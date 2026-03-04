using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.Domain.Services.Communication.Authentication;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Security;
using SigningPortal.Core.Utilities;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SigningPortal.Core.Services
{
	public class AuthenticatService : IAuthenticatService
	{
		private readonly HttpClient _client;
		private readonly IConfiguration _configuration;
		private readonly ICacheClient _cacheClient;
		private readonly IGlobalConfiguration _globalConfiguration;
		private readonly OpenID openIDHelper;
		private readonly ILogger<AuthenticatService> _logger;
		private readonly IAuthenticationRepository _authenticationRepository;
		private readonly IConstantError _constantError;
		private readonly IDocumentRepository _documentRepository;
		private readonly IRecepientsRepository _recepientsRepository;

		public AuthenticatService(ILogger<AuthenticatService> logger,
			HttpClient httpClient,
			IConfiguration configuration,
			ICacheClient cacheClient,
			IGlobalConfiguration globalConfiguration,
			IAuthenticationRepository authenticationRepository,
			IConstantError constantError,
			IDocumentRepository documentRepository,
			IRecepientsRepository recepientsRepository)
		{
			_configuration = configuration;
			_cacheClient = cacheClient;
			_globalConfiguration = globalConfiguration;
			_client = httpClient;
			_client.Timeout = TimeSpan.FromMinutes(10);
			var idpUrl = _configuration["Config:IDP_Config:IDP_url"];

			if (string.IsNullOrWhiteSpace(idpUrl))
			{
				throw new InvalidOperationException("IDP URL is not configured properly.");
			}

			_client.BaseAddress = new Uri(idpUrl);
			openIDHelper = new OpenID(_configuration, _client, _globalConfiguration);
			_logger = logger;
			_authenticationRepository = authenticationRepository;
			_constantError = constantError;
			_documentRepository = documentRepository;
			_recepientsRepository = recepientsRepository;
		}

		public ServiceResult GetAuthorizationUrl()
		{
			try
			{
				_logger.LogInformation("--> GetAuthorizationUrl");

				var state = Guid.NewGuid().ToString("N");
				var nonce = Guid.NewGuid().ToString("N");
				var responce = openIDHelper.GetAuthorizationUrl(nonce, state);
				_logger.LogInformation("<-- GetAuthorizationUrl");
				//_logger.LogInformation("GetAuthorizationUrl response: " +responce.ToString());
				_logger.LogInformation("GetAuthorizationUrl url: " + responce.Url);
				return new ServiceResult(responce);

			}
			catch (Exception e)
			{
				Monitor.SendException(e);

				_logger.LogError("GetAuthorizationUrl  Exception :  {0}", e.Message);
				//return new ServiceResult("An error occurred while generate authentication url");
				return new ServiceResult(_constantError.GetMessage("102501"));
			}
		}

		public async Task<ServiceResult> AuthenticateUser(AuthenticateUserDTO requestObj)
		{
			try
			{
				_logger.LogInformation("--> AuthenticateUser");

				if (requestObj == null)
					return new ServiceResult(_constantError.GetMessage("102515"));
				//return new ServiceResult("Invalid request body provided");

				if (string.IsNullOrEmpty(requestObj.code))
					//return new ServiceResult("The code value is empty string or null");
					return new ServiceResult(_constantError.GetMessage("102502"));

				//if (string.IsNullOrEmpty(requestObj.nonce))
				//    //return new ServiceResult("The nonce value is empty string or null");
				//    return new ServiceResult(_constantError.GetMessage("102503"));


				JObject TokenResponse = openIDHelper.GetAccessToken(requestObj.code).Result;
				if (TokenResponse.ContainsKey("error") &&
					TokenResponse.ContainsKey("error_description"))
				{
					return new ServiceResult(TokenResponse["error_description"].ToString());
				}
				_logger.LogInformation("AuthenticateUser  : get access_token from idp successfully");

				var isOpenId = _configuration.GetValue<bool>("OpenId_Connect");

				var ID_Token = "";
				if (isOpenId)
				{
					ID_Token = TokenResponse["id_token"].ToString();
					if (string.IsNullOrEmpty(ID_Token))
						//return new ServiceResult("The id_token value is empty string or null");
						return new ServiceResult(_constantError.GetMessage("102504"));

				}

				var accessToken = TokenResponse["access_token"].ToString();
				if (string.IsNullOrEmpty(accessToken))
					//return new ServiceResult("The access_token value is empty string or null");
					return new ServiceResult(_constantError.GetMessage("102505"));

				_logger.LogInformation("IDP Access token : {0}", accessToken);

				var expires_in = int.Parse(TokenResponse["expires_in"].ToString());
				if (expires_in == 0)
					expires_in = 3480;
				else
					expires_in = expires_in - 60;

				var accessTokenTime = DateTime.UtcNow;

				IDPUserDTO userdata = null;

				if (isOpenId == true)
				{
					//code for openid connect

					//validate id_token and get cliam values from  id_token
					ClaimsPrincipal userObj = openIDHelper.ValidateIdentityToken(ID_Token);
					if (userObj == null)
						//return new ServiceResult("Claim Object getting null value");
						return new ServiceResult(_constantError.GetMessage("102506"));


					_logger.LogInformation("AuthenticateUser  : get userinfo from id_token successfully");

					//validate nonce value is matched with our nonce value
					//which is send from login url
					var nonce = userObj.FindFirst("nonce")?.Value ?? "";
					//if (!string.Equals(nonce, requestObj.nonce))
					//    //return new ServiceResult("The nonce value is invalid");
					//    return new ServiceResult(_constantError.GetMessage("102507"));

					var daesClaim = userObj.FindFirst("daes_claims")?.Value ?? "";
					userdata = JsonConvert.DeserializeObject<IDPUserDTO>(daesClaim);
					userdata.sub = userObj.FindFirst("sub")?.Value ?? "";

					//user.Uuid = userdata.suid;
					//user.fullname = userdata.name;
					//user.dob = userdata.birthdate;
					//user.mailId = userdata.email;
					//user.mobileNo = userdata.phone;
					//user.sub = int.Parse(userdata.sub);
				}
				else
				{
					//code for oauth
					JObject userObj = await openIDHelper.GetUserInfo(accessToken);
					if (userObj.ContainsKey("error") && userObj.ContainsKey("error_description"))
						return new ServiceResult(userObj["error_description"].ToString());

					_logger.LogInformation("AuthenticateUser  : get userinfo from idp successfully");

					userdata = JsonConvert.DeserializeObject<IDPUserDTO>(userObj.ToString());
					//user.Uuid = userObj["uuid"].ToString();
					//user.fullname = userObj["name"].ToString();
					//user.dob = userObj["birthdate"].ToString();
					//user.mailId = userObj["email"].ToString();
					//user.mobileNo = userObj["phone_number"].ToString();
					//user.sub = int.Parse(userObj["sub"].ToString());
				}

				var OrgnizationList = new List<OrganizationDetails>();

				var response = await _client.GetAsync(
					_configuration.GetValue<string>("Config:OrganizationDetailsList") + userdata.suid
				);

				if (response.StatusCode == HttpStatusCode.OK)
				{
					var content = await response.Content.ReadAsStringAsync();

					var apiResponse = JsonConvert.DeserializeObject<APIResponse>(content);

					if (apiResponse?.Success == true && apiResponse.Result != null)
					{
						var resultString = apiResponse.Result.ToString();

						if (!string.IsNullOrWhiteSpace(resultString))
						{
							OrgnizationList = JsonConvert.DeserializeObject<List<OrganizationDetails>>(resultString)
											  ?? new List<OrganizationDetails>();
						}
					}
					else
					{
						_logger.LogError(apiResponse?.Message);
						return new ServiceResult(apiResponse?.Message ?? "Unknown error occurred.");
					}
				}
				else
				{
					Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");

					_logger.LogError($"The request with URI={response.RequestMessage.RequestUri} failed " +
							   $"with status code={response.StatusCode}");
					return new ServiceResult(_constantError.GetMessage("102509"));
				}

				UserDTO User = new UserDTO()
				{
					Name = userdata.name,
					Email = userdata.email.ToLowerInvariant(),
					Suid = userdata.suid,
					OrganizationId = "",
					OrganizationName = "",
					AccountType = AccountTypeConstants.Self,
					AccessTokenExpiryTime = DateTime.UtcNow.AddSeconds(expires_in)
				};

				var emailList = new List<string>();
				emailList.Add(userdata.email.ToLowerInvariant());

				if (OrgnizationList != null && OrgnizationList.Count != 0)
				{
					foreach (var orgnization in OrgnizationList)
					{
						if (!emailList.Contains(orgnization.SubscriberEmailList))
							emailList.Add(orgnization.SubscriberEmailList.ToLowerInvariant());
					}
				}

				if (userdata.login_profile != null)
				{
					if (userdata.login_profile.Count == 1)
					{
						if (userdata.login_profile[0].Email.ToLowerInvariant() == userdata.email.ToLowerInvariant())
						{
							var NewOrgnizationList = new List<OrganizationDetails>();
							foreach (var Org in OrgnizationList)
							{
								foreach (var LoginOrg in userdata.login_profile)
								{
									if (Org.OrganizationUid == LoginOrg.OrgnizationId)
									{
										NewOrgnizationList.Add(Org);
									}
								}
							}

							OrgnizationList = NewOrgnizationList;
						}
						else
						{
							var OrgName = "";
							foreach (var item in OrgnizationList)
							{
								if (item.OrganizationUid == userdata.login_profile[0].OrgnizationId)
								{

									OrgName = item.OrganizationName;
									break;
								}
							}
							User.OrganizationId = userdata.login_profile[0].OrgnizationId;
							User.OrganizationName = OrgName;
							User.AccountType = AccountTypeConstants.Organization;
							User.Email = userdata.login_profile[0].Email.ToLowerInvariant();
						}

					}
					else
					{
						if (userdata.login_profile[0].Email.ToLowerInvariant() != userdata.email.ToLowerInvariant())
						{
							User.Email = userdata.login_profile[0].Email.ToLowerInvariant();
						}

						var NewOrgnizationList = new List<OrganizationDetails>();
						foreach (var Org in OrgnizationList)
						{
							foreach (var LoginOrg in userdata.login_profile)
							{
								if (Org.OrganizationUid == LoginOrg.OrgnizationId)
								{
									NewOrgnizationList.Add(Org);
								}
							}
						}

						OrgnizationList = NewOrgnizationList;
					}
				}

				var name = userdata.name.Split(" ");
				var firstName = "";
				var lastName = "";
				if (name.Length == 1)
				{
					firstName = name.ToString();
					lastName = name.ToString();
				}
				else if (name.Length == 2)
				{
					firstName = name[0];
					lastName = name[1];
				}
				else
				{
					firstName = name[0];
					lastName = name[name.Length - 1];
				}

				var token = openIDHelper.generateApiToken(User, expires_in);
				if (string.IsNullOrEmpty(token))
					//return new ServiceResult("Failed to gerate api token");
					return new ServiceResult(_constantError.GetMessage("102508"));

				var clientId = _globalConfiguration.IDPClientId;

				var lastLoginTime = await GetUserLastLogInDetails(userdata.suid, clientId);

				try
				{
					List<string> tempIdList = new List<string>();

					var recepients = _recepientsRepository.GetRecepientsBySuidAsync(userdata.suid).Result;

					foreach (var recepient in recepients)
					{
						tempIdList.Add(recepient.Tempid);
					}

					await _documentRepository.UpdateExpiredDocumentStatusByTempIdList(tempIdList);
				}
				catch (Exception e)
				{
					Monitor.SendException(e);

					_logger.LogError("Check Expired Documents Excp'  :: " + e.Message);
				}

				//////Setting Profile Image in Reddis
				//string profile_image = string.Empty;

				//JObject profileImageResponse = await openIDHelper.GetUserProfileImage(accessToken);
				//if ((bool)profileImageResponse["success"])
				//	profile_image = profileImageResponse["result"].ToString();

				//var (retValue, errorMsg) = await _cacheClient.Add("UserProfileImage", userdata.suid, profile_image, TimeSpan.FromSeconds(expires_in));
				//if (retValue == 0)
				//{
				//	_logger.LogInformation($"Profile image added to Reddis for user {userdata.suid}");
				//}
				//else
				//{
				//	_logger.LogError($"Profile image not added to Reddis for user {userdata.suid}. Error :: {errorMsg}");
				//}

				AuthenticateUserResponse authenticateUserResponse = new AuthenticateUserResponse()
				{
					name = userdata.name,
					firstName = firstName,
					lastName = lastName,
					email = userdata.email.ToLowerInvariant(),
					accessToken = token,
					idp_token = accessToken,
					documentNumber = userdata.id_document_number,
					suid = userdata.suid,
					last_login = lastLoginTime,
					SelfEmails = emailList,
					expires_in = expires_in,
				};

				if (userdata.login_profile != null)
				{
					if (userdata.login_profile.Count == 1)
					{
						if (userdata.email.ToLowerInvariant() != userdata.login_profile[0].Email.ToLowerInvariant())
						{
							authenticateUserResponse.allowAccountSelection = false;
							authenticateUserResponse.orgnizationId = User.OrganizationId;
							authenticateUserResponse.orgnizationName = User.OrganizationName;
							authenticateUserResponse.email = userdata.login_profile[0].Email.ToLowerInvariant();
						}
					}
					else
					{
						if (userdata.email.ToLowerInvariant() != userdata.login_profile[0].Email.ToLowerInvariant() && userdata.login_type != "1")
						{
							authenticateUserResponse.allowSelfAccountSelection = false;
						}
					}
				}
				else
				{
					if (userdata.login_type != "1")
						authenticateUserResponse.allowAccountSelection = false;
				}

				authenticateUserResponse.OrgDetailsList = OrgnizationList;

				_logger.LogInformation("<-- AuthenticateUser");

				return new ServiceResult(authenticateUserResponse, "Login successfully");

			}
			catch (Exception e)
			{
				Monitor.SendException(e);

				_logger.LogError("AuthenticateUser  Exception :  {0}", e.Message);
			}
			//return new ServiceResult("An error occurred while authenticate user");
			return new ServiceResult(_constantError.GetMessage("102509"));
		}

		public async Task<ServiceResult> GetUserProfileImage(string accessToken)
		{
			try
			{
				JObject response = await openIDHelper.GetUserProfileImage(accessToken);

				var result = response["result"]?.ToString() ?? string.Empty;
				var message = response["message"]?.ToString() ?? "Unknown error";
				var success = response["success"]?.ToObject<bool>() ?? false;

				return new ServiceResult(result, message, success);
			}
			catch (Exception e)
			{
				_logger.LogError("GetUserProfileImage Exception: {Message}", e.Message);
			}

			return new ServiceResult("Error occurred while receiving profile image");
		}

		public  ServiceResult GetApiAccessOld(GetApiAccessTokenDTOOld requestObj, string authtoken)
		{
			try
			{
				_logger.LogInformation("--> GetApiAccess");

				if (string.IsNullOrEmpty(authtoken))
					//return new ServiceResult("No Authorization token provided!");
					return new ServiceResult(_constantError.GetMessage("102510"));

				var TokenArray = authtoken.Split(" ");

				if (string.IsNullOrEmpty(TokenArray[0]) || TokenArray[0] != "Basic")
					//return new ServiceResult("Invalid Authorization token type!");
					return new ServiceResult(_constantError.GetMessage("102511"));

				if (string.IsNullOrEmpty(TokenArray[1]))
					//return new ServiceResult("Invalid Authorization token!");
					return new ServiceResult(_constantError.GetMessage("102512"));

				var credentialstring = openIDHelper.StringFromBase64(TokenArray[1]);
				var credential = credentialstring.Split(":");

				if (credential.Length != 2)
					//return new ServiceResult("Invalid Authorization token!");
					return new ServiceResult(_constantError.GetMessage("102512"));

				IdpSecret IDP_Secrets = new IdpSecret()
				{
					client_ID = _globalConfiguration.MobileIDPClientId,
					client_secret = _globalConfiguration.MobileIDPClientSecret
				};

				if (IDP_Secrets == null)
					//return new ServiceResult("Fail to get Appsetting");
					return new ServiceResult(_constantError.GetMessage("102513"));


				if (credential[0] != IDP_Secrets.client_ID || credential[1] != IDP_Secrets.client_secret)
					return new ServiceResult(_constantError.GetMessage("102512"));

				if (string.IsNullOrEmpty(requestObj.email) && string.IsNullOrEmpty(requestObj.name) &&
					string.IsNullOrEmpty(requestObj.suid) && string.IsNullOrEmpty(requestObj.key))
					//return new ServiceResult("Invalid Request body provided!");
					return new ServiceResult(_constantError.GetMessage("102515"));

				var ReqKey = openIDHelper.StringFromBase64(requestObj.key);
				//var frontEndSecret = _configuration.GetValue<string>("Secret:FrontEndSecret");
				var OriginalKey = openIDHelper.StringFromBase64(_globalConfiguration.FrontEndSecret);

				if (ReqKey != OriginalKey)
					return new ServiceResult(_constantError.GetMessage("102516"));
				//return new ServiceResult("Invalid  Key Provided!");

				UserDTO User = new UserDTO()
				{
					Name = requestObj.name,
					Email = requestObj.email,
					Suid = requestObj.suid,
					OrganizationName = "",
					OrganizationId = "",
					AccountType = AccountTypeConstants.Self,
					AccessTokenExpiryTime = DateTime.UtcNow.AddSeconds(int.Parse("3600"))
				};

				var token = openIDHelper.generateApiToken(User, 3600);
				if (string.IsNullOrEmpty(token))
					return new ServiceResult(_constantError.GetMessage("102508"));
				//return new ServiceResult("Failed to gerate api token");



				var response = new GetApiAccessResponse()
				{
					accessToken = token,
				};

				_logger.LogInformation("<-- GetApiAccess");
				return new ServiceResult(response);

			}
			catch (Exception e)
			{
				Monitor.SendException(e);

				_logger.LogError("GetApiAccess  Exception :  {0}", e.Message);
				return new ServiceResult(_constantError.GetMessage("102517"));
				//return new ServiceResult("An error occurred while generate Api Access token");
			}
		}
		public async Task<ServiceResult> GetApiAccess(GetApiAccessTokenDTO requestObj, string authtoken)
		{
			try
			{
				_logger.LogInformation("--> GetApiAccess");

				if (string.IsNullOrEmpty(authtoken))
					//return new ServiceResult("No Authorization token provided!");
					return new ServiceResult(_constantError.GetMessage("102510"));

				var TokenArray = authtoken.Split(" ");

				if (string.IsNullOrEmpty(TokenArray[0]) || TokenArray[0] != "Basic")
					//return new ServiceResult("Invalid Authorization token type!");
					return new ServiceResult(_constantError.GetMessage("102511"));

				if (string.IsNullOrEmpty(TokenArray[1]))
					//return new ServiceResult("Invalid Authorization token!");
					return new ServiceResult(_constantError.GetMessage("102512"));

				if (string.IsNullOrEmpty(requestObj.email))
				{
					return new ServiceResult("Invalid Request body provided! Email is missing");
				}

				if (string.IsNullOrEmpty(requestObj.suid))
				{
					return new ServiceResult("Invalid Request body provided! Suid is missing");
				}

				if (string.IsNullOrEmpty(requestObj.name))
				{
					return new ServiceResult("Invalid Request body provided! Name is missing");
				}

				var credentialstring = openIDHelper.StringFromBase64(TokenArray[1]);
				var credential = credentialstring.Split(":");

				if (credential.Length != 2)
					//return new ServiceResult("Invalid Authorization token!");
					return new ServiceResult(_constantError.GetMessage("102512"));

				IdpSecret IDP_Secrets = new IdpSecret()
				{
					client_ID = _globalConfiguration.MobileIDPClientId,
					client_secret = _globalConfiguration.MobileIDPClientSecret
				};

				if (IDP_Secrets == null)
					//return new ServiceResult("Fail to get Appsetting");
					return new ServiceResult(_constantError.GetMessage("102513"));


				if (credential[0] != IDP_Secrets.client_ID || credential[1] != IDP_Secrets.client_secret)
					return new ServiceResult(_constantError.GetMessage("102512"));

				if (string.IsNullOrEmpty(requestObj.email) && string.IsNullOrEmpty(requestObj.name) &&
					string.IsNullOrEmpty(requestObj.suid))
					//return new ServiceResult("Invalid Request body provided!");
					return new ServiceResult(_constantError.GetMessage("102515"));

				// Get Access Token
				JObject TokenResponse = await openIDHelper.GetAccessToken();
				if (TokenResponse.ContainsKey("error") &&
					TokenResponse.ContainsKey("error_description"))
				{
					return new ServiceResult(TokenResponse["error_description"].ToString());
				}

				var accessToken = TokenResponse["access_token"].ToString();
				if (string.IsNullOrEmpty(accessToken))
				{
					return new ServiceResult("Invalid access token");
				}

				var expires_in = int.Parse(TokenResponse["expires_in"].ToString());
				if (expires_in == 0)
					expires_in = 3480;
				else
					expires_in = expires_in - 60;

				UserDTO User = new UserDTO()
				{
					Name = requestObj.name,
					Email = requestObj.email,
					Suid = requestObj.suid,
					OrganizationName = string.Empty,
					OrganizationId = string.Empty,
					AccountType = AccountTypeConstants.Self,
					AccessTokenExpiryTime = DateTime.UtcNow.AddSeconds(expires_in)
				};

				var token = openIDHelper.generateApiToken(User, expires_in);
				if (string.IsNullOrEmpty(token))
					return new ServiceResult(_constantError.GetMessage("102508"));
				//return new ServiceResult("Failed to gerate api token");

			
				var OrgnizationList = new List<OrganizationDetails>();

				var response = await _client.GetAsync(_configuration.GetValue<string>("Config:OrganizationDetailsList") + requestObj.suid);


				if (response.StatusCode == HttpStatusCode.OK)
				{
					var content = await response.Content.ReadAsStringAsync();

					var apiResponse = JsonConvert.DeserializeObject<APIResponse>(content);

					if (apiResponse?.Success == true && apiResponse.Result != null)
					{
						var resultString = apiResponse.Result.ToString();

						if (!string.IsNullOrWhiteSpace(resultString))
						{
							OrgnizationList = JsonConvert.DeserializeObject<List<OrganizationDetails>>(resultString)
											  ?? new List<OrganizationDetails>();
						}
					}
					else
					{
						_logger.LogError(apiResponse?.Message);
						return new ServiceResult(apiResponse?.Message ?? "Unknown error occurred.");
					}
				}
				else
				{
					Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");

					_logger.LogError($"The request with URI={response.RequestMessage.RequestUri} failed " +
							   $"with status code={response.StatusCode}");
					return new ServiceResult(_constantError.GetMessage("102509"));
				}

				var response1 = new GetApiAccessResponse()
				{
					accessToken = accessToken,
					apiToken = token,
					OrgDetailsList = OrgnizationList,
					expires_in = expires_in
				};

				_logger.LogInformation("<-- GetApiAccess");
				return new ServiceResult(response1);

			}
			catch (Exception e)
			{
				Monitor.SendException(e);

				_logger.LogError("GetApiAccess  Exception :  {0}", e.Message);
				return new ServiceResult(_constantError.GetMessage("102517"));
				//return new ServiceResult("An error occurred while generate Api Access token");
			}
		}

		public async Task<string> GetUserLastLogInDetails(string suid, string clientId)
		{
			try
			{
				var result = await _authenticationRepository.GetUserLastLoginAsyc(suid, clientId);
				if (result.Count == 0)
				{
					return string.Empty;
				}
				if (result.Count == 1)
				{
					return string.Empty;
				}
				return result[1].endTime;
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);

				_logger.LogError(ex, ex.Message);
				return string.Empty;
			}
		}

		public ServiceResult UpdateApiAccessTokenAsync(UpdateApiAccessTokenDTO requestObj, UserDTO userDTO)
		{
			try
			{
				_logger.LogInformation("--> UpdateApiAccessToken");

				if (string.IsNullOrEmpty(requestObj.OrganizationName) || string.IsNullOrEmpty(requestObj.OrganizationId) ||
					string.IsNullOrEmpty(requestObj.AccountType) || string.IsNullOrEmpty(requestObj.Email))
					//return new ServiceResult("Invalid Request body provided!");
					return new ServiceResult(_constantError.GetMessage("102515"));

				var expTime = Math.Round(System.Math.Abs(userDTO.AccessTokenExpiryTime.Subtract(DateTime.UtcNow).TotalSeconds));

				UserDTO User = new UserDTO()
				{
					Name = userDTO.Name,
					Email = requestObj.Email,
					Suid = userDTO.Suid,
					OrganizationName = requestObj.OrganizationName,
					OrganizationId = requestObj.OrganizationId,
					AccountType = requestObj.AccountType,
					AccessTokenExpiryTime = DateTime.UtcNow.AddSeconds(expTime)
				};

				var token = openIDHelper.generateApiToken(User, int.Parse(expTime.ToString()));
				if (string.IsNullOrEmpty(token))
					return new ServiceResult(_constantError.GetMessage("102508"));
				//return new ServiceResult("Failed to gerate api token");

				var response = new GetApiAccessResponse()
				{
					accessToken = token,
				};

				return new ServiceResult(response);
			}
			catch (Exception e)
			{
				Monitor.SendException(e);

				_logger.LogError("GetApiAccess  Exception :  {0}", e.Message);
				//return new ServiceResult(_constantError.GetMessage("102517"));
				return new ServiceResult("An error occurred while update Api Access token");
			}
		}
        public ServiceResult GetVerificationAuthorizationUrl()
        {
            try
            {
                _logger.LogInformation("--> GetAuthorizationUrl");

                var state = Guid.NewGuid().ToString("N");
                var nonce = Guid.NewGuid().ToString("N");
                var responce = openIDHelper.GetVerificationAppAuthorizationUrl(nonce, state);
                _logger.LogInformation("<-- GetAuthorizationUrl");
                //_logger.LogInformation("GetAuthorizationUrl response: " +responce.ToString());
                _logger.LogInformation("GetAuthorizationUrl url: " + responce.Url);
                return new ServiceResult(responce);

            }
            catch (Exception e)
            {
                Monitor.SendException(e);

                _logger.LogError("GetAuthorizationUrl  Exception :  {0}", e.Message);
                //return new ServiceResult("An error occurred while generate authentication url");
                return new ServiceResult(_constantError.GetMessage("102501"));
            }
        }
        public async Task<ServiceResult> AuthenticateVerifier(AuthenticateUserDTO requestObj)
        {
            try
            {
                _logger.LogInformation("--> AuthenticateUser");

                if (requestObj == null)
                    return new ServiceResult(_constantError.GetMessage("102515"));

                if (string.IsNullOrEmpty(requestObj.code))
                    return new ServiceResult(_constantError.GetMessage("102502"));


                JObject TokenResponse = openIDHelper.GetVerifierAccessToken(requestObj.code).Result;
                if (TokenResponse.ContainsKey("error") &&
                    TokenResponse.ContainsKey("error_description"))
                {
                    return new ServiceResult(TokenResponse["error_description"].ToString());
                }
                _logger.LogInformation("AuthenticateUser  : get access_token from idp successfully");

                var isOpenId = _configuration.GetValue<bool>("OpenId_Connect");

                var ID_Token = "";
                if (isOpenId)
                {
                    ID_Token = TokenResponse["id_token"].ToString();
                    if (string.IsNullOrEmpty(ID_Token))
                        return new ServiceResult(_constantError.GetMessage("102504"));

                }

                var accessToken = TokenResponse["access_token"].ToString();
                if (string.IsNullOrEmpty(accessToken))
                    return new ServiceResult(_constantError.GetMessage("102505"));

                _logger.LogInformation("IDP Access token : {0}", accessToken);

                var expires_in = int.Parse(TokenResponse["expires_in"].ToString());
                if (expires_in == 0)
                    expires_in = 3480;
                else
                    expires_in = expires_in - 60;

                var accessTokenTime = DateTime.UtcNow;

                IDPUserDTO userdata = null;

                if (isOpenId == true)
                {
                    ClaimsPrincipal userObj = openIDHelper.ValidateVerifierIdentityToken(ID_Token);
                    if (userObj == null)
                        return new ServiceResult(_constantError.GetMessage("102506"));


                    _logger.LogInformation("AuthenticateUser  : get userinfo from id_token successfully");

                    var nonce = userObj.FindFirst("nonce")?.Value ?? "";

                    var daesClaim = userObj.FindFirst("daes_claims")?.Value ?? "";
                    userdata = JsonConvert.DeserializeObject<IDPUserDTO>(daesClaim);
                    userdata.sub = userObj.FindFirst("sub")?.Value ?? "";

                }
                else
                {
                    //code for oauth
                    JObject userObj = await openIDHelper.GetUserInfo(accessToken);
                    if (userObj.ContainsKey("error") && userObj.ContainsKey("error_description"))
                        return new ServiceResult(userObj["error_description"].ToString());

                    _logger.LogInformation("AuthenticateUser  : get userinfo from idp successfully");

                    userdata = JsonConvert.DeserializeObject<IDPUserDTO>(userObj.ToString());
                }

				var OrgnizationList = new List<OrganizationDetails>();

				var response = await _client.GetAsync(_configuration.GetValue<string>("Config:OrganizationDetailsList") + userdata.suid);


				if (response.StatusCode == HttpStatusCode.OK)
				{
					var content = await response.Content.ReadAsStringAsync();

					var apiResponse = JsonConvert.DeserializeObject<APIResponse>(content);

					if (apiResponse?.Success == true && apiResponse.Result != null)
					{
						var resultString = apiResponse.Result.ToString();

						if (!string.IsNullOrWhiteSpace(resultString))
						{
							OrgnizationList = JsonConvert.DeserializeObject<List<OrganizationDetails>>(resultString)
											  ?? new List<OrganizationDetails>();
						}
					}
					else
					{
						_logger.LogError(apiResponse?.Message);
						return new ServiceResult(apiResponse?.Message ?? "Unknown error occurred.");
					}
				}
				else
                {
                    Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
                    $"with status code={response.StatusCode}");

                    _logger.LogError($"The request with URI={response.RequestMessage.RequestUri} failed " +
                               $"with status code={response.StatusCode}");
                    return new ServiceResult(_constantError.GetMessage("102509"));
                }

                UserDTO User = new UserDTO()
                {
                    Name = userdata.name,
                    Email = userdata.email.ToLowerInvariant(),
                    Suid = userdata.suid,
                    OrganizationId = "",
                    OrganizationName = "",
                    AccountType = AccountTypeConstants.Self,
                    AccessTokenExpiryTime = DateTime.UtcNow.AddSeconds(expires_in)
                };

                var emailList = new List<string>();
                emailList.Add(userdata.email.ToLowerInvariant());

                if (OrgnizationList != null && OrgnizationList.Count != 0)
                {
                    foreach (var orgnization in OrgnizationList)
                    {
                        if (!emailList.Contains(orgnization.SubscriberEmailList))
                            emailList.Add(orgnization.SubscriberEmailList.ToLowerInvariant());
                    }
                }

                if (userdata.login_profile != null)
                {
                    if (userdata.login_profile.Count == 1)
                    {
                        if (userdata.login_profile[0].Email.ToLowerInvariant() == userdata.email.ToLowerInvariant())
                        {
                            var NewOrgnizationList = new List<OrganizationDetails>();
                            foreach (var Org in OrgnizationList)
                            {
                                foreach (var LoginOrg in userdata.login_profile)
                                {
                                    if (Org.OrganizationUid == LoginOrg.OrgnizationId)
                                    {
                                        NewOrgnizationList.Add(Org);
                                    }
                                }
                            }

                            OrgnizationList = NewOrgnizationList;
                        }
                        else
                        {
                            var OrgName = "";
                            foreach (var item in OrgnizationList)
                            {
                                if (item.OrganizationUid == userdata.login_profile[0].OrgnizationId)
                                {

                                    OrgName = item.OrganizationName;
                                    break;
                                }
                            }
                            User.OrganizationId = userdata.login_profile[0].OrgnizationId;
                            User.OrganizationName = OrgName;
                            User.AccountType = AccountTypeConstants.Organization;
                            User.Email = userdata.login_profile[0].Email.ToLowerInvariant();
                        }

                    }
                    else
                    {
                        if (userdata.login_profile[0].Email.ToLowerInvariant() != userdata.email.ToLowerInvariant())
                        {
                            User.Email = userdata.login_profile[0].Email.ToLowerInvariant();
                        }

                        var NewOrgnizationList = new List<OrganizationDetails>();
                        foreach (var Org in OrgnizationList)
                        {
                            foreach (var LoginOrg in userdata.login_profile)
                            {
                                if (Org.OrganizationUid == LoginOrg.OrgnizationId)
                                {
                                    NewOrgnizationList.Add(Org);
                                }
                            }
                        }

                        OrgnizationList = NewOrgnizationList;
                    }
                }

                var name = userdata.name.Split(" ");
                var firstName = "";
                var lastName = "";
                if (name.Length == 1)
                {
                    firstName = name.ToString();
                    lastName = name.ToString();
                }
                else if (name.Length == 2)
                {
                    firstName = name[0];
                    lastName = name[1];
                }
                else
                {
                    firstName = name[0];
                    lastName = name[name.Length - 1];
                }

                var token = openIDHelper.generateApiToken(User, expires_in);
                if (string.IsNullOrEmpty(token))
                    return new ServiceResult(_constantError.GetMessage("102508"));

                var clientId = _globalConfiguration.IDPClientId;

                var lastLoginTime = await GetUserLastLogInDetails(userdata.suid, clientId);

                try
                {
                    List<string> tempIdList = new List<string>();

                    var recepients = _recepientsRepository.GetRecepientsBySuidAsync(userdata.suid).Result;

                    foreach (var recepient in recepients)
                    {
                        tempIdList.Add(recepient.Tempid);
                    }

                    await _documentRepository.UpdateExpiredDocumentStatusByTempIdList(tempIdList);
                }
                catch (Exception e)
                {
                    Monitor.SendException(e);

                    _logger.LogError("Check Expired Documents Excp'  :: " + e.Message);
                }


                AuthenticateUserResponse authenticateUserResponse = new AuthenticateUserResponse()
                {
                    name = userdata.name,
                    firstName = firstName,
                    lastName = lastName,
                    email = userdata.email.ToLowerInvariant(),
                    accessToken = token,
                    idp_token = accessToken,
                    documentNumber = userdata.id_document_number,
                    suid = userdata.suid,
                    last_login = lastLoginTime,
                    SelfEmails = emailList,
                    expires_in = expires_in,
                };

                if (userdata.login_profile != null)
                {
                    if (userdata.login_profile.Count == 1)
                    {
                        if (userdata.email.ToLowerInvariant() != userdata.login_profile[0].Email.ToLowerInvariant())
                        {
                            authenticateUserResponse.allowAccountSelection = false;
                            authenticateUserResponse.orgnizationId = User.OrganizationId;
                            authenticateUserResponse.orgnizationName = User.OrganizationName;
                            authenticateUserResponse.email = userdata.login_profile[0].Email.ToLowerInvariant();
                        }
                    }
                    else
                    {
                        if (userdata.email.ToLowerInvariant() != userdata.login_profile[0].Email.ToLowerInvariant() && userdata.login_type != "1")
                        {
                            authenticateUserResponse.allowSelfAccountSelection = false;
                        }
                    }
                }
                else
                {
                    if (userdata.login_type != "1")
                        authenticateUserResponse.allowAccountSelection = false;
                }

                authenticateUserResponse.OrgDetailsList = OrgnizationList;

                _logger.LogInformation("<-- AuthenticateUser");

                return new ServiceResult(authenticateUserResponse, "Login successfully");

            }
            catch (Exception e)
            {
                Monitor.SendException(e);

                _logger.LogError("AuthenticateUser  Exception :  {0}", e.Message);
            }
            return new ServiceResult(_constantError.GetMessage("102509"));
        }
    }
}

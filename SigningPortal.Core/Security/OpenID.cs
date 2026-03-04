using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SigningPortal.Core.Domain.Services.Communication.Authentication;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace SigningPortal.Core.Security
{
	public class OpenID
	{
		public IConfiguration configuration;
		private readonly IGlobalConfiguration _globalConfiguration;
		private readonly HttpClient client;
		private readonly bool isEncrypted = false;
		public OpenID(IConfiguration _configuration, HttpClient httpClient, IGlobalConfiguration globalConfiguration)
		{
			client = httpClient;
			configuration = _configuration;
			_globalConfiguration = globalConfiguration;
			isEncrypted = _configuration.GetValue<bool>("EncryptionEnabled");
		}

		public AuthenticationUrlResponse GetAuthorizationUrl(string nonce, string state)
		{

			var Url = string.Empty;
			var authorizationURl = configuration.GetValue<string>("Config:IDP_Config:IDP_url");

			var isOpenId = configuration.GetValue<bool>("OpenId_Connect");
			if (isOpenId == true)
			{
				/*Prepare jwtToken object to generate jwt token which is send form
                 request parameter in query string*/
				var requestObject = new JwtTokenDTO();
				requestObject.Expiry = 60;
				requestObject.Audience = configuration["Config:IDP_Config:Issuer"];
				requestObject.Issuer = _globalConfiguration.IDPClientId;
				requestObject.ResponseType = "code";
				requestObject.RedirecUri = configuration["Config:Signing_portal:FRONTEND_URL"];
				requestObject.Scope = configuration["Config:IDP_Config:scope"];
				requestObject.State = state;
				requestObject.Nonce = nonce;

				//generate jwt token by passing jwttoken object details
				var response = JWTTokenManager.GenerateJWTToken(requestObject, isEncrypted);
				if (null == response)
				{
					throw new Exception("Fail to generate JWT token for " +
						"Authorization request.");
				}

				//generate idp login url using ClientId,ClientId,Scopes,state,nonce,request
				//check all values in appsettings.Development.json file
				authorizationURl = authorizationURl +
				   "authorization?client_id={0}&redirect_uri={1}&response_type=code&scope={2}&state={3}&" +
				   "nonce={4}&request={5}";

				var clientId = _globalConfiguration.IDPClientId;

				Url = String.Format(authorizationURl,
									clientId,
									configuration.GetValue<string>("Config:Signing_portal:FRONTEND_URL"),
									configuration.GetValue<string>("Config:IDP_Config:scope"),
									state, nonce, response);

			}
			else
			{
				authorizationURl = authorizationURl +
				   "authorization?client_id={0}&redirect_uri={1}&response_type=code&scope={2}&state={3}";

				var scope = configuration.GetValue<string>("Config:IDP_Config:scope");

				var clientId = _globalConfiguration.IDPClientId;

				Url = String.Format(authorizationURl,
									 clientId,
									 configuration.GetValue<string>("Config:Signing_portal:FRONTEND_URL"),
									 scope.Replace("openid ", ""),
									 state);

			}

			return new AuthenticationUrlResponse(Url);

		}

		public string GetLogoutUrl(string? idToken = null, string? state = null)
		{
			var signOutUrl = configuration.GetValue<string>("Config:IDP_Config:signOutUrl")
							 ?? throw new InvalidOperationException("signOutUrl is not configured.");

			var logoutUrl = configuration.GetValue<string>("Config:IDP_Config:logout_url")
							?? throw new InvalidOperationException("logout_url is not configured.");

			return string.Format(signOutUrl, logoutUrl);
		}
		public async Task<JObject> GetAccessToken(string code)
		{
			var clientId = _globalConfiguration.IDPClientId;

			//prepare data object which is send with token endpoint url 
			var redirectUri = configuration.GetValue<string>("Config:Signing_portal:FRONTEND_URL")
				   ?? throw new InvalidOperationException("FRONTEND_URL is not configured.");

			var data = new Dictionary<string, string>
				{
				   { "code", code ?? throw new ArgumentNullException(nameof(code)) },
				   { "client_id", clientId ?? throw new ArgumentNullException(nameof(clientId)) },
				   { "redirect_uri", redirectUri },
				   { "grant_type", "authorization_code" }
				};

			var isOpenId = configuration.GetValue<bool>("OpenId_Connect");
			if (isOpenId == true)
			{
				//set client assertion type
				var ClientAssertionType = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";

				/*Prepare jwtToken object to generate jwt token which is send form
                  client_assertion parameter in query string*/
				var requestObject = new JwtTokenDTO();
				requestObject.Expiry = 60;
				requestObject.Audience = configuration["Config:IDP_Config:IDP_url"] + "api/Authentication/token";
				requestObject.Issuer = clientId;
				requestObject.Subject = clientId;

				var ClientAssertion = JWTTokenManager.GenerateJWTToken(requestObject, isEncrypted);
				if (null == ClientAssertion)
				{
					throw new Exception("Fail to generate JWT token for Token request.");
				}

				data.Add("client_assertion_type", ClientAssertionType);
				data.Add("client_assertion", ClientAssertion);

			}
			else
			{
				var clientSecret = _globalConfiguration.IDPClientSecret;

				client.DefaultRequestHeaders.Clear();
				var authToken = Encoding.ASCII.GetBytes($"{clientId}:{clientSecret}");
				var authzHeader = "Basic  " + Convert.ToBase64String(authToken);
				var headerName = configuration["TokenHeaderName"]
				 ?? throw new InvalidOperationException("TokenHeaderName is not configured.");

				client.DefaultRequestHeaders.Add(headerName, authzHeader);
			}

			//convert data object in url encoded form
			var content = new FormUrlEncodedContent(data);


			var response = await client.PostAsync("api/Authentication/token", content);
			if (response == null)
			{
				throw new Exception("GetAccessToken responce getting null");
			}
			if (!response.IsSuccessStatusCode)
			{
				Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");

				dynamic error = new JObject();
				error.error = response.StatusCode;
				error.error_description = response.ReasonPhrase;
				return error;
			}
			else
			{
				var responseString = await response.Content.ReadAsStringAsync();

				return JObject.Parse(responseString);
			}

		}

		public async Task<JObject> GetAccessToken()
		{
			try
			{
				IdpSecret IDP_Secrets = new IdpSecret()
				{
					client_ID = _globalConfiguration.MobileIDPClientId,
					client_secret = _globalConfiguration.MobileIDPClientSecret
				};

				if (IDP_Secrets == null)
				{
					dynamic error = new JObject();
					error.error = "Internal error";
					error.error_description = "fail to get idp secret";
					return error;
				}
				// Prepare data object which is send with token endpoint url 
				var data = new Dictionary<string, string>
				{
				   { "client_id", IDP_Secrets.client_ID },
				   { "grant_type", "client_credentials" },
				   { "client_assertion_type",
						"urn:ietf:params:oauth:client-assertion-type:jwt-bearer"}
				};

				/*Prepare jwtToken object to generate jwt token which is send form
                    client_assertion parameter in query string*/
				var requestObject = new JwtTokenDTO();
				requestObject.Expiry = 60;
				requestObject.Audience = configuration["Config:IDP_Config:IDP_url"] + "api/Authentication/token";
				requestObject.Issuer = IDP_Secrets.client_ID;
				requestObject.Subject = IDP_Secrets.client_ID;

				// Generate JWT Token
				var ClientAssertion = JWTTokenManager.GenerateJWTToken(requestObject, isEncrypted);
				if (null == ClientAssertion)
				{
					dynamic error = new JObject();
					error.error = "Internal error";
					error.error_description = "fail to generate jwt token";
					return error;
				}
				data.Add("client_assertion", ClientAssertion);

				// Convert data object in url encoded form
				var content = new FormUrlEncodedContent(data);

				var response = await client.PostAsync("api/Authentication/token", content);
				if (response == null)
				{
					dynamic error = new JObject();
					error.error = "Internal error";
					error.error_description = "Api responce getting null";
					return error;
				}

				if (!response.IsSuccessStatusCode)
				{
					Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");

					dynamic error = new JObject();
					error.error = response.StatusCode;
					error.error_description = response.ReasonPhrase;
					return error;
				}
				else
				{
					var responseString = await response.Content.ReadAsStringAsync();
					return JObject.Parse(responseString);
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);

				dynamic error = new JObject();
				error.error = "Internal error";
				error.error_description = "GetAccessToken failed : " +
						ex.Message;
				return error;
			}
		}

		public async Task<JObject> GetUserInfo(string accessToken)
		{
			client.DefaultRequestHeaders.Clear();
			var authzHeader = "Bearer  " + accessToken;
			var headerName = configuration["TokenHeaderName"]
				 ?? throw new InvalidOperationException("TokenHeaderName is not configured.");

			client.DefaultRequestHeaders.Add(headerName, authzHeader);
			var response = await client.GetAsync("api/UserInfo/userinfo");
			if (response == null)
			{
				throw new Exception("get user info responce getting null");
			}
			if (!response.IsSuccessStatusCode)
			{
				Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");

				dynamic error = new JObject();
				error.error = response.StatusCode;
				error.error_description = response.ReasonPhrase;
				return error;
			}
			else
			{
				var responseString = await response.Content.ReadAsStringAsync();
				JObject info = JObject.Parse(responseString);
				return info;
			}

		}

		public async Task<JObject> GetUserProfileImage(string accessToken)
		{
			client.DefaultRequestHeaders.Clear();
			var authzHeader = "Bearer  " + accessToken;
			var headerName = configuration["TokenHeaderName"]
				 ?? throw new InvalidOperationException("TokenHeaderName is not configured.");

			client.DefaultRequestHeaders.Add(headerName, authzHeader);
			var response = await client.GetAsync("api/UserInfo/GetUserImage");
			if (response == null)
			{
				throw new Exception("get user info responce getting null");
			}
			if (!response.IsSuccessStatusCode)
			{
				Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");

				dynamic error = new JObject();
				error.error = response.StatusCode;
				error.error_description = response.ReasonPhrase;
				return error;
			}
			else
			{
				var responseString = await response.Content.ReadAsStringAsync();
				JObject info = JObject.Parse(responseString);
				return info;
			}

		}

		public ClaimsPrincipal ValidateIdentityToken(string idToken)
		{

			//validate id_token
			var user = ValidateJwt(idToken);

			//return id_token claim values
			return user;

		}

		public ClaimsPrincipal ValidateVerifierIdentityToken(string idToken)
		{

			//validate id_token
			var user = ValidateVerifierJwt(idToken);

			//return id_token claim values
			return user;

		}

		public ClaimsPrincipal ValidateJwt(string jwt)
		{

			//set options for jwt signature validation
			var parameters = new TokenValidationParameters
			{
				IssuerSigningKeyResolver = (token, securityToken, kid, parameters) =>
				{
					/*get key from idp jwks url to validate id_token signature*/
					var response = client.GetAsync("api/Jwks/jwksuri").Result;
					var responseString = response.Content.ReadAsStringAsync().Result;
					var keys = JsonConvert.DeserializeObject<JsonWebKeySet>(responseString);
					return keys.Keys;
				},
				//set flag true for validate issuer
				ValidateIssuer = true,
				//set flag true for validate Audience
				ValidateAudience = true,
				//set valid issuer to verify in token issuer
				ValidIssuer = configuration["Config:IDP_Config:Issuer"],
				//set valid Audience to verify in token Audience
				ValidAudience = _globalConfiguration.IDPClientId,
				NameClaimType = "name",
			};

			var handler = new JwtSecurityTokenHandler();
			handler.InboundClaimTypeMap.Clear();

			//validate jwt token
			// if token is valid it return claim otherwise throw exception
			var user = handler.ValidateToken(jwt, parameters, out var _);
			return user;

		}

		public ClaimsPrincipal ValidateVerifierJwt(string jwt)
		{

			//set options for jwt signature validation
			var parameters = new TokenValidationParameters
			{
				IssuerSigningKeyResolver = (token, securityToken, kid, parameters) =>
				{
					/*get key from idp jwks url to validate id_token signature*/
					var response = client.GetAsync("api/Jwks/jwksuri").Result;
					var responseString = response.Content.ReadAsStringAsync().Result;
					var keys = JsonConvert.DeserializeObject<JsonWebKeySet>(responseString);
					return keys.Keys;
				},
				//set flag true for validate issuer
				ValidateIssuer = true,
				//set flag true for validate Audience
				ValidateAudience = true,
				//set valid issuer to verify in token issuer
				ValidIssuer = configuration["Config:IDP_Config:Issuer"],
				//set valid Audience to verify in token Audience
				ValidAudience = configuration.GetValue<string>("Config:Verification_app:client_id"),
				NameClaimType = "name",
			};

			var handler = new JwtSecurityTokenHandler();
			handler.InboundClaimTypeMap.Clear();

			//validate jwt token
			// if token is valid it return claim otherwise throw exception
			var user = handler.ValidateToken(jwt, parameters, out var _);
			return user;

		}
		public string ValidateApiToken(string token)
		{
			try
			{
				var tokenHandler = new JwtSecurityTokenHandler();
				//var apiToken = configuration.GetValue<string>("Secret:ApiTokenKeySecret");
				var key = Encoding.ASCII.GetBytes(_globalConfiguration.ApiTokenKeySecret);
				tokenHandler.ValidateToken(token, new TokenValidationParameters
				{
					ValidateIssuerSigningKey = true,
					IssuerSigningKey = new SymmetricSecurityKey(key),
					ValidateIssuer = false,
					ValidateAudience = false,
					// set clockskew to zero so tokens expire exactly at token expiration time (instead of 5 minutes later)
					ClockSkew = TimeSpan.Zero
				}, out SecurityToken validatedToken);

				var jwtToken = (JwtSecurityToken)validatedToken;
				var User = jwtToken.Claims.First(x => x.Type == ClaimTypes.UserData).Value;

				return User;
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);

				return null;
			}
		}

		public string generateApiToken(UserDTO user, int expire_in)
		{
			// generate token that is valid for 7 days
			var tokenHandler = new JwtSecurityTokenHandler();
			//var apiToken = configuration.GetValue<string>("Secret:ApiTokenKeySecret");
			var key = Encoding.ASCII.GetBytes(_globalConfiguration.ApiTokenKeySecret);
			var tokenDescriptor = new SecurityTokenDescriptor
			{
				Subject = new ClaimsIdentity(new[] { new Claim(ClaimTypes.UserData, JsonConvert.SerializeObject(user)) }),
				Expires = DateTime.UtcNow.AddSeconds(expire_in),
				SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
			};
			var token = tokenHandler.CreateToken(tokenDescriptor);
			return tokenHandler.WriteToken(token);
		}

		public string StringToBase64(string data)
		{
			return Convert.ToBase64String(Encoding.UTF8.GetBytes(data));
		}

		public string StringFromBase64(string data)
		{
			return Encoding.UTF8.GetString(Convert.FromBase64String(data));
		}

		public AuthenticationUrlResponse GetVerificationAppAuthorizationUrl(string nonce, string state)
		{

			var Url = string.Empty;
			var authorizationURl = configuration.GetValue<string>("Config:IDP_Config:IDP_url");

			var isOpenId = configuration.GetValue<bool>("OpenId_Connect");
			if (isOpenId == true)
			{
				/*Prepare jwtToken object to generate jwt token which is send form
                 request parameter in query string*/
				var clientId = configuration.GetValue<string>("Config:Verification_app:client_id");

				var requestObject = new JwtTokenDTO();
				requestObject.Expiry = 60;
				requestObject.Audience = configuration["Config:IDP_Config:Issuer"];
				requestObject.Issuer = clientId;
				requestObject.ResponseType = "code";
				requestObject.RedirecUri = configuration["Config:Verification_app:redirect_url"];
				requestObject.Scope = configuration["Config:Verification_app:scope"];
				requestObject.State = state;
				requestObject.Nonce = nonce;

				//generate jwt token by passing jwttoken object details
				var response = JWTTokenManager.GenerateJWTToken(requestObject, isEncrypted);
				if (null == response)
				{
					throw new Exception("Fail to generate JWT token for " +
						"Authorization request.");
				}

				//generate idp login url using ClientId,ClientId,Scopes,state,nonce,request
				//check all values in appsettings.Development.json file
				authorizationURl = authorizationURl +
				   "authorization?client_id={0}&redirect_uri={1}&response_type=code&scope={2}&state={3}&" +
				   "nonce={4}&request={5}";



				Url = String.Format(authorizationURl,
									clientId,
									configuration.GetValue<string>("Config:Verification_app:redirect_url"),
									configuration.GetValue<string>("Config:Verification_app:scope"),
									state, nonce, response);

			}
			else
			{
				authorizationURl = authorizationURl +
				   "authorization?client_id={0}&redirect_uri={1}&response_type=code&scope={2}&state={3}";

				var scope = configuration.GetValue<string>("Config:Verification_app:scope");

				var clientId = configuration.GetValue<string>("Config:Verification_app:client_id");

				Url = String.Format(authorizationURl,
									 clientId,
									 configuration.GetValue<string>("Config:Verification_app:redirect_url"),
									 scope.Replace("openid ", ""),
									 state);

			}

			return new AuthenticationUrlResponse(Url);

		}


		public async Task<JObject> GetVerifierAccessToken(string code)
		{
			var clientId = configuration.GetValue<string>("Config:Verification_app:client_id");

			//prepare data object which is send with token endpoint url 
		
			var redirectUri = configuration.GetValue<string>("Config:Verification_app:redirect_url")
				   ?? throw new InvalidOperationException("verification_app redirect url is not configured.");

			var data = new Dictionary<string, string>
			{
			   { "code", code ?? throw new ArgumentNullException(nameof(code)) },
			   { "client_id", clientId ?? throw new ArgumentNullException(nameof(clientId)) },
			   { "redirect_uri", redirectUri },
			   { "grant_type", "authorization_code" }
			};
			var isOpenId = configuration.GetValue<bool>("OpenId_Connect");
			if (isOpenId == true)
			{
				//set client assertion type
				var ClientAssertionType = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";

				/*Prepare jwtToken object to generate jwt token which is send form
                  client_assertion parameter in query string*/
				var requestObject = new JwtTokenDTO();
				requestObject.Expiry = 60;
				requestObject.Audience = configuration["Config:IDP_Config:IDP_url"] + "api/Authentication/token";
				requestObject.Issuer = clientId;
				requestObject.Subject = clientId;

				var ClientAssertion = JWTTokenManager.GenerateJWTToken(requestObject, isEncrypted);
				if (null == ClientAssertion)
				{
					throw new Exception("Fail to generate JWT token for Token request.");
				}

				data.Add("client_assertion_type", ClientAssertionType);
				data.Add("client_assertion", ClientAssertion);

			}
			else
			{
				var clientSecret = configuration.GetValue<string>("Config:Verification_app:client_secret");

				client.DefaultRequestHeaders.Clear();
				var authToken = Encoding.ASCII.GetBytes($"{clientId}:{clientSecret}");
				var authzHeader = "Basic  " + Convert.ToBase64String(authToken);
				var headerName = configuration["TokenHeaderName"]
				 ?? throw new InvalidOperationException("TokenHeaderName is not configured.");

				client.DefaultRequestHeaders.Add(headerName, authzHeader);
			}

			//convert data object in url encoded form
			var content = new FormUrlEncodedContent(data);


			var response = await client.PostAsync("api/Authentication/token", content);
			if (response == null)
			{
				throw new Exception("GetAccessToken responce getting null");
			}
			if (!response.IsSuccessStatusCode)
			{
				Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");

				dynamic error = new JObject();
				error.error = response.StatusCode;
				error.error_description = response.ReasonPhrase;
				return error;
			}
			else
			{
				var responseString = await response.Content.ReadAsStringAsync();

				return JObject.Parse(responseString);
			}

		}

	}
}

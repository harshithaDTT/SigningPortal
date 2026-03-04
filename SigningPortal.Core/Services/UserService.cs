using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace SigningPortal.Core.Services
{
	public class UserService : IUserService
	{
		private readonly ILogger<UserService> _logger;
		private readonly HttpClient _client;
		private readonly IHttpClientFactory _httpClientFactory;
		private readonly IConfiguration _configuration;
		private readonly IConstantError _constantError;
		private readonly IUserRepository _userRepository;
		public UserService(ILogger<UserService> logger,
			IHttpClientFactory httpClientFactory,
			IConfiguration configuration,
			IConstantError constantError,
			IUserRepository userRepository)
		{
			_configuration = configuration;
			_httpClientFactory = httpClientFactory;
			_client = _httpClientFactory.CreateClient("ignoreSSL"); ;
			_client.Timeout = TimeSpan.FromMinutes(10);
			_client.DefaultRequestHeaders.Add("Accept", "application/json");
			_userRepository = userRepository;
			_logger = logger;
			_constantError = constantError;
		}

		public async Task<ServiceResult> CheckIDPUsersAsync(CheckIdpUserDTO req, string userEmail)
		{
			if (req == null)
			{
				return new ServiceResult(_constantError.GetMessage("102551"));
				//return new ServiceResult("Object cannot be empty");
			}

			if (String.IsNullOrEmpty(req.emailList))
			{
				return new ServiceResult(_constantError.GetMessage("102552"));
				//return new ServiceResult("Email list cannot be empty");
			}

			try
			{
				if (_configuration.GetValue<bool>("CheckBlockedEmail"))
				{
					bool isBlocked = false;
					dynamic emailData = new System.Dynamic.ExpandoObject();
					IList<string> blockedEmail = new List<string>();

					string[] values = req.emailList.Split(',');
					for (int i = 0; i < values.Length; i++)
					{
						values[i] = values[i].Trim();
					}

					foreach (string value in values)
					{
						var userEmailList = await _userRepository.GetBlockedUserEmailAsync(value);
						if (userEmailList != null && userEmailList.BlockedDomainList.Contains(value.Split('@')[1]))
						{
							isBlocked = true;
							((IDictionary<String, Object>)emailData).Add(value, "Blocked Domain");
						}
						else if (userEmailList != null && userEmailList.BlockedEmailList.Contains(userEmail))
						{
							isBlocked = true;
							blockedEmail.Add(value);
							((IDictionary<String, Object>)emailData).Add(value, "Blocked User");
						}
						else
						{
							((IDictionary<String, Object>)emailData).Add(value, "User");
						}
					}

					var emailResult = JsonConvert.SerializeObject(emailData);

					if (isBlocked)
					{
						return new ServiceResult(emailResult, "Cannot send file to some recepients");
					}
				}

				string json = JsonConvert.SerializeObject(new { EmailList = req.emailList },
					new JsonSerializerSettings { ContractResolver = new CamelCasePropertyNamesContractResolver() });
				StringContent content = new StringContent(json, Encoding.UTF8, "application/json");
				var checkIdpUserUrl = _configuration["Config:CheckIdpUser"]
					  ?? throw new InvalidOperationException("Config:CheckIdpUser is missing.");

				HttpResponseMessage response =
					await _client.PostAsync(new Uri(checkIdpUserUrl), content);
				if (response.StatusCode == HttpStatusCode.OK)
				{
					APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
					if (apiResponse.Success)
					{
						return new ServiceResult(apiResponse.Result, apiResponse.Message);
					}
					else
					{
						_logger.LogError(apiResponse.Message);
						return new ServiceResult(apiResponse.Message);
					}
				}
				else
				{
					Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");

					_logger.LogError($"The request with URI={response.RequestMessage.RequestUri} failed " +
							   $"with status code={response.StatusCode}");
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("CheckIDPUsersAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult(_constantError.GetMessage("102553"));
			//return new ServiceResult("An error occurred while validating IDP users");
		}

		public async Task<ServiceResult> UpdateUserBlockListAsync(string userEmail, BlockUnblockUserDTO userDTO)
		{
			try
			{
				if (string.IsNullOrEmpty(userDTO.Value))
				{
					return new ServiceResult("Email cannot be null");
				}

				if (string.IsNullOrEmpty(userDTO.Status))
				{
					return new ServiceResult("status cannot be null");
				}

				var userEmailList = await _userRepository.GetBlockedUserEmailAsync(userEmail);

				if (userEmailList != null)
				{
					if (userDTO.Status == "Block")
					{

						if (userDTO.Type == "Email")
						{
							if (userEmail != userDTO.Value)
							{
								if (!userEmailList.BlockedEmailList.Contains(userDTO.Value))
								{
									userEmailList.BlockedEmailList.Add(userDTO.Value);
								}
								else
								{
									return new ServiceResult(userDTO.Value + " is already blocked");
								}
							}
							else
							{
								return new ServiceResult("Cannot block own email");
							}
						}

						if (userDTO.Type == "Domain")
						{
							if (userEmail.Split('@')[1] != userDTO.Value)
							{
								if (!userEmailList.BlockedDomainList.Contains(userDTO.Value))
								{
									userEmailList.BlockedDomainList.Add(userDTO.Value);
								}
								else
								{
									return new ServiceResult(userDTO.Value + " is already blocked");
								}
							}
							else
							{
								return new ServiceResult("Cannot block own domain");
							}
						}

					}

					if (userDTO.Status == "Unblock")
					{
						if (userDTO.Type == "Email")
						{
							if (userEmailList.BlockedEmailList.Contains(userDTO.Value))
							{
								userEmailList.BlockedEmailList.Remove(userDTO.Value);
							}
							else
							{
								return new ServiceResult(userDTO.Value + " is not blocked");
							}
						}

						if (userDTO.Type == "Domain")
						{
							if (userEmailList.BlockedDomainList.Contains(userDTO.Value))
							{
								userEmailList.BlockedDomainList.Remove(userDTO.Value);
							}
							else
							{
								return new ServiceResult(userDTO.Value + " is not blocked");
							}
						}
					}

					var updateEmailList = await _userRepository.UpdateBlockedEmailListAsync(userDTO.Type, userEmailList);

					if (updateEmailList)
					{
						return new ServiceResult(null, "Successfully updated block " + userDTO.Type + " list");
					}
				}
				else
				{
					if (userDTO.Status == "Block")
					{
						BlockedUser blockedUser = new BlockedUser()
						{
							Email = userEmail
						};

						if (userDTO.Type == "Email")
						{
							blockedUser.BlockedEmailList.Add(userDTO.Value);
						}

						if (userDTO.Type == "Domain")
						{
							blockedUser.BlockedDomainList.Add(userDTO.Value);
						}

						var blockUser = await _userRepository.BlockEmailAsync(blockedUser);

						return new ServiceResult(null, "Successfully blocked " + userDTO.Type);
					}
				}

				return new ServiceResult("Failed to block " + userDTO.Type);
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("UserStatusAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("Failed to " + userDTO.Status + userDTO.Type);
			//return new ServiceResult(_constantError.GetMessage("102553"));
		}

		public async Task<ServiceResult> BlockedUserEmailListAsync(string email)
		{
			try
			{
				var userEmailList = await _userRepository.GetBlockedUserEmailAsync(email);
				if (userEmailList == null)
				{
					return new ServiceResult("No Record available");
				}
				else
				{
					return new ServiceResult(userEmailList);
				}

			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("BlockedUserEmailListAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult(_constantError.GetMessage("102553"));
		}

		public async Task<ServiceResult> GetOrganizationEmailListAsync(string orgId)
		{
			try
			{
				if (string.IsNullOrEmpty(orgId))
				{
					return new ServiceResult("Email cannot be null");
				}

				var response = _client.GetAsync(_configuration.GetValue<string>("Config:OrganizationEmailListUrl") + orgId).Result;

				if (response.StatusCode == HttpStatusCode.OK)
				{
					var content = await response.Content.ReadAsStringAsync();
					var apiResponse = JsonConvert.DeserializeObject<APIResponse>(content);

					if (apiResponse == null)
					{
						return new ServiceResult(null, "Invalid API response");
					}

					if (apiResponse.Success)
					{
						if (apiResponse.Result == null)
						{
							return new ServiceResult(new List<string>(), "No emails found");
						}

						var resultString = apiResponse.Result.ToString()?.Replace("\r\n", "");

						var emails = JsonConvert.DeserializeObject<List<string>>(resultString ?? "")
									 ?? new List<string>();

						return new ServiceResult(emails, "Successfully received organization email list");
					}
					else
					{
						_logger.LogError(apiResponse.Message ?? "API returned failure");
						return new ServiceResult("Failed to get organization email list");
					}
				}
				else
				{
					Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");

					_logger.LogError($"The request with uri={response.RequestMessage.RequestUri} failed " +
					   $"with status code={response.StatusCode}");
				}

			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetOrganizationEmailListAsync Exception :  {0}", ex.Message);
			}
			return new ServiceResult("Failed to get organization email list");
		}
		public async Task<ServiceResult> SearchUserEmailListAsync(string value)
		{
			try
			{
				if (string.IsNullOrEmpty(value))
				{
					return new ServiceResult("Email cannot be null");
				}

				var response = _client.GetAsync(_configuration.GetValue<string>("Config:UgPassUserList") + value).Result;

				if (response.StatusCode == HttpStatusCode.OK)
				{
					APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
					if (apiResponse.Success)
					{
						return new ServiceResult(apiResponse.Result, "Successfully received user email list");
					}
					else
					{
						_logger.LogError(apiResponse.Message);
						return new ServiceResult("Failed to get users email list");
					}
				}
				else
				{
					Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");

					_logger.LogError($"The request with uri={response.RequestMessage.RequestUri} failed " +
					   $"with status code={response.StatusCode}");
				}

			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("UserEmailListAsync Exception :  {0}", ex.Message);
			}
			return new ServiceResult("Failed to get users email list");
		}

		public async Task<ServiceResult> GetSubscriberOrgnizationListByEmailAsync(string email)
		{
			try
			{
				_logger.LogInformation("GetSubscriberOrgnizationListByEmailAsync start " + DateTime.UtcNow);

				if (string.IsNullOrEmpty(email))
				{
					return new ServiceResult("Email cannot be null");
				}

				_logger.LogInformation("OrgnizationDetailsListByEmail api call start");
				var response = _client.GetAsync(_configuration.GetValue<string>("Config:OrgnizationDetailsListByEmailUrl") + email).Result;
				_logger.LogInformation("OrgnizationDetailsListByEmail api call end");

				if (response.StatusCode == HttpStatusCode.OK)
				{
					var content = await response.Content.ReadAsStringAsync();
					var apiResponse = JsonConvert.DeserializeObject<APIResponse>(content);

					if (apiResponse == null)
					{
						_logger.LogError("Failed to deserialize APIResponse");
						return new ServiceResult(null, "Invalid API response");
					}

					if (apiResponse.Success)
					{
						_logger.LogInformation("GetSubscriberOrgnizationListByEmailAsync end " + DateTime.UtcNow);

						var resultString = apiResponse.Result?.ToString() ?? string.Empty;

						return new ServiceResult(
							resultString,
							"Successfully received subscriber orgnization details"
						);
					}
					else
					{
						var errorMessage = apiResponse.Message ?? "Failed to get subscriber orgnization details";

						_logger.LogError(errorMessage);
						_logger.LogInformation("GetSubscriberOrgnizationListByEmailAsync end " + DateTime.UtcNow);

						return new ServiceResult(errorMessage);
					}
				}
				else
				{
					Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");

					_logger.LogError($"The request with uri={response.RequestMessage.RequestUri} failed " +
					   $"with status code={response.StatusCode}");
				}

			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("UserEmailListAsync Exception :  {0}", ex.Message);
			}
			_logger.LogInformation("GetSubscriberOrgnizationListByEmailAsync end " + DateTime.UtcNow);
			return new ServiceResult("Failed to get subscriber orgnization details");
		}
	}
}

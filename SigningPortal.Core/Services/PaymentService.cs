using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.Domain.Services.Communication.Payment;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

namespace SigningPortal.Core.Services
{
	public class PaymentService : IPaymentService
	{
		private readonly HttpClient _client;
		private readonly IConfiguration _configuration;
		private readonly IConstantError _constantError;
		private readonly ILogger<PaymentService> _logger;

		public PaymentService(ILogger<PaymentService> logger,
			IConfiguration configuration,
			IConstantError constantError,
			 HttpClient httpClient)
		{
			_configuration = configuration; 
            _client = httpClient;
			_client.Timeout = TimeSpan.FromMinutes(10);
			var idpUrl = _configuration["Config:IDP_Config:IDP_url"];

			if (string.IsNullOrWhiteSpace(idpUrl))
			{
				throw new InvalidOperationException("IDP URL is not configured properly.");
			}

			_client.BaseAddress = new Uri(idpUrl);
			_logger = logger;
			_constantError = constantError;

		}
		public async Task<ServiceResult> IsCreditAvailable(UserDTO userdata, bool isEsealPresent, bool isSignaturePresent = false)
		{
			try
			{
				var Url = "";
				if (userdata.AccountType.ToLower() == AccountTypeConstants.Self)
				{
					Url = _configuration.GetValue<string>("Config:PriceDetailsUrl") + "get/remaining-credits?suid=" + userdata.Suid;
				}
				else
				{
					Url = _configuration.GetValue<string>("Config:PriceDetailsUrl") + "get-org-rem-credits?orgId=" + userdata.OrganizationId;
				}

				var response = await _client.GetAsync(Url);
				if (response.StatusCode == HttpStatusCode.OK)
				{
					APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(
												await response.Content.ReadAsStringAsync())
												?? throw new InvalidOperationException("Failed to deserialize API response.");

					if (apiResponse.Success)
					{
						var result = false;
						var msg = "";

						var resultString = apiResponse.Result?.ToString()
										   ?? throw new InvalidOperationException("API response result is null.");

						if (userdata.AccountType.ToLower() == AccountTypeConstants.Self)
						{
							result = int.Parse(resultString) > 0;
							msg = result ? "Credits available" : "Credits are not available";
							return new ServiceResult(result, msg);
						}
						else
						{
							JObject obj = JsonConvert.DeserializeObject<JObject>(resultString)
										  ?? throw new InvalidOperationException("Failed to deserialize JObject.");

							if ((obj["postPaid"]?.Value<bool>() ?? false))
							{
								return new ServiceResult(true, apiResponse.Message);
							}

							if (isSignaturePresent)
							{
								var value = obj["digital_SIGNATURE"]?.Value<double>() ?? 0;
								result = value > 0;
								msg = result ? "Credits available" : "Credits are not available";
								if (!result) return new ServiceResult(result, msg);
							}

							if (isEsealPresent)
							{
								var value = obj["eseal_SIGNATURE"]?.Value<double>() ?? 0;
								result = value > 0;
								msg = result ? "Credits available" : "Eseal credits are not available";
								if (!result) return new ServiceResult(result, msg);
							}

							return new ServiceResult(result, "Credits available");
						}
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
			catch (Exception e)
			{
				Monitor.SendException(e);
				_logger.LogError("IsCreditAvailable  Exception :  {0}", e.Message);
			}

			return new ServiceResult(_constantError.GetMessage("102565"));
		}

		public async Task<(bool isPrepaid, ServiceResult result)> IsGroupCreditAvailable(UserDTO userdata, bool isEsealPresent, bool isSignaturePresent, int signCnt = 0, int esealCnt = 0)
		{
			var isPrepaid = true;
			try
			{

				var Url = "";
				if (userdata.AccountType.ToLower() == AccountTypeConstants.Self)
				{
					Url = _configuration.GetValue<string>("Config:PriceDetailsUrl") + "get/remaining-credits?suid=" + userdata.Suid;
				}
				else
				{
					Url = _configuration.GetValue<string>("Config:PriceDetailsUrl") + "get-org-rem-credits?orgId=" + userdata.OrganizationId;
				}

				var response = await _client.GetAsync(Url);
				if (response.StatusCode == HttpStatusCode.OK)
				{
					// Deserialize API response safely
					var responseContent = await response.Content.ReadAsStringAsync();
					var apiResponse = JsonConvert.DeserializeObject<APIResponse>(responseContent)
									  ?? throw new InvalidOperationException("Failed to deserialize API response.");

					// Ensure Result is not null
					var resultString = apiResponse.Result?.ToString()
									   ?? throw new InvalidOperationException("API response result is null.");

					if (apiResponse.Success)
					{
						var result = false;
						var msg = "";

						if (userdata.AccountType.Equals(AccountTypeConstants.Self, StringComparison.OrdinalIgnoreCase))
						{
							// Safe parse
							if (!int.TryParse(resultString, out int creditCount))
								throw new InvalidOperationException("API result is not a valid integer.");

							result = creditCount > signCnt;
							msg = result ? "Credits available" : "Number of credits is less than number of signatures.";
							return (isPrepaid, new ServiceResult(result, msg));
						}
						else
						{
							// Deserialize JObject safely
							var obj = JsonConvert.DeserializeObject<JObject>(resultString)
									  ?? throw new InvalidOperationException("Failed to deserialize JObject from API result.");

							// Safe property access
							if ((obj["postPaid"]?.Value<bool>() ?? false))
							{
								isPrepaid = false;
								return (isPrepaid, new ServiceResult(true, apiResponse.Message));
							}

							if (isSignaturePresent)
							{
								var value = obj["digital_SIGNATURE"]?.Value<double>() ?? 0;
								result = value > signCnt;
								msg = result ? "Credits available" : "Number of credits is less than number of signatures.";
								if (!result) return (isPrepaid, new ServiceResult(result, msg));
							}

							if (isEsealPresent)
							{
								var value = obj["eseal_SIGNATURE"]?.Value<double>() ?? 0;
								result = value > esealCnt;
								msg = result ? "Credits available" : "Number of eseal credits is less than number of eseal.";
								if (!result) return (isPrepaid, new ServiceResult(result, msg));
							}

							return (isPrepaid, new ServiceResult(result, "Credits available"));
						}
					}
					else
					{
						_logger.LogError(apiResponse.Message);
						return (isPrepaid, new ServiceResult(apiResponse.Message));
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
			catch (Exception e)
			{
				Monitor.SendException(e);
				_logger.LogError("IsCreditAvailable  Exception :  {0}", e.Message);
			}

			return (isPrepaid, new ServiceResult(_constantError.GetMessage("102565")));
		}

		public async Task<ServiceResult> IsPrepaidOrPostpaidAsync(UserDTO userdata)
		{
			try
			{
				var Url = _configuration.GetValue<string>("Config:PriceDetailsUrl") + "get-org-rem-credits?orgId=" + userdata.OrganizationId;

				var response = await _client.GetAsync("");
				if (response.StatusCode == HttpStatusCode.OK)
				{
					// Read API response safely
					var responseContent = await response.Content.ReadAsStringAsync();
					var apiResponse = JsonConvert.DeserializeObject<APIResponse>(responseContent)
									  ?? throw new InvalidOperationException("Failed to deserialize API response.");

					// Ensure Result is not null
					var resultString = apiResponse.Result?.ToString()
									   ?? throw new InvalidOperationException("API response result is null.");

					if (apiResponse.Success)
					{
						// Deserialize JObject safely
						var obj = JsonConvert.DeserializeObject<JObject>(resultString)
								  ?? throw new InvalidOperationException("Failed to deserialize JObject from API result.");

						// Safe property access
						var isPostPaid = obj["postPaid"]?.Value<bool>() ?? false;

						return new ServiceResult(true, isPostPaid ? "Postpaid" : "Prepaid");
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
			catch (Exception e)
			{
				Monitor.SendException(e);
				_logger.LogError("IsPrepaidOrPostpaidAsync  Exception :  {0}", e.Message);
			}

			return new ServiceResult(_constantError.GetMessage("102565"));
		}

		public async Task<ServiceResult> GetCreditDeatails(UserDTO userdata)
		{
			try
			{

				//var details = new PaymentDetails
				//{
				//    AvailableCredit = 789,
				//    TotalCredit = 1000
				//};

				//return new ServiceResult(details, "credit are available");

				var response = await _client.GetAsync(_configuration.GetValue<string>("Config:PriceDetailsUrl") + "get-balance-sheet-subscriber?suid=" + userdata.Suid + "&serviceId=1");

				if (response.StatusCode == HttpStatusCode.OK)
				{
					APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
					if (apiResponse.Success)
					{
						var customJsonSerializerSettings = new JsonSerializerSettings
						{
							NullValueHandling = NullValueHandling.Ignore
						};
						// Ensure apiResponse.Result is not null
						var resultString = apiResponse.Result?.ToString()
										   ?? throw new InvalidOperationException("API response result is null.");

						// Deserialize safely
						var details = JsonConvert.DeserializeObject<CreditDetails>(resultString, customJsonSerializerSettings)
									  ?? throw new InvalidOperationException("Failed to deserialize CreditDetails.");

						var Creditdetails = new PaymentDetails
						{
							AvailableCredit = details.totalCredits - details.totalDebits,
							TotalCredit = details.totalCredits
						};

						return new ServiceResult(Creditdetails, apiResponse.Message);
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
			catch (Exception e)
			{
				Monitor.SendException(e);
				_logger.LogError("IsCreditAvailable  Exception :  {0}", e.Message);
			}

			return new ServiceResult(_constantError.GetMessage("102566"));
		}
	}

}

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace SigningPortal.Core.Utilities
{
	public class GenericPushNotificationService : IGenericPushNotificationService
	{
		private readonly HttpClient _httpClient;
		private readonly ILogger<GenericPushNotificationService> _logger;
		private readonly IConfiguration _configuration;
		public GenericPushNotificationService(HttpClient httpClient,
			ILogger<GenericPushNotificationService> logger,
			IConfiguration configuration)
		{
			_httpClient = httpClient;
			_logger = logger;
			_configuration = configuration;
		}

		public async Task<ServiceResult> SendGenericPushNotification(string accessToken, string suid, string message)
		{
			try
			{
				if (string.IsNullOrEmpty(accessToken))
				{
					return new ServiceResult("Access Token cannot be null or empty");
				}
				else if (string.IsNullOrEmpty(suid))
				{
					return new ServiceResult("Suid cannot be null or empty");
				}
				else if (string.IsNullOrEmpty(message))
				{
					return new ServiceResult("Message Body cannot be null or empty");
				}

				PushNotificationDTO pushNotification = new()
				{
					AccessToken = accessToken,
					Suid = suid,
					Body = message
				};

				var baseUrl = _configuration.GetValue<string>("Config:GenericNotificationURL")?.TrimEnd('/');
				if (string.IsNullOrWhiteSpace(baseUrl))
				{
					_logger.LogError("GenericNotificationURL is not configured.");
					return new ServiceResult(false, "GenericNotificationURL is not configured");
				}

				var requestUrl = $"{baseUrl}/api/push-notification/send-push-notification";

				_logger.LogInformation("Sending push notification. Email: {Email}, Title: {Title}, Body: {Body}",
					pushNotification.Suid, pushNotification.Title, pushNotification.Body);

				// Serialize payload
				var jsonPayload = JsonConvert.SerializeObject(pushNotification);

				using var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

				// Call API
				var response = await _httpClient.PostAsync(requestUrl, content);
				var body = await response.Content.ReadAsStringAsync();

				// Handle HTTP failure
				if (!response.IsSuccessStatusCode)
				{
					_logger.LogError("Push notification failed. Status: {StatusCode}, Body: {Body}", response.StatusCode, body);
					return new ServiceResult(false, $"HTTP error while sending push notification: {response.StatusCode}");
				}

				// Deserialize API response
				var apiResponse = JsonConvert.DeserializeObject<APIResponse>(body);

				if (apiResponse != null && apiResponse.Success)
				{
					_logger.LogInformation("Push notification sent successfully. Email: {Email}, Title: {Title}",
						pushNotification.Suid, pushNotification.Title);
					return new ServiceResult(true, apiResponse.Message ?? "Push notification sent successfully");
				}

				_logger.LogError("Push notification API returned failure. Body: {Body}", body);
				return new ServiceResult(false, apiResponse?.Message ?? "Push notification API returned failure");
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Exception occurred while sending push notification");
				return new ServiceResult(false, $"Exception occurred while sending push notification: {ex.Message}");
			}
		}

		public async Task<ServiceResult> SendNotificationDelegationRequest(DelegationPushNotificationDTO request)
		{
			try
			{
				if (request == null)
				{
					return new ServiceResult(false, "Delegation push notification request should not be null");
				}

				var baseUrl = _configuration.GetValue<string>("Config:GenericNotificationURL")?.TrimEnd('/');
				if (string.IsNullOrWhiteSpace(baseUrl))
				{
					_logger.LogError("GenericNotificationURL is not configured.");
					return new ServiceResult(false, "GenericNotificationURL is not configured");
				}

				var requestUrl = $"{baseUrl}/api/push-notification/send-delegation-notification";

				_logger.LogInformation("Sending delegation push notification. Title: {Title}, Delegatees: {Delegatees}",
					request.Title, string.Join(", ", request.DelegateeList ?? new List<string>()));

				// Serialize payload
				var jsonPayload = JsonConvert.SerializeObject(request);

				using var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

				// Call API
				var response = await _httpClient.PostAsync(requestUrl, content);
				var body = await response.Content.ReadAsStringAsync();

				// Handle HTTP errors
				if (!response.IsSuccessStatusCode)
				{
					_logger.LogError("Delegation push notification failed. Status: {StatusCode}, Body: {Body}", response.StatusCode, body);
					return new ServiceResult(false, $"HTTP error while sending delegation push notification: {response.StatusCode}");
				}

				// Deserialize API response
				var apiResponse = JsonConvert.DeserializeObject<APIResponse>(body);

				if (apiResponse != null && apiResponse.Success)
				{
					_logger.LogInformation("Delegation push notification sent successfully. Title: {Title}, Delegatees: {Delegatees}",
						request.Title, string.Join(", ", request.DelegateeList ?? new List<string>()));
					return new ServiceResult(true, apiResponse.Message ?? "Delegation push notification sent successfully");
				}

				_logger.LogError("Delegation push notification API returned failure. Body: {Body}", body);
				return new ServiceResult(false, apiResponse?.Message ?? "Delegation push notification API returned failure");
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Exception occurred while sending delegation push notification");
				return new ServiceResult(false, $"Exception occurred while sending delegation push notification: {ex.Message}");
			}
		}

	}
}

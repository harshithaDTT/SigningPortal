using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace SigningPortal.Core.Utilities
{
	public class GenericEmailService : IGenericEmailService
	{
		private readonly HttpClient _httpClient;
		private readonly ILogger<GenericEmailService> _logger;
		private readonly IConfiguration _configuration;

		public GenericEmailService(HttpClient httpClient,
			ILogger<GenericEmailService> logger,
			IConfiguration configuration)
		{
			_httpClient = httpClient;
			_logger = logger;
			_configuration = configuration;
		}

		public async Task<ServiceResult> SendGenericEmail(Message message)
		{
			try
			{
				if (message.To == null || message.To.Count == 0)
					return new ServiceResult(false, "Recipients list should not be empty.");

				var baseUrl = _configuration.GetValue<string>("Config:GenericNotificationURL")?.TrimEnd('/');
				if (string.IsNullOrWhiteSpace(baseUrl))
				{
					_logger.LogError("GenericNotificationURL is not configured.");
					return new ServiceResult(false, "GenericNotificationURL is not configured");
				}

				var payload = new { to = message.To, subject = message.Subject, content = message.Content };

				_logger.LogInformation("Sending generic email. Recipients: {Recipients}", string.Join(", ", message.To));

				var jsonPayload = JsonConvert.SerializeObject(payload);

				using var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

				var response = await _httpClient.PostAsync($"{baseUrl}/api/email/send-email", content);

				var body = await response.Content.ReadAsStringAsync();

				if (!response.IsSuccessStatusCode)
				{
					_logger.LogError("Failed HTTP response. Status: {StatusCode}, Body: {Body}", response.StatusCode, body);
					return new ServiceResult(false, $"HTTP error while sending email: {response.StatusCode}");
				}

				var apiResponse = JsonConvert.DeserializeObject<APIResponse>(body);

				if (apiResponse != null && apiResponse.Success)
				{
					_logger.LogInformation("Generic email sent successfully. Recipients: {Recipients}", string.Join(", ", message.To));
					return new ServiceResult(true, apiResponse.Message ?? "Email sent successfully");
				}

				_logger.LogError("Email API returned failure. Body: {Body}", body);
				return new ServiceResult(false, apiResponse?.Message ?? "Email API returned failure");
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Exception occurred while sending generic email");
				Monitor.SendException(ex);
				return new ServiceResult(false, "Exception occurred while sending generic email: " + ex.Message);
			}
		}

		public async Task<ServiceResult> SendGenericEmailWithAttachment(Message message, string fileName)
		{
			try
			{
				var baseUrl = _configuration.GetValue<string>("Config:GenericNotificationURL")?.TrimEnd('/');
				if (string.IsNullOrWhiteSpace(baseUrl))
				{
					_logger.LogError("GenericNotificationURL is not configured.");
					return new ServiceResult(false, "GenericNotificationURL is not configured");
				}


				_logger.LogInformation("Sending generic email with attachment. Recipients: {Recipients}, FileName: {FileName}",
										string.Join(", ", message.To), fileName);

				using var form = new MultipartFormDataContent();

				// Add normal fields
				form.Add(new StringContent(string.Join(",", message.To)), "To");
				form.Add(new StringContent(message.Subject ?? string.Empty), "Subject");
				form.Add(new StringContent(message.Content ?? string.Empty), "Content");
				form.Add(new StringContent(message.IsAttachmentPresent.ToString().ToLower()), "IsAttachmentPresent");

				// Add file content
				if (message.Attachment != null && message.Attachment.Length > 0)
				{
					var streamContent = new ByteArrayContent(message.Attachment);
					streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
					form.Add(streamContent, "Attachment", Path.ChangeExtension(fileName,".pdf"));
				}

				var response = await _httpClient.PostAsync(baseUrl + $"/api/email/send-email-attachment?filename={Uri.EscapeDataString(Path.ChangeExtension(fileName, ".pdf"))}", form);
				var body = await response.Content.ReadAsStringAsync();

				if (!response.IsSuccessStatusCode)
				{
					_logger.LogError("Failed HTTP response. Status: {StatusCode}, Body: {Body}", response.StatusCode, body);
					return new ServiceResult(false, $"HTTP error while sending email with attachment: {response.StatusCode}");
				}

				var apiResponse = JsonConvert.DeserializeObject<APIResponse>(body);

				if (apiResponse != null && apiResponse.Success)
				{
					_logger.LogInformation("Generic email with attachment sent successfully. Recipients: {Recipients}, FileName: {FileName}",
											string.Join(", ", message.To), fileName);
					return new ServiceResult(true, apiResponse.Message ?? "Email with attachment sent successfully");
				}

				_logger.LogError("Email API returned failure. Body: {Body}", body);
				return new ServiceResult(false, apiResponse?.Message ?? "Email API returned failure");
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Exception occurred while sending generic email with attachment");
				Monitor.SendException(ex);
				return new ServiceResult(false, "Exception occurred while sending generic email with attachment: " + ex.Message);
			}
		}

	}
}


using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MongoDB.Driver.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.Domain.Services.Communication.Documents;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace SigningPortal.Core.Services
{
	public class DigitalFormResponseService : IDigitalFormResponseService
	{
		private readonly ILogger<DigitalFormResponseService> _logger;
		private readonly IDigitalFormResponseRepository _formRepository;
		private readonly INewDigitalFormResponseRepository _newFormRepository;
		private readonly IDocumentHelper _documentHelper;
		private readonly IDelegationRepository _delegationRepository;
		private readonly IDigitalFormTemplateRepository _templateRepository;
		private readonly IDigitalFormTemplateRoleRepository _documentTemplateRoleRepository;
		private readonly ITemplateDocumentRepository _templateDocumentRepository;
		private readonly ITemplateRecepientRepository _templateRecepientRepository;
		private readonly IConfiguration _configuration;
		private readonly INotificationService _notificationService;
		private readonly IPaymentService _paymentService;
		private readonly HttpClient _client;
		private readonly HttpContext context;
		private readonly IBackgroundService _backgroundService;

		public DigitalFormResponseService
			(
				ILogger<DigitalFormResponseService> logger,
				IDigitalFormResponseRepository formRepository,
				INewDigitalFormResponseRepository newFormRepository,
				IDocumentHelper documentHelper,
				IDelegationRepository delegationRepository,
				IDigitalFormTemplateRepository templateRepository,
				IDigitalFormTemplateRoleRepository documentTemplateRoleRepository,
				ITemplateDocumentRepository templateDocumentRepository,
				ITemplateRecepientRepository templateRecepientRepository,
				IConfiguration configuration,
				INotificationService notificationService,
				IPaymentService paymentService,
				IHttpContextAccessor httpContextAccessor,
				HttpClient httpClient,
				IBackgroundService backgroundService

			)
		{
			_logger = logger;
			_formRepository = formRepository;
			_newFormRepository = newFormRepository;
			_documentHelper = documentHelper;
			_delegationRepository = delegationRepository;
			_templateRepository = templateRepository;
			_documentTemplateRoleRepository = documentTemplateRoleRepository;
			_templateDocumentRepository = templateDocumentRepository;
			_templateRecepientRepository = templateRecepientRepository;
			_configuration = configuration;
			_notificationService = notificationService;
			_paymentService = paymentService;

			_client = httpClient;
			_client.Timeout = TimeSpan.FromSeconds(300);
			context = httpContextAccessor.HttpContext;
			_backgroundService = backgroundService;
		}

		public async Task<ServiceResult> GetDigitalFormResponseByTemplateIdAndSuidAsync(string templateId, string suid)
		{
			try
			{
				var formDetails = await _formRepository.GetDigitalFormResponseByIdAsync(templateId, suid);
				if (formDetails == null)
				{
					return new ServiceResult("Form response not found");
				}

				return new ServiceResult(formDetails, "Successfully recieved form response");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetDigitalFormResponseByTemplateIdAndSuidAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while getting form template response");
		}

		public async Task<ServiceResult> GetDigitalFormResponseByIdAsync(string roleId)
		{
			try
			{
				var formDetails = await _formRepository.GetDigitalFormResponseAsync(roleId);
				if (formDetails == null)
				{
					return new ServiceResult("An error occurred while getting form template");
				}

				return new ServiceResult(formDetails, "Successfully recieved form template");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetDigitalFormResponseByIdAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while getting form template role");
		}

		public async Task<ServiceResult> GetNewDigitalFormResponseListByRequestGroupIdAsync(string requestGrpId)
		{
			try
			{
				var tempDocList = await _templateDocumentRepository
										.GetTemplateDocumentListByRequestGroupId(requestGrpId);

				if (tempDocList == null || tempDocList.Count == 0)
					return new ServiceResult("Template documents not found");

				var tempDocIdList = tempDocList.Select(x => x._id).ToList();

				var formResponseList = await _newFormRepository
											.GetNewDigitalFormResponseListByTemplateDocumentIdListAsync(tempDocIdList);

				return new ServiceResult(formResponseList, "Successfully received form template response list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, message: $"GetNewDigitalFormResponseListByRequestGroupIdAsync Exception :: {ex.Message}");
				return new ServiceResult("An error occurred while getting form response");
			}
		}


		public async Task<ServiceResult> GetNewDigitalFormResponseByDocIdFormIdAsync(string docId, string tempId)
		{
			try
			{
				var formDetails = await _newFormRepository.GetNewDigitalFormResponseByDocIdFormIdAsync(docId, tempId);
				if (formDetails == null)
				{
					return new ServiceResult("An error occurred while getting form response");
				}

				return new ServiceResult(formDetails, "Successfully recieved form template");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetNewDigitalFormResponseByDocIdFormIdAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while getting form response");
		}

		public async Task<ServiceResult> GetDigitalFormResponseListByTemplateIdAsync(string tempId)
		{
			try
			{
				var formDetails = await _formRepository.GetDigitalFormResponseListAsync(tempId);
				if (formDetails == null)
				{
					return new ServiceResult("An error occurred while getting form response list");
				}

				//formDetails.ForEach(x => x.FormFieldData = string.Empty);

				return new ServiceResult(formDetails, "Successfully recieved form form response list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetDigitalFormResponseListByTemplateIdAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while getting form response list");
		}

		public async Task<ServiceResult> GetNewDigitalFormResponseListByTemplateIdAsync(string tempId)
		{
			try
			{
				var formDetails = await _newFormRepository.GetNewDigitalFormResponseListAsync(tempId);
				if (formDetails == null)
				{
					return new ServiceResult("An error occurred while getting form response list");
				}

				//formDetails.ForEach(x => x.FormFieldData = string.Empty);

				return new ServiceResult(formDetails, "Successfully recieved form form response list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetDigitalFormResponseListByTemplateIdAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while getting form response list");
		}

		public async Task<ServiceResult> GetSelfDigitalFormResponseListAsync(UserDTO user)
		{
			try
			{
				var formDetails = await _formRepository.GetSelfDigitalFormResponseListAsync(user.Suid);
				if (formDetails == null)
				{
					return new ServiceResult("An error occurred while getting form response list");
				}

				return new ServiceResult(formDetails, "Successfully recieved form form response list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetSelfDigitalFormResponseListAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while getting form response list");
		}

		//Used For Assisted Onboarded User
		public async Task<ServiceResult> SaveDigitalFormResponseAsync(DigitalFormResponseDTO dto, UserDTO userDTO)
		{
			bool isEsealPresent = false;
			bool isSignaturePresent = false;

			if (dto.FormId == null)
			{
				_logger.LogError("TemplateId cannot be empty");
				return new ServiceResult("TemplateId cannot be empty");
			}
			if (dto.File == null)
			{
				_logger.LogError("File cannot be empty");
				return new ServiceResult("File cannot be empty");
			}

			try
			{
				var isExist = await _formRepository.IsDigitalFormResponseExistAsync(dto.FormId, userDTO.Suid);
				if (isExist)
				{
					_logger.LogError("User has already filled the form");
					return new ServiceResult("User has already filled the form");
				}

				var template = await _templateRepository.GetDigitalFormTemplateAsync(dto.FormId);

				var docTemplate = await _documentTemplateRoleRepository.GetDigitalFormTemplateRoleListByTemplateIdAsync(dto.FormId);
				if (docTemplate == null || !docTemplate.Any())
				{
					_logger.LogError("Digital Form Template role list not found");
					return new ServiceResult("Digital Form Template role list not found");
				}
				var role = docTemplate[0];


				NewSigningServiceDTO data = new()
				{
					accountType = userDTO.AccountType.ToLower(),
					accountId = (userDTO.AccountType.ToLower() == AccountTypeConstants.Self) ? userDTO.Suid : userDTO.OrganizationId,
					documentType = _configuration.GetValue<string>("SigningService:SignDocType"),
					subscriberUniqueId = userDTO.Suid,
					organizationUid = string.IsNullOrEmpty(dto.OrganizationId) ? null : dto.OrganizationId,
					//authPin = string.IsNullOrEmpty(dto.AuthPin) ? null : PKIMethods.Instance.GenerateSHA256Hash(dto.AuthPin),
					//signPin = string.IsNullOrEmpty(dto.SignPin) ? null : PKIMethods.Instance.GenerateSHA256Hash(dto.SignPin),
					//capturedFace = string.IsNullOrEmpty(dto.CapturedFace) ? null : dto.CapturedFace,
					//voiceCapture = string.IsNullOrEmpty(dto.CapturedVoice) ? null : dto.CapturedVoice,
					assistive = true,
					placeHolderCoordinates = new()
					{
						pageNumber = role.PlaceHolderCoordinates.pageNumber?.ToString(),
						signatureXaxis = role.PlaceHolderCoordinates.signatureXaxis?.ToString(),
						signatureYaxis = role.PlaceHolderCoordinates.signatureYaxis?.ToString()
					}
				};

				var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
				var isDevelopment = environment == Environments.Development;
				if (isDevelopment)
				{
					data.callbackURL = _configuration.GetValue<string>("CallBackUrl") + "/api/digitalformresponse/new-callback-update";
				}
				else
				{
					data.callbackURL = _configuration.GetValue<string>("Config:Signing_portal:BACKEND_URL") + "/api/digitalformresponse/new-callback-update";
				}

				if (role.PlaceHolderCoordinates.pageNumber != null &&
					role.PlaceHolderCoordinates.signatureXaxis != null &&
					role.PlaceHolderCoordinates.signatureYaxis != null)
				{
					isSignaturePresent = true;
				}
				if (role.EsealPlaceHolderCoordinates.pageNumber != null &&
					role.EsealPlaceHolderCoordinates.signatureXaxis != null &&
					role.EsealPlaceHolderCoordinates.signatureYaxis != null)
				{
					data.esealPlaceHolderCoordinates = new()
					{
						pageNumber = role.EsealPlaceHolderCoordinates.pageNumber?.ToString(),
						signatureXaxis = role.EsealPlaceHolderCoordinates.signatureXaxis?.ToString(),
						signatureYaxis = role.EsealPlaceHolderCoordinates.signatureYaxis?.ToString()
					};

					isEsealPresent = true;
				}

				DigitalFormResponse formResponse = new()
				{
					FormId = dto.FormId,
					FormTemplateName = !string.IsNullOrEmpty(template.TemplateName) ? template.TemplateName : "",
					SignerEmail = userDTO.Email,
					SignerName = userDTO.Name,
					SignerSuid = userDTO.Suid,
					AcToken = dto.AcToken,
					DigitalFormRequestId = dto.DigitalFormRequestId,
					CreatedBy = userDTO.Name,
					FormFieldData = dto.FormFieldData,
					UpdatedBy = userDTO.Name,
					CreatedAt = DateTime.UtcNow,
					UpdatedAt = DateTime.UtcNow,
					Status = DocumentStatusConstants.InProgress
				};

				//check credit available or not
				var res = await _paymentService.IsCreditAvailable(userDTO, isEsealPresent, isSignaturePresent);
				if (res.Success && !(bool)res.Result)
				{
					_logger.LogInformation("Credits not available for " + userDTO.Email);
					return new ServiceResult(res.Message);
				}

				//Store document in EDMS
				var expiryDate = DateTime.UtcNow.AddDays(365).ToString("yyyy-MM-dd HH:mm:ss");
				var EdmsDoc = await _documentHelper.SaveDocumentToEDMS(dto.File, "documentName", expiryDate, userDTO.Suid);
				if (!EdmsDoc.Success)
				{
					_logger.LogError("Failed to save document in edms.");
					//return new ServiceResult(_constantError.GetMessage("102524"));
					return new ServiceResult("Failed to save document in edms.");
				}

				formResponse.EdmsId = EdmsDoc.Result.ToString();

				HttpResponseMessage response = null;
				var url = string.Empty;
				if (isSignaturePresent == false && isEsealPresent == true)
				{
					//data.organizationUid = userDTO.OrganizationId;

					url = _configuration.GetValue<string>("Config:NewESealSignServiceUrl");
				}
				else
				{
					url = _configuration.GetValue<string>("Config:NewSignServiceUrl");
				}

				using (var multipartFormContent = new MultipartFormDataContent())
				{
					StreamContent fileStreamContent = new(dto.File.OpenReadStream());
					fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");

					_client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", dto.IdpToken);

					//Add the file
					_logger.LogInformation($"Request body for the url {url} : {JsonConvert.SerializeObject(data)}");
					multipartFormContent.Add(fileStreamContent, name: "file", fileName: dto.File.FileName + ".pdf");
					multipartFormContent.Add(new StringContent(JsonConvert.SerializeObject(data)), "model");

					response = await _client.PostAsync(url, multipartFormContent);
				}
				if (response.StatusCode == HttpStatusCode.OK)
				{
					var res1 = await response.Content.ReadAsStringAsync();
					APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
					if (!apiResponse.Success)
					{
						_logger.LogError(apiResponse.Message);
						return new ServiceResult(apiResponse.Message);
					}
					formResponse.CorelationId = apiResponse.Result.ToString();
				}
				else
				{
					Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");

					_logger.LogInformation("Form Id : " + dto.FormId);
					_logger.LogError($"The request with URI={response.RequestMessage.RequestUri} failed " +
							   $"with status code={response.StatusCode}" + $" error = {response.ReasonPhrase}");
					return new ServiceResult("Signing failed");
				}

				var savedResponse = await _formRepository.SaveDigitalFormResponseAsync(formResponse);
				if (savedResponse == null)
				{
					_logger.LogError("Response not saved");
					return new ServiceResult("Response not saved");
				}
				return new ServiceResult(response, "Digital form signing and saving initiated");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("SaveDigitalFormResponseAsync Exception :  {0}", ex.Message);
			}
			return new ServiceResult("An error occurred while saving digital form response");
		}

		public async Task<ServiceResult> GenerateCSVResponseSheet(string formId)
		{
			if (formId == null)
			{
				return new ServiceResult("Form Id cannot be null");
			}

			try
			{
				var respList = await _formRepository.GetDigitalFormResponseListAsync(formId);
				if (respList == null || !respList.Any())
				{
					return new ServiceResult("Form Response List is empty");
				}

				var dataTable = new DataTable();
				dataTable.Columns.Add("SignerName".ToUpper());
				dataTable.Columns.Add("SignerEmail".ToUpper());
				dataTable.Columns.Add("SignDate".ToUpper());
				dataTable.Columns.Add("Status".ToUpper());

				foreach (var resp in respList)
				{
					var formData = JsonConvert.DeserializeObject<Dictionary<string, string>>(resp.FormFieldData);

					// Add additional columns based on the keys in the JSON object
					foreach (var key in formData.Keys)
					{
						if (!dataTable.Columns.Contains(key))
						{
							dataTable.Columns.Add(key.ToUpper());
						}
					}

					var dataRow = dataTable.NewRow();

					// Fill DataTable with response data
					dataRow["SignerName"] = resp.SignerName;
					dataRow["SignerEmail"] = resp.SignerEmail;
					dataRow["SignDate"] = resp.CreatedAt.ToString();
					dataRow["Status"] = resp.Status;

					// Fill additional columns based on the keys in the JSON object
					foreach (var kvp in formData)
					{
						dataRow[kvp.Key] = kvp.Value;
					}

					dataTable.Rows.Add(dataRow);
				}

				var csv = new StringBuilder();

				// Use CsvWriter for proper CSV formatting
				using (var csvWriter = new CsvWriter(new StringWriter(csv), new CsvConfiguration(CultureInfo.InvariantCulture)))
				{
					// Write header
					foreach (DataColumn column in dataTable.Columns)
					{
						csvWriter.WriteField(column.ColumnName);
					}
					csvWriter.NextRecord();

					// Write data
					foreach (DataRow row in dataTable.Rows)
					{
						for (int i = 0; i < dataTable.Columns.Count; i++)
						{
							var field = row[i].ToString();
							// Check for null or empty values and write an empty field if necessary
							csvWriter.WriteField(string.IsNullOrEmpty(field) ? "" : field);
						}
						csvWriter.NextRecord();
					}
				}

				var csvBytes = Encoding.UTF8.GetBytes(csv.ToString());

				var contentDisposition = new System.Net.Mime.ContentDisposition
				{
					FileName = "digital_form_responses.csv",
					Inline = false,
				};

				context.Response.Headers["Content-Disposition"] = contentDisposition.ToString();
				var fileResult = new FileContentResult(csvBytes, "text/csv")
				{
					FileDownloadName = "digital_form_responses.csv",
				};

				return new ServiceResult(fileResult, "CSV file received successfully");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GenerateCSVResponseSheet Exception: {0}", ex.Message);
				return new ServiceResult($"An error occurred: {ex.Message}");
			}
		}

		public async Task<ServiceResult> GenerateNewCSVResponseSheet(string formId)
		{
			if (string.IsNullOrWhiteSpace(formId))
			{
				return new ServiceResult("Form Id cannot be null or empty");
			}

			var dataTable = new DataTable();

			try
			{
				var respList = await _newFormRepository.GetNewDigitalFormResponseListAsync(formId);
				if (respList == null || !respList.Any())
				{
					return new ServiceResult("Form Response List is empty");
				}

				var numberOfSignatories = respList.FirstOrDefault()?.SignerResponses.Count ?? 0;

				// Add signer columns dynamically
				for (int i = 1; i <= numberOfSignatories; i++)
				{
					dataTable.Columns.Add($"Signer{i} Name");
					dataTable.Columns.Add($"Signer{i} Email");
					dataTable.Columns.Add($"Signer{i} SignDate");
					dataTable.Columns.Add($"Signer{i} Status");
				}

				// Process each response
				foreach (var resp in respList)
				{
					var signatories = resp.SignerResponses;

					// Ensure we have at least one signer to avoid null issues
					if (signatories == null || !signatories.Any())
					{
						continue;
					}

					var firstSigner = signatories.FirstOrDefault(x => x.SignerOrder == 1);
					var formData = firstSigner != null
						? JsonConvert.DeserializeObject<Dictionary<string, string>>(firstSigner.FormFieldData)
						: new Dictionary<string, string>();

					// Add dynamic columns from form field data
					foreach (var key in formData.Keys)
					{
						if (!dataTable.Columns.Contains(key))
						{
							dataTable.Columns.Add(key);
						}
					}

					// Populate the data row
					var dataRow = dataTable.NewRow();

					for (int i = 1; i <= numberOfSignatories; i++)
					{
						var signer = signatories.ElementAtOrDefault(i - 1);
						if (signer != null)
						{
							dataRow[$"Signer{i} Name"] = signer.SignerDetails.SignerName;
							dataRow[$"Signer{i} Email"] = signer.SignerDetails.SignerEmail;
							dataRow[$"Signer{i} SignDate"] = signer.CompleteTime;
							dataRow[$"Signer{i} Status"] = signer.Status;
						}
					}

					foreach (var kvp in formData)
					{
						dataRow[kvp.Key] = kvp.Value;
					}

					dataTable.Rows.Add(dataRow);
				}

				// Generate CSV content
				var memoryStream = new MemoryStream();
				using (var writer = new StreamWriter(memoryStream, Encoding.UTF8))
				using (var csvWriter = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture)))
				{
					// Write header
					foreach (DataColumn column in dataTable.Columns)
					{
						csvWriter.WriteField(column.ColumnName);
					}
					csvWriter.NextRecord();

					// Write rows
					foreach (DataRow row in dataTable.Rows)
					{
						foreach (var item in row.ItemArray)
						{
							csvWriter.WriteField(item?.ToString() ?? "");
						}
						csvWriter.NextRecord();
					}
				}

				// Return file as a downloadable response
				var csvBytes = memoryStream.ToArray();
				var fileResult = new FileContentResult(csvBytes, "text/csv")
				{
					FileDownloadName = "digital_form_responses.csv"
				};

				return new ServiceResult(fileResult, "CSV file generated successfully");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, "Error generating CSV response sheet for Form Id: {FormId}", formId);
				return new ServiceResult($"An error occurred while generating the CSV: {ex.Message}");
			}
		}

		public async Task<ServiceResult> GetDigitalFormFillDataAsync(string suid,string idpToken = "")
		{
			try
			{
				_logger.LogInformation("GetDigitalFormFillDataAsync start");
				if (string.IsNullOrEmpty(suid))
				{
					return new ServiceResult("SUID can not be null");
				}

				HttpClient httpClient = new();

				httpClient.DefaultRequestHeaders.Add("deviceId", "WEB");
				httpClient.DefaultRequestHeaders.Add("appVersion", "3.0.15");
				httpClient.DefaultRequestHeaders.Add("osVersion", "2");

                var reqBody = new
                {
                    selfieRequired = true,
                    suid
                };

                var json = JsonConvert.SerializeObject(reqBody);

				StringContent content = new(json, Encoding.UTF8, "application/json");

                httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", idpToken);

                _logger.LogInformation("GetDigitalFormFillDataAsync api call start");
				var response = await httpClient.PostAsync(_configuration.GetValue<string>("Config:FillDataUrl"), content);
				_logger.LogInformation("GetDigitalFormFillDataAsync api call end");
				if (response.StatusCode == HttpStatusCode.OK)
				{
					APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
					if (apiResponse.Success)
					{
						_logger.LogInformation("GetDigitalFormFillDataAsync end");
						return new ServiceResult(apiResponse.Result.ToString().Replace("\r\n", ""), apiResponse.Message);
					}
					else
					{
						_logger.LogError(apiResponse.Message);
						_logger.LogInformation("GetDigitalFormFillDataAsync end");
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
				_logger.LogError("GetDigitalFormFillDataAsync Exception :  {0}", ex.Message);
			}
			_logger.LogInformation("GetDigitalFormFillDataAsync end");
			return new ServiceResult("Failed to receive digital form fill data");
		}

		public async Task<ServiceResult> DeleteFormResponseBySuidAndTempId(string suid, string tempId)
		{
			try
			{
				var formDetails = await _formRepository.DeleteDigitalFormResponseByTempIdAndSuid(suid, tempId);
				if (!formDetails)
				{
					return new ServiceResult("An error occurred while deleting form response");
				}

				return new ServiceResult(null, "Form Response Deleted successfully");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("DeleteFormResponseBySuidAndTempId Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while deleting form response");
		}

		//public async Task<ServiceResult> NewCallBackDigitalFormResponseUpdateAsync(RecieveDocumentDTO dto)
		//{
		//	try
		//	{
		//		_logger.LogInformation("NewCallBackDigitalFormResponseUpdateAsync service start ---->");

		//		DigitalFormTemplate documentData = new();

		//		DigitalFormResponse toUpdate = new()
		//		{
		//			CorelationId = dto.correlationID,
		//			Status = DocumentStatusConstants.Completed,
		//		};

		//		if (dto.success == false)
		//		{
		//			toUpdate.Status = DocumentStatusConstants.Failed;

		//			var response = await _formRepository.UpdateDigitalFormResponseById(toUpdate);
		//			if (!response)
		//			{
		//				_logger.LogInformation("UpdateDigitalFormResponseById fail");
		//			}
		//			_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedFormDetailsNotifiaction(dto.correlationID, "Document signing failed."));

		//			return new ServiceResult("Document signing failed");
		//		}

		//		var savedResponse = await _formRepository.GetDigitalFormResponseByCorelationIdAsync(dto.correlationID);
		//		if (savedResponse == null)
		//		{
		//			_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedFormDetailsNotifiaction(dto.correlationID, "Document signing failed."));

		//			toUpdate.Status = DocumentStatusConstants.Failed;
		//		}
		//		else
		//		{

		//			if (savedResponse.FormFieldData.Contains("x_cst_indv_suid"))
		//			{
		//				_logger.LogInformation("OpenSpp API call start ----->");
		//				HttpResponseMessage httpResponse;

		//				string url = _configuration.GetValue<string>("Config:OpenSPPApi");

		//				using (var multipartFormContent = new MultipartFormDataContent())
		//				{
		//					StreamContent fileStreamContent = new(dto.signfile.OpenReadStream());
		//					fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");

		//					_logger.LogInformation($"OpenSpp API call request body: {savedResponse.FormFieldData}");

		//					multipartFormContent.Add(fileStreamContent, name: "file", fileName: dto.signfile.FileName + ".pdf");

		//					multipartFormContent.Add(new StringContent(savedResponse.FormFieldData), name: "jsonData");

		//					httpResponse = await _client.PostAsync(url, multipartFormContent);
		//				}
		//				if (httpResponse.StatusCode != HttpStatusCode.OK)
		//				{
		//					_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedFormDetailsNotifiaction(dto.correlationID, "Something went wrong, please try after some time"));

		//					//PushNotification
		//					// _documentHelper.DigitalFormPushNotification(new DigitalFormPushNotificationDTO() { Body = "Something went wrong, please try after some time", Email = savedResponse.SignerEmail });

		//					//delete form response
		//					var deleteForm = await _formRepository.DeleteDigitalFormResponseByCorelationId(dto.correlationID);
		//					if (!deleteForm)
		//					{
		//						_logger.LogError("Failed to delete form response");
		//					}

		//					Monitor.SendMessage($"The request with URI={httpResponse.RequestMessage.RequestUri} failed " +
		//					$"with status code={httpResponse.StatusCode}");

		//					_logger.LogError($"The request with URI={httpResponse.RequestMessage.RequestUri} failed " +
		//						   $"with status code={httpResponse.StatusCode}" + $" error = {httpResponse.ReasonPhrase}");
		//					return new ServiceResult("Signing Failed");
		//				}
		//				else
		//				{
		//					APIResponse newResponse = JsonConvert.DeserializeObject<APIResponse>(await httpResponse.Content.ReadAsStringAsync());
		//					if (!newResponse.Success)
		//					{
		//						_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedFormDetailsNotifiaction(dto.correlationID, newResponse.Message));

		//						//PushNotification
		//						//_documentHelper.DigitalFormPushNotification(new DigitalFormPushNotificationDTO() { Body = newResponse.Message, Email = savedResponse.SignerEmail });

		//						//delete form response
		//						var deleteForm = await _formRepository.DeleteDigitalFormResponseByCorelationId(dto.correlationID);
		//						if (!deleteForm)
		//						{
		//							_logger.LogError("Failed to delete form response");
		//						}

		//						_logger.LogError(newResponse.Message);
		//						return new ServiceResult(newResponse.Message);
		//					}
		//				}

		//				_logger.LogInformation(" <-----OpenSpp API call end");
		//			}

		//			/////////////////////////////////////

		//			documentData = await _templateRepository.GetDigitalFormTemplateAsync(savedResponse.FormId);

		//			var updateDocumentToEDMS = await _documentHelper.UpdateDocumentToEDMS
		//										(savedResponse.EdmsId, dto.signfile, dto.signfile.FileName, savedResponse.SignerSuid);
		//			if (!updateDocumentToEDMS.Success)
		//			{
		//				_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedFormDetailsNotifiaction(dto.correlationID, "Document signing failed."));

		//				toUpdate.Status = DocumentStatusConstants.Failed;

		//				var response = await _formRepository.UpdateDigitalFormResponseById(toUpdate);
		//				if (!response)
		//				{
		//					_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedFormDetailsNotifiaction(dto.correlationID, "Document signing failed."));
		//				}
		//			}
		//			else
		//			{
		//				var response = await _formRepository.UpdateDigitalFormResponseById(toUpdate);
		//				if (!response)
		//				{
		//					_logger.LogInformation("UpdateDigitalFormResponseById fail");
		//					_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedFormDetailsNotifiaction(dto.correlationID, "Document signing failed."));
		//				}
		//				else
		//				{

		//					if (!string.IsNullOrWhiteSpace(documentData.SubmissionUrl))
		//					{
		//						var url = documentData.SubmissionUrl;

		//						string file;
		//						using (var memoryStream = new MemoryStream())
		//						{
		//							await dto.signfile.CopyToAsync(memoryStream);
		//							var fileBytes = memoryStream.ToArray();
		//							file = Convert.ToBase64String(fileBytes);
		//						}

		//						var request = new
		//						{
		//							FormId = savedResponse.FormId,
		//							Data = JsonConvert.DeserializeObject<JObject>(savedResponse.FormFieldData),
		//							File = file
		//						};

		//						var stringContent = new StringContent(JsonConvert.SerializeObject(request), Encoding.UTF8, "application/json");

		//						var httpResponse = await _client.PostAsync(url, stringContent);
		//						if (httpResponse.IsSuccessStatusCode)
		//						{
		//							var apiResponse = JsonConvert.DeserializeObject<APIResponse>(await httpResponse.Content.ReadAsStringAsync());
		//							if (apiResponse.Success)
		//							{
		//								_logger.LogInformation($"The request with URI={httpResponse.RequestMessage.RequestUri} is successful ");
		//							}
		//							else
		//							{
		//								_logger.LogError($"The request with URI={httpResponse.RequestMessage.RequestUri} is successful " +
		//									   $"with api response = {apiResponse.Message}");
		//							}
		//						}
		//						else
		//						{
		//							Monitor.SendMessage($"The request with URI={httpResponse.RequestMessage.RequestUri} failed " +
		//									$"with status code={httpResponse.StatusCode}");

		//							_logger.LogError($"The request with URI={httpResponse.RequestMessage.RequestUri} failed " +
		//									   $"with status code={httpResponse.StatusCode}" + $" error = {httpResponse.ReasonPhrase}");
		//						}
		//					}
		//					_logger.LogInformation("UpdateDigitalFormResponseById success");

		//					_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedFormDetailsNotifiaction(dto.correlationID, "Document signed successfully."));

		//					NotificationDTO notification = new()
		//					{
		//						Receiver = documentData.Suid,
		//						Sender = savedResponse.SignerEmail,
		//						Text = savedResponse.SignerName + " has signed the document " + documentData.DocumentName,
		//						Link = "/dashboard/document/" + savedResponse.FormId + "/status"
		//					};

		//					_backgroundService.RunBackgroundTask<INotificationService>(sender =>
		//						sender.CreateNotificationAsync(
		//							notification,
		//							documentData.OrganizationUid,
		//							new(NotificationTypeConstants.TemplateDocument, documentData._id)));

		//					try
		//					{
		//						bool pushNotification = _configuration.GetValue<bool>("PushNotification");
		//						if (savedResponse.AcToken != null && pushNotification)
		//						{
		//							_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.PushNotification(savedResponse.AcToken, documentData.Suid, savedResponse.SignerName + " has signed the document " + documentData.DocumentName));
		//						}
		//					}
		//					catch (Exception ex)
		//					{
		//						Monitor.SendException(ex);
		//						_logger.LogError("Failed to send push notification");
		//					}

		//					try
		//					{
		//						byte[] fileArray = null;

		//						if (dto.signfile != null)
		//						{
		//							using var memoryStream = new MemoryStream();
		//							dto.signfile.CopyTo(memoryStream);
		//							fileArray = memoryStream.ToArray();
		//						}

		//						SendEmailObj sendEmail = new()
		//						{
		//							Id = savedResponse.FormId,
		//							UserEmail = documentData.Email,
		//							UserName = documentData.CreatedBy
		//						};
		//						_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendAnEmailToFormCreator(sendEmail, fileArray));

		//						sendEmail = new()
		//						{
		//							Id = savedResponse.FormId,
		//							UserEmail = savedResponse.SignerEmail,
		//							UserName = savedResponse.SignerName,
		//						};
		//						_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendAnEmailToFormSigner(sendEmail, null, fileArray));
		//					}
		//					catch (Exception ex)
		//					{
		//						Monitor.SendException(ex);
		//						_logger.LogError("Failed to send email");
		//					}

		//					var res = new CallBackResponce();

		//					res.AccountType = AccountTypeConstants.Self;
		//					res.Value = savedResponse.SignerSuid;

		//					return new ServiceResult(res, "Successfully recieved form response");
		//				}
		//			}

		//		}
		//	}
		//	catch (Exception ex)
		//	{
		//		Monitor.SendException(ex);
		//		_logger.LogError(ex, ex.Message);
		//		_logger.LogError("NewCallBackDigitalFormResponseUpdateAsync Exception :  {0}", ex.Message);
		//	}
		//	finally
		//	{
		//		_logger.LogInformation("----> NewCallBackDigitalFormResponseUpdateAsync service end");
		//	}

		//	return new ServiceResult("An error occurred while getting new callback signing response");
		//}

		public async Task<ServiceResult> NewSaveDigitalFormResponseAsync(DigitalFormResponseDTO dto, UserDTO userDTO)
		{
			_logger.LogInformation("NewSaveDigitalFormResponseAsync service start ---->");

			bool isEsealPresent = false;
			bool isSignaturePresent = false;
			DigitalFormResponse savedResponse = new();
			HttpResponseMessage response;

			if (dto.FormId == null)
			{
				_logger.LogError("TemplateId cannot be empty");
				return new ServiceResult("TemplateId cannot be empty");
			}
			if (dto.File == null)
			{
				_logger.LogError("File cannot be empty");
				return new ServiceResult("File cannot be empty");
			}

			try
			{
				var isExist = await _formRepository.IsDigitalFormResponseExistAsync(dto.FormId, userDTO.Suid);
				if (isExist)
				{
					_logger.LogError("User has already filled the form");
					return new ServiceResult("User has already filled the form");
				}

				var template = await _templateRepository.GetDigitalFormTemplateAsync(dto.FormId);

				var docTemplate = await _documentTemplateRoleRepository.GetDigitalFormTemplateRoleListByTemplateIdAsync(dto.FormId);
				if (docTemplate == null || !docTemplate.Any())
				{
					_logger.LogError("Digital Form Template role list not found");
					return new ServiceResult("Digital Form Template role list not found");
				}
				var role = docTemplate[0];

				SigningServiceDTO data = new()
				{
					accountType = userDTO.AccountType.ToLower(),
					accountId = (userDTO.AccountType.ToLower() == AccountTypeConstants.Self) ? userDTO.Suid : userDTO.OrganizationId,
					documentType = _configuration.GetValue<string>("SigningService:SignDocType"),
					subscriberUniqueId = userDTO.Suid,
					organizationUid = dto.OrganizationId,
					mobile = dto.IsMobile,
					authPin = dto.AuthPin,
					signPin = dto.SignPin,
					userPhoto = dto.UserPhoto,

					placeHolderCoordinates = new()
					{
						pageNumber = role.PlaceHolderCoordinates.pageNumber?.ToString(),
						signatureXaxis = role.PlaceHolderCoordinates.signatureXaxis?.ToString(),
						signatureYaxis = role.PlaceHolderCoordinates.signatureYaxis?.ToString(),
						imgHeight = role.PlaceHolderCoordinates.imgHeight?.ToString(),
						imgWidth = role.PlaceHolderCoordinates.imgWidth?.ToString(),
					}
				};

				var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
				var isDevelopment = environment == Environments.Development;
				if (isDevelopment)
				{
					data.callbackURL = _configuration.GetValue<string>("CallBackUrl") + "/api/digitalformresponse/new-callback-update";
				}
				else
				{
					data.callbackURL = _configuration.GetValue<string>("Config:Signing_portal:BACKEND_URL") + "/api/digitalformresponse/new-callback-update";
				}

				if (role.PlaceHolderCoordinates.pageNumber != null &&
					role.PlaceHolderCoordinates.signatureXaxis != null &&
					role.PlaceHolderCoordinates.signatureYaxis != null)
				{
					isSignaturePresent = true;
				}
				if (role.EsealPlaceHolderCoordinates.pageNumber != null &&
					role.EsealPlaceHolderCoordinates.signatureXaxis != null &&
					role.EsealPlaceHolderCoordinates.signatureYaxis != null)
				{
					data.esealPlaceHolderCoordinates = new()
					{
						pageNumber = role.EsealPlaceHolderCoordinates.pageNumber?.ToString(),
						signatureXaxis = role.EsealPlaceHolderCoordinates.signatureXaxis?.ToString(),
						signatureYaxis = role.EsealPlaceHolderCoordinates.signatureYaxis?.ToString(),
						imgWidth = role.EsealPlaceHolderCoordinates?.imgWidth?.ToString(),
						imgHeight = role.EsealPlaceHolderCoordinates?.imgHeight?.ToString(),
					};

					isEsealPresent = true;
				}

				DigitalFormResponse formResponse = new()
				{
					FormId = dto.FormId,
					FormTemplateName = !string.IsNullOrEmpty(template.TemplateName) ? template.TemplateName : "",
					SignerEmail = userDTO.Email,
					SignerName = userDTO.Name,
					SignerSuid = userDTO.Suid,
					AcToken = dto.AcToken,
					CreatedBy = userDTO.Name,
					FormFieldData = dto.FormFieldData,
					UpdatedBy = userDTO.Name,
					CreatedAt = DateTime.UtcNow,
					UpdatedAt = DateTime.UtcNow,
					Status = DocumentStatusConstants.InProgress
				};


				//check credit available or not
				var res = await _paymentService.IsCreditAvailable(userDTO, isEsealPresent, isSignaturePresent);
				if (res.Success && !(bool)res.Result)
				{
					_logger.LogInformation("Credits not available for " + userDTO.Email);
					return new ServiceResult(res.Message);
				}


				//Store document in EDMS
				var expiryDate = DateTime.UtcNow.AddDays(365).ToString("yyyy-MM-dd HH:mm:ss");
				var EdmsDoc = await _documentHelper.SaveDocumentToEDMS(dto.File, "documentName", expiryDate, userDTO.Suid);
				if (!EdmsDoc.Success)
				{
					_logger.LogError("Failed to save document in edms.");
					//return new ServiceResult(_constantError.GetMessage("102524"));
					return new ServiceResult("Failed to save document in edms.");
				}

				formResponse.EdmsId = EdmsDoc.Result.ToString();

				string url;

				if (isSignaturePresent == false && isEsealPresent == true)
				{
					//data.organizationUid = userDTO.OrganizationId;

					url = _configuration.GetValue<string>("Config:ESealSignServiceUrl");
				}
				else
				{
					url = _configuration.GetValue<string>("Config:SignServiceUrl");
				}

				using (var multipartFormContent = new MultipartFormDataContent())
				{
					StreamContent fileStreamContent = new(dto.File.OpenReadStream());
					fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");

					_client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", dto.IdpToken);

					//Add the file
					_logger.LogInformation($"Request body for the url {url} : {JsonConvert.SerializeObject(data)}");
					multipartFormContent.Add(fileStreamContent, name: "file", fileName: dto.File.FileName + ".pdf");
					multipartFormContent.Add(new StringContent(JsonConvert.SerializeObject(data)), "model");

					response = await _client.PostAsync(url, multipartFormContent);
				}
				if (response.StatusCode == HttpStatusCode.OK)
				{
					var res1 = await response.Content.ReadAsStringAsync();
					APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
					if (!apiResponse.Success)
					{
						_logger.LogError(apiResponse.Message);
						return new ServiceResult(apiResponse.Message);
					}
					formResponse.CorelationId = apiResponse.Result.ToString();
				}
				else
				{
					Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");

					_logger.LogInformation("Form Id : " + dto.FormId);
					_logger.LogError($"The request with URI={response.RequestMessage.RequestUri} failed " +
							   $"with status code={response.StatusCode}" + $" error = {response.ReasonPhrase}");
					return new ServiceResult("Signing failed");
				}

				savedResponse = await _formRepository.SaveDigitalFormResponseAsync(formResponse);
				if (savedResponse == null)
				{
					_logger.LogError("Response not saved");
					return new ServiceResult("Response not saved");
				}
				return new ServiceResult(savedResponse, "Digital form signing and saving initiated");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("NewSaveDigitalFormResponseAsync Exception :  {0}", ex.Message);
			}
			finally
			{
				_logger.LogInformation("----> NewSaveDigitalFormResponseAsync service end");
			}
			return new ServiceResult("An error occurred while saving digital form response");
		}

		//new form flow with multiroles

		public async Task<ServiceResult> SendFormSigngingRequestAsync(FormSigngingRequestDTO dto, UserDTO userDTO)
		{
			try
			{
				bool isEsealPresent = false;
				bool isSignaturePresent = false;
				NewDigitalFormResponse savedResponse = new();
				HttpResponseMessage response;

				if (dto.FormDocumentId == null)
				{
					_logger.LogError("FormDocumentId cannot be empty");
					return new ServiceResult("FormDocumentId cannot be empty");
				}
				if (dto.File == null)
				{
					_logger.LogError("File cannot be empty");
					return new ServiceResult("File cannot be empty");
				}

				try
				{
					//var isExist = await _formRepository.IsDigitalFormResponseExistAsync(dto.FormId, userDTO.Suid);
					//if (isExist)
					//{
					//    _logger.LogError("User has already filled the form");
					//    return new ServiceResult("User has already filled the form");
					//}

					var templateDocument = await _templateDocumentRepository.GetTemplateDocumentByTempIdAsync(dto.FormDocumentId);
					if (templateDocument == null)
					{
						_logger.LogError("No document template record found");
						return new ServiceResult("No records found");
					}

					var template = await _templateRepository.GetDigitalFormTemplateAsync(dto.FormId);
					if (template == null)
					{
						_logger.LogError("No from template record found");
						return new ServiceResult("No records found");
					}

					var currentRecepient = templateDocument.TemplateRecepients.OrderBy(x => x.Order).Where(x => ((x.Signer.suid == userDTO.Suid
																|| x.AlternateSignatories.Any(s => s.suid == userDTO.Suid))
																&& x.OrganizationId == userDTO.OrganizationId)
																&& x.Status != RecepientStatus.Signed).FirstOrDefault();

					if (currentRecepient.TakenAction == true)
					{
						_logger.LogInformation("Form has been signed already.");
						return new ServiceResult("Form has been signed already.");
					}

					SigningServiceDTO data = new()
					{
						accountType = userDTO.AccountType.ToLower(),
						accountId = (userDTO.AccountType.ToLower() == AccountTypeConstants.Self) ? userDTO.Suid : userDTO.OrganizationId,
						documentType = _configuration.GetValue<string>("SigningService:SignDocType"),
						subscriberUniqueId = userDTO.Suid,
						organizationUid = dto.OrganizationId,
						mobile = dto.IsMobile,
						authPin = dto.AuthPin,
						signPin = dto.SignPin,
						userPhoto = dto.UserPhoto,

						placeHolderCoordinates = new()
						{
							pageNumber = currentRecepient.SignatureAnnotations.pageNumber?.ToString(),
							signatureXaxis = currentRecepient.SignatureAnnotations.signatureXaxis?.ToString(),
							signatureYaxis = currentRecepient.SignatureAnnotations.signatureYaxis?.ToString(),
							imgHeight = currentRecepient.SignatureAnnotations.imgHeight?.ToString(),
							imgWidth = currentRecepient.SignatureAnnotations.imgWidth?.ToString(),
						}
					};

					var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
					var isDevelopment = environment == Environments.Development;
					if (isDevelopment)
					{
						data.callbackURL = _configuration.GetValue<string>("CallBackUrl") + "/api/digitalformresponse/signed-form-document";
					}
					else
					{
						data.callbackURL = _configuration.GetValue<string>("Config:Signing_portal:BACKEND_URL") + "/api/digitalformresponse/signed-form-document";
					}

					if (currentRecepient.SignatureAnnotations.pageNumber != null &&
						currentRecepient.SignatureAnnotations.signatureXaxis != null &&
						currentRecepient.SignatureAnnotations.signatureYaxis != null)
					{
						isSignaturePresent = true;
					}
					if (currentRecepient.EsealAnnotations.pageNumber != null &&
						currentRecepient.EsealAnnotations.signatureXaxis != null &&
						currentRecepient.EsealAnnotations.signatureYaxis != null)
					{
						data.esealPlaceHolderCoordinates = new()
						{
							pageNumber = currentRecepient.EsealAnnotations.pageNumber?.ToString(),
							signatureXaxis = currentRecepient.EsealAnnotations.signatureXaxis?.ToString(),
							signatureYaxis = currentRecepient.EsealAnnotations.signatureYaxis?.ToString(),
							imgWidth = currentRecepient.EsealAnnotations?.imgWidth?.ToString(),
							imgHeight = currentRecepient.EsealAnnotations?.imgHeight?.ToString(),
						};
						isEsealPresent = true;
					}


					if (currentRecepient != null)
					{
						data.deligationSign = currentRecepient.HasDelegation;
					}

					//get delegation details
					if (currentRecepient.HasDelegation)
					{
						var delegatorDetails = await _delegationRepository.GetDelegateById(currentRecepient.DelegationId);
						if (delegatorDetails != null)
						{
							data.recipientName = delegatorDetails.DelegatorName;
							data.recipientEncryptedString = "";// PKIMethods.Instance.PKICreateSecureWireData(delegatorDetails.DelegatorSuid);
						}

						if (delegatorDetails.EndDateTime.ToUniversalTime() < DateTime.UtcNow)
						{
							if (delegatorDetails.DelegationStatus == DelegateConstants.Active ||
								delegatorDetails.DelegationStatus == DelegateConstants.Pending)
							{
								delegatorDetails.DelegationStatus = DelegateConstants.Expired;

								var updateDelegate = await _delegationRepository.UpdateDelegateById(delegatorDetails);
								if (!updateDelegate)
								{
									_logger.LogError("Failed to udpate delegate");
									//return new ServiceResult("Failed to udpate delegate");
								}

								try
								{
									_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendEmailToDelegatee(delegatorDetails._id, "Signature Delegation Expired", true));
								}
								catch (Exception ex)
								{
									Monitor.SendException(ex);
									_logger.LogError("SendEmailToDelegatee Exception");
									_logger.LogError(ex.Message);
								}

								return new ServiceResult("Delegation period is expired.");
							}
						}

						if (delegatorDetails.DelegationStatus == DelegateConstants.Expired)
						{
							return new ServiceResult("Delegation period is expired.");
						}

						if (delegatorDetails.DelegationStatus == DelegateConstants.Cancelled)
						{
							return new ServiceResult("Delegation has been revoked.");
						}
					}


					//check credit available or not
					var res = await _paymentService.IsCreditAvailable(userDTO, isEsealPresent, isSignaturePresent);
					if (res.Success && !(bool)res.Result)
					{
						_logger.LogInformation("Credits not available for " + userDTO.Email);
						return new ServiceResult(res.Message);
					}

					NewDigitalFormResponse formResponse = new()
					{
						FormId = dto.FormId,
						FormTemplateName = !string.IsNullOrEmpty(template.TemplateName) ? template.TemplateName : "",
						//SignerEmail = userDTO.Email,
						//SignerName = userDTO.Name,
						//SignerSuid = userDTO.Suid,
						//AcToken = dto.AcToken,
						RequestType = templateDocument.RequestType,
						CreatedBy = userDTO.Name,
						TemplateDocumentID = dto.FormDocumentId,
						//FormFieldData = dto.FormFieldData,
						UpdatedBy = userDTO.Name,
						CreatedAt = DateTime.UtcNow,
						UpdatedAt = DateTime.UtcNow,
						Status = DocumentStatusConstants.InProgress
					};


					SignerResponse signer = new()
					{
						SignerDetails = new SignerDetails()
						{
							SignerName = userDTO.Name,
							RoleName = currentRecepient?.RoleName,
							SignerSuid = userDTO.Suid,
							SignerEmail = userDTO.Email,
							DelegationId = currentRecepient.DelegationId
						},
						Status = DocumentStatusConstants.InProgress,
						Actoken = dto.AcToken,
						FormFieldData = dto.FormFieldData,
						SignerOrder = currentRecepient.Order

					};

					//Store document in EDMS
					int daysToComplete;
					string expiryDate = string.Empty;
					if (int.TryParse(templateDocument.DaysToComplete, out daysToComplete))
					{
						expiryDate = DateTime.UtcNow.AddDays(daysToComplete).ToString("yyyy-MM-dd HH:mm:ss");
					}
					else
					{
						_logger.LogError("DaysToComplete must be a valid integer string.");
					}
					var EdmsDoc = await _documentHelper.SaveDocumentToEDMS(dto.File, "documentName", expiryDate, userDTO.Suid);
					if (!EdmsDoc.Success)
					{
						_logger.LogError("Failed to save document in edms.");
						//return new ServiceResult(_constantError.GetMessage("102524"));
						return new ServiceResult("Failed to save document in edms.");
					}

					formResponse.EdmsId = EdmsDoc.Result.ToString();

					string url;

					if (isSignaturePresent == false && isEsealPresent == true)
					{
						//data.organizationUid = userDTO.OrganizationId;

						url = _configuration.GetValue<string>("Config:ESealSignServiceUrl");
					}
					else
					{
						url = _configuration.GetValue<string>("Config:SignServiceUrl");
					}

					using (var multipartFormContent = new MultipartFormDataContent())
					{
						StreamContent fileStreamContent = new(dto.File.OpenReadStream());
						fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");

						_client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", dto.IdpToken);


						var json = JsonConvert.SerializeObject(data);
						//Add the file
						_logger.LogInformation($"Request body for the url {url} : {JsonConvert.SerializeObject(data)}");
						multipartFormContent.Add(fileStreamContent, name: "file", fileName: dto.File.FileName + ".pdf");
						multipartFormContent.Add(new StringContent(json), "model");

						response = await _client.PostAsync(url, multipartFormContent);
					}
					if (response.StatusCode == HttpStatusCode.OK)
					{
						var res1 = await response.Content.ReadAsStringAsync();
						APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
						if (!apiResponse.Success)
						{
							_logger.LogError(apiResponse.Message);
							return new ServiceResult(apiResponse.Message);
						}
						signer.CorrelationId = apiResponse.Result.ToString();
						_logger.LogInformation("CorrelationId : " + apiResponse.Result.ToString());
					}
					else
					{
						Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
						$"with status code={response.StatusCode}");

						_logger.LogInformation("Form Id : " + dto.FormId);
						_logger.LogError($"The request with URI={response.RequestMessage.RequestUri} failed " +
								   $"with status code={response.StatusCode}" + $" error = {response.ReasonPhrase}");
						return new ServiceResult("Signing failed");
					}

					var temDoc = new TemplateDocument()
					{
						_id = dto.FormDocumentId,
						EdmsId = EdmsDoc.Result.ToString()
					};

					var updateTemplateDocument = await _templateDocumentRepository.UpdateTemplateDocumentEdmsIdById(temDoc);
					if (!updateTemplateDocument)
					{
						_logger.LogError("Failed to update edms id in template document");
					}
					//update accesstoken for pushnotification
					var updateRecepient = await _templateRecepientRepository.UpdateCorrelationIdOfTemplateRecepientById(
											currentRecepient._id,
											signer.CorrelationId ?? string.Empty,  // fallback if null
											userDTO.Name,
											dto.AcToken,
											dto.IdpToken,
											userDTO.Email
										);
					var formRes = await _newFormRepository.GetNewDigitalFormResponseByDocIdFormIdAsync(dto.FormDocumentId, dto.FormId);
					if (formRes == null)
					{
						formResponse.SignerResponses.Add(signer);
						savedResponse = await _newFormRepository.SaveNewDigitalFormResponseAsync(formResponse);
						if (savedResponse == null)
						{
							_logger.LogError("Response not saved");
							return new ServiceResult("Response not saved");
						}
					}
					else if (formRes.SignerResponses.Count < templateDocument.TemplateRecepients.Count)
					{
						var existingSigner = formRes.SignerResponses
								.FirstOrDefault(x => x.SignerDetails.SignerSuid == userDTO.Suid
													&& x.SignerDetails.DelegationId == signer.SignerDetails.DelegationId);

						if (existingSigner != null)
						{
							// Update CorrelationId for the existing signer
							existingSigner.CorrelationId = signer.CorrelationId;
						}
						else
						{
							// Add a new signer
							formRes.SignerResponses.Add(signer);
						}

						var updateSigners = await _newFormRepository.UpdateNewDigitalFormSignersResponseById(formRes, formRes._id);
						if (!updateSigners)
						{
							_logger.LogError("Failed to update signers in form response");
						}
					}
					return new ServiceResult(savedResponse, "Digital form signing initiated");
				}
				catch (Exception ex)
				{
					Monitor.SendException(ex);
					_logger.LogError(ex, ex.Message);
					_logger.LogError("NewSaveDigitalFormResponseAsync Exception :  {0}", ex.Message);
				}
				finally
				{
					_logger.LogInformation("----> NewSaveDigitalFormResponseAsync service end");
				}
				return new ServiceResult("An error occurred while saving digital form response");

			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
			}
			return new ServiceResult("An error");
		}

		public async Task<ServiceResult> ReceivedFormDocumentAsync(RecieveDocumentDTO dto)
		{
			try
			{
				bool isAllSignComplete = false;

				if (dto == null)
				{
					_logger.LogError("RecieveFormDocument request data null");
					_logger.LogInformation("RecieveFormDocument callback CorelationId :" + dto.correlationID);
					return new ServiceResult("Data cannot be null");
				}

				_logger.LogInformation("ReceivedFormSigngingRequestAsync service start ---->");

				//DigitalFormTemplate documentData = new();

				NewDigitalFormResponse toUpdate = new()
				{
					Status = DocumentStatusConstants.Completed
				};



				_logger.LogInformation("RecieveForm callback CorelationId :" + dto.correlationID);

				var recepientData = await _templateRecepientRepository.FindTemplateRecepientByCorelationId(dto.correlationID);
				if (recepientData == null)
				{
					toUpdate.Status = DocumentStatusConstants.Failed;

					var response = await _newFormRepository.UpdateNewDigitalFormResponseStatusById(toUpdate, dto.correlationID);
					if (!response)
					{
						_logger.LogInformation("UpdateDigitalFormResponseById fail");
					}
					_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedFormDocumentDetailsNotifiaction(dto.correlationID, "Form signing failed."));

					return new ServiceResult("Form signing failed");
				}

				_logger.LogInformation("Form Recepient data : {0}", JsonConvert.SerializeObject(recepientData));

				var docId = recepientData.TemplateDocumentId;

				if (dto.success == false)
				{
					string errorMessage;
					if (string.IsNullOrEmpty(dto.errorMessage))
					{
						errorMessage = "Something went wrong";
					}
					else
					{
						errorMessage = dto.errorMessage;
					}
					_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedFormDocumentDetailsNotifiaction(dto.correlationID, "Form signing failed."));

					_logger.LogInformation("RecieveDocument callback CorelationId :" + dto.correlationID);
					return new ServiceResult(errorMessage);
				}

				if (dto.signfile == null)
				{
					_logger.LogError("Recieve form document signed file null");
					_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedFormDocumentDetailsNotifiaction(dto.correlationID, "Document signing failed."));

					_logger.LogInformation("RecieveFormDocument callback CorelationId :" + dto.correlationID);
					return new ServiceResult("File cannot be null");
					//return new ServiceResult("File cannot be null");
				}

				IFormFile signedDoc = dto.signfile;

				_logger.LogInformation("Recieve form document callback : final process start");

				var currentRecepientList = await _templateRecepientRepository.GetTemplateRecepientLeft(recepientData.TemplateDocumentId);
				var docData = await _templateDocumentRepository.GetTemplateDocumentById(recepientData.TemplateDocumentId);
				var currentRecepient = currentRecepientList.Where(x => x.Signer.suid == recepientData.Signer.suid).FirstOrDefault();

				var templateData = await _templateRepository.GetDigitalFormTemplateAsync(docData.FormId);

				var suid = recepientData.Signer.suid;
				toUpdate.EdmsId = docData.EdmsId;


				//Store document in EDMS
				int daysToComplete;
				string expiryDate = string.Empty;
				if (int.TryParse(docData.DaysToComplete, out daysToComplete))
				{
					expiryDate = DateTime.UtcNow.AddDays(daysToComplete).ToString("yyyy-MM-dd HH:mm:ss");
				}
				else
				{
					_logger.LogError("DaysToComplete must be a valid integer string.");
				}

				if (currentRecepientList.Count == 1)
				{
					docData.CompleteTime = DateTime.UtcNow;
					docData.UpdatedAt = DateTime.UtcNow;
					docData.Status = DocumentStatusConstants.Completed;



					if (currentRecepient.Signer.email.ToLower() != recepientData.Signer.email.ToLower())
					{
						NotificationDTO notification = new NotificationDTO
						{
							Receiver = docData.Owner.suid,
							Sender = recepientData.Signer.email,
							Text = recepientData.SignerName + " has signed the document " + docData.DocumentName,
							Link = "/dashboard/document/" + recepientData.TemplateDocumentId + "/status"
						};

						_backgroundService.RunBackgroundTask<INotificationService>(sender =>
							sender.CreateNotificationAsync(
								notification,
								docData.OrganizationId,
								new(NotificationTypeConstants.TemplateDocument, recepientData.TemplateDocumentId)));

					}


					var updateDocumentToEDMS = await _documentHelper.UpdateDocumentToEDMS(docData.EdmsId, dto.signfile, docData.DocumentName, suid);
					if (!updateDocumentToEDMS.Success)
					{
						docData.UpdatedAt = DateTime.UtcNow;
						docData.Status = DocumentStatusConstants.Failed;
						_logger.LogError("Recieve document callback : Update document in edms failed"+ updateDocumentToEDMS.Message);


						_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedFormDocumentDetailsNotifiaction(dto.correlationID, "Document signing failed."));

						_logger.LogInformation("RecieveDocument callback CorelationId :" + dto.correlationID);
						return new ServiceResult(updateDocumentToEDMS.Message);
					}
					_logger.LogInformation("Recieve document callback : Update document in edms success");


					var updateDoc = await _templateDocumentRepository.UpdateTemplateDocumentById(docData);
					if (updateDoc == false)
					{
						_logger.LogError("Failed to update document");
						_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedFormDocumentDetailsNotifiaction(dto.correlationID, "Document signing failed."));
					}

					if (docData.Owner.email.ToLower() != recepientData.Signer.email.ToLower())
					{
						SendEmailObj sendEmail = new SendEmailObj
						{
							Id = recepientData.TemplateDocumentId,
							UserEmail = docData.Owner.email,
							UserName = recepientData.SignerName
						};
						_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendAnEmailToFormSender(sendEmail));
					}

					_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedFormDocumentDetailsNotifiaction(dto.correlationID, "Document signed successfully."));

					isAllSignComplete = true;
				}
				else
				{
					var updateDocumentToEDMS = await _documentHelper.UpdateDocumentToEDMS(docData.EdmsId, dto.signfile, docData.DocumentName, suid);
					if (!updateDocumentToEDMS.Success)
					{
						_logger.LogError("Recieve document callback : Update document in edms failed"+ updateDocumentToEDMS.Message);


						_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedFormDocumentDetailsNotifiaction(dto.correlationID, "Document signing failed."));

						_logger.LogInformation("RecieveDocument callback CorelationId :" + dto.correlationID);
						return new ServiceResult(updateDocumentToEDMS.Message);
					}
					_logger.LogInformation("Recieve document callback : Update document in edms success");

					//form multi role or multiple signatures

					docData.CompleteTime = DateTime.UtcNow;
					docData.UpdatedAt = DateTime.UtcNow;
					docData.Status = DocumentStatusConstants.InProgress;

					NotificationDTO notification = new NotificationDTO
					{
						Receiver = docData.Owner.suid,
						Sender = recepientData.Signer.email,
						Text = recepientData.SignerName + " has signed the document " + docData.DocumentName,
						Link = "/dashboard/document/" + recepientData.TemplateDocumentId + "/status"
					};
					_backgroundService.RunBackgroundTask<INotificationService>(sender =>
						sender.CreateNotificationAsync(
							notification,
							docData.OrganizationId,
							new(NotificationTypeConstants.TemplateDocument, recepientData.TemplateDocumentId)));


					if (docData.Owner.email != recepientData.Signer.email)
					{
						SendEmailObj sendEmail = new SendEmailObj
						{
							Id = recepientData.TemplateDocumentId,
							UserEmail = docData.Owner.email,
							UserName = recepientData.SignerName
						};
						_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendAnEmailToFormSender(sendEmail));
					}

					_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedFormDocumentDetailsNotifiaction(dto.correlationID, " Document signed successfully."));

				}


				var updateDocument = await _templateDocumentRepository.UpdateTemplateDocumentById(docData);
				if (updateDocument == false)
				{
					_logger.LogError("Failed to update document");
				}

				try
				{
					if (currentRecepientList.Count > 0)
					{

						var data = new TemplateDocument
						{
							_id = recepientData.TemplateDocumentId,
							CompleteSignList = docData.CompleteSignList,
							PendingSignList = docData.PendingSignList
						};

						var UserSignCompleted = data.PendingSignList
							.FirstOrDefault(o => o.suid == recepientData.Signer.suid && o.email == recepientData.Signer.email.ToLower());

						if (UserSignCompleted != null)
						{
							data.CompleteSignList.Add(UserSignCompleted);
							data.PendingSignList.Remove(UserSignCompleted);
						}
							
						data.UpdatedAt = DateTime.UtcNow;

						var updateDoc = await _templateDocumentRepository.UpdateArrayInTemplateDocumentById(data);
						if (!updateDoc)
						{
							_logger.LogError("Failed to update pending signing array and complete signing array in form document");
						}

						//currentRecepient.TakenAction = true;
						var updateRecepient = await _templateRecepientRepository.UpdateTakenActionOfTemplateRecepientById(currentRecepient._id);
						if (updateRecepient == false)
						{
							_logger.LogError("Failed to update form document recepient");
						}

						var formRes = await _newFormRepository.GetNewDigitalFormResponseByCorelationIdAsync(dto.correlationID);
						if (formRes == null)
						{
							_logger.LogError("Failed to get form response");
						}
						else if (formRes.SignerResponses.Count <= docData.TemplateRecepientCount)
						{
							var existingSigner = formRes.SignerResponses
									.FirstOrDefault(x => x.SignerDetails.SignerSuid == currentRecepient.Signer.suid);

							if (existingSigner != null)
							{
								// Update CorrelationId for the existing signer
								existingSigner.CorrelationId = dto.correlationID;
								existingSigner.Status = RecepientStatus.Signed;
								existingSigner.CompleteTime = DateTime.UtcNow;

							}

							var updateSigners = await _newFormRepository.UpdateNewDigitalFormSignersResponseById(formRes, formRes._id);
							if (!updateSigners)
							{
								_logger.LogError("Failed to update signers in form response");
							}
						}

						///pending
						if (isAllSignComplete)
						{
							var response = await _newFormRepository.UpdateNewDigitalFormResponseById(toUpdate, dto.correlationID);
							if (!response)
							{
								_logger.LogInformation("UpdateNewDigitalFormResponseById fail");
								//await _documentHelper.SendSignedFormDocumentDetailsNotifiaction(dto.correlationID, "Document signing failed.");
							}
							_logger.LogInformation("UpdateNewDigitalFormResponseById success");


							if (!string.IsNullOrEmpty(templateData.SubmissionUrl))
							{
								var submissionData = JsonConvert.DeserializeObject<SubmissionFormDataDTO>(templateData.SubmissionUrl);
								var url = submissionData.RequestURL;

								using HttpClient client = new();

								if (!string.IsNullOrEmpty(submissionData.AuthUser) && !string.IsNullOrEmpty(submissionData.AuthPassword))
								{
									var byteArray = Encoding.ASCII.GetBytes($"{submissionData.AuthUser}:{submissionData.AuthPassword}");
									client.DefaultRequestHeaders.Authorization =
										new AuthenticationHeaderValue("Basic", Convert.ToBase64String(byteArray));
								}

								if (submissionData.Headers != null)
								{
									foreach (var set in submissionData.Headers)
									{
										if (set.Key.Equals("Content-Type", StringComparison.OrdinalIgnoreCase))
											continue; // Skip to avoid conflict
										client.DefaultRequestHeaders.Add(set.Key, set.Value);
									}
								}

								var formFieldData = formRes?.SignerResponses
									.Where(s => !string.IsNullOrEmpty(s.FormFieldData))
									.Select(s => s.FormFieldData)
									.FirstOrDefault();

								using var multipartContent = new MultipartFormDataContent();

								// Add JSON payload
								var requestData = new
								{
									docData.FormId,
									FieldData = !string.IsNullOrEmpty(formFieldData)
										? JsonConvert.DeserializeObject<JObject>(formFieldData)
										: new JObject()
								};
								var jsonContent = new StringContent(JsonConvert.SerializeObject(requestData), Encoding.UTF8, "application/json");
								multipartContent.Add(jsonContent, "jsonData");

								// Add file content
								using var stream = signedDoc.OpenReadStream();
								var fileContent = new StreamContent(stream);
								fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf"); // Set the correct MIME type
								multipartContent.Add(fileContent, "file", dto.signfile.FileName);

								var httpResponse = await client.PostAsync(url, multipartContent);

								if (httpResponse.IsSuccessStatusCode)
								{
									var apiResponse = JsonConvert.DeserializeObject<APIResponse>(await httpResponse.Content.ReadAsStringAsync());
									if (apiResponse.Success)
									{
										_logger.LogInformation($"The request with URI={httpResponse.RequestMessage.RequestUri} is successful " +
															   $"with api response = {apiResponse.Message}");
									}
									else
									{
										_logger.LogError($"The request with URI={httpResponse.RequestMessage.RequestUri} is successful " +
														 $"with api response = {apiResponse.Message}");
									}
								}
								else
								{
									Monitor.SendMessage($"The request with URI={httpResponse.RequestMessage.RequestUri} failed " +
														$"with status code={httpResponse.StatusCode}");

									_logger.LogError($"The request with URI={httpResponse.RequestMessage.RequestUri} failed " +
													 $"with status code={httpResponse.StatusCode} error = {httpResponse.ReasonPhrase}");
								}
							}

							// OpenSPP Call For MyTrust
							var isMyTrust = _configuration.GetValue<bool>("MyTrust");
							if (templateData.TemplateName == "SOCIAL BENEFICIARY FORM")
							{
								_logger.LogInformation("OpenSpp Call Start");

								var formFieldData = formRes.SignerResponses
									.Where(x => !string.IsNullOrEmpty(x.FormFieldData))
									.Select(x => x.FormFieldData)
									.FirstOrDefault();

								if (!string.IsNullOrEmpty(formFieldData))
								{
									try
									{
										JObject formFieldDataObject = JObject.Parse(formFieldData);
										formFieldDataObject["FormType"] = "SWP";
										string updatedFormFieldData = formFieldDataObject.ToString();

										var url = _configuration.GetValue<string>("Config:OpenSPPURL");

										var jsonContent = new StringContent(updatedFormFieldData, Encoding.UTF8, "application/json");

										_logger.LogInformation($"FormFieldData: {updatedFormFieldData}");

										_logger.LogInformation("Sending POST request to OpenSPP URL: {Url}", url);

										var openSPPResponse = await _client.PostAsync(url, jsonContent);

										if (openSPPResponse.IsSuccessStatusCode)
										{
											var responseContent = await openSPPResponse.Content.ReadAsStringAsync();
											_logger.LogInformation("OpenSpp Call succeeded. Response: {ResponseContent}", responseContent);
										}
										else
										{
											_logger.LogError("OpenSpp Call failed. Status: {StatusCode}, Reason: {Reason}",
												openSPPResponse.StatusCode, openSPPResponse.ReasonPhrase);
										}
									}
									catch (Exception ex)
									{
										_logger.LogError(ex, "An error occurred while calling OpenSPP.");
									}
								}
								else
								{
									_logger.LogError("No valid FormFieldData found.");
								}

								_logger.LogInformation("OpenSpp Call End");
							}

							var content = string.Empty;
							//send email to all recepients with signed document as attachment 

							var multiSign = (docData.TemplateRecepients.Count > 1) ? true : false;
							if (!multiSign)
							{
								content = docData.DocumentName + " document has been signed successfully. <br/> Please find the attached signed document.";
							}
							else
							{
								content = docData.DocumentName + " document has been signed by all signatories sent by " + docData.Owner.email + ". <br/> Please find the attached signed document.";
							}

							//Google drive file upload implementation inside
							_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendEmailToAllFormRecepients(docId, content, "Document Signed", true, true));

							// Form Signing Email with Attachment to Form Creator
							try
							{
								byte[] fileArray = null;

								if (dto.signfile != null)
								{
									using var memoryStream = new MemoryStream();
									using var stream = dto.signfile.OpenReadStream();  // Actually use this stream
									stream.CopyTo(memoryStream);
									fileArray = memoryStream.ToArray();
								}

								SendEmailObj sendEmailToCreator = new()
								{
									Id = templateData._id,
									UserEmail = templateData.Email,
									UserName = templateData.CreatedBy
								};
								if (fileArray != null)
								{
									_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendAnEmailToFormCreator(sendEmailToCreator, fileArray));

								}

							}
							catch (Exception ex)
							{
								Monitor.SendException(ex);
								_logger.LogError("Failed to send email to form creator");
							}


							// SignalR Notification for the OWNER

							if (recepientData.Signer.email != docData.Owner.email)
							{
								NotificationDTO notification = new NotificationDTO
								{
									Receiver = docData.Owner.suid,
									Sender = recepientData.Signer.email,
									Text = "All signatures of document " + docData.DocumentName + " have been signed successfully",
									Link = "/dashboard/document/" + recepientData.TemplateDocumentId + "/status"
								};

								if (docData.TemplateRecepients.Count == 1)
								{
									notification.Text = $"{recepientData.SignerName} has signed the document {docData.DocumentName}";
								}

								_backgroundService.RunBackgroundTask<INotificationService>(sender =>
									sender.CreateNotificationAsync(
										notification,
										docData.OrganizationId,
										new(NotificationTypeConstants.TemplateDocument, recepientData.TemplateDocumentId)));

								bool pushNotification = _configuration.GetValue<bool>("PushNotification");

								if (recepientData.IdpToken != null && pushNotification)
								{
									_backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(recepientData.IdpToken, docData.Owner.suid, notification.Text));
								}
							}

						}
						SendEmailObj sendEmail = new SendEmailObj
						{
							Id = recepientData.TemplateDocumentId,
							UserEmail = recepientData.Signer.email,
							UserName = recepientData.SignerName
						};
						if (recepientData.IdpToken != null)
						{
							_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendAnEmailToFormRecipient(sendEmail, recepientData.IdpToken, null));

						}

						_logger.LogInformation("Email sent successfully for corelation id : " + recepientData.CorrelationId);
						_logger.LogInformation("Email sent time : " + DateTime.UtcNow);
					}
				}
				catch (Exception ex)
				{
					Monitor.SendException(ex);
					_logger.LogError("Recieve form document callback : send mail to recepient failed" + ex.Message);
				}

				var res = new CallBackResponce();
				if (recepientData.AccountType.ToLower() == AccountTypeConstants.Self)
				{
					res.AccountType = AccountTypeConstants.Self;
					res.Value = recepientData.Signer.suid;
				}
				else
				{
					res.AccountType = AccountTypeConstants.Organization;
					res.Value = recepientData.OrganizationId;
				}
				_logger.LogInformation("Recieve document callback : Final process end");

				_logger.LogInformation("RecieveDocument callback CorelationId :" + dto.correlationID);
				return new ServiceResult(res, "Document signed successfully");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("ReceivedFormSigngingRequestAsync Exception :  {0}", ex.Message);
			}
			finally
			{
				_logger.LogInformation("----> ReceivedFormSigngingRequestAsync service end");
			}

			return new ServiceResult("An error occurred while getting new callback signing response");
		}

		public async Task<ServiceResult> DeclineTemplateDocumentSigningAsync(string tempDocumentId, DeclineDocumentSigningDTO declineDocumentSigning)
		{
			if (tempDocumentId == null)
			{
				return new ServiceResult("Id cannot be null");
			}

			if (declineDocumentSigning == null)
			{
				return new ServiceResult("Data cannot be null");
			}

			try
			{
				var rejectedByUser = new User()
				{
					email = declineDocumentSigning.UserEmail,
					suid = declineDocumentSigning.Suid
				};

				var update = await _templateRecepientRepository.DeclineSigningAsync(tempDocumentId, rejectedByUser, declineDocumentSigning.Comment);
				if (update == false)
				{
					_logger.LogError("Failed to update recepient");
					return new ServiceResult("Failed to update recepient");
				}

				var updateDoc = await _templateDocumentRepository.UpdateTemplateDocumentStatusAsync(tempDocumentId, DocumentStatusConstants.Declined);
				if (updateDoc == false)
				{
					_logger.LogError("Failed to update document status");
					return new ServiceResult("Failed to update document status");
				}

				var formResponse = await _newFormRepository.GetNewDigitalFormResponseByDocIdAsync(tempDocumentId);
				if (formResponse != null)
				{
					var updateRes = await _newFormRepository.UpdateNewDigitalFormResponseStatusByTempDocId(tempDocumentId, DocumentStatusConstants.Declined);
					if (updateRes == false)
					{
						_logger.LogError("Failed to update response status");
						return new ServiceResult("Failed to update response status");
					}
				}

				var document = await _templateDocumentRepository.GetTemplateDocumentById(tempDocumentId);

				NotificationDTO notification = new NotificationDTO()
				{
					Receiver = document.Owner.suid,
					Sender = declineDocumentSigning.UserEmail,
					Text = declineDocumentSigning.UserName + " has declined to sign the form",
					Link = "/dashboard/document/" + tempDocumentId + "/status"
				};

				_backgroundService.RunBackgroundTask<INotificationService>(sender =>
					sender.CreateNotificationAsync(
						notification,
						document.OrganizationId,
						new(NotificationTypeConstants.TemplateDocument, tempDocumentId)));

				bool pushNotification = _configuration.GetValue<bool>("PushNotification");

				if (pushNotification && declineDocumentSigning.acToken is string acToken)
				{
					_backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(declineDocumentSigning.acToken, document.Owner.suid, notification.Text + $" {document.DocumentName}"));
				}

				_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendDeclineFormSignatureNotifiactionToAllTemplateRecepient(tempDocumentId, notification, declineDocumentSigning.acToken));

				//var content = declineDocumentSigning.UserName + " has declined to sign the document sent by "+document.OwnerName;

				var content = "The form " + document.DocumentName + " sent by " + document.Owner.email + " has been rejected by " + declineDocumentSigning.UserName;

				content = (!string.IsNullOrEmpty(declineDocumentSigning.Comment)) ? content + ". <br/> Rejection Comment : " + declineDocumentSigning.Comment + ".<br/>" : content;

				_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendEmailToAllFormRecepients(tempDocumentId, content, "Document Rejected", false, false));

				return new ServiceResult(null, "Successfully declined signing");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("DeclineTemplateDocumentSigningAsync Exception :  {0}", ex.Message);
			}
			return new ServiceResult("An error occurred while decline signing");
		}
	}
}

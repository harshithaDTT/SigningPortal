using DnsClient.Internal;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.Domain.Services.Communication.Bulksign;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace SigningPortal.Core.Services
{
	public class BulkSignService : IBulkSignService
	{
		private readonly HttpClient _client;
		private readonly ILogger<BulkSignService> _logger;
		private readonly IBulkSignRepository _bulkSignRepository;
		private readonly ITemplateService _templateService;
		private readonly IConfiguration _configuration;
		private readonly IBackgroundService _backgroundService;

		public BulkSignService(
			ILogger<BulkSignService> logger,
			HttpClient httpClient,
			IBulkSignRepository bulkSignRepository,
			ITemplateService templateService,
			IConfiguration configuration,
			IBackgroundService backgroundService)
		{
			_configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));

			var signatureServiceAgenturl = _configuration["Config:SignatureServiceAgentBaseAddress"];

			if (string.IsNullOrWhiteSpace(signatureServiceAgenturl))
			{
				throw new InvalidOperationException("signatureServiceAgent URL is not configured properly.");
			}

			httpClient.BaseAddress = new Uri(signatureServiceAgenturl);
			httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

			_logger = logger;
			_client = httpClient;
			_client.Timeout = TimeSpan.FromMinutes(10);
			_bulkSignRepository = bulkSignRepository;
			_templateService = templateService;
			_backgroundService = backgroundService;
		}

		public ServiceResult GetFileConfigurationForBulkSignAsync()
		{
			try
			{
				var allowedFileSize = new
				{
					NumberOfFiles = _configuration.GetValue<int>("BulkSignFileConfig:NumberOfFiles"),
					EachFileSize = _configuration.GetValue<int>("BulkSignFileConfig:EachFileSize"),
					AllFileSize = _configuration.GetValue<int>("BulkSignFileConfig:AllFileSize")
				};
				_logger.LogInformation($"AllowedFileConfig: {allowedFileSize}");
				return new ServiceResult(allowedFileSize, "Successfully received allowed file size");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);

				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetAllowedFileSizeAsync Exception :  {0}", ex.Message);
			}

			//return new ServiceResult(_constantError.GetMessage("102518"));
			_logger.LogError("An error occurred while receiving allowed file size");
			return new ServiceResult("An error occurred while receiving allowed file size");
		}

		public async Task<ServiceResult> GetBulkSigDataListAsync(UserDTO userDTO)
		{
			try
			{
				_logger.LogInformation("GetBulkSigDataListAsync strart");
				_logger.LogInformation("organizaion id: " + userDTO.OrganizationId);
				_logger.LogInformation("suid: " + userDTO.Suid);
				var list = await _bulkSignRepository.GetBulkSigDataList(userDTO.OrganizationId, userDTO.Suid);
				if (list == null)
				{
					_logger.LogInformation("No records found");
					return new ServiceResult(new List<BulkSign>(), "No records found.");
				}
				foreach (var item in list)
				{
					_logger.LogInformation("Transaction : " + item.Transaction + " Status: " + item.Status);
				}
				_logger.LogInformation("GetBulkSigDataListAsync end");

				return new ServiceResult(list, "Successfully received bulksign data list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetBulkSigDataListAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while receiving bulksign data list");
		}

		public async Task<ServiceResult> GetReceivedBulkSignListAsync(UserDTO user)
		{
			try
			{
				_logger.LogInformation("GetReceivedBulkSignListAsync strart");
				_logger.LogInformation("organizaion id: " + user.OrganizationId);
				_logger.LogInformation("suid: " + user.Suid);
				var list = await _bulkSignRepository.GetReceivedBulkSignDataList(user.OrganizationId, user.Email);
				if (list == null)
				{
					_logger.LogInformation("No records found");
					return new ServiceResult(new List<BulkSign>(), "No records found.");
				}
				_logger.LogInformation("GetReceivedBulkSignListAsync end");

				return new ServiceResult(list, "Successfully received bulksign list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetReceivedBulkSignListAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while receiving bulksign list");
		}

		public async Task<ServiceResult> GetSentBulkSignListAsync(UserDTO user)
		{
			try
			{
				_logger.LogInformation("GetSentBulkSignListAsync strart");
				_logger.LogInformation("organizaion id: " + user.OrganizationId);
				_logger.LogInformation("suid: " + user.Suid);
				var list = await _bulkSignRepository.GetSentBulkSignDataList(user.OrganizationId, user.Suid);
				if (list == null || list.Count == 0)
				{
					_logger.LogInformation("No records found");
					return new ServiceResult(new List<BulkSign>(), "No records found.");
				}
				_logger.LogInformation("GetSentBulkSignListAsync end");

				return new ServiceResult(list, "Successfully received bulksign list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetSentBulkSignListAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while receiving bulksign list");
		}

		public async Task<ServiceResult> GetBulkSigDataListByTemplateIdAsync(string templateID)
		{
			try
			{
				var bulkSignDataList = await _bulkSignRepository.GetBulkSigDataListByTemplateId(templateID);
				_logger.LogInformation($"BulkSignData: {bulkSignDataList}");
				if (bulkSignDataList == null)
				{
					_logger.LogInformation("No details found");
					return new ServiceResult(null, "No details found.");
				}

				return new ServiceResult(bulkSignDataList, "Successfully received bulksign data list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);

				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetBulkSigDataListByTemplateIdAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while receiving bulksign data list");
		}

		public async Task<ServiceResult> GetBulkSigDataAsync(string corelationId)
		{
			try
			{
				var bulkSignData = await _bulkSignRepository.GetBulkSignDataByCorelationId(corelationId);
				_logger.LogInformation($"Bulk Sign Data {bulkSignData}");
				if (bulkSignData == null)
				{
					_logger.LogInformation("No details found");
					return new ServiceResult(null, "No details found.");
				}

				return new ServiceResult(bulkSignData, "Successfully received bulksign data");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);

				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetBulkSigDataAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while receiving bulksign data");
		}

		//public async Task<ServiceResult> SaveBulksignConfigAsync(string templateId, UserDTO userDTO)
		//{
		//    try
		//    {
		//        if(templateId == null)
		//        {
		//            return new ServiceResult("Template id cannot be null");
		//        }

		//        var templateDetails =(Template) (await _templateService.GetTemplateDetailsAsync(templateId)).Result;
		//        if(templateDetails == null)
		//        {
		//            return new ServiceResult("Failed to get template details");
		//        }

		//        BulkSign bulksignobj = new BulkSign()
		//        {
		//            TemplateId = templateId,
		//            TemplateName = templateDetails.TemplateName,
		//            OrganizationId = userDTO.OrganizationId,
		//            Suid = userDTO.Suid,
		//            SourcePath = _configuration.GetValue<string>("SourcePath"),
		//            SignedPath = _configuration.GetValue<string>("DestinationPath"),
		//            SignatureAnnotations = templateDetails.Annotations,
		//            EsealAnnotations = templateDetails.EsealAnnotations,
		//            Status = DocumentStatusConstants.InProgress,
		//            CreatedAt = DateTime.UtcNow,
		//            CreatedBy = userDTO.Name
		//        };

		//        var saveBulkSignData = await _bulkSignRepository.SaveBulkSignData(bulksignobj);

		//        return new ServiceResult(saveBulkSignData, "Successfully saved bulksign data");
		//    }
		//    catch (Exception ex)
		//    {
		//        _logger.LogError(ex, ex.Message);
		//        _logger.LogError("SaveBulksignConfigAsync Exception :  {0}", ex.Message);
		//    }

		//    return new ServiceResult("An error occurred while saving bulksign data");
		//}

		public async Task<ServiceResult> PrepareBulkSigningRequestAsync(string templateId, UserDTO userDTO)
		{

			if (templateId == null)
			{
				_logger.LogInformation("Template id cannot be null");
				return new ServiceResult("Template id cannot be null");
			}

			try
			{
				var templateDetails = (Template)(await _templateService.GetTemplateDetailsAsync(templateId)).Result;
				_logger.LogInformation($"Template Details {templateDetails}");
				if (templateDetails == null)
				{
					_logger.LogInformation("Failed to get template details");
					return new ServiceResult("Failed to get template details");
				}

				JObject Settings = JObject.Parse(templateDetails.SettingConfig);
				var agentResponce = _configuration.GetValue<string>("Config:Signing_portal:AGENT_URL");
				if (string.IsNullOrEmpty(agentResponce))
				{
					_logger.LogInformation("Agent Url Not Found");
					return new ServiceResult("Agent Url Not Found");
				}

				PrepareBulksignResponse prepareBulksignResponse = new PrepareBulksignResponse()
				{
					Suid = userDTO.Suid,
					Email = userDTO.Email,
					OrganizationId = userDTO.OrganizationId,
					SourcePath = Settings["inputpath"].ToString(),
					DestinationPath = Settings["outputpath"].ToString(),
					//CallBackUrl = _configuration.GetValue<string>("CallBackUrl"),
					//AgentUrl = _configuration.GetValue<string>("AgentUrl")
					AgentUrl = agentResponce,
					SignatureTemplateId = templateDetails.SignatureTemplate,
					EsealSignatureTemplateId = templateDetails.EsealSignatureTemplate,
					QrCodeRequired = templateDetails.QrCodeRequired
				};

				_logger.LogInformation($"PreparedBulksignResponse: {prepareBulksignResponse}");

				var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
				var isDevelopment = environment == Environments.Development;
				if (isDevelopment)
				{
					prepareBulksignResponse.CallBackUrl = _configuration.GetValue<string>("CallBackUrl");
				}
				else
				{
					prepareBulksignResponse.CallBackUrl = _configuration.GetValue<string>("Config:Signing_portal:BACKEND_URL") + "/api/bulksigne/bulksigned-document";
				}

				if (!string.IsNullOrEmpty(templateDetails.Annotations))
				{
					JObject signCoordinatesObj = JObject.Parse(templateDetails.Annotations);

					//var signCords = signCoordinatesObj[templateDetails.RoleList[0].Role];
					var signCords = signCoordinatesObj[userDTO.Email];

					prepareBulksignResponse.PlaceHolderCoordinates = new placeHolderCoordinates
					{
						pageNumber = signCords["PageNumber"].ToString(),
						signatureXaxis = signCords["posX"].ToString(),
						signatureYaxis = signCords["posY"].ToString(),
						imgWidth = signCords["width"].ToString(),
						imgHeight = signCords["height"].ToString()
					};
				}

				if (templateDetails.EsealAnnotations != null)
				{
					JObject esealCoordinatesObj = JObject.Parse(templateDetails.EsealAnnotations);
					var esealCords = esealCoordinatesObj[userDTO.Email];
					//var esealCords = esealCoordinatesObj[templateDetails.RoleList[0].Role];

					prepareBulksignResponse.EsealPlaceHolderCoordinates = new esealplaceHolderCoordinates
					{
						pageNumber = esealCords["PageNumber"].ToString(),
						signatureXaxis = esealCords["posX"].ToString(),
						signatureYaxis = esealCords["posY"].ToString(),
						imgWidth = esealCords["width"].ToString(),
						imgHeight = esealCords["height"].ToString()
					};
				}

				if (templateDetails.QrCodeAnnotations != null)
				{
					JObject qrCodeCoordinatesObj = JObject.Parse(templateDetails.QrCodeAnnotations);
					var qrCords = qrCodeCoordinatesObj[userDTO.Email];
					//var esealCords = esealCoordinatesObj[templateDetails.RoleList[0].Role];

					prepareBulksignResponse.QrCodePlaceHolderCoordinates = new QrCodePlaceHolderCoordinates
					{
						pageNumber = qrCords["PageNumber"].ToString(),
						signatureXaxis = qrCords["posX"].ToString(),
						signatureYaxis = qrCords["posY"].ToString(),
						imgHeight = qrCords["height"].ToString(),
						imgWidth = qrCords["width"].ToString()
					};
				}

				// prepareBulksignResponse.CorelationId = $@"{Guid.NewGuid()}";
				_logger.LogInformation($"Successfully received preparing bulksigning request, response: {prepareBulksignResponse}");

				return new ServiceResult(prepareBulksignResponse, "Successfully received preparing bulksigning request");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);

				_logger.LogError(ex, ex.Message);
				_logger.LogError("PrepareBulkSigningRequestAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while preparing bulksigning request");
		}

		public async Task<ServiceResult> SaveBulkSigningRequestAsync(string templateId, string transactionName, UserDTO userDTO, string? signerEmail = null)
		{
			if (templateId == null)
			{
				_logger.LogInformation("Template id cannot be null");
				return new ServiceResult("Template id cannot be null");
			}

			try
			{
				string email = !string.IsNullOrEmpty(signerEmail) ? signerEmail : userDTO.Email;

				if (string.IsNullOrWhiteSpace(transactionName))
				{
					_logger.LogInformation("Transaction name cannot be empty or blank spaces");
					return new ServiceResult("Transaction name cannot be empty or blank spaces");
				}
				else
				{
					bool IsTransactionNameExist = await _bulkSignRepository.IsBulkSigningTransactionNameExists(transactionName, userDTO.OrganizationId);
					if (IsTransactionNameExist)
					{
						_logger.LogInformation($"Transaction name already exists : {transactionName}");
						return new ServiceResult("Transaction name already exists");
					}
				}

				var templateDetails = (Template)(await _templateService.GetTemplateDetailsAsync(templateId)).Result;
				if (templateDetails == null)
				{
					_logger.LogInformation("Failed to get template details");
					return new ServiceResult("Failed to get template details");
				}

				JObject Settings = JObject.Parse(templateDetails.SettingConfig);

				var agentResponce = _configuration.GetValue<string>("Config:Signing_portal:AGENT_URL");
				if (string.IsNullOrEmpty(agentResponce))
				{
					_logger.LogInformation("Agent Url Not Found");
					return new ServiceResult("Agent Url Not Found");
				}

				PrepareBulksignResponse prepareBulksignResponse = new PrepareBulksignResponse()
				{
					Suid = userDTO.Suid,
					Email = userDTO.Email,
					OrganizationId = userDTO.OrganizationId,
					SourcePath = Settings["inputpath"].ToString(),
					DestinationPath = Settings["outputpath"].ToString(),
					//CallBackUrl = _configuration.GetValue<string>("CallBackUrl"),
					//AgentUrl = _configuration.GetValue<string>("AgentUrl")
					AgentUrl = agentResponce,
					SignatureTemplateId = templateDetails.SignatureTemplate,
					EsealSignatureTemplateId = templateDetails.EsealSignatureTemplate,
					QrCodeRequired = templateDetails.QrCodeRequired
				};

				var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
				var isDevelopment = environment == Environments.Development;
				if (isDevelopment)
				{
					prepareBulksignResponse.CallBackUrl = _configuration.GetValue<string>("CallBackUrl");
				}
				else
				{
					prepareBulksignResponse.CallBackUrl = _configuration.GetValue<string>("Config:Signing_portal:BACKEND_URL") + "/api/bulksigne/bulksigned-document";
				}

				if (!string.IsNullOrEmpty(templateDetails.Annotations))
				{
					JObject signCoordinatesObj = JObject.Parse(templateDetails.Annotations);

					var signCords = signCoordinatesObj[email];

					//var signCords = signCoordinatesObj[templateDetails.RoleList[0].Role];

					prepareBulksignResponse.PlaceHolderCoordinates = new placeHolderCoordinates
					{
						pageNumber = signCords["PageNumber"].ToString(),
						signatureXaxis = signCords["posX"].ToString(),
						signatureYaxis = signCords["posY"].ToString(),
						imgWidth = signCords["width"].ToString(),
						imgHeight = signCords["height"].ToString()
					};
				}

				if (templateDetails.EsealAnnotations != null)
				{
					JObject esealCoordinatesObj = JObject.Parse(templateDetails.EsealAnnotations);
					var esealCords = esealCoordinatesObj[email];
					//var esealCords = esealCoordinatesObj[templateDetails.RoleList[0].Role];

					prepareBulksignResponse.EsealPlaceHolderCoordinates = new esealplaceHolderCoordinates
					{
						pageNumber = esealCords["PageNumber"].ToString(),
						signatureXaxis = esealCords["posX"].ToString(),
						signatureYaxis = esealCords["posY"].ToString(),
						imgWidth = esealCords["width"].ToString(),
						imgHeight = esealCords["height"].ToString()
					};
				}

				if (templateDetails.QrCodeAnnotations != null)
				{
					JObject qrCodeCoordinatesObj = JObject.Parse(templateDetails.QrCodeAnnotations);
					var qrCords = qrCodeCoordinatesObj[email];
					//var esealCords = esealCoordinatesObj[templateDetails.RoleList[0].Role];

					prepareBulksignResponse.QrCodePlaceHolderCoordinates = new QrCodePlaceHolderCoordinates
					{
						pageNumber = qrCords["PageNumber"].ToString(),
						signatureXaxis = qrCords["posX"].ToString(),
						signatureYaxis = qrCords["posY"].ToString(),
						imgHeight = qrCords["height"].ToString(),
						imgWidth = qrCords["width"].ToString()
					};
				}

				prepareBulksignResponse.CorelationId = $@"{Guid.NewGuid()}";

				BulkSign bulksignobj = new BulkSign()
				{
					CorelationId = prepareBulksignResponse.CorelationId,
					TemplateId = templateId,
					TemplateName = templateDetails.TemplateName,
					OrganizationId = userDTO.OrganizationId,
					Suid = userDTO.Suid,
					Transaction = transactionName,
					SourcePath = prepareBulksignResponse.SourcePath,
					SignedPath = prepareBulksignResponse.DestinationPath,
					//SignatureAnnotations = templateDetails.Annotations.Replace(templateDetails.RoleList[0].Role, userDTO.Email),
					Status = DocumentStatusConstants.Draft,
					CreatedAt = DateTime.UtcNow,
					OwnerName = userDTO.Name,
					OwnerEmail = userDTO.Email,
					SignerEmail = string.IsNullOrEmpty(signerEmail) ? null : signerEmail
					//SignatureEnvironment = ""
				};

				_logger.LogInformation($"BulkSignObj: {bulksignobj}");

				if (!string.IsNullOrEmpty(templateDetails.Annotations))
					bulksignobj.SignatureAnnotations = templateDetails.Annotations.Replace(templateDetails.RoleList[0].Role, userDTO.Email);

				if (!string.IsNullOrEmpty(templateDetails.EsealAnnotations))
					bulksignobj.EsealAnnotations = templateDetails.EsealAnnotations.Replace(templateDetails.RoleList[0].Role, userDTO.Email);

				if (!string.IsNullOrEmpty(templateDetails.QrCodeAnnotations))
					bulksignobj.QrAnnotations = templateDetails.QrCodeAnnotations.Replace(templateDetails.RoleList[0].Role, userDTO.Email);

				var saveBulkSignData = await _bulkSignRepository.SaveBulkSignData(bulksignobj);

				_logger.LogInformation($"Save BulkSign Data status {saveBulkSignData}");

				return new ServiceResult(prepareBulksignResponse, "Successfully saved bulksign data");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);

				_logger.LogError(ex, ex.Message);
				_logger.LogError("SaveBulkSigningRequestAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while saving bulksign data");
		}

		public async Task<ServiceResult> SaveBulkSigningRequestByPreparatorAsync(string templateId, string transactionName, string signerEmail, UserDTO userDTO)
		{

			if (templateId == null)
			{
				_logger.LogInformation("Template id cannot be null");
				return new ServiceResult("Template id cannot be null");
			}

			try
			{
				if (string.IsNullOrWhiteSpace(transactionName))
				{
					_logger.LogInformation("Transaction name cannot be empty or blank spaces");
					return new ServiceResult("Transaction name cannot be empty or blank spaces");
				}
				else
				{
					bool IsTransactionNameExist = await _bulkSignRepository.IsBulkSigningTransactionNameExists(transactionName, userDTO.OrganizationId);
					if (IsTransactionNameExist)
					{
						_logger.LogInformation($"Transaction name already exists : {transactionName}");
						return new ServiceResult("Transaction name already exists");
					}
				}

				var templateDetails = (Template)(await _templateService.GetTemplateDetailsAsync(templateId)).Result;
				if (templateDetails == null)
				{
					_logger.LogInformation("Failed to get template details");
					return new ServiceResult("Failed to get template details");
				}

				JObject Settings = JObject.Parse(templateDetails.SettingConfig);

				var agentResponce = _configuration.GetValue<string>("Config:Signing_portal:AGENT_URL");
				if (string.IsNullOrEmpty(agentResponce))
				{
					_logger.LogInformation("Agent Url Not Found");
					return new ServiceResult("Agent Url Not Found");
				}

				PrepareBulksignResponse prepareBulksignResponse = new PrepareBulksignResponse()
				{
					Suid = userDTO.Suid,
					Email = userDTO.Email,
					OrganizationId = userDTO.OrganizationId,
					SourcePath = Settings["inputpath"].ToString(),
					DestinationPath = Settings["outputpath"].ToString(),
					//CallBackUrl = _configuration.GetValue<string>("CallBackUrl"),
					//AgentUrl = _configuration.GetValue<string>("AgentUrl")
					AgentUrl = agentResponce,
					SignatureTemplateId = templateDetails.SignatureTemplate,
					EsealSignatureTemplateId = templateDetails.EsealSignatureTemplate,
					QrCodeRequired = templateDetails.QrCodeRequired
				};

				var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
				var isDevelopment = environment == Environments.Development;
				if (isDevelopment)
				{
					prepareBulksignResponse.CallBackUrl = _configuration.GetValue<string>("CallBackUrl");
				}
				else
				{
					prepareBulksignResponse.CallBackUrl = _configuration.GetValue<string>("Config:Signing_portal:BACKEND_URL") + "/api/bulksigne/bulksigned-document";
				}

				if (!string.IsNullOrEmpty(templateDetails.Annotations))
				{
					JObject signCoordinatesObj = JObject.Parse(templateDetails.Annotations);

					var signCords = signCoordinatesObj[signerEmail];

					//var signCords = signCoordinatesObj[templateDetails.RoleList[0].Role];

					prepareBulksignResponse.PlaceHolderCoordinates = new placeHolderCoordinates
					{
						pageNumber = signCords["PageNumber"].ToString(),
						signatureXaxis = signCords["posX"].ToString(),
						signatureYaxis = signCords["posY"].ToString(),
						imgWidth = signCords["width"].ToString(),
						imgHeight = signCords["height"].ToString()
					};
				}

				if (templateDetails.EsealAnnotations != null)
				{
					JObject esealCoordinatesObj = JObject.Parse(templateDetails.EsealAnnotations);
					var esealCords = esealCoordinatesObj[signerEmail];
					//var esealCords = esealCoordinatesObj[templateDetails.RoleList[0].Role];

					prepareBulksignResponse.EsealPlaceHolderCoordinates = new esealplaceHolderCoordinates
					{
						pageNumber = esealCords["PageNumber"].ToString(),
						signatureXaxis = esealCords["posX"].ToString(),
						signatureYaxis = esealCords["posY"].ToString(),
						imgWidth = esealCords["width"].ToString(),
						imgHeight = esealCords["height"].ToString()
					};
				}

				if (templateDetails.QrCodeAnnotations != null)
				{
					JObject qrCodeCoordinatesObj = JObject.Parse(templateDetails.QrCodeAnnotations);
					var qrCords = qrCodeCoordinatesObj[signerEmail];
					//var esealCords = esealCoordinatesObj[templateDetails.RoleList[0].Role];

					prepareBulksignResponse.QrCodePlaceHolderCoordinates = new QrCodePlaceHolderCoordinates
					{
						pageNumber = qrCords["PageNumber"].ToString(),
						signatureXaxis = qrCords["posX"].ToString(),
						signatureYaxis = qrCords["posY"].ToString(),
						imgHeight = qrCords["height"].ToString(),
						imgWidth = qrCords["width"].ToString()
					};
				}

				prepareBulksignResponse.CorelationId = $@"{Guid.NewGuid()}";

				BulkSign bulksignobj = new BulkSign()
				{
					CorelationId = prepareBulksignResponse.CorelationId,
					TemplateId = templateId,
					TemplateName = templateDetails.TemplateName,
					OrganizationId = userDTO.OrganizationId,
					Suid = userDTO.Suid,
					Transaction = transactionName,
					SourcePath = prepareBulksignResponse.SourcePath,
					SignedPath = prepareBulksignResponse.DestinationPath,
					//SignatureAnnotations = templateDetails.Annotations.Replace(templateDetails.RoleList[0].Role, userDTO.Email),
					Status = DocumentStatusConstants.Draft,
					CreatedAt = DateTime.UtcNow,
					OwnerName = userDTO.Name,
					OwnerEmail = userDTO.Email,
					SignerEmail = signerEmail,
					//SignatureEnvironment = ""
				};

				_logger.LogInformation($"BulkSignObj {bulksignobj}");

				if (!string.IsNullOrEmpty(templateDetails.Annotations))
					bulksignobj.SignatureAnnotations = templateDetails.Annotations.Replace(templateDetails.RoleList[0].Role, signerEmail);

				if (!string.IsNullOrEmpty(templateDetails.EsealAnnotations))
					bulksignobj.EsealAnnotations = templateDetails.EsealAnnotations.Replace(templateDetails.RoleList[0].Role, signerEmail);

				if (!string.IsNullOrEmpty(templateDetails.QrCodeAnnotations))
					bulksignobj.QrAnnotations = templateDetails.QrCodeAnnotations.Replace(templateDetails.RoleList[0].Role, signerEmail);

				var saveBulkSignData = await _bulkSignRepository.SaveBulkSignData(bulksignobj);

				_logger.LogInformation($"Successfully saved bulksign data, response: {prepareBulksignResponse}");

				return new ServiceResult(prepareBulksignResponse, "Successfully saved bulksign data");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);

				_logger.LogError(ex, ex.Message);
				_logger.LogError("SaveBulkSigningRequestByPreparatorAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while saving bulksign data");
		}

		public async Task<ServiceResult> BulkSignAsync(SignDTO signDTO, string url, string idToken)
		{
			try
			{
				//var myTrust = _configuration.GetValue<bool>("MyTrust");
				//var urlpath = myTrust
				//    ? _configuration.GetValue<string>("Config:BulkSignURL")
				//    : $"{url}/SignatureServiceAgent/api/digital/signature/bulk/sign";
				var urlpath = _configuration.GetValue<string>("Config:BulkSignURL");

				// Clear previous headers to avoid pollution
				_client.DefaultRequestHeaders.Clear();

				// Set appropriate authorization header based on the configuration
				//if (myTrust)
				//{
				_client.DefaultRequestHeaders.Add("UgPassAuthorization", $"Bearer {idToken}");
				//}
				//else
				//{
				//    _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", idToken);
				//}

				// Serialize the DTO to JSON
				string json = JsonConvert.SerializeObject(signDTO);
				_logger.LogInformation($"Bulk sign async json object : {json}");
				StringContent content = new StringContent(json, Encoding.UTF8, "application/json");

				// Make the asynchronous POST request
				var response = await _client.PostAsync(urlpath, content);

				// Check if the response is successful
				if (response.IsSuccessStatusCode)
				{
					var responseString = await response.Content.ReadAsStringAsync();
					APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(responseString);
					_logger.LogInformation($"Bulk Sign Async Api response :{apiResponse.ToString()}");

					if (apiResponse?.Success == true)
					{
						return new ServiceResult(apiResponse.Result, apiResponse.Message);
					}
					else
					{
						_logger.LogError($"Bulk Sign Async Api call failed :{apiResponse.ToString()}");
						Monitor.SendMessage($"BulkSignAsync: API call failed. Response: {responseString}");
						return new ServiceResult(apiResponse?.Message ?? "Unknown error occurred");
					}
				}
				else
				{
					var errorContent = await response.Content.ReadAsStringAsync();
					Monitor.SendMessage($"BulkSignAsync: Request to {response.RequestMessage.RequestUri} failed with " +
						$"status code {response.StatusCode}. Response: {errorContent}");
					_logger.LogError($"BulkSignAsync: Request to {response.RequestMessage.RequestUri} failed with " +
						$"status code {response.StatusCode}. Response: {errorContent}");

					return new ServiceResult("Internal Error");
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex.Message);
				throw;  // Preserve the original exception details
			}
		}

		public async Task<ServiceResult> SendFiles(List<IFormFile> files, string correlationId)
		{
			var uploadUrl = _configuration.GetValue<string>("Config:BulkUploadURL");
			_logger.LogInformation($"SendFiles URL: {uploadUrl}");

			using var multipartFormContent = new MultipartFormDataContent();

			foreach (var file in files)
			{
				// Ensure the stream is disposed after sending
				var fileStreamContent = new StreamContent(file.OpenReadStream(), (int)file.Length);
				fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
				multipartFormContent.Add(fileStreamContent, "files", file.FileName);
			}

			multipartFormContent.Add(new StringContent(correlationId), "correlationId");

			HttpResponseMessage response;
			try
			{
				response = await _client.PostAsync(uploadUrl, multipartFormContent);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error occurred while sending files.");
				return new ServiceResult("Internal Error");
			}

			if (response.StatusCode != HttpStatusCode.OK)
			{
				var errorMessage = $"The request with URI={response.RequestMessage?.RequestUri} failed with status code={response.StatusCode}";
				Monitor.SendMessage(errorMessage);
				_logger.LogError(errorMessage);
				return new ServiceResult("Internal Error");
			}

			var responseContent = await response.Content.ReadAsStringAsync();
			APIResponse apiResponse;
			try
			{
				apiResponse = JsonConvert.DeserializeObject<APIResponse>(responseContent);
			}
			catch (JsonException ex)
			{
				_logger.LogError(ex, "Failed to deserialize API response.");
				return new ServiceResult("Internal Error");
			}

			_logger.LogInformation($"Send Files API response: {apiResponse}");

			return apiResponse.Success
				? new ServiceResult(apiResponse.Result, apiResponse.Message)
				: new ServiceResult(apiResponse.Message);
		}

		public async Task<ServiceResult> UpdateDocumentStatus(string correlationId)
		{
			_logger.LogInformation("UpdateBulkSignStatus started for CorrelationId: {CorrelationId}", correlationId);

			try
			{
				var baseUrl = _configuration.GetValue<string>("Config:BulkUploadStatusURL");
				if (string.IsNullOrWhiteSpace(baseUrl))
				{
					const string configError = "BulkUploadStatusURL is not configured.";
					_logger.LogError(configError);
					return new ServiceResult(configError);
				}

				var requestUrl = $"{baseUrl}/{correlationId}";
				_logger.LogInformation("Calling BulkSignStatus API: {RequestUrl}", requestUrl);

				var response = await _client.GetAsync(requestUrl);

				if (response.StatusCode == HttpStatusCode.OK)
				{
					var content = await response.Content.ReadAsStringAsync();

					var contentResponse = JsonConvert.DeserializeObject<APIResponse>(content)
										  ?? throw new InvalidOperationException("Invalid API response.");

					var apiResponse = JsonConvert.DeserializeObject<BulkSignCallBackDTO>(
						contentResponse.Result?.ToString()
						?? throw new InvalidOperationException("API result is null."))
						?? throw new InvalidOperationException("Failed to deserialize response.");

					_logger.LogInformation("BulkSignStatus API Response: {@ApiResponse}", apiResponse);

					return new ServiceResult(apiResponse, "Successfully received status");
				}

				var errorMessage = $"BulkSignStatus request failed. URL={requestUrl}, StatusCode={response.StatusCode}";
				Monitor.SendMessage(errorMessage);
				_logger.LogError(errorMessage);
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, "Error occurred while updating bulk sign status.");
				return new ServiceResult(ex.Message);
			}

			return new ServiceResult("An error occurred while requesting BulkSignStatus.");
		}

		public async Task<ServiceResult> UpdateBulkSigningStatusAsync(string corelationId, bool forSigner)
		{
			try
			{
				if (string.IsNullOrEmpty(corelationId))
				{
					_logger.LogInformation("Corelation id cannot be null");
					return new ServiceResult("Corelation id cannot be null");
				}

				var record = await _bulkSignRepository.GetBulkSignDataByCorelationId(corelationId);
				if (record == null)
				{
					_logger.LogInformation("Bulk Sign data not found");
					return new ServiceResult("Bulk Sign data not found");
				}

				if (record.Status == DocumentStatusConstants.Completed || record.Status == DocumentStatusConstants.Failed)
				{
					return new ServiceResult(record, "Status updated successfully");
				}

				BulkSign bulkSign = new()
				{
					CorelationId = corelationId
				};

				if (forSigner)
				{
					bulkSign.Status = DocumentStatusConstants.Pending;
				}
				else
				{
					bulkSign.Status = DocumentStatusConstants.InProgress;
				}

				var updateBulkSignData = await _bulkSignRepository.UpdateBulkSignData(bulkSign);
				if (!updateBulkSignData)
				{
					_logger.LogInformation("Failed to update bulk sign status");
					return new ServiceResult("Failed to update bulk sign status");
				}

				return new ServiceResult(updateBulkSignData, "Status updated successfully");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);

				_logger.LogError(ex, ex.Message);
				_logger.LogError("UpdateBulkSigningStatusAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while updating bulksign status");
		}

		public async Task<ServiceResult> UpdateBulkSigningSourceDestinationAsync(PathDTO dto)
		{
			try
			{
				if (string.IsNullOrEmpty(dto.CorelationId))
				{
					_logger.LogInformation("Corelation id cannot be null");
					return new ServiceResult("Corelation id cannot be null");
				}

				BulkSign bulkSign = new BulkSign
				{
					CorelationId = dto.CorelationId,
					SourcePath = dto.Source,
					SignedPath = dto.Destination,
				};

				var updateBulkSignData = await _bulkSignRepository.UpdateBulkSignSrcDestData(bulkSign);
				if (!updateBulkSignData)
				{
					_logger.LogInformation("Failed to update bulksign data");
					return new ServiceResult("Failed to update bulksign data");
				}

				return new ServiceResult(updateBulkSignData, "Source and Destination updated successfully");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);

				_logger.LogError(ex, ex.Message);
				_logger.LogError("UpdateBulkSigningSourceDestinationAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while updating bulksign source and destination");
		}

		public async Task<ServiceResult> FailBulkSigningRequestAsync(string CorrelationId)
		{
			if (string.IsNullOrEmpty(CorrelationId))
			{
				_logger.LogInformation("Corelation id cannot be null");
				return new ServiceResult("Corelation id cannot be null");
			}

			try
			{

				var bulkSignData = await _bulkSignRepository.GetBulkSignDataByCorelationId(CorrelationId);
				if (bulkSignData == null)
				{
					_logger.LogInformation("No details found");
					return new ServiceResult(null, "No details found.");
				}

				BulkSign bulkSign = new BulkSign
				{
					CorelationId = CorrelationId,
					Result = new Result(),
					Status = DocumentStatusConstants.Failed
				};

				var updateBulksignData = await _bulkSignRepository.UpdateBulkSignData(bulkSign);
				if (!updateBulksignData)
				{
					_logger.LogInformation("Failed to update bulksign data");
					return new ServiceResult("Failed to update bulksign data");
				}

				return new ServiceResult(null, "Successfully update bulksigning request status");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);

				_logger.LogError(ex, ex.Message);
				_logger.LogError("FailBulkSigningRequestAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while updating bulksigning request status");
		}

		public async Task<ServiceResult> GetBulkSignerListAsync(string OrgId)
		{

			if (string.IsNullOrEmpty(OrgId))
			{
				_logger.LogInformation("Organization id cannot be null");
				return new ServiceResult("Organization id cannot be null");
			}

			try
			{

				var response = await _client.GetAsync(_configuration.GetValue<string>("Config:OrganizationBulkSignerEmailListUrl") + OrgId);

				if (response.StatusCode == HttpStatusCode.OK)
				{
					var apiResponse = JsonConvert.DeserializeObject<APIResponse>(
					  await response.Content.ReadAsStringAsync())
				  ?? throw new InvalidOperationException("Invalid API response.");

					if (apiResponse.Success)
					{
						var orgBulkSignerList = JsonConvert.DeserializeObject<BulkSignerListDTO>(
							apiResponse.Result?.ToString()
							?? throw new InvalidOperationException("API result is null."))
							?? throw new InvalidOperationException("Failed to deserialize.");

						return new ServiceResult(orgBulkSignerList, apiResponse.Message ?? "Success");
					}

					return new ServiceResult(apiResponse.Message ?? "Unknown error");
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
				_logger.LogError("FailBulkSigningRequestAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while updating bulksigning request status");
		}

		public async Task<ServiceResult> DownloadSignedDocumentAsync(string fileName, string corelationId)
		{
			try
			{
				if (String.IsNullOrEmpty(fileName))
				{
					_logger.LogInformation("Filename cannot be null");
					return new ServiceResult("Filename cannot be null.");
				}

				if (String.IsNullOrEmpty(corelationId))
				{
					_logger.LogInformation("Corelation Id cannot be null");
					return new ServiceResult("Corelation Id cannot be null.");
				}

				var bulkSignData = await _bulkSignRepository.GetBulkSignDataByCorelationId(corelationId);
				if (bulkSignData == null)
				{
					_logger.LogInformation("No details found");
					return new ServiceResult(null, "No details found.");
				}

				DownloadSignedDocumentDTO downloadSignedDocument = new DownloadSignedDocumentDTO
				{
					FileName = fileName,
					DestinationPath = bulkSignData.SignedPath
				};

				string json = JsonConvert.SerializeObject(downloadSignedDocument,
					new JsonSerializerSettings { ContractResolver = new CamelCasePropertyNamesContractResolver() });
				StringContent content = new StringContent(json, Encoding.UTF8, "application/json");

				DateTime startTime = DateTime.UtcNow;
				_logger.LogInformation("DownloadSignedDocumentAsync Time : {0}", startTime);

				HttpResponseMessage response = await _client.PostAsync($"api/digital/signature/get/file", content);

				_logger.LogInformation("Download document total time : {0}", DateTime.UtcNow.Subtract(startTime));

				if (response.StatusCode == HttpStatusCode.OK)
				{
					byte[] bytes = await response.Content.ReadAsByteArrayAsync();
					if (bytes == null || bytes.Length == 0)
					{
						_logger.LogInformation("Document not Found");
						return new ServiceResult("Document not found");
					}
					else
					{
						_logger.LogInformation("Document Received Successfully");
						return new ServiceResult(bytes, "Document received successfully");
					}
				}
				else if (response.StatusCode == HttpStatusCode.NoContent)
				{
					_logger.LogInformation("The Doucment is no longer exists");
					return new ServiceResult("This Document No Longer Exists");
				}
				else
				{
					Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");

					_logger.LogError($"The request with URI={response.RequestMessage.RequestUri} failed " +
							   $"with status code={response.StatusCode}");

					return new ServiceResult("Failed to receive document : " + response.ReasonPhrase);
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);

				_logger.LogError(ex, ex.Message);
				_logger.LogError("DownloadSignedDocumentAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while fetching document");
		}

		public async Task<ServiceResult> GetAgentUrlAsync(string OrgId)
		{
			_logger.LogInformation("GetAgentUrlAsync Start");

			if (string.IsNullOrEmpty(OrgId))
			{
				_logger.LogInformation("Organization id cannot be null");
				return new ServiceResult("Organization id cannot be null");
			}

			try
			{
				_logger.LogInformation("GetOrganizationAgentUrl API call start");

				var response = await _client.GetAsync(_configuration.GetValue<string>("Config:GetOrganizationAgentUrl") + OrgId);

				_logger.LogInformation("GetOrganizationAgentUrl API call end");

				if (response.StatusCode == HttpStatusCode.OK)
				{
					APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
					_logger.LogInformation($"Get AgentUrlAsync Api response :{apiResponse.ToString()}");
					if (apiResponse.Success)
					{
						_logger.LogInformation("GetAgentUrlAsync End");
						return new ServiceResult(apiResponse.Result, apiResponse.Message);
					}
					else
					{
						_logger.LogError(apiResponse.Message, apiResponse);
						_logger.LogInformation("GetAgentUrlAsync End");
						return new ServiceResult(apiResponse.Message);
					}
				}
				else
				{
					Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");

					_logger.LogError(response.Content.ToString());
					_logger.LogError($"The request with URI={response.RequestMessage.RequestUri} failed " +
							   $"with status code={response.StatusCode}");
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);

				_logger.LogError(ex, ex.Message);
				_logger.LogError("FailBulkSigningRequestAsync Exception :  {0}", ex.Message);
			}
			_logger.LogInformation("GetAgentUrlAsync End");
			return new ServiceResult("An error occurred while updating bulksigning request status");
		}

		public async Task<ServiceResult> BulkSignCallBackAsync(BulkSignCallBackDTO bulkSignCallBackDTO)
		{
			_logger.LogInformation($"BulkSignCallBackDTO : {bulkSignCallBackDTO}");
			if (string.IsNullOrEmpty(bulkSignCallBackDTO.CorrelationId))
			{
				_logger.LogInformation("Corelation id cannot be null");
				return new ServiceResult("Corelation id cannot be null");
			}

			try
			{
				var bulkSignData = await _bulkSignRepository.GetBulkSignDataByCorelationId(bulkSignCallBackDTO.CorrelationId);
				if (bulkSignData == null)
				{
					_logger.LogInformation("No details found");
					return new ServiceResult(null, "No details found.");
				}

				BulkSign bulkSign = new BulkSign
				{
					CorelationId = bulkSignCallBackDTO.CorrelationId,
					Result = bulkSignCallBackDTO.Result,
					Status = DocumentStatusConstants.Completed,
					CompletedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
				};

				var updateBulksignData = await _bulkSignRepository.UpdateBulkSignData(bulkSign);
				if (!updateBulksignData)
				{
					_logger.LogError($"Failed to update bulksigndata");
					return new ServiceResult("Failed to update bulksign data");
				}

				NotificationDTO notification = new NotificationDTO
				{
					Receiver = bulkSignData.Suid,
					Sender = bulkSignData.OwnerEmail,
					Text = bulkSignData.TemplateName + " Bulk Sign has completed",
					Link = ""
				};

				_backgroundService.RunBackgroundTask<INotificationService>(sender =>
					sender.CreateNotificationAsync(
						notification,
						bulkSignData.OrganizationId,
						new(NotificationTypeConstants.BulkSign, bulkSignData.CorelationId)));

				return new ServiceResult(null, "Successfully received preparing bulksigning request");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);

				_logger.LogError(ex, ex.Message);
				_logger.LogError("BulkSignCallBackAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while updating bulksigning request");
		}

		public async Task<byte[]> DownloadBulkSignDocumentAsync(DownloadBulkSignDocumentDTO documentDownloadDTO, string url)
		{
			_logger.LogInformation("DownloadAsync");
			try
			{




				//string relativePath = url+"SignatureServiceAgent/api/digital/signature/get/file";

				//Uri fullUrl = new Uri(new Uri(agentUrl), relativePath);

				//string url = $"{fullUrl}";

				DownloadBulkSignDocumentDTO getfileDTO = new DownloadBulkSignDocumentDTO()
				{
					fileName = documentDownloadDTO.fileName,
					destinationPath = documentDownloadDTO.destinationPath
				};

				//string json = JsonConvert.SerializeObject(getfileDTO);

				//StringContent content = new StringContent(json, Encoding.UTF8, "application/json");

				string json = JsonConvert.SerializeObject(getfileDTO,
				  new JsonSerializerSettings { ContractResolver = new CamelCasePropertyNamesContractResolver() });
				StringContent content = new StringContent(json, Encoding.UTF8, "application/json");

				HttpResponseMessage response = await _client.PostAsync(url + "/api/digital/signature/get/file", content);

				// var response = _client.PostAsync(url, content).Result;

				if (response.StatusCode == HttpStatusCode.OK)
				{

					response.EnsureSuccessStatusCode();

					if (response.Content.Headers.ContentType?.MediaType == "application/pdf")
					{
						return await response.Content.ReadAsByteArrayAsync();
					}
					else
					{
						_logger.LogError("The response is not a PDF file.");
						throw new InvalidOperationException("The response is not a PDF file.");
					}
				}
				else
				{
					Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");
					_logger.LogError($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");

					throw new InvalidOperationException("The response is not a PDF file.");
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex.Message);
				throw new InvalidOperationException(ex.Message);
			}
		}

		public async Task<ServiceResult> VerifyPathsAsync(VerifyPathsDTO verifyPaths, string url)
		{
			try
			{
				JObject obj = new JObject();
				obj.Add("sourcePath", verifyPaths.Inputpath);
				obj.Add("destinationPath", verifyPaths.Outputpath);

				//obj.Add("sourcePath", "/home/user1/BulkSign/Baji Src/");
				//obj.Add("destinationPath", "/home/user1/BulkSign/Baji Dest/");

				string json = JsonConvert.SerializeObject(obj,
					new JsonSerializerSettings { ContractResolver = new CamelCasePropertyNamesContractResolver() });
				StringContent content = new StringContent(json, Encoding.UTF8, "application/json");

				//_logger.LogInformation("Add Organization api call start");
				HttpResponseMessage response = await _client.PostAsync(url + "/api/digital/signature/get/documents/details", content);
				//HttpResponseMessage response = await _client.PostAsync(url+ "/SignatureServiceAgent/api/digital/signature/valid/path", content);
				//_logger.LogInformation("Add Organization api call end");
				if (response.StatusCode == HttpStatusCode.OK)
				{
					APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
					_logger.LogInformation($"VerifyPathsAsync Api response :{apiResponse.ToString()}");
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
				_logger.LogError("VerifyPathsAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while verifying paths");
		}


		public async Task<ServiceResult> BulkSignFileData(BulkSignFileDataDTO dataobj, string url)
		{
			try
			{

				string json = JsonConvert.SerializeObject(dataobj,
					new JsonSerializerSettings { ContractResolver = new CamelCasePropertyNamesContractResolver() });
				StringContent content = new StringContent(json, Encoding.UTF8, "application/json");

				//_logger.LogInformation("Add Organization api call start");
				HttpResponseMessage response = await _client.PostAsync(url + "/api/digital/signature/get/file", content);
				//HttpResponseMessage response = await _client.PostAsync(url+ "/SignatureServiceAgent/api/digital/signature/valid/path", content);
				//_logger.LogInformation("Add Organization api call end");
				if (response.StatusCode == HttpStatusCode.OK)
				{
					byte[] bytes = await response.Content.ReadAsByteArrayAsync();
					if (bytes == null || bytes.Length == 0)
					{
						_logger.LogInformation("Document not found");
						return new ServiceResult("Document not found");
					}
					else
					{
						return new ServiceResult(bytes, "Document received successfully");
					}
				}
				else if (response.StatusCode == HttpStatusCode.NoContent)
				{
					_logger.LogInformation("This Document No Longer Exists");
					return new ServiceResult("This Document No Longer Exists");
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
				_logger.LogError("VerifyPathsAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while verifying paths");
		}


		public async Task<ServiceResult> SendBulkSignRequestAsync(SendBulkSignRequestDTO signingobj, string url)
		{
			//return new ServiceResult(true, "Successful");
			try
			{
				string json = JsonConvert.SerializeObject(signingobj,
				   new JsonSerializerSettings { ContractResolver = new CamelCasePropertyNamesContractResolver() });
				StringContent content = new StringContent(json, Encoding.UTF8, "application/json");

				//_logger.LogInformation("Add Organization api call start");
				HttpResponseMessage response = await _client.PostAsync(url + "/SignatureServiceAgent/api/digital/signature/bulk/sign", content);
				//HttpResponseMessage response = await _client.PostAsync(url+ "/SignatureServiceAgent/api/digital/signature/valid/path", content);
				//_logger.LogInformation("Add Organization api call end");
				if (response.StatusCode == HttpStatusCode.OK)
				{
					APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
					_logger.LogInformation($"SendBulkSignRequestAsync Api response :{apiResponse.ToString()}");
					if (apiResponse.Success)
					{
						return new ServiceResult(apiResponse.Result, apiResponse.Message);
					}
					else
					{
						_logger.LogError(apiResponse.Message);
						return new ServiceResult(false, apiResponse.Message);
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
				_logger.LogError("SendBulkSignRequestAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while bulksigning request.");

		}

		public async Task<ServiceResult> UpdateBulkSignStatus(string corelationId, string url)
		{
			_logger.LogInformation("UpdateBulkSignStatus");
			try
			{
				//var myTrust = _configuration.GetValue<bool>("MyTrust");
				//var urlpath = myTrust
				//    ? _configuration.GetValue<string>("Config:BulkSignStatusURL")
				//    : $"{url}/SignatureServiceAgent/item/by/";
				var urlpath = _configuration.GetValue<string>("Config:BulkSignStatusURL")
			  ?? throw new InvalidOperationException("BulkSignStatusURL is not configured.");

				HttpResponseMessage response = await _client.GetAsync(urlpath + corelationId);

				if (response.StatusCode == HttpStatusCode.OK)
				{
					var content = await response.Content.ReadAsStringAsync();

					var apiResponse = JsonConvert.DeserializeObject<BulkSignCallBackDTO>(content)
									  ?? throw new InvalidOperationException("Failed to deserialize BulkSignCallBackDTO.");

					_logger.LogInformation("UpdateBulkSignStatus Api Response : {@ApiResponse}", apiResponse);

					return new ServiceResult(apiResponse, "successfully received status");
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
				_logger.LogError(ex.Message);
				return new ServiceResult(ex.Message);
			}
			return new ServiceResult("An error occurred while UpdateBulkSignStatus request.");
		}


		// LOCAL BULK SIGNING SERVICES
		//public async Task<ServiceResult> SaveLocalBulkSigningRequestAsync(string templateId, string transactionName, UserDTO userDTO)
		//{
		//    if (templateId == null)
		//    {
		//        return new ServiceResult("Template id cannot be null");
		//    }

		//    try
		//    {
		//        if (string.IsNullOrWhiteSpace(transactionName))
		//        {
		//            return new ServiceResult("Transaction name cannot be empty or blank spaces");
		//        }
		//        else
		//        {
		//            bool IsTransactionNameExist = await _bulkSignRepository.IsBulkSigningTransactionNameExists(transactionName);
		//            if (IsTransactionNameExist)
		//            {
		//                return new ServiceResult("Transaction name already exists");
		//            }
		//        }

		//        var templateDetails = (Template)(await _templateService.GetTemplateDetailsAsync(templateId)).Result;
		//        if (templateDetails == null)
		//        {
		//            return new ServiceResult("Failed to get template details");
		//        }

		//        JObject Settings = JObject.Parse(templateDetails.SettingConfig);

		//        var agentResponce = await GetAgentUrlAsync(userDTO.OrganizationId);
		//        if (!agentResponce.Success)
		//        {
		//            return new ServiceResult(agentResponce.Message);
		//        }

		//        PrepareBulksignResponse prepareBulksignResponse = new PrepareBulksignResponse()
		//        {
		//            Suid = userDTO.Suid,
		//            Email = userDTO.Email,
		//            OrganizationId = userDTO.OrganizationId,
		//            SourcePath = Settings["inputpath"].ToString(),
		//            DestinationPath = Settings["outputpath"].ToString(),
		//            //CallBackUrl = _configuration.GetValue<string>("CallBackUrl"),
		//            //AgentUrl = _configuration.GetValue<string>("AgentUrl")
		//            AgentUrl = agentResponce.Result.ToString(),
		//            SignatureTemplateId = templateDetails.SignatureTemplate,
		//            EsealSignatureTemplateId = templateDetails.EsealSignatureTemplate,
		//            QrCodeRequired = templateDetails.QrCodeRequired
		//        };

		//        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
		//        var isDevelopment = environment == Environments.Development;
		//        if (isDevelopment)
		//        {
		//            prepareBulksignResponse.CallBackUrl = _configuration.GetValue<string>("CallBackUrl");
		//        }
		//        else
		//        {
		//            prepareBulksignResponse.CallBackUrl = _configuration.GetValue<string>("Config:Signing_portal:BACKEND_URL") + "/api/bulksigne/bulksigned-document";
		//        }

		//        if (!string.IsNullOrEmpty(templateDetails.Annotations))
		//        {
		//            JObject signCoordinatesObj = JObject.Parse(templateDetails.Annotations);

		//            var signCords = signCoordinatesObj[userDTO.Email];

		//            //var signCords = signCoordinatesObj[templateDetails.RoleList[0].Role];

		//            prepareBulksignResponse.PlaceHolderCoordinates = new placeHolderCoordinates
		//            {
		//                pageNumber = signCords["PageNumber"].ToString(),
		//                signatureXaxis = signCords["posX"].ToString(),
		//                signatureYaxis = signCords["posY"].ToString()
		//            };
		//        }

		//        if (templateDetails.EsealAnnotations != null)
		//        {
		//            JObject esealCoordinatesObj = JObject.Parse(templateDetails.EsealAnnotations);
		//            var esealCords = esealCoordinatesObj[userDTO.Email];
		//            //var esealCords = esealCoordinatesObj[templateDetails.RoleList[0].Role];

		//            prepareBulksignResponse.EsealPlaceHolderCoordinates = new esealplaceHolderCoordinates
		//            {
		//                pageNumber = esealCords["PageNumber"].ToString(),
		//                signatureXaxis = esealCords["posX"].ToString(),
		//                signatureYaxis = esealCords["posY"].ToString()
		//            };
		//        }

		//        if (templateDetails.QrCodeAnnotations != null)
		//        {
		//            JObject qrCodeCoordinatesObj = JObject.Parse(templateDetails.QrCodeAnnotations);
		//            var esealCords = qrCodeCoordinatesObj[userDTO.Email];
		//            //var esealCords = esealCoordinatesObj[templateDetails.RoleList[0].Role];

		//            prepareBulksignResponse.QrCodePlaceHolderCoordinates = new QrCodePlaceHolderCoordinates
		//            {
		//                pageNumber = esealCords["PageNumber"].ToString(),
		//                signatureXaxis = esealCords["posX"].ToString(),
		//                signatureYaxis = esealCords["posY"].ToString()
		//            };
		//        }

		//        prepareBulksignResponse.CorelationId = $@"{Guid.NewGuid()}";

		//        BulkSign bulksignobj = new BulkSign()
		//        {
		//            CorelationId = prepareBulksignResponse.CorelationId,
		//            TemplateId = templateId,
		//            TemplateName = templateDetails.TemplateName,
		//            OrganizationId = userDTO.OrganizationId,
		//            Suid = userDTO.Suid,
		//            Transaction = transactionName,
		//            SourcePath = prepareBulksignResponse.SourcePath,
		//            SignedPath = prepareBulksignResponse.DestinationPath,
		//            //SignatureAnnotations = templateDetails.Annotations.Replace(templateDetails.RoleList[0].Role, userDTO.Email),
		//            Status = DocumentStatusConstants.InProgress,
		//            CreatedAt = DateTime.UtcNow,
		//            OwnerName = userDTO.Name,
		//            OwnerEmail = userDTO.Email,
		//            SignatureEnvironment = "Local"
		//        };

		//        if (!string.IsNullOrEmpty(templateDetails.Annotations))
		//            bulksignobj.SignatureAnnotations = templateDetails.Annotations.Replace(templateDetails.RoleList[0].Role, userDTO.Email);

		//        if (!string.IsNullOrEmpty(templateDetails.EsealAnnotations))
		//            bulksignobj.EsealAnnotations = templateDetails.EsealAnnotations.Replace(templateDetails.RoleList[0].Role, userDTO.Email);

		//        if (!string.IsNullOrEmpty(templateDetails.QrCodeAnnotations))
		//            bulksignobj.QrAnnotations = templateDetails.QrCodeAnnotations.Replace(templateDetails.RoleList[0].Role, userDTO.Email);

		//        var saveBulkSignData = await _bulkSignRepository.SaveBulkSignData(bulksignobj);

		//        return new ServiceResult(prepareBulksignResponse, "Successfully saved bulksign data");
		//    }
		//    catch (Exception ex)
		//    {
		//        _logger.LogError(ex, ex.Message);
		//        _logger.LogError("SaveLocalBulkSigningRequestAsync Exception :  {0}", ex.Message);
		//    }

		//    return new ServiceResult("An error occurred while saving bulksign data");
		//}

		//public async Task<ServiceResult> UpdateCompletedStatusAsync(string corelationId)
		//{
		//    try
		//    {
		//        if (string.IsNullOrEmpty(corelationId))
		//        {
		//            return new ServiceResult("Corelation id cannot be null");
		//        }

		//        var record = await _bulkSignRepository.GetBulkSignDataByCorelationId(corelationId);
		//        if (record == null)
		//        {
		//            return new ServiceResult("Bulk Sign data not found");
		//        }

		//        if (record.Status == DocumentStatusConstants.Completed || record.Status == DocumentStatusConstants.Failed)
		//        {
		//            return new ServiceResult(record, "Status updated successfully");
		//        }

		//        BulkSign bulkSign = new()
		//        {
		//            CorelationId = corelationId,
		//            Status = DocumentStatusConstants.Completed,
		//            CompletedAt = DateTime.UtcNow.ToString(),
		//        };

		//        var updateBulkSignData = await _bulkSignRepository.UpdateBulkSignData(bulkSign);
		//        if (!updateBulkSignData)
		//        {
		//            return new ServiceResult("Failed to update bulk sign status");
		//        }

		//        return new ServiceResult(updateBulkSignData, "Status updated successfully");
		//    }
		//    catch (Exception ex)
		//    {
		//        _logger.LogError(ex, ex.Message);
		//        _logger.LogError("UpdateBulkSigningStatusAsync Exception :  {0}", ex.Message);
		//    }

		//    return new ServiceResult("An error occurred while updating bulksign status");
		//}


	}
}

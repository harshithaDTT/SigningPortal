using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
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
	public class UserTemplateService : IUserTemplateService
	{
		private readonly HttpClient _client;
		private readonly ILogger<TemplateService> _logger;
		private readonly IDocumentHelper _documentHelper;
		private readonly IUserTemplateRepository _templateRepository;
		private readonly ISubscriberOrgUserTemplateRepository _subscriberOrgTemplateRepository;
		private readonly IConfiguration _configuration;
		public UserTemplateService(ILogger<TemplateService> logger,
			 IUserTemplateRepository templateRepository,
			 ISubscriberOrgUserTemplateRepository subscriberOrgTemplateRepository,
			 IDocumentHelper documentHelper,
			 HttpClient httpClient,
			 IConfiguration configuration)
		{
			_logger = logger;
			_subscriberOrgTemplateRepository = subscriberOrgTemplateRepository;
			_documentHelper = documentHelper;
			_templateRepository = templateRepository;
			_configuration = configuration;
            _client = httpClient;
			_client.Timeout = TimeSpan.FromMinutes(10);
			var OrganizationServiceUrl = _configuration["Config:OrganizationServiceBaseAddress"];

			if (string.IsNullOrWhiteSpace(OrganizationServiceUrl))
			{
				throw new InvalidOperationException("OrganizationService URL is not configured properly.");
			}

			httpClient.BaseAddress = new Uri(OrganizationServiceUrl);
			httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
		}

		public async Task<ServiceResult> GetSignatureTemplateList()
		{
			try
			{
				HttpResponseMessage response = await _client.GetAsync($"api/get/all/templates");
				if (response.StatusCode == HttpStatusCode.OK)
				{
					var content = await response.Content.ReadAsStringAsync();
					var apiResponse = JsonConvert.DeserializeObject<APIResponse>(content);

					if (apiResponse == null)
						return new ServiceResult(null, "Invalid API response.");

					if (!apiResponse.Success)
						return new ServiceResult(null, apiResponse.Message ?? "API returned failure.");

					if (apiResponse.Result == null)
						return new ServiceResult(null, "No data received.");

					var resultJson = apiResponse.Result.ToString();

					if (string.IsNullOrWhiteSpace(resultJson))
						return new ServiceResult(null, "Empty result received.");

					var list = JsonConvert.DeserializeObject<IList<SignatureTemplatesDTO>>(resultJson)
							   ?? new List<SignatureTemplatesDTO>();

					return new ServiceResult(list, "Successfully received signature template list");
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
			}

			return new ServiceResult("Failed to receive signature template list");
		}

		public async Task<ServiceResult> SaveNewTemplateAsync(SaveNewTemplateDTO template, UserDTO userDetails)
		{

			if (template.File == null)
			{
				return new ServiceResult("File cannot be null");
			}

			if (template.Model == null)
			{
				return new ServiceResult("Model cannot be null");
			}

			try
			{

				JObject esealCoordinatesObj = null;

				TemplateModel modelObj = JsonConvert.DeserializeObject<TemplateModel>(template.Model);

				JObject signCoordinatesObj = JObject.Parse(template.Model);

				var signCords = signCoordinatesObj["signCords"].ToString();
				var esealCords = signCoordinatesObj["esealCords"].ToString();
				var qrCords = signCoordinatesObj["qrCords"].ToString();

				if (!string.IsNullOrEmpty(signCords))
				{
					modelObj.SignCords.coordinates = JsonConvert.SerializeObject(signCoordinatesObj["signCords"]);
					//modelObj.esealCords.coordinates
				}

				if (!string.IsNullOrEmpty(esealCords))
				{
					modelObj.EsealCords.coordinates = JsonConvert.SerializeObject(signCoordinatesObj["esealCords"]);

					esealCoordinatesObj = JObject.Parse(signCoordinatesObj["esealCords"].ToString());
				}

				if (!string.IsNullOrEmpty(qrCords))
				{
					modelObj.QrCords.coordinates = JsonConvert.SerializeObject(signCoordinatesObj["qrCords"]);
				}

				//Duplicate template name validation logic

				var templateList = await _subscriberOrgTemplateRepository.GetTemplateListBySuid(userDetails.Suid);
				if (templateList != null)
				{
					var templateListCount = 0;
					foreach (var item in templateList)
					{
						if (modelObj.TemplateName == item.TemplateDetails[0].TemplateName)
						{
							templateListCount++;
						}
					}

					if (templateListCount > 0)
					{
						return new ServiceResult("Template name " + modelObj.TemplateName + " already exists");
					}
				}

				//for testing expiry date is tomorrow

				var expiryDate = DateTime.UtcNow.AddDays(365).ToString("yyyy-MM-dd HH:mm:ss");
				var EdmsDoc = await _documentHelper.SaveDocumentToEDMS(template.File, modelObj.DocumentName, expiryDate, userDetails.Suid);
				if (!EdmsDoc.Success)
				{
					//return new ServiceResult(_constantError.GetMessage("102524"));
					return new ServiceResult("Failed to save document in edms.");
				}

				var templateData = new UserTemplate()
				{
					TemplateName = modelObj.TemplateName,
					DocumentName = modelObj.DocumentName,
					Annotations = modelObj?.SignCords?.coordinates,
					EsealAnnotations = modelObj?.EsealCords?.coordinates,
					QrCodeAnnotations = modelObj?.QrCords?.coordinates,
					QrCodeRequired = modelObj.QrCodeRequired,
					SettingConfig = modelObj?.SettingConfig,
					EmailList = modelObj?.EmailList,
					RoleList = modelObj.RoleList,
					SignatureTemplate = modelObj.SignatureTemplate,
					EsealSignatureTemplate = modelObj.EsealSignatureTemplate,
					Status = "ACTIVE",
					EdmsId = EdmsDoc.Result.ToString(),
					CreatedBy = userDetails.Name,
					CreatedAt = DateTime.UtcNow
				};

				var saveTemplate = await _templateRepository.SaveTemplateAsync(templateData);

				var subscriberOrgData = new SubscriberOrgUserTemplate()
				{
					Suid = userDetails.Suid,
					OrganizationId = userDetails.OrganizationId,
					TemplateId = saveTemplate._id,
					CreatedAt = DateTime.UtcNow
				};

				var subscriberOrgTemplate = await _subscriberOrgTemplateRepository.SaveSubscriberOrgTemplate(subscriberOrgData);

				return new ServiceResult(subscriberOrgTemplate, "Successfully saved template");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("SaveNewTemplateAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while saving template");
		}

		public async Task<ServiceResult> GetTemplateListAsync(UserDTO userDTO)
		{
			try
			{
				IList<UserTemplate> templateList = new List<UserTemplate>();

				var list = await _subscriberOrgTemplateRepository.GetTemplateListBySuid(userDTO.Suid);
				if (list == null)
				{
					_logger.LogInformation("No records found");
					return new ServiceResult(new List<UserTemplate>(), "No records found.");
				}

				foreach (var item in list)
				{
					templateList.Add(item.TemplateDetails[0]);
				}

				return new ServiceResult(templateList, "Successfully received template list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetTemplateListAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while recevieng template list");
		}

		public async Task<ServiceResult> GetTemplateListForBulkSignAsync(UserDTO userDTO)
		{
			try
			{
				IList<UserTemplate> templateList = new List<UserTemplate>();

				var list = await _subscriberOrgTemplateRepository.GetTemplateListBySuid(userDTO.Suid);
				if (list == null)
				{
					_logger.LogInformation("No records found");
					return new ServiceResult(new List<UserTemplate>(), "No records found.");
				}

				foreach (var item in list)
				{
					if (item.TemplateDetails[0].RoleList.Count == 1 && item.TemplateDetails[0].EmailList.Contains(userDTO.Email))
						templateList.Add(item.TemplateDetails[0]);
				}

				return new ServiceResult(templateList, "Successfully received template list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetTemplateListAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while recevieng template list");
		}

		public async Task<ServiceResult> GetTemplateDetailsAsync(string templateId)
		{
			try
			{
				if (string.IsNullOrEmpty(templateId))
				{
					return new ServiceResult("Template id cannot be null");
				}

				var template = await _templateRepository.GetTemplateAsync(templateId);
				if (template != null)
				{
					return new ServiceResult(template, "Successfully received template details");
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetTemplateDetailsAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while recevieng template details");
		}

		public async Task<ServiceResult> UpdateTemplateAsync(UpdateTemplateDTO updateTemplate, UserDTO userDTO)
		{
			if (updateTemplate == null)
			{
				return new ServiceResult("Template data cannot be null");
			}

			try
			{
				JObject esealCoordinatesObj = null;

				TemplateModel modelObj = JsonConvert.DeserializeObject<TemplateModel>(updateTemplate.Model);

				JObject signCoordinatesObj = JObject.Parse(updateTemplate.Model);

				var signCords = signCoordinatesObj["signCords"].ToString();
				var esealCords = signCoordinatesObj["esealCords"].ToString();
				var qrCords = signCoordinatesObj["qrCords"].ToString();

				if (!string.IsNullOrEmpty(signCords))
				{
					modelObj.SignCords.coordinates = JsonConvert.SerializeObject(signCoordinatesObj["signCords"]);
					//modelObj.esealCords.coordinates
				}

				if (!string.IsNullOrEmpty(esealCords))
				{
					modelObj.EsealCords.coordinates = JsonConvert.SerializeObject(signCoordinatesObj["esealCords"]);

					esealCoordinatesObj = JObject.Parse(signCoordinatesObj["esealCords"].ToString());
				}

				if (!string.IsNullOrEmpty(qrCords))
				{
					modelObj.QrCords.coordinates = JsonConvert.SerializeObject(signCoordinatesObj["qrCords"]);
				}

				////Duplicate template name validation logic

				//var templateList = await _subscriberOrgTemplateRepository.GetTemplateListByOrgId(userDTO.OrganizationId);
				//if (templateList != null)
				//{
				//    var templateListCount = 0;
				//    foreach (var item in templateList)
				//    {
				//        if (modelObj.TemplateName == item.TemplateDetails[0].TemplateName)
				//        {
				//            templateListCount++;
				//        }
				//    }

				//    if (templateListCount > 1)
				//    {
				//        return new ServiceResult("Template name " + modelObj.TemplateName + " already exists");
				//    }
				//}

				//Duplicate template name validation logic

				var templateList = await _subscriberOrgTemplateRepository.GetTemplateListBySuid(userDTO.Suid);
				if (templateList != null)
				{
					IList<SubscriberOrgUserTemplate> tempList = new List<SubscriberOrgUserTemplate>();
					foreach (var item in templateList)
					{
						if (modelObj.TemplateName == item.TemplateDetails[0].TemplateName)
						{
							tempList.Add(item);
						}
					}

					if (tempList.Count > 1)
					{
						return new ServiceResult("Template name " + modelObj.TemplateName + " already exists");
					}

					if (tempList.Count == 1 && modelObj.TemplateId != tempList[0].TemplateId)
					{
						return new ServiceResult("Template name " + modelObj.TemplateName + " already exists");
					}
				}

				UserTemplate template = new UserTemplate()
				{
					_id = modelObj.TemplateId,
					Annotations = modelObj?.SignCords?.coordinates,
					EsealAnnotations = modelObj?.EsealCords?.coordinates,
					QrCodeAnnotations = modelObj?.QrCords?.coordinates,
					QrCodeRequired = modelObj.QrCodeRequired,
					SettingConfig = modelObj?.SettingConfig,
					//EmailList = modelObj?.EmailList,
					//RoleList = modelObj.RoleList,
					SignatureTemplate = modelObj.SignatureTemplate,
					EsealSignatureTemplate = modelObj.EsealSignatureTemplate,
					UpdatedBy = userDTO.Name,
					UpdatedAt = DateTime.UtcNow
				};

				var update = await _templateRepository.UpdateTemplateById(template);
				if (update == true)
				{
					return new ServiceResult(null, "Successfully updated template");
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("UpdateTemplateAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while updating template");
		}

		public async Task<ServiceResult> VerifyOrganizationUserBySignatureTemplateAsync(VerifyOrganizationUserDTO verifyOrgUser, UserDTO userDTO)
		{
			if (string.IsNullOrEmpty(verifyOrgUser.Email))
			{
				return new ServiceResult("Email cannot be null");
			}

			if (string.IsNullOrEmpty(userDTO.OrganizationId))
			{
				return new ServiceResult("Organization id cannot be null");
			}

			try
			{
				VerifyOrganizationUser OrgUser = new VerifyOrganizationUser()
				{
					TemplateId = verifyOrgUser.TemplateId,
					Email = verifyOrgUser.Email,
					OrgId = userDTO.OrganizationId
				};
				string json = JsonConvert.SerializeObject(
					OrgUser, new JsonSerializerSettings { ContractResolver = new CamelCasePropertyNamesContractResolver() });
				StringContent content = new StringContent(json, Encoding.UTF8, "application/json");

				HttpResponseMessage response = await _client.PostAsync($"api/get/user/template/details", content);
				if (response.StatusCode == HttpStatusCode.OK)
				{
					var jsonvalue = await response.Content.ReadAsStringAsync();
					var apiResponse = JsonConvert.DeserializeObject<APIResponse>(jsonvalue);

					if (apiResponse == null)
					{
						_logger.LogError("API response deserialization failed");
						return new ServiceResult("Invalid API response");
					}

					if (apiResponse.Success)
					{
						if (apiResponse.Result == null)
						{
							_logger.LogError("API response result is null");
							return new ServiceResult("Verification failed");
						}

						return new ServiceResult(
							apiResponse.Result.ToString()!,
							"Successfully verified organization user"
						);
					}
					else
					{
						var message = apiResponse.Message ?? "Unknown API error";
						_logger.LogError(message);
						return new ServiceResult(message);
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
			}

			return new ServiceResult("Failed to verify organization user");
		}

		public async Task<ServiceResult> DeleteTemplateAsync(string templateId, UserDTO userDTO)
		{
			try
			{
				if (string.IsNullOrEmpty(templateId))
				{
					return new ServiceResult("Template id cannot be null");
				}

				var template = await GetTemplateDetailsAsync(templateId);
				if (template == null)
				{
					return new ServiceResult("Template does't exists");
				}

				var deleteSubscriberOrgTemplate = await _subscriberOrgTemplateRepository.DeleteSubscriberOrgTemplate(templateId, userDTO);
				if (!deleteSubscriberOrgTemplate)
				{
					return new ServiceResult("Failed to delete template");
				}

				var deleteTemplate = await _templateRepository.DeleteTemplateAsync(templateId);
				if (!deleteTemplate)
				{
					return new ServiceResult("Failed to delete template");
				}

				return new ServiceResult(null, "Successfully deleted template");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("DeleteTemplateAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while deleting template");
		}
	}
}

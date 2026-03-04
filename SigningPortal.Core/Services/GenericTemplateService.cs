using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace SigningPortal.Core.Services
{
	public class GenericTemplateService : IGenericTemplateService
	{
		private readonly HttpClient _client;
		private readonly ILogger<GenericTemplateService> _logger;
		private readonly IDocumentHelper _documentHelper;
		private readonly IGenericTemplateRepository _genericTemplateRepository;
		private readonly ISubscriberOrgGenericTemplateRepository _subscriberOrgGenericTemplateRepository;
		private readonly IConfiguration _configuration;

		public GenericTemplateService(ILogger<GenericTemplateService> logger,
			IDocumentHelper documentHelper,
			IGenericTemplateRepository genericTemplateRepository,
			ISubscriberOrgGenericTemplateRepository subscriberOrgGenericTemplateRepository,
			HttpClient httpClient,
			IConfiguration configuration)
		{
			_logger = logger;
			_documentHelper = documentHelper;
			_genericTemplateRepository = genericTemplateRepository;
			_subscriberOrgGenericTemplateRepository = subscriberOrgGenericTemplateRepository;
			_configuration = configuration;

			_client = httpClient;
			_client.Timeout = TimeSpan.FromMinutes(10);
		}

		public async Task<ServiceResult> SaveNewGenericTemplateAsync(SaveNewGenericTemplateDTO template, UserDTO userDetails)
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

				GenericTemplateModel modelObj = JsonConvert.DeserializeObject<GenericTemplateModel>(template.Model);

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

				var templateList = await _subscriberOrgGenericTemplateRepository.GetGenericTemplateListByOrgId(userDetails.OrganizationId);
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

				var templateData = new GenericTemplate()
				{
					TemplateName = modelObj.TemplateName,
					DocumentName = modelObj.DocumentName,
					DaysToComplete = modelObj.DaysToComplete,
					Annotations = modelObj?.SignCords?.coordinates,
					EsealAnnotations = modelObj?.EsealCords?.coordinates,
					QrCodeAnnotations = modelObj?.QrCords?.coordinates,
					QrCodeRequired = modelObj.QrCodeRequired,
					//SettingConfig = modelObj?.SettingConfig,
					//EmailList = modelObj?.EmailList,
					RoleList = modelObj.RoleList,
					SignatureTemplate = modelObj.SignatureTemplate,
					EsealSignatureTemplate = modelObj.EsealSignatureTemplate,
					CreatedBy = userDetails.Name,
					ESealRequired = modelObj.ESealRequired,
					DisableOrder = modelObj.DisableOrder,
					AllSignatureRequired = modelObj.AllSignatureRequired,
					RequiredSignatureNo = modelObj.RequiredSignatureNo,
					Rotation = modelObj.Rotation,
					Status = "ACTIVE",
					EdmsId = EdmsDoc.Result.ToString(),
					CreatedAt = DateTime.UtcNow
				};

				var saveTemplate = await _genericTemplateRepository.SaveGenericTemplateAsync(templateData);

				var subscriberOrgData = new SubscriberOrgGenericTemplate()
				{
					Suid = userDetails.Suid,
					OrganizationId = userDetails.OrganizationId,
					TemplateId = saveTemplate._id,
					CreatedAt = DateTime.UtcNow
				};

				var subscriberOrgTemplate = await _subscriberOrgGenericTemplateRepository.SaveSubscriberOrgGenericTemplate(subscriberOrgData);

				return new ServiceResult(subscriberOrgTemplate, "Successfully saved template");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("SaveNewGenericTemplateAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while saving template");
		}

		public async Task<ServiceResult> GetGenericTemplateListAsync(UserDTO userDTO)
		{
			try
			{
				IList<GenericTemplate> templateList = new List<GenericTemplate>();

				var list = await _subscriberOrgGenericTemplateRepository.GetGenericTemplateListBySuidAndOrgId(userDTO.Suid, userDTO.OrganizationId);
				if (list == null)
				{
					_logger.LogInformation("No records found");
					return new ServiceResult(new List<GenericTemplate>(), "No records found.");
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

		public async Task<ServiceResult> GetGenericTemplateDetailsAsync(string templateId)
		{
			try
			{
				if (string.IsNullOrEmpty(templateId))
				{
					return new ServiceResult("Template id cannot be null");
				}

				var template = await _genericTemplateRepository.GetGenericTemplateAsync(templateId);
				if (template != null)
				{
					return new ServiceResult(template, "Successfully received template details");
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetGenericTemplateDetailsAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while recevieng template details");
		}

		public async Task<ServiceResult> UpdateGenericTemplateAsync(UpdateGenericTemplateDTO updateTemplate, UserDTO userDTO)
		{
			if (updateTemplate == null)
			{
				return new ServiceResult("Template data cannot be null");
			}

			try
			{
				JObject esealCoordinatesObj = null;

				GenericTemplateModel modelObj = JsonConvert.DeserializeObject<GenericTemplateModel>(updateTemplate.Model);

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

				var templateList = await _subscriberOrgGenericTemplateRepository.GetGenericTemplateListByOrgId(userDTO.OrganizationId);
				if (templateList != null)
				{
					IList<SubscriberOrgGenericTemplate> tempList = new List<SubscriberOrgGenericTemplate>();
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

				GenericTemplate template = new GenericTemplate()
				{
					_id = modelObj.TemplateId,
					DaysToComplete = modelObj.DaysToComplete,
					Annotations = modelObj?.SignCords?.coordinates,
					EsealAnnotations = modelObj?.EsealCords?.coordinates,
					QrCodeAnnotations = modelObj?.QrCords?.coordinates,
					QrCodeRequired = modelObj.QrCodeRequired,
					//SettingConfig = modelObj?.SettingConfig,
					//EmailList = modelObj?.EmailList,
					RoleList = modelObj.RoleList,
					SignatureTemplate = modelObj.SignatureTemplate,
					EsealSignatureTemplate = modelObj.EsealSignatureTemplate,
					ESealRequired = modelObj.ESealRequired,
					DisableOrder = modelObj.DisableOrder,
					AllSignatureRequired = modelObj.AllSignatureRequired,
					RequiredSignatureNo = modelObj.RequiredSignatureNo,
					UpdatedBy = userDTO.Name,
					UpdatedAt = DateTime.UtcNow
				};

				var update = await _genericTemplateRepository.UpdateGenericTemplateById(template);
				if (update == true)
				{
					return new ServiceResult(null, "Successfully updated template");
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("UpdateGenericTemplateAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while updating template");
		}

		public async Task<ServiceResult> DeleteGenericTemplateAsync(string templateId, UserDTO userDTO)
		{
			try
			{
				if (string.IsNullOrEmpty(templateId))
				{
					return new ServiceResult("Template id cannot be null");
				}

				var template = await GetGenericTemplateDetailsAsync(templateId);
				if (template == null)
				{
					return new ServiceResult("Template does't exists");
				}

				var deleteSubscriberOrgTemplate = await _subscriberOrgGenericTemplateRepository.DeleteSubscriberOrgGenericTemplate(templateId, userDTO);
				if (!deleteSubscriberOrgTemplate)
				{
					return new ServiceResult("Failed to delete template");
				}

				var deleteTemplate = await _genericTemplateRepository.DeleteGenericTemplateAsync(templateId);
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
				_logger.LogError("DeleteGenericTemplateAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while deleting template");
		}
	}
}

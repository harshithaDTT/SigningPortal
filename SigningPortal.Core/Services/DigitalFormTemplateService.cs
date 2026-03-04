using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SigningPortal.Core.Services
{
	public class DigitalFormTemplateService : IDigitalFormTemplateService
	{
		private readonly ILogger<DigitalFormTemplateService> _logger;
		private readonly IDocumentHelper _documentHelper;
		private readonly ITemplateDocumentRepository _templateDocumentRepository;
		private readonly IDigitalFormTemplateRepository _documentTemplateRepository;
		private readonly IDigitalFormResponseRepository _digitalFormResponseRepository;
		private readonly INewDigitalFormResponseRepository _newDigitalFormResponseRepository;
		private readonly IDigitalFormTemplateRoleRepository _roleRepository;
		public DigitalFormTemplateService
			(
				ILogger<DigitalFormTemplateService> logger,
				IDocumentHelper documentHelper,
				ITemplateDocumentRepository templateDocumentRepository,
				IDigitalFormTemplateRepository documentTemplate,
				IDigitalFormTemplateRoleRepository documentTemplateRole,
				IDigitalFormResponseRepository digitalFormResponseRepository,
				INewDigitalFormResponseRepository newDigitalFormResponseRepository
			)
		{
			_logger = logger;
			_documentHelper = documentHelper;
			_templateDocumentRepository = templateDocumentRepository;
			_documentTemplateRepository = documentTemplate;
			_roleRepository = documentTemplateRole;
			_digitalFormResponseRepository = digitalFormResponseRepository;
			_newDigitalFormResponseRepository = newDigitalFormResponseRepository;
		}

		private async Task ScheduledUpdate()
		{
			try
			{
				// Fetch only the templates that need to be updated (if possible).
				var allTemplates = await _documentTemplateRepository.GetAllPublishedDigitalFormsAsync();

				// Filter templates that need an update
				var templatesToUpdate = allTemplates
					.Where(template => template.UpdatedAt.AddDays(int.Parse(template.DaysToComplete)) < DateTime.UtcNow)
					.ToList();

				if (templatesToUpdate.Count == 0) return;

				var updates = new List<DigitalFormTemplate>();

				// Prepare a batch of updates
				foreach (var template in templatesToUpdate)
				{
					DigitalFormTemplate temp = new()
					{
						_id = template._id,
						PublishGlobally = false,
						Status = TemplateConstants.Unpublish
					};
					updates.Add(temp);
				}

				// Perform a bulk update to the repository to reduce the number of calls
				var updateSuccess = await _documentTemplateRepository.BulkUpdateDigitalFormTemplateStatus(updates);

				// Log in case of failure
				if (!updateSuccess)
				{
					_logger.LogError("Some or all statuses were not updated");
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError($"ScheduledUpdate Exception :  {ex.Message}");
			}
		}

		public async Task<ServiceResult> SaveNewDigitalFormTemplateAsync(SaveNewDigitalFormTemplateDTO newDoc, UserDTO userDTO)
		{
			DigitalFormTemplate savedTemplate = new();
			string edmsId = string.Empty;

			if (newDoc.Model == null)
			{
				return new ServiceResult("Model cannot be null");
			}

			try
			{
				TemplateModelDTO templateModel = JsonConvert.DeserializeObject<TemplateModelDTO>(newDoc.Model);

				List<RoleDetails> roleDetails = JsonConvert.DeserializeObject<List<RoleDetails>>(templateModel.rolesConfig);

				var isNameExists = await _documentTemplateRepository.IsDigitalFormTemplateNameExists(templateModel.docConfig.name, userDTO.OrganizationId);
				if (isNameExists)
				{
					return new ServiceResult("Template name " + templateModel.docConfig.name + " already exists in the organization " + userDTO.OrganizationName);
				}

				if (newDoc.File != null && templateModel.docConfig.docType == "PDF")
				{
					var expiryDate = DateTime.UtcNow.AddDays(365).ToString("yyyy-MM-dd HH:mm:ss");
					var EdmsDoc = await _documentHelper.SaveDocumentToEDMS(newDoc.File, newDoc.File.FileName, expiryDate, userDTO.Suid);
					if (!EdmsDoc.Success)
					{
						//return new ServiceResult(_constantError.GetMessage("102524"));
						return new ServiceResult("Failed to save document in edms.");
					}

					edmsId = EdmsDoc.Result.ToString();
				}

				if (templateModel != null)
				{
					DigitalFormTemplate documentTemplate = new()
					{
						//Model = newDoc.Model,
						TemplateName = templateModel.docConfig.name,
						OrganizationUid = userDTO.OrganizationId,
						AdvancedSettings = templateModel.docConfig.advancedSettings,
						Suid = userDTO.Suid,
						Email = userDTO.Email,
						EdmsId = edmsId,
						DocumentName = templateModel.docConfig.documentName,
						DaysToComplete = templateModel.docConfig.daysToComplete,
						NumberOfSignatures = templateModel.docConfig.numberOfSignatures,
						AllSigRequired = templateModel.docConfig.allSigRequired,
						PublishGlobally = templateModel.docConfig.publishGlobally,
						SequentialSigning = templateModel.docConfig.sequentialSigning,
						SubmissionEmails = templateModel.docConfig.submissionEmails,
						SubmissionUrl = templateModel.docConfig.submissionUrl,
						DataStorage = templateModel.docConfig.dataStorage,
						Type = templateModel.docConfig.docType,
						HtmlSchema = templateModel.docConfig.htmlSchema,
						PdfSchema = templateModel.docConfig.pdfSchema,
						Status = TemplateConstants.Unpublish,
						CreatedBy = userDTO.Name,
						UpdatedBy = userDTO.Name,
						CreatedAt = DateTime.UtcNow,
						UpdatedAt = DateTime.UtcNow,
						//FormGroupId = "",
						FormType = "General",
						Order = 1,
						ApplicableSubscriberType = "All"
					};

					savedTemplate = await _documentTemplateRepository.SaveDigitalFormTemplateAsync(documentTemplate);
					if (savedTemplate == null)
					{
						return new ServiceResult("An error occurred while saving form template");
					}
				}

				if (roleDetails != null)
				{
					List<DigitalFormTemplateRole> roleList = new();

					foreach (var detail in roleDetails)
					{
						DigitalFormTemplateRole documentTemplateRole = new()
						{
							TemplateId = savedTemplate._id,
							Email = detail.email,
							Roles = detail.role,
							SigningOrder = detail.signingOrder,
							AnnotationsList = detail.annotationsList,
							PlaceHolderCoordinates = detail.placeHolderCoordinates,
							EsealPlaceHolderCoordinates = detail.esealPlaceHolderCoordinates,
							CreatedBy = userDTO.Name,
							UpdatedBy = userDTO.Name,
							CreatedAt = DateTime.UtcNow,
							UpdatedAt = DateTime.UtcNow,
						};
						//roleList.Add(documentTemplateRole);

						DigitalFormTemplateRole tempRole = await _roleRepository.SaveDigitalFormTemplateRoleAsync(documentTemplateRole);
						if (tempRole == null)
						{
							return new ServiceResult("An error occurred while saving form template roles");
						}

						roleList.Add(tempRole);
					}

					//List<DigitalFormTemplateRole> savedTemplateRoles = await _roleRepository.SaveDigitalFormTemplateRoleListAsync(roleList);
					//if (savedTemplateRoles == null)
					//{
					//	return new ServiceResult("An error occurred while saving form template roles");
					//}
				}

				return new ServiceResult(savedTemplate._id, "Successfully saved form template");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("SaveNewDigitalFormTemplateAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while saving form template");
		}

		public async Task<ServiceResult> PublishUnpublishTemplateStatusAsync(string templateId, string action, UserDTO user)
		{
			string msg = "";

			if (templateId == null)
			{
				return new ServiceResult("Template id cannot be null");
			}

			if (action == null)
			{
				return new ServiceResult("Action cannot be null");
			}
			try
			{
				var docTemp = await _documentTemplateRepository.GetDigitalFormTemplateAsync(templateId);
				if (docTemp == null)
				{
					return new ServiceResult("Template not found");
				}
				DigitalFormTemplate temp = new() { _id = docTemp._id, PublishGlobally = false };
				if (action == TemplateConstants.Unpublish)
				{
					temp.Status = TemplateConstants.Unpublish;
					msg = "Form template unpublished";
				}
				else if (action == TemplateConstants.Publish)
				{
					temp.Status = TemplateConstants.Publish;
					msg = "Form template published";
				}
				else if (action == TemplateConstants.PublishAll)
				{
					temp.Status = TemplateConstants.Publish;
					temp.PublishGlobally = true;
					msg = "Form template published globally";
				}

				var update = await _documentTemplateRepository.UpdateDigitalFormTemplateStatus(temp);
				if (!update)
				{
					return new ServiceResult("Status not updated");
				}
				return new ServiceResult(null, msg);
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("PublishUnpublishTemplateStatusAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while " + action + "ing template");
		}

		public async Task<ServiceResult> NewPublishUnpublishTemplateStatusAsync(PublishUnpublishTemplateDTO dto, UserDTO user)
		{
			string msg = "";

			if (dto.TemplateId == null)
			{
				return new ServiceResult("Template id cannot be null");
			}

			if (dto.Action == null)
			{
				return new ServiceResult("Action cannot be null");
			}
			try
			{
				var docTemp = await _documentTemplateRepository.GetDigitalFormTemplateAsync(dto.TemplateId);
				if (docTemp == null)
				{
					return new ServiceResult("Template not found");
				}
				DigitalFormTemplate temp = new() { _id = docTemp._id, PublishGlobally = false };
				if (dto.Action == TemplateConstants.Unpublish)
				{
					temp.Status = TemplateConstants.Unpublish;
					msg = "Form template unpublished";
				}
				else if (dto.Action == TemplateConstants.Publish)
				{
					temp.Status = TemplateConstants.Publish;
					msg = "Form template published";
				}
				else if (dto.Action == TemplateConstants.PublishAll)
				{
					temp.Status = TemplateConstants.Publish;
					temp.PublishGlobally = true;
					msg = "Form template published globally";
				}

				var update = await _documentTemplateRepository.UpdateDigitalFormTemplateStatus(temp);
				if (!update)
				{
					return new ServiceResult("Status not updated");
				}

				if (dto.RoleData != null && (dto.Action == TemplateConstants.Publish || dto.Action == TemplateConstants.PublishAll))
				{
					var updateTasks = dto.RoleData.Select(async item =>
					{
						var roleToUpdate = docTemp.Roles.FirstOrDefault(x => x._id == item.Key);

						if (roleToUpdate == null)
						{
							var errorMessage = $"Role not found for id: {item.Key}";
							_logger.LogError(errorMessage);
							throw new Exception(errorMessage); // Throwing exception for missing role
						}

						// Update role details
						var updatedRole = item.Value;
						roleToUpdate.Roles.email = updatedRole.Email;
						roleToUpdate.Roles.organizationId = updatedRole.OrganizationId;
						roleToUpdate.Roles.suid = updatedRole.Suid;
						roleToUpdate.Roles.organizationName = updatedRole.OrganizationName;
						roleToUpdate.Roles.delegationId = updatedRole.DelegationId;

						// Save the updated role
						var updateRoleDetails = await _roleRepository.UpdateDigitalFormTemplateRoleById(roleToUpdate);
						if (!updateRoleDetails)
						{
							_logger.LogError($"Failed to update role for id: {item.Key}");
						}
					});

					// Execute all role update tasks in parallel
					await Task.WhenAll(updateTasks);
				}
				return new ServiceResult(null, msg);
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("PublishUnpublishTemplateStatusAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while " + dto.Action + "ing template");
		}

		public async Task<ServiceResult> GetDigitalFormTemplateByIdAsync(string templateId)
		{
			try
			{
				var docTemplate = await _documentTemplateRepository.GetDigitalFormTemplateAsync(templateId);
				if (docTemplate == null)
				{
					return new ServiceResult("No digital form template found");
				}

				return new ServiceResult(docTemplate, "Successfully recieved form template");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetDigitalFormTemplateByIdAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while getting form template details");
		}

		public async Task<ServiceResult> GetDigitalFormTemplateListAsync(UserDTO userDTO)
		{
			try
			{
				_ = Task.Run(async () => await ScheduledUpdate());

				var docTemplateList = await _documentTemplateRepository.GetDigitalFormTemplateListAsync(userDTO);
				if (docTemplateList == null)
				{
					return new ServiceResult("No digital form template found");
				}

				return new ServiceResult(docTemplateList, "Successfully recieved form template list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetDigitalFormTemplateListAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while getting form template list");
		}

		//public async Task<ServiceResult> GetDigitalFormTemplateListByGroupIdAsync(string id)
		//{
		//    try
		//    {
		//        Task.Run(async () => await ScheduledUpdate());

		//        var docTemplateList = await _documentTemplateRepository.GetDigitalFormTemplateListByGroupIdAsync(id);
		//        if (docTemplateList == null)
		//        {
		//            return new ServiceResult("An error occurred while getting form template list");
		//        }

		//        return new ServiceResult(docTemplateList, "Successfully recieved form template list");
		//    }
		//    catch (Exception ex)
		//    {
		//        _logger.LogError(ex, ex.Message);
		//        _logger.LogError("GetDigitalFormTemplateListByGroupIdAsync Exception :  {0}", ex.Message);
		//    }

		//    return new ServiceResult("An error occurred while getting form template list");
		//}

		public async Task<ServiceResult> GetDigitalFormTemplatePublishListAsync(UserDTO userDTO)
		{
			try
			{
				_ = Task.Run(async () => await ScheduledUpdate());

				var list = new List<FormTemplateResponseDTO>();

				var docTemplateList = await _documentTemplateRepository.GetDigitalFormTemplatePublishListAsync(userDTO);
				if (docTemplateList == null)
				{
					return new ServiceResult("No digital form template found");
				}

				// Prepare a list of tasks to fetch form responses in parallel
				var tasks = docTemplateList.Select(async docTemplate =>
				{
					var docTempResponse = new FormTemplateResponseDTO()
					{
						Template = docTemplate
					};

					// Fetch form response asynchronously for each template
					var response = await _digitalFormResponseRepository.GetDigitalFormResponseByIdAsync(docTemplate._id, userDTO.Suid);
					if (response != null)
					{
						docTempResponse.FormResponse = response;
					}

					return docTempResponse;
				}).ToList();

				// Await all tasks in parallel
				var result = await Task.WhenAll(tasks);

				list.AddRange(result);

				return new ServiceResult(list, "Successfully recieved form template list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetDigitalFormTemplatePublishListAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while getting form template list");
		}

		public async Task<ServiceResult> GetNewDigitalFormTemplatePublishListAsync(UserDTO userDTO)
		{
			try
			{
				_ = Task.Run(async () => await ScheduledUpdate());

				var list = new List<NewFormTemplateResponseDTO>();

				var docTemplateList = await _documentTemplateRepository.GetDigitalFormTemplatePublishListAsync(userDTO);
				if (docTemplateList == null)
				{
					return new ServiceResult("No digital form template found");
				}

				// Prepare a list of tasks to fetch form responses in parallel
				var tasks = docTemplateList.Select(async docTemplate =>
				{
					var docTempResponse = new NewFormTemplateResponseDTO()
					{
						Template = docTemplate
					};

					// Fetch form response asynchronously for each template
					//var response = await _templateDocumentRepository.GetTemplateResponseDocument(docTemplate._id, userDTO.Suid, userDTO.OrganizationId);
					//if (response != null)
					//{
					//	  docTempResponse.FormResponse = response;
					//}
					var res = await _newDigitalFormResponseRepository.GetNewDigitalFormResponseByIdAsync(docTemplate._id, userDTO.Suid);
					if (res != null)
					{
						docTempResponse.Response = res;

						var response = await _templateDocumentRepository.GetTemplateDocumentById(res.TemplateDocumentID);
						if (response != null)
						{
							docTempResponse.FormResponse = response;
						}
					}

					return docTempResponse;
				}).ToList();

				// Await all tasks in parallel
				var result = await Task.WhenAll(tasks);

				list.AddRange(result);

				return new ServiceResult(list, "Successfully recieved form template list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetNewDigitalFormTemplatePublishListAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while getting form template list");
		}

		public async Task<ServiceResult> GetDigitalFormTemplatePublishGlobalListAsync(UserDTO userDTO)
		{
			try
			{
				_ = Task.Run(async () => await ScheduledUpdate());

				var list = new List<FormTemplateResponseDTO>();

				var docTemplateList = await _documentTemplateRepository.GetDigitalFormTemplatePublishGlobalListAsync();
				if (docTemplateList == null)
				{
					return new ServiceResult("No digital form template found");
				}

				// Prepare a list of tasks to fetch form responses in parallel
				var tasks = docTemplateList.Select(async docTemplate =>
				{
					var docTempResponse = new FormTemplateResponseDTO()
					{
						Template = docTemplate
					};

					// Fetch form response asynchronously for each template
					var response = await _digitalFormResponseRepository.GetDigitalFormResponseByIdAsync(docTemplate._id, userDTO.Suid);
					if (response != null)
					{
						docTempResponse.FormResponse = response;
					}

					return docTempResponse;
				}).ToList();

				// Await all tasks in parallel
				var result = await Task.WhenAll(tasks);

				list.AddRange(result);

				return new ServiceResult(list, "Successfully recieved form template list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetDigitalFormTemplatePublishGlobalListAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while getting form template list");
		}

		public async Task<ServiceResult> GetNewDigitalFormTemplatePublishGlobalListAsync(UserDTO userDTO)
		{
			try
			{
				_ = Task.Run(async () => await ScheduledUpdate());

				var list = new List<NewFormTemplateResponseDTO>();

				var docTemplateList = await _documentTemplateRepository.GetDigitalFormTemplatePublishGlobalListAsync();
				if (docTemplateList == null)
				{
					return new ServiceResult("No digital form template found");
				}

				// Prepare a list of tasks to fetch form responses in parallel
				var tasks = docTemplateList.Select(async docTemplate =>
				{
					var docTempResponse = new NewFormTemplateResponseDTO()
					{
						Template = docTemplate
					};

					// Fetch form response asynchronously for each template
					//var response = await _templateDocumentRepository.GetGlobalTemplateResponseDocument(docTemplate._id, userDTO.Suid);
					//if (response != null)
					//{
					//	docTempResponse.FormResponse = response;
					//}
					var res = await _newDigitalFormResponseRepository.GetNewDigitalFormResponseByIdAsync(docTemplate._id, userDTO.Suid);
					if (res != null)
					{
						docTempResponse.Response = res;

						var response = await _templateDocumentRepository.GetTemplateDocumentById(res.TemplateDocumentID);
						if (response != null)
						{
							docTempResponse.FormResponse = response;
						}
					}

					return docTempResponse;
				}).ToList();

				// Await all tasks in parallel
				var result = await Task.WhenAll(tasks);

				list.AddRange(result);

				return new ServiceResult(list, "Successfully recieved form template list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetNewDigitalFormTemplatePublishGlobalListAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while getting form template list");
		}

		public async Task<ServiceResult> GetGlobalTemplateListAsync()
		{
			try
			{
				_ = Task.Run(async () => await ScheduledUpdate());

				var docTemplateList = await _documentTemplateRepository.GetDigitalFormTemplatePublishGlobalListAsync();
				if (docTemplateList == null || docTemplateList.Count == 0)
				{
					return new ServiceResult("List is Empty");
				}

				return new ServiceResult(docTemplateList, "Successfully recieved global form list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetGlobalTemplateListAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while getting form template list");
		}

		public async Task<ServiceResult> UpdateDigitalFormTemplateAsync(UpdateDigitalFormTemplateDTO newDoc, UserDTO userDTO)
		{
			List<DigitalFormTemplateRole> existingRoles = new();
			DigitalFormTemplate savedTemplate = new();
			try
			{
				if (newDoc.Model == null)
				{
					return new ServiceResult("Model cannot be null");
				}

				TemplateModelDTO templateModel = JsonConvert.DeserializeObject<TemplateModelDTO>(newDoc.Model);

				List<UpdatedRoleDetail> roleDetails = JsonConvert.DeserializeObject<List<UpdatedRoleDetail>>(templateModel.rolesConfig);

				var isNameExists = await _documentTemplateRepository.IsDigitalFormTemplateNameExists(templateModel.docConfig.name, userDTO.OrganizationId, newDoc.TemplateId);
				if (isNameExists)
				{
					return new ServiceResult("Template name " + templateModel.docConfig.name + " already exists in the organization " + userDTO.OrganizationName);
				}

				if (templateModel != null)
				{
					DigitalFormTemplate existingTemplate = await _documentTemplateRepository.GetDigitalFormTemplateAsync(newDoc.TemplateId);
					if (existingTemplate == null)
					{
						return new ServiceResult("Form template not found");
					}
					if (newDoc.File != null)
					{
						var updatedDoc = await _documentHelper.UpdateDocumentToEDMS(existingTemplate.EdmsId, newDoc.File, newDoc.File.FileName, existingTemplate.Suid);
						if (updatedDoc == null)
						{
							return new ServiceResult("Form not updated to Edms");
						}
					}

					//existingTemplate.Model = newDoc.Model;
					existingTemplate.TemplateName = templateModel.docConfig.name;
					existingTemplate.DocumentName = templateModel.docConfig.documentName;
					existingTemplate.DaysToComplete = templateModel.docConfig.daysToComplete;
					existingTemplate.AdvancedSettings = templateModel.docConfig.advancedSettings;
					existingTemplate.SubmissionEmails = templateModel.docConfig.submissionEmails;
					existingTemplate.SubmissionUrl = templateModel.docConfig.submissionUrl;
					existingTemplate.DataStorage = templateModel.docConfig.dataStorage;
					existingTemplate.NumberOfSignatures = templateModel.docConfig.numberOfSignatures;
					existingTemplate.AllSigRequired = templateModel.docConfig.allSigRequired;
					existingTemplate.PublishGlobally = templateModel.docConfig.publishGlobally;
					existingTemplate.SequentialSigning = templateModel.docConfig.sequentialSigning;
					existingTemplate.PdfSchema = templateModel.docConfig.pdfSchema;
					existingTemplate.HtmlSchema = templateModel.docConfig.htmlSchema;
					existingTemplate.Type = templateModel.docConfig.docType;
					existingTemplate.UpdatedBy = userDTO.Name;
					existingTemplate.UpdatedAt = DateTime.UtcNow;
					existingTemplate.Status = TemplateConstants.Unpublish;

					var updatedTemplate = await _documentTemplateRepository.UpdateDigitalFormTemplate(existingTemplate);

					savedTemplate = existingTemplate;
				}

				if (roleDetails != null)
				{
					// Retrieve existing roles for the template
					existingRoles = await _roleRepository.GetDigitalFormTemplateRoleListByTemplateIdAsync(savedTemplate._id);

					List<DigitalFormTemplateRole> roleList = new List<DigitalFormTemplateRole>();

					foreach (var detail in roleDetails)
					{
						DigitalFormTemplateRole documentTemplateRole = new DigitalFormTemplateRole()
						{
							_id = detail.roleId,
							TemplateId = savedTemplate._id,
							Email = detail.email,
							Roles = detail.role,
							SigningOrder = detail.signingOrder,
							AnnotationsList = detail.annotationsList,
							EsealPlaceHolderCoordinates = detail.esealPlaceHolderCoordinates,
							PlaceHolderCoordinates = detail.placeHolderCoordinates,
							UpdatedAt = DateTime.UtcNow,
						};
						roleList.Add(documentTemplateRole);
					}

					// Identify roles to add, update, and delete
					var rolesToAdd = roleList.Where(r => existingRoles.All(er => er._id != r._id)).ToList();
					var rolesToUpdate = roleList.Where(r => existingRoles.Any(er => er._id == r._id)).ToList();
					var rolesToDelete = existingRoles.Where(r => roleList.All(er => er._id != r._id)).ToList();

					// Add new roles
					foreach (var role in rolesToAdd)
					{
						role.CreatedBy = userDTO.Name;
						role.UpdatedBy = userDTO.Name;
						role.UpdatedAt = DateTime.UtcNow;
						role.CreatedAt = DateTime.UtcNow;

                        await _roleRepository.SaveDigitalFormTemplateRoleAsync(role);
                    }

					//await _roleRepository.SaveDigitalFormTemplateRoleListAsync(rolesToAdd);

					// Update existing roles
					foreach (var role in rolesToUpdate)
					{
						var existingRole = existingRoles.FirstOrDefault(er => er._id == role._id);

						if (existingRole != null)
						{
							// Update properties of roles as needed
							existingRole.TemplateId = savedTemplate._id;
							existingRole.Email = role.Email;
							existingRole.Roles = role.Roles;
							existingRole.AnnotationsList = role.AnnotationsList;
							existingRole.PlaceHolderCoordinates = role.PlaceHolderCoordinates;
							existingRole.EsealPlaceHolderCoordinates = role.EsealPlaceHolderCoordinates;
							existingRole.UpdatedAt = DateTime.UtcNow;
							existingRole.UpdatedBy = userDTO.Name;

							await _roleRepository.UpdateDigitalFormTemplateRoleById(existingRole);
						}
					}

					// Delete roles that are no longer present                    
					await _roleRepository.DeleteDigitalFormTemplateRoleListAsync(rolesToDelete);
				}

				var allRoles = await _roleRepository.GetDigitalFormTemplateRoleListByTemplateIdAsync(savedTemplate._id);

				return new ServiceResult(new { savedTemplate, allRoles }, "Successfully updated form template");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("UpdateDigitalFormTemplateAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while updating form template");
		}
	}
}

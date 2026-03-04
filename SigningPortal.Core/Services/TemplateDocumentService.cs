using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.Domain.Services.Communication.TemplateDocuments;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

namespace SigningPortal.Core.Services
{
	public class TemplateDocumentService : ITemplateDocumentService
	{
		private readonly HttpClient _client;
		private readonly ITemplateDocumentRepository _documentRepository;
		private readonly ITemplateRecepientRepository _recepientRepository;
		private readonly IDigitalFormTemplateRepository _templateRepository;
		private readonly ILogger<TemplateDocumentService> _logger;
		private readonly IDocumentHelper _documentHelper;
		private readonly IEDMSService _edmsService;
		private readonly IBackgroundService _backgroundService;
		private readonly IConfiguration _configuration;
		public TemplateDocumentService(HttpClient httpClient,
				ILogger<TemplateDocumentService> logger,
				ITemplateRecepientRepository recepientRepository,
				ITemplateDocumentRepository documentRepository,
				IDigitalFormTemplateRepository templateRepository,
				IDocumentHelper documentHelper,
				IEDMSService edmsService,
				IConfiguration configuration,
				IBackgroundService backgroundService)
		{
			_documentRepository = documentRepository;
			_recepientRepository = recepientRepository;
			_templateRepository = templateRepository;
			_logger = logger;
			_edmsService = edmsService;
			_documentHelper = documentHelper;
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
			_backgroundService = backgroundService;
		}
		public async Task<ServiceResult> SaveTemplateDocumentListAsync(TemplateSendingDTO requestObj, UserDTO user, string requestGrpId = null)
		{
			_logger.LogInformation("SaveTemplateDocumentListAsync Service Start ----->");
			List<string> emailList = new();
			string errorMessage = string.Empty;
			TemplateDocument savedTemplateDoc = new();

			if (requestObj == null)
			{
				_logger.LogError("Request object cannot be null");
				return new ServiceResult("Request object cannot be null");
			}
			if (requestObj.RolesMapping == null || !requestObj.RolesMapping.Any())
			{
				_logger.LogError("RolesMapping cannot be null or empty");
				return new ServiceResult("RolesMapping cannot be null or empty");
			}
			if (requestObj.RoleAnnotations == null || !requestObj.RoleAnnotations.Any())
			{
				_logger.LogError("RoleAnnotations cannot be null or empty");
				return new ServiceResult("RoleAnnotations cannot be null or empty");
			}

			//_logger.LogInformation($"Save Template Document List Request :: {JsonConvert.SerializeObject(requestObj)}");

			try
			{
				var template = await _templateRepository.GetDigitalFormTemplateAsync(requestObj.FormId);
				if (template == null)
				{
					_logger.LogError($"Template not found for FormId: {requestObj.FormId}");
					return new ServiceResult("Template not found");
				}

				var RequestGroupId = requestGrpId ?? Guid.NewGuid().ToString();           //Very important to get the group request list

				_logger.LogInformation($"Request Group ID :: {RequestGroupId}");

				List<TemplateDocument> templateDocument = new();

				var saveTasks = requestObj.RolesMapping.Select(async roleDetail =>
				{
					// Create recipients list for the current roleDetail
					List<TemplateRecepient> recepients = new();

					TemplateDocument document = new()
					{
						FormId = requestObj.FormId,
						FormTemplateName = template.TemplateName,
						DocumentName = requestObj.DocumentName,
						OrganizationId = user.OrganizationId,
						OrganizationName = user.OrganizationName,
						AccountType = user.AccountType.ToLower(),
						Owner = new User
						{
							suid = user.Suid,
							email = user.Email,
						},
						TemplateRecepientCount = roleDetail.Keys.Count,
						DaysToComplete = template.DaysToComplete,
						EdmsId = template.EdmsId,
						RequestGroupId = RequestGroupId,
						RequestName = requestObj.RequestName,
						RequestType = requestObj.RequestType,
						TemplateType = requestObj.TemplateType,
						Status = DocumentStatusConstants.New,
						CommonFields = requestObj.PreFilledData,
						RoleSchema = requestObj.RoleSchema,
						HtmlSchema = !string.IsNullOrEmpty(requestObj.HtmlSchema) ? requestObj.HtmlSchema : template.HtmlSchema,
						PdfSchema = !string.IsNullOrEmpty(requestObj.PdfSchema) ? requestObj.PdfSchema : template.PdfSchema,
						MultiSign = roleDetail.Keys.Count > 1,
						DisableOrder = requestObj.DisableOrder,
						CreateTime = DateTime.UtcNow,
						CreatedAt = DateTime.UtcNow,
						UpdatedAt = DateTime.UtcNow,
					};

					// Calculate the ExpieryDate using DaysToComplete
					if (int.TryParse(template.DaysToComplete, out int daysToComplete))
					{
						document.ExpieryDate = DateTime.UtcNow.AddDays(daysToComplete);
					}
					else
					{
						// Handle invalid DaysToComplete string
						_logger.LogError("DaysToComplete must be a valid integer string.");
					}

					foreach (var role in roleDetail)
					{
						if (!requestObj.RoleAnnotations.TryGetValue(role.Key, out var roleAnnotation))
						{
							_logger.LogError($"No annotations found for RoleId: {role.Key}");
							errorMessage = $"No annotations found for RoleId: {role.Key}";
							throw new Exception(errorMessage);
						}

						var recepient = new TemplateRecepient
						{
							RoleId = role.Key,
							RoleName = role.Value.RoleName,
							Signer = role.Value.Signer,
							SignerName = role.Value.SignerName,
							OrganizationId = role.Value.OrganizationId,
							OrganizationName = role.Value.OrganizationName,
							AccountType = string.IsNullOrEmpty(role.Value?.OrganizationId) ? "self" : "organization",
							Status = DocumentStatusConstants.Pending,
							TakenAction = false,
							SignatureMandatory = true,
							DelegationId = role.Value.DelegationId,
							HasDelegation = role.Value.HasDelegation,
							AlternateSignatories = role.Value.AlternateSignatories,
							Order = requestObj.RoleSigningOrder[role.Key],
							AnnotationList = roleAnnotation.AnnotationList,
							SignatureAnnotations = roleAnnotation.AnnotationType.PlaceHolderCoordinates,
							EsealAnnotations = roleAnnotation.AnnotationType.EsealplaceHolderCoordinates,
							QrAnnotations = roleAnnotation.AnnotationType.QrPlaceHolderCoordinates,
							SigningReqTime = DateTime.UtcNow,
							CreatedAt = DateTime.UtcNow,
							UpdatedAt = DateTime.UtcNow,
						};

						recepients.Add(recepient);

						document.PendingSignList.Add(role.Value.Signer);
					}

					// Save the document and get its generated ID
					savedTemplateDoc = await _documentRepository.SaveTemplateDocument(document);
					if (savedTemplateDoc == null)
					{
						_logger.LogError("An error occurred while saving template document");
						errorMessage = "An error occurred while saving template document";
						throw new Exception(errorMessage);
					}

					// Assign document ID to each recipient
					recepients.ForEach(recepient => recepient.TemplateDocumentId = savedTemplateDoc._id);

					// Save the recipients list
					var savedRecepients = await _recepientRepository.SaveTemplateRecepientListAsync(recepients);
					if (savedRecepients == null)
					{
						_logger.LogError("An error occurred while saving template recipient");
						errorMessage = "An error occurred while saving template recipient";
						throw new Exception(errorMessage);
					}


					try
					{
						SendEmailObj emailObj = new SendEmailObj()
						{
							UserEmail = user.Email,
							UserName = user.Name,
							Id = savedTemplateDoc._id
						};

						_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendAnEmailToFormRecipient(emailObj, requestObj.AccessToken, savedTemplateDoc));
					}
					catch (Exception ex)
					{
						Monitor.SendException(ex);
						_logger.LogError(ex, ex.Message);
						_logger.LogError("SaveNewDocumentAsync Exception : send email {0}", ex.Message);
					}


				});

				// Execute all tasks in parallel
				await Task.WhenAll(saveTasks);

				var allDocs = await _documentRepository.GetTemplateDocumentListByRequestGroupId(RequestGroupId);
				if (allDocs == null)
				{
					_logger.LogError("An error occured while getting template document list");
					return new ServiceResult("An error occured while getting template document list");
				}

				//_logger.LogInformation($"Save Template Document List Response :: {JsonConvert.SerializeObject(allDocs)}");

				return new ServiceResult(allDocs, "Form sent successfully");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("SaveTemplateDocumentListAsync Exception : " + ex.Message);
			}
			finally
			{
				_logger.LogInformation("SaveTemplateDocumentListAsync Service End ----->");
			}

			return new ServiceResult(!string.IsNullOrEmpty(errorMessage) ?
									errorMessage : "An error occurred while saving template document list");
		}

		public async Task<ServiceResult> GetTemplateDocumentListByGroupIdAsync(string groupId)
		{
			try
			{
				var allDocs = await _documentRepository.GetTemplateDocumentListByRequestGroupId(groupId);
				if (allDocs == null)
				{
					_logger.LogError("\"Template document list is empty\"");
					return new ServiceResult("Template document list is empty");
				}

				return new ServiceResult(allDocs, "Template document list received successfully");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetTemplateDocumentListByGroupIdAsync Exception : " + ex.Message);
			}
			return new ServiceResult("An error occured while getting template document list");
		}

		public async Task<ServiceResult> GetTemplateDocumentByIdAsync(string id)
		{
			try
			{
				var templateDocument = await _documentRepository.GetTemplateDocumentById(id);
				if (templateDocument == null)
				{
					_logger.LogError("Template Document not found");
					return new ServiceResult("Template document not found");
				}

				return new ServiceResult(templateDocument, "Template document received successfully");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetTemplateDocumentByIdAsync Exception : " + ex.Message);
			}
			return new ServiceResult("An error occured while getting template document");
		}

		public async Task<ServiceResult> GetTemplateDocumentListByFormIdAsync(string formId)
		{
			try
			{
				var templateDocument = await _documentRepository.GetTemplateDocumentListByFormIdAsync(formId);
				if (templateDocument == null)
				{
					_logger.LogError("Template document not found");
					return new ServiceResult("Template document not found");
				}

				return new ServiceResult(templateDocument, "Template document received successfully");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetTemplateDocumentListByFormIdAsync Exception : " + ex.Message);
			}
			return new ServiceResult("An error occured while getting template document");
		}

		public async Task<ServiceResult> SentTemplateDocumentListExists(UserDTO user)
		{
			try
			{
				var docExists = await _documentRepository.TemplateDocumentsBySuidAndOrganizationIdExists(user.Suid, user.OrganizationId);

				string msg = docExists ? "Template document list exists" : "Template document list is empty";

				return new ServiceResult(docExists, msg);
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError($"SentTemplateDocumentListExists Exception: {ex.Message}");
				return new ServiceResult("An error occurred while checking the template document list");
			}
		}

		public async Task<ServiceResult> GetSentTemplateDocumentList(UserDTO userDTO)
		{
			try
			{
				var allDocs = await _documentRepository
					.GetAllTemplateDocumentsBySuidAndOrganizationId(userDTO.Suid, userDTO.OrganizationId);

				if (allDocs == null || !allDocs.Any())
				{
					_logger.LogError("Template document list is empty");
					return new ServiceResult(
						new List<SentTemplateDocumentListResponse>(),
						"Template document list is empty"
					);
				}

				var responseList = allDocs
					.GroupBy(doc => doc.RequestGroupId)
					.Select(group =>
					{
						var miniList = group.ToList();

						var tempDoc = miniList.First();
						var temRecep = miniList
							.SelectMany(x => x.TemplateRecepients)
							.ToList();

						// ⚠ Potential side effect (see note below)
						tempDoc.TemplateRecepients = new List<TemplateRecepient>();

						return new SentTemplateDocumentListResponse
						{
							MyCommonDoc = tempDoc,
							SentDocCount = miniList.Count,
							Recepients = temRecep,
							CompleteStatusCount =
								miniList.Count(x => x.Status == DocumentStatusConstants.Completed)
						};
					})
					.ToList();

				return new ServiceResult(
					responseList,
					"Template document list retrieved successfully."
				);
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				return new ServiceResult(
					"An error occurred while getting the template document list"
				);
			}
		}

		public async Task<ServiceResult> GetMyTemplateDocumentList(UserDTO userDTO)
		{
			try
			{
				var allDocs = await _documentRepository.GetAllTemplateDocumentsBySuidAndOrganizationId(userDTO.Suid, userDTO.OrganizationId);
				if (allDocs == null)
				{
					_logger.LogError("Template document list is empty");
					return new ServiceResult(new List<TemplateDocument>(), "Template document list is empty");
				}

				// Group by RequestGroupId and create the list
				var myList = allDocs
					.Where(x => x.TemplateRecepientCount == 1 &&
								x.TemplateRecepients[0].Signer.suid == userDTO.Suid &&
								x.TemplateRecepients[0].OrganizationId == userDTO.OrganizationId
							)
					.ToList();

				return new ServiceResult(myList, "Template document list received successfully");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError($"GetSentTemplateDocumentListBySuidAndOrganizationIdAsync Exception: {ex.Message}");
				return new ServiceResult("An error occurred while getting the template document list");
			}
		}

		public async Task<ServiceResult> GetReceivedTemplateDocumentsList(UserDTO userDTO)
		{
			try
			{
				_logger.LogInformation("GetReceivedTemplateDocumentsList start");

				// Fetch recipients first
				var recipientList = await _recepientRepository.GetTemplateRecepientBySuidAndOrganizationIdAsync(userDTO.Suid, userDTO.OrganizationId);

				if (recipientList == null || !recipientList.Any())
				{
					_logger.LogInformation("No recipients found for the given Suid and OrganizationId");
					return new ServiceResult(new List<TemplateDocument>(), "No template documents found.");
				}

				// Fetch all document details for the recipient template IDs in a single query
				List<string> templateDocumentIds = recipientList.Select(r => r.TemplateDocumentId).Distinct().ToList();
				var documentDataList = await _documentRepository.GetTemplateDocumentListByTempIdList(templateDocumentIds);

				if (documentDataList == null || !documentDataList.Any())
				{
					_logger.LogInformation("No documents found for the recipient template document IDs");
					return new ServiceResult(new List<TemplateDocument>(), "No template documents found.");
				}

				//var templateDocList = documentDataList
				//	.Where(doc => (doc.TemplateRecepientCount != 1 || doc.Owner.suid != userDTO.Suid) &&
				//					(doc.Status != DocumentStatusConstants.New || doc.RequestType != TemplateConstants.Publish) &&
				//					(doc.RequestType == TemplateConstants.Publish && doc.TemplateRecepients.Any(x => x.Order != 1 && x.Signer.suid == userDTO.Suid)))
				//	.ToList();

				var templateDocList = new List<TemplateDocument>();

				foreach (var doc in documentDataList)
				{
					if (doc.TemplateRecepientCount == 1 && doc.Owner.suid == userDTO.Suid)
					{
						continue;
					}
					if (doc.Status == DocumentStatusConstants.New && doc.RequestType == TemplateConstants.Publish)
					{
						continue;
					}
					if (doc.RequestType == TemplateConstants.Publish &&
						doc.TemplateRecepients.Any(x => x.Signer.suid == userDTO.Suid && x.Order == 1) &&
						!doc.TemplateRecepients.Any(x => x.Signer.suid == userDTO.Suid && x.Order > 1))
					{
						continue;
					}
					templateDocList.Add(doc);
				}

				_logger.LogInformation("GetReceivedTemplateDocumentsList end");
				return new ServiceResult(templateDocList, "Successfully received template document list.");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError($"GetReceivedTemplateDocumentsList Exception: {ex.Message}");
				return new ServiceResult("An error occurred while receiving the template document list");
			}
		}

		public async Task<ServiceResult> GetReferredDocumentsList(UserDTO userDTO)
		{
			try
			{
				List<string> receivedListArray = new List<string>();

				var recepientList = await _recepientRepository.GetTemplateRecepientByAlternateEmailSuidAsync(userDTO.Suid);
				var documentTasks = recepientList.Select(async recepient =>
				{
					var documentData = await _documentRepository.GetTemplateDocumentDetailsByTemplateRecepientsTempIdAsync(recepient.TemplateDocumentId);
					return new { recepient, documentData };
				});

				var documentResults = await Task.WhenAll(documentTasks);

				foreach (var result in documentResults)
				{
					var recepient = result.recepient;
					var documentData = result.documentData;

					if (documentData != null)
					{
						receivedListArray.Add(recepient.TemplateDocumentId);

						if (userDTO.AccountType.ToLower() != recepient.AccountType)
						{
							receivedListArray.Remove(recepient.TemplateDocumentId);
							continue;
						}

						if (userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && userDTO.OrganizationId != recepient.OrganizationId)
						{
							receivedListArray.Remove(recepient.TemplateDocumentId);
							continue;
						}

						if (!string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.OrganizationId != recepient.OrganizationId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
						{
							receivedListArray.Remove(recepient.TemplateDocumentId);
							continue;
						}

						if (!string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.OrganizationId != recepient.OrganizationId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
						{
							receivedListArray.Remove(recepient.TemplateDocumentId);
							continue;
						}

						if (!string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && userDTO.OrganizationId != recepient.OrganizationId)
						{
							receivedListArray.Remove(recepient.TemplateDocumentId);
							continue;
						}

						if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.OrganizationId.Trim()))
						{
							receivedListArray.Remove(recepient.TemplateDocumentId);
							continue;
						}

						if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.OrganizationId.Trim()))
						{
							receivedListArray.Remove(recepient.TemplateDocumentId);
							continue;
						}
					}
				}

				var documents = await _documentRepository.GetTemplateDocumentListByTempIdList(receivedListArray);
				if (documents == null)
				{
					_logger.LogError("Failed to receive referred template document list.");
					return new ServiceResult("Failed to receive referred template document list.");
				}

				return new ServiceResult(documents, "Successfully received referred template document list.");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetReferredDocumentsList Exception :  {0}", ex.Message);
			}
			return new ServiceResult("An error occurred while receiving the template document list");
		}

		public async Task<ServiceResult> GetOrganiztionUsersListAsync(string organizationId)
		{
			try
			{
				HttpResponseMessage response = await _client.GetAsync($"api/get/signtorylist/" + organizationId);
				if (response.StatusCode == HttpStatusCode.OK)
				{
					var content = await response.Content.ReadAsStringAsync();
					var apiResponse = JsonConvert.DeserializeObject<APIResponse>(content);

					if (apiResponse == null)
					{
						_logger.LogError("Failed to deserialize APIResponse.");
						return new ServiceResult(null, "Invalid API response.");
					}

					if (!apiResponse.Success)
					{
						var message = apiResponse.Message ?? "API returned failure.";
						_logger.LogError(message);
						return new ServiceResult(null, message);
					}

					if (apiResponse.Result == null)
					{
						_logger.LogError("API returned null result.");
						return new ServiceResult(null, "No data received.");
					}

					var resultJson = apiResponse.Result.ToString();

					if (string.IsNullOrWhiteSpace(resultJson))
					{
						return new ServiceResult(null, "Empty result received.");
					}

					var list = JsonConvert.DeserializeObject<IList<SignatureTemplatesDTO>>(resultJson)
							   ?? new List<SignatureTemplatesDTO>();

					return new ServiceResult(list, "Successfully received organization users list");
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
				_logger.LogError($"GetOrganiztionUsersListAsync Exception: {ex.Message}");
			}
			return new ServiceResult("An error occurred while receiving organization user list");
		}

	}
}

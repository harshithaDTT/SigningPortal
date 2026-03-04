using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.Domain.Services.Communication.GroupSigning;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using Monitor = SigningPortal.Core.Utilities.Monitor;

namespace SigningPortal.Core.Services
{
	public class GroupSigningService : IGroupSigningService
	{
		private readonly ILogger<GroupSigningService> _logger;
		private readonly IGroupSigningRepository _groupSigningRepository;
		private readonly IConfiguration _configuration;
		private readonly IDocumentRepository _documentRepository;
		private readonly IDocumentHelper _documentHelper;
		private readonly ICacheClient _redisClient;
		private readonly IRecepientsRepository _recepientsRepository;
		private readonly IDelegationRepository _delegationRepository;
		private readonly INotificationService _notificationService;
		private readonly IBackgroundService _backgroundService;
		private readonly ITemplateService _templateService;
		private readonly IConstantError _constantError;
		private readonly IEDMSService _edmsService;
		private readonly IPaymentService _paymentService;

        private readonly bool isEnncrypted = false;
        public GroupSigningService(ILogger<GroupSigningService> logger,
			IGroupSigningRepository groupSigningRepository,
			IConfiguration configuration,
			IDocumentRepository documentRepository,
			IDocumentHelper documentHelper,
			ICacheClient redisClient,
			IEDMSService edmsService,
			ITemplateService templateService,
			IRecepientsRepository recepientsRepository,
			IDelegationRepository delegationRepository,
			INotificationService notificationService,
			IBackgroundService backgroundService,
			IPaymentService paymentService,
			IConstantError constantError)
		{
			_logger = logger;
			_groupSigningRepository = groupSigningRepository;
			_configuration = configuration;
			_documentRepository = documentRepository;
			_documentHelper = documentHelper;
			_redisClient = redisClient;
			_edmsService = edmsService;
			_templateService = templateService;
			_recepientsRepository = recepientsRepository;
			_delegationRepository = delegationRepository;
			_notificationService = notificationService;
			_backgroundService = backgroundService;
			_paymentService = paymentService;
			_constantError = constantError;
            isEnncrypted = _configuration.GetValue<bool>("EncryptionEnabled");
        }

		public async Task<ServiceResult> GetGroupSigningListAsync(UserDTO userDTO)
		{
			try
			{
				var list = await _groupSigningRepository.GetGroupSigningListBySuidAndOrgIdAsync(userDTO.Suid, userDTO.OrganizationId);
				return list == null || !list.Any()
					? new ServiceResult(new List<GroupSigning>(), "List is empty")
					: new ServiceResult(list, "Group signing documents list received successfully");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, "Exception in GetGroupSigningListAsync");
				return new ServiceResult("An error occurred while getting group signing documents list");
			}
		}

		public async Task<ServiceResult> GetGroupSigningRequestByIdAsync(string requestId)
		{
			try
			{
				var request = await _groupSigningRepository.GetGroupSigningRequestByIdAsync(requestId);
				return request == null
					? new ServiceResult(new GroupSigning(), "Request not found")
					: new ServiceResult(request, "Group signing request received successfully");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, "Exception in GetGroupSigningRequestByIdAsync");
				return new ServiceResult("An error occurred while getting group signing request");
			}
		}

		public async Task<ServiceResult> SaveAndSignGroupRequestAsync(List<string> documentIds, string transaction, UserDTO user, string acToken, GroupSigningAuthDTO auth = null)
		{
			if (documentIds == null || !documentIds.Any())
				return new ServiceResult("Document list cannot be empty");

			if (user == null)
				return new ServiceResult(_constantError.GetMessage("102526"));

			var blockStatus = new ConcurrentDictionary<string, bool>();
			bool isEsealPresent = false, isSignaturePresent = false, isQrPresent = false;
			int signatureCount = 0, esealCount = 0, qrCount = 0;


			try
			{
				var documents = await _documentRepository.GetDocumentByTempIdList(documentIds);
				if (documents == null || !documents.Any())
					return new ServiceResult("Documents not found");

				var groupSigning = new GroupSigning
				{
					SignerSuid = user.Suid,
					SignerOrganizationId = user.OrganizationId,
					Transaction = transaction,
					Status = DocumentStatusConstants.InProgress,
					IsMobile = auth != null,
					CreatedAt = DateTime.UtcNow,
					UpdatedAt = DateTime.UtcNow,
					TotalFileCount = documents.Count,
					SuccessFileCount = 0,
					FailedFileCount = 0,
					SigningGroups = new List<SigningGroup>()
				};

				foreach (var document in documents)
				{
					if (document.IsDocumentBlocked)
						return new ServiceResult($"Document {document.DocumentName} is blocked. Please retry later.");

					var recipient = document.Recepients
						.OrderBy(r => r.Order)
						.FirstOrDefault(r =>
							(r.Status == RecepientStatus.NeedToSign ||
							 r.Status == RecepientStatus.Failed ||
							 r.Status == RecepientStatus.PinFailed) &&
							(r.Suid == user.Suid || r.AlternateSignatories.Any(a => a.suid == user.Suid)));

					if (recipient == null)
					{
						_logger.LogError("Recipient not found for document: {0}", document._id);
						continue;
					}

					groupSigning.SigningGroups.Add(new SigningGroup
					{
						DocumentId = document._id,
						DocumentStatus = document.Status,
						DocumentName = document.DocumentName,
						RecepientId = recipient._id,
						RecepientStatus = recipient.Status,
						CorelationId = Guid.NewGuid().ToString(),
					});

					if (!string.IsNullOrWhiteSpace(document.Annotations))
					{
						try
						{
							var signatureMap = JsonConvert.DeserializeObject<Dictionary<string, Coordinates>>(document.Annotations);
							if (signatureMap.ContainsKey(recipient.Suid))
							{
								isSignaturePresent = true;
								signatureCount++;
							}
						}
						catch (Exception ex)
						{
							_logger.LogError(ex, $"Failed to deserialize SignatureAnnotations for Document: {document._id}");
						}
					}

					if (!string.IsNullOrEmpty(user.OrganizationId) && !string.IsNullOrEmpty(document.EsealAnnotations))
					{
						try
						{
							var esealMap = JsonConvert.DeserializeObject<Dictionary<string, ESealCoordinates>>(document.EsealAnnotations);
							if (esealMap.ContainsKey(recipient.Suid))
							{
								isEsealPresent = true;
								esealCount++;
							}
						}
						catch (Exception ex)
						{
							_logger.LogError(ex, $"Failed to deserialize EsealAnnotations for Document: {document._id}");
						}
					}

					if (!string.IsNullOrEmpty(user.OrganizationId) && !string.IsNullOrEmpty(document.QrCodeAnnotations))
					{
						try
						{
							var qrMap = JsonConvert.DeserializeObject<Dictionary<string, Coordinates>>(document.QrCodeAnnotations);
							if (qrMap.ContainsKey(recipient.Suid))
							{
								isQrPresent = true;
								qrCount++;
							}
						}
						catch (Exception ex)
						{
							_logger.LogError(ex, $"Failed to deserialize QrAnnotations for Document: {document._id}");
						}
					}
				}

				if (!groupSigning.SigningGroups.Any())
					return new ServiceResult("No valid documents found for signing");

				var savedGroupSigning = await _groupSigningRepository.SaveRequestAsync(groupSigning);
				if (savedGroupSigning == null || string.IsNullOrEmpty(savedGroupSigning._id))
					return new ServiceResult("Failed to save signing request");

				if (qrCount > signatureCount)
					signatureCount = qrCount;

				if (isQrPresent && !isEsealPresent)
					isSignaturePresent = true;


				var creditResult = await _paymentService.IsGroupCreditAvailable
					(user, isEsealPresent, isEsealPresent ? isSignaturePresent : true, signatureCount, esealCount);
				if (!creditResult.result.Success || !(bool)creditResult.result.Result)
					return new ServiceResult(creditResult.result.Message);

				bool isPrepaid = creditResult.isPrepaid;

				// Block documents
				var blockUpdate = await _documentRepository.UpdateDocumentListBlockedStatusAsync(documentIds, true);
				if (!blockUpdate)
					_logger.LogError("Failed to update document block status");

				foreach (var id in documentIds)
					blockStatus[id] = true;

				var authRequest = new GroupSigningAuthRequestDTO
				{
					subscriberUid = user.Suid,
					sign = isEsealPresent ? isSignaturePresent : true,
					auth = isEsealPresent,
					isMobile = auth != null,
					signPin = auth?.signPin ?? string.Empty,
					authPin = auth?.authPin ?? string.Empty,
					faceData = auth?.faceData ?? string.Empty
				};

				var authResponse = await SigningAuthenticationAsync(authRequest);
				if (!authResponse.Success)
				{
					foreach (var id in documentIds)
						blockStatus[id] = false;

					return new ServiceResult(authResponse.Message);
				}

				// Store Redis Data
				foreach (var signingGroup in savedGroupSigning.SigningGroups)
				{
					var status = new GroupSigningDocumentStatus
					{
						DocumentId = signingGroup.DocumentId,
						DocumentName = signingGroup.DocumentName,
						Status = signingGroup.RecepientStatus == RecepientStatus.Signed
							? RecepientStatus.Signed
							: RecepientStatus.SigningInProgress,
					};

					var (addCode, addErr) = await _redisClient.AddHashRecordAsync(
						savedGroupSigning._id,
						signingGroup.DocumentId,
						status,
						TimeSpan.FromDays(1)
					);

					if (addCode != 0 && !string.IsNullOrEmpty(addErr))
						_logger.LogError("Redis status add failed: " + addErr);
				}


				// Fire-and-forget signing requests
				_logger.LogInformation("Group Document Signing Start ----->");

				//var semaphore = new SemaphoreSlim(5); // Set max concurrency (e.g., 5)

				foreach (var document in documents)
				{
					_ = Task.Run(async () =>
					{
						//await semaphore.WaitAsync();
						try
						{
							await SendSigningBatchRequestAsync(document, savedGroupSigning, user, acToken, isPrepaid);
						}
						catch (Exception ex)
						{
							blockStatus[document._id] = false;
							_logger.LogError(ex, $"SendSigningBatchRequestAsync failed for documentId: {document._id}");
						}
						//finally { semaphore.Release(); }
					});
				}

				_logger.LogInformation("Group Document Signing End ----->");

				return new ServiceResult(savedGroupSigning._id, "Document Signing Initiated");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, "Exception in SaveAndSignGroupRequestAsync");
				return new ServiceResult("An error occurred while signing documents");
			}
			finally
			{
				try
				{
					if (blockStatus.Any(kvp => !kvp.Value))
					{
						var toUnblock = blockStatus.Where(kvp => !kvp.Value).Select(kvp => kvp.Key).ToList();
						await _documentRepository.UpdateDocumentListBlockedStatusAsync(toUnblock, false);
					}
				}
				catch (Exception ex)
				{
					_logger.LogError(ex, "Exception while restoring blocked documents");
				}
			}
		}

		public async Task<ServiceResult> RetryGroupSigningRequestAsync(GroupSigning groupSigning, List<string> documentIds, UserDTO user, string acToken, GroupSigningAuthDTO auth = null)
		{
			if (groupSigning == null)
				return new ServiceResult("Group Signing object cannot be null");

			if (user == null)
				return new ServiceResult(_constantError.GetMessage("102526"));

			var blockStatus = new ConcurrentDictionary<string, bool>();
			bool isEsealPresent = false, isSignaturePresent = false, isQrPresent = false;
			int signatureCount = 0, esealCount = 0, qrCount = 0;

			try
			{
				var documents = await _documentRepository.GetDocumentByTempIdList(documentIds);
				if (documents == null || !documents.Any())
					return new ServiceResult("Documents not found");

				foreach (var document in documents)
				{
					var recipient = document.Recepients
						.OrderBy(r => r.Order)
						.FirstOrDefault(r =>
							(r.Status == RecepientStatus.NeedToSign ||
							 r.Status == RecepientStatus.Failed ||
							 r.Status == RecepientStatus.PinFailed) &&
							(r.Suid == user.Suid || r.AlternateSignatories.Any(a => a.suid == user.Suid)));

					if (recipient == null)
						continue;

					if (!string.IsNullOrWhiteSpace(document.Annotations))
					{
						try
						{
							var signatureMap = JsonConvert.DeserializeObject<Dictionary<string, Coordinates>>(document.Annotations);
							if (signatureMap.ContainsKey(recipient.Suid))
							{
								isSignaturePresent = true;
								signatureCount++;
							}
						}
						catch (Exception ex)
						{
							_logger.LogError(ex, $"Failed to deserialize SignatureAnnotations for Document: {document._id}");
						}
					}

					if (!string.IsNullOrEmpty(user.OrganizationId) && !string.IsNullOrEmpty(document.EsealAnnotations))
					{
						try
						{
							var esealMap = JsonConvert.DeserializeObject<Dictionary<string, ESealCoordinates>>(document.EsealAnnotations);
							if (esealMap.ContainsKey(recipient.Suid))
							{
								isEsealPresent = true;
								esealCount++;
							}
						}
						catch (Exception ex)
						{
							_logger.LogError(ex, $"Failed to deserialize EsealAnnotations for Document: {document._id}");
						}
					}

					if (!string.IsNullOrEmpty(user.OrganizationId) && !string.IsNullOrEmpty(document.QrCodeAnnotations))
					{
						try
						{
							var qrMap = JsonConvert.DeserializeObject<Dictionary<string, Coordinates>>(document.QrCodeAnnotations);
							if (qrMap.ContainsKey(recipient.Suid))
							{
								isQrPresent = true;
								qrCount++;
							}
						}
						catch (Exception ex)
						{
							_logger.LogError(ex, $"Failed to deserialize QrAnnotations for Document: {document._id}");
						}
					}
				}

				if (qrCount > signatureCount)
					signatureCount = qrCount;

				if (isQrPresent && !isEsealPresent)
					isSignaturePresent = true;

				var creditResult = await _paymentService.IsGroupCreditAvailable
					(user, isEsealPresent, isEsealPresent ? isSignaturePresent : true, signatureCount, esealCount);
				if (!creditResult.result.Success || !(bool)creditResult.result.Result)
					return new ServiceResult(creditResult.result.Message);

				bool isPrepaid = creditResult.isPrepaid;

				// Block documents
				var updateBlock = await _documentRepository.UpdateDocumentListBlockedStatusAsync(documentIds, true);
				if (!updateBlock)
					_logger.LogError("Failed to block documents");

				foreach (var id in documentIds)
					blockStatus[id] = true;

				var authRequest = new GroupSigningAuthRequestDTO
				{
					subscriberUid = user.Suid,
					sign = isEsealPresent ? isSignaturePresent : true,
					auth = isEsealPresent,
					isMobile = auth != null,
					signPin = auth?.signPin ?? string.Empty,
					authPin = auth?.authPin ?? string.Empty,
					faceData = auth?.faceData ?? string.Empty
				};

				var authResponse = await SigningAuthenticationAsync(authRequest);
				if (!authResponse.Success)
				{
					foreach (var id in documentIds)
						blockStatus[id] = false;

					return new ServiceResult(authResponse.Message);
				}

				// Store Redis Data
				foreach (var signingGroup in groupSigning.SigningGroups)
				{
					var status = new GroupSigningDocumentStatus
					{
						DocumentId = signingGroup.DocumentId,
						DocumentName = signingGroup.DocumentName,
						Status = signingGroup.RecepientStatus == RecepientStatus.Signed
							? RecepientStatus.Signed
							: RecepientStatus.SigningInProgress,
					};

					var (addCode, addErr) = await _redisClient.AddHashRecordAsync(
						groupSigning._id,
						signingGroup.DocumentId,
						status,
						TimeSpan.FromDays(1)
					);

					if (addCode != 0 && !string.IsNullOrEmpty(addErr))
						_logger.LogError("Redis status add failed: " + addErr);
				}


				// Fire-and-forget signing requests
				_logger.LogInformation("Group Document Signing Start ----->");

				foreach (var document in documents)
				{
					_ = Task.Run(async () =>
					{
						try
						{
							await SendSigningBatchRequestAsync(document, groupSigning, user, acToken, isPrepaid);
						}
						catch (Exception ex)
						{
							blockStatus[document._id] = false;
							_logger.LogError(ex, $"SendSigningBatchRequestAsync failed for documentId: {document._id}");
						}
					});
				}

				_logger.LogInformation("Group Document Signing End ----->");

				return new ServiceResult(groupSigning._id, "Document Signing Re-Initiated");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, "Exception in RetryGroupSigningRequestAsync");
				return new ServiceResult("An error occurred while retrying group signing");
			}
			finally
			{
				try
				{
					if (blockStatus.Any(kvp => !kvp.Value))
					{
						var toUnblock = blockStatus.Where(kvp => !kvp.Value).Select(kvp => kvp.Key).ToList();
						await _documentRepository.UpdateDocumentListBlockedStatusAsync(toUnblock, false);
					}
				}
				catch (Exception ex)
				{
					_logger.LogError(ex, "Exception while restoring blocked documents");
				}
			}
		}

		private async Task<ServiceResult> SigningAuthenticationAsync(GroupSigningAuthRequestDTO authRequest)
		{
			try
			{
				var apiUrl = _configuration.GetValue<string>("Config:GroupSignAuthUrl");

				string jsonBody = JsonConvert.SerializeObject(authRequest);
				_logger.LogInformation("Initiating Signing Authentication call.");
				_logger.LogInformation("Target URL: {0}", apiUrl);
				_logger.LogInformation("Request Body: {0}", jsonBody);

				using var client = new HttpClient();
				client.Timeout = TimeSpan.FromMinutes(10);
				var response = await client.PostAsync(apiUrl, new StringContent(jsonBody, Encoding.UTF8, "application/json"));
				string responseContent = await response.Content.ReadAsStringAsync();

				if (!response.IsSuccessStatusCode)
				{
					_logger.LogError("Signing Authentication failed. Status: {0}, Response: {1}", response.StatusCode, responseContent);
					return new ServiceResult($"Authentication call failed with status code: {response.StatusCode}");
				}

				var apiResponse = JsonConvert.DeserializeObject<APIResponse>(responseContent);

				if (apiResponse?.Success == true)
				{
					_logger.LogInformation("Signing authenticated successfully for Suid: {0}", authRequest.subscriberUid);
					return new ServiceResult(apiResponse.Result, "Signing authentication successful");
				}
				else
				{
					string apiMessage = apiResponse?.Message ?? "Unknown error";
					_logger.LogError("Signing authentication failed for Suid: {0}. Message: {1}", authRequest.subscriberUid, apiMessage);
					return new ServiceResult(apiMessage);
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, "Exception during Signing Authentication for Suid: {0}", authRequest.subscriberUid);
				return new ServiceResult("An error occurred during signing authentication.");
			}
		}

		private async Task SendSigningBatchRequestAsync(Document document, GroupSigning groupSigning, UserDTO user, string acToken, bool isPrepaid)
		{
			bool isEseal = false;

			if (user == null)
			{
				_logger.LogError("User details cannot be null");
				return;
			}

			var recipient = document.Recepients
				.OrderBy(r => r.Order)
				.FirstOrDefault(r =>
					(r.Status == RecepientStatus.NeedToSign ||
					 r.Status == RecepientStatus.Failed ||
					 r.Status == RecepientStatus.PinFailed) &&
					(r.Suid == user.Suid || r.AlternateSignatories.Any(a => a.suid == user.Suid)));

			if (recipient == null)
			{
				await _documentRepository.UpdateDocumentBlockedStatusAsync(document._id, false);
				_logger.LogError("Recipient not found for documentId: {0}", document._id);
				return;
			}

			var signingGroup = groupSigning.SigningGroups
				.FirstOrDefault(g => g.DocumentId == document._id && g.RecepientId == recipient._id);

			if (signingGroup == null)
			{
				await _documentRepository.UpdateDocumentBlockedStatusAsync(document._id, false);
				_logger.LogError("Signing group not found for documentId: {0}", document._id);
				return;
			}

			var callBackDTO = new RecieveGroupSigningDocumentDTO
			{
				correlationID = signingGroup.CorelationId,
				requestId = groupSigning._id,
				DocType = "",
				success = false,
				errorCode = 0,
				errorMessage = ""
			};

			// Delegation check
			if (recipient.HasDelegation)
			{
				var delegation = await _delegationRepository.GetDelegateById(recipient.DelegationId);
				bool isInvalid = delegation == null ||
								 delegation.EndDateTime.ToUniversalTime() < DateTime.UtcNow ||
								 delegation.DelegationStatus == DelegateConstants.Cancelled ||
								 delegation.DelegationStatus == DelegateConstants.Expired;

				if (isInvalid)
				{
					if (delegation != null && delegation.DelegationStatus == DelegateConstants.Active)
					{
						delegation.DelegationStatus = DelegateConstants.Expired;
						await _delegationRepository.UpdateDelegateById(delegation);

						try
						{
							_backgroundService.RunBackgroundTask<IDocumentHelper>(
								s => s.SendEmailToDelegatee(delegation._id, "Signature Delegation Expired", true));
						}
						catch (Exception ex)
						{
							Monitor.SendException(ex);
							_logger.LogError(ex, "SendEmailToDelegatee Exception");
						}
					}

					callBackDTO.errorMessage = "Delegation is invalid or expired";
					callBackDTO.errorCode = 1;
					await RecieveDocumentAsync(callBackDTO, user, isPrepaid);
					return;
				}
			}


			// Fetch file from EDMS
			var edmsResult = await _edmsService.GetDocumentAsync(document.EdmsId);
			if (!edmsResult.Success)
			{	
				_logger.LogError($"PDF Document not found for EdmsId :: {document.EdmsId}");
				callBackDTO.errorMessage = "PDF Document not found";
				callBackDTO.errorCode = 1;
				await RecieveDocumentAsync(callBackDTO, user, isPrepaid);
				return;
			}

			byte[] pdfBytes = (byte[])edmsResult.Result;

			// Parse annotations inline
			Coordinates signatureCoord = null;
			ESealCoordinates esealCoord = null;
			Coordinates qrCoord = null;

			try
			{
				if (!string.IsNullOrEmpty(document.Annotations))
				{
					var map = JsonConvert.DeserializeObject<Dictionary<string, Coordinates>>(document.Annotations);
					map.TryGetValue(recipient.Suid, out signatureCoord);
				}

				if (!string.IsNullOrEmpty(document.EsealAnnotations))
				{
					var esealMap = JsonConvert.DeserializeObject<Dictionary<string, ESealCoordinates>>(document.EsealAnnotations);
					esealMap.TryGetValue(recipient.Suid, out esealCoord);
				}

				if (!string.IsNullOrEmpty(document.QrCodeAnnotations))
				{
					var qrMap = JsonConvert.DeserializeObject<Dictionary<string, Coordinates>>(document.QrCodeAnnotations);
					qrMap.TryGetValue(recipient.Suid, out qrCoord);
				}

			}
			catch (Exception ex)
			{
				_logger.LogError(ex, $"Failed to parse annotations for documentId: {document._id}");
				callBackDTO.errorMessage = "Something went wrong while getting annotations. Please try again after some time";
				callBackDTO.errorCode = 1;
				await RecieveDocumentAsync(callBackDTO, user, isPrepaid);
			}

			isEseal = esealCoord != null;

			var requestBody = new GroupSigningRequestBody
			{
				DocumentType = "pades",
				Id = user.Suid,
				OrganizationId = user.OrganizationId,
				signatureTemplateId = recipient.SignTemplate,
				esealSignatureTemplateId = recipient.EsealTemplate,
				PlaceHolderCoordinates = signatureCoord == null ? null : new placeHolderCoordinates
				{
					signatureXaxis = signatureCoord.posX.ToString(),
					signatureYaxis = signatureCoord.posY.ToString(),
					pageNumber = signatureCoord.PageNumber.ToString(),
					imgHeight = signatureCoord.height.ToString(),
					imgWidth = signatureCoord.width.ToString()
				},
				EsealPlaceHolderCoordinates = esealCoord == null ? null : new esealplaceHolderCoordinates
				{
					signatureXaxis = esealCoord.posX.ToString(),
					signatureYaxis = esealCoord.posY.ToString(),
					pageNumber = esealCoord.PageNumber.ToString(),
					imgHeight = esealCoord.height.ToString(),
					imgWidth = esealCoord.width.ToString()
				},
				QrcodePlaceHolderCoordinates = qrCoord == null ? null : new qrPlaceHolderCoordinates
				{
					signatureXaxis = qrCoord.posX.ToString(),
					signatureYaxis = qrCoord.posY.ToString(),
					pageNumber = qrCoord.PageNumber.ToString(),
					imgHeight = qrCoord.height.ToString(),
					imgWidth = qrCoord.width.ToString()
				}
			};

			if (qrCoord != null)
			{
				var crit = JsonConvert.DeserializeObject<CriticalData>(document.QrCriticalData ?? string.Empty);

				requestBody.PublicData = new List<string>()
				{
					user.Name,
					user.OrganizationName ?? string.Empty
				};
				requestBody.PrivateData = new List<string>()
				{
					document._id,
					crit?.entityName ?? string.Empty,
					crit?.docSerialNo ?? string.Empty
				};

				var qrCredentialId = _configuration.GetValue<string>("QRCredentialId")
					   ?? throw new InvalidOperationException("QRCredentialId configuration is missing.");

				requestBody.CredentialId = isEnncrypted
					? PKIMethods.Instance.PKIDecryptSecureWireData(qrCredentialId)
					: qrCredentialId;
			}

			string jsonModel = JsonConvert.SerializeObject(requestBody);

			_logger.LogInformation($"Signing Request Body :: {jsonModel}");

			// Update recipient status
			recipient.UpdatedAt = DateTime.UtcNow;
			recipient.AccessToken = acToken;
			recipient.Status = RecepientStatus.SigningInProgress;
			recipient.CorrelationId = signingGroup.CorelationId;

			if (!await _recepientsRepository.UpdateRecepientsById(recipient))
			{
				_logger.LogError("Failed to update recipient");
				callBackDTO.errorMessage = "Failed to update. Please try again after some time";
				callBackDTO.errorCode = 1;
				await RecieveDocumentAsync(callBackDTO, user, isPrepaid);
				return;
			}


			using var stream = new MemoryStream(pdfBytes);
			using var form = new MultipartFormDataContent
			{
				{ new StringContent(jsonModel, Encoding.UTF8), "model" },
				{ new StreamContent(stream) { Headers = { ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf") } }, "multipartFile", document.DocumentName }
			};

			// Make signing API call
			try
			{
				using var client = new HttpClient();
				var signUrl = _configuration.GetValue<string>("Config:GroupSignUrl");
				var response = await client.PostAsync(signUrl, form);
				var responseContent = await response.Content.ReadAsStringAsync();

				if (!response.IsSuccessStatusCode)
				{
					_logger.LogError("Signing API call failed: {0}", responseContent);
					callBackDTO.errorMessage = "Error occurred while signing document. Please try again after some time";
					callBackDTO.errorCode = 1;
					await RecieveDocumentAsync(callBackDTO, user, isPrepaid);
					return;
				}

				var apiResponse = JsonConvert.DeserializeObject<APIResponse>(responseContent);
				if (apiResponse == null || apiResponse.Success != true || apiResponse.Result == null)
				{
					_logger.LogError($"Signing Request Response :: {responseContent}");
					callBackDTO.errorMessage = apiResponse?.Message ?? "Unknown signing error";
					callBackDTO.errorCode = 1;
					await RecieveDocumentAsync(callBackDTO, user, isPrepaid);
					return;
				}

				// Convert signed file from base64
				string base64 = apiResponse.Result.ToString();
				string cleanBase64 = base64.Contains(',') ? base64.Split(',')[1] : base64;
				byte[] signedBytes = Convert.FromBase64String(cleanBase64);

				using var signedStream = new MemoryStream(signedBytes);
				callBackDTO.signfile = new FormFile(signedStream, 0, signedBytes.Length, "file", document.DocumentName)
				{
					Headers = new HeaderDictionary(),
					ContentType = "application/pdf"
				};
				callBackDTO.success = true;

				await RecieveDocumentAsync(callBackDTO, user, isPrepaid, isEseal);
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, "Exception while calling GroupSignUrl");
				callBackDTO.errorMessage = "Something went wrong. Please try again after some time";
				callBackDTO.errorCode = 1;
				await RecieveDocumentAsync(callBackDTO, user, isPrepaid);
			}
		}

		public async Task<ServiceResult> GroupSigningStatusAsync(string groupId)
		{
			try
			{
				if (string.IsNullOrEmpty(groupId))
					return new ServiceResult("Group ID is required");

				var response = new GroupSigningStatusResponse
				{
					GroupId = groupId,
				};

				var (data, errorMsg) = await _redisClient.GetAllHashRecordsAsync<GroupSigningDocumentStatus>(groupId);

				if (data != null)
					foreach (var document in data)
					{
						response.GroupSignStatus.Add(document.Value);
					}

				response.SuccessFileCount = response.GroupSignStatus.Count(x => x.Status == RecepientStatus.Signed);
				response.FailedFileCount = response.GroupSignStatus.Count(x => x.Status == DocumentStatusConstants.Failed);
				response.TotalFileCount = data != null ? data.Count : 0;

				return new ServiceResult(response, "Successfully retrieved group signing status");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, "Exception in GroupSigningStatusAsync");
				return new ServiceResult("An error occurred while retrieving group signing status");
			}
		}

		public async Task<ServiceResult> UpdateGroupSigningStatusAsync(string requestId)
		{
			try
			{
				if (string.IsNullOrEmpty(requestId))
				{
					return new ServiceResult("id cannot be null");
				}

				var groupSigning = await _groupSigningRepository.GetGroupSigningRequestByIdAsync(requestId);
				if (groupSigning == null)
				{
					_logger.LogError("Group signing request not found in DB for requestId: {0}", requestId);
					return new ServiceResult("Group signing request not found");
				}

				if (groupSigning.Status == DocumentStatusConstants.Completed)
				{
					return new ServiceResult(groupSigning, "Group signing request is already updated");
				}

				var statusResult = await GroupSigningStatusAsync(requestId);
				if (!statusResult.Success || statusResult.Result is not GroupSigningStatusResponse status)
				{
					_logger.LogError("Failed to fetch group signing status from Redis for requestId: {0}", requestId);
					return new ServiceResult("Group signing status not found in redis ");
				}

				if (status.TotalFileCount != status.SuccessFileCount + status.FailedFileCount)
				{
					_logger.LogInformation("Signing not yet complete for requestId: " + requestId);
					return new ServiceResult("Signing not yet completed");
				}


				groupSigning.Status = DocumentStatusConstants.Completed;
				groupSigning.SuccessFileCount = status.SuccessFileCount;
				groupSigning.FailedFileCount = status.FailedFileCount;
				groupSigning.UpdatedAt = DateTime.UtcNow;

				foreach (var signingGroup in groupSigning.SigningGroups)
				{
					var document = await _documentRepository.GetDocumentById(signingGroup.DocumentId);
					if (document == null)
					{
						_logger.LogError("Document not found in DB for docId: {0}", signingGroup.DocumentId);
						continue;
					}

					var docStatus = status.GroupSignStatus
						.FirstOrDefault(x => x.DocumentId == signingGroup.DocumentId);

					if (docStatus != null)
					{
						signingGroup.RecepientStatus = docStatus.Status;
						signingGroup.DocumentStatus = document.Status;
						signingGroup.FailureReason = docStatus.FailureReason;
					}
				}

				await _groupSigningRepository.UpdateGroupSigningAsync(groupSigning);

				return new ServiceResult(groupSigning, "Successfully updated group signing status");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, "Exception in UpdateGroupSigningStatusAsync");
			}
			return new ServiceResult("An error occurred while updating group singing documents status");

		}

		private async Task RecieveDocumentAsync(RecieveGroupSigningDocumentDTO document, UserDTO user, bool isPrepaid, bool isEseal = false)
		{
			DateTime startTime = DateTime.UtcNow;
			_logger.LogInformation("RecieveDocument start time: {0}", startTime.ToString("s"));
			_logger.LogInformation("CorrelationId: {0}", document?.correlationID ?? "NULL");

			string suid = "", docId = "", docName = "";
			bool isAllSignComplete = false;
			string redisStatus = RecepientStatus.Signed;
			Recepients recipientData = null;

			if (document == null)
			{
				_logger.LogError("RecieveDocumentAsync received NULL document");
				return;
			}

			try
			{
				recipientData = await _recepientsRepository.FindRecepientsByCorelationId(document.correlationID);
				if (recipientData == null)
				{
					_logger.LogError("No recipient found for CorrelationId: {0}", document.correlationID);
					redisStatus = DocumentStatusConstants.Failed;
					return;
				}

				var recipientList = await _recepientsRepository.GetRecepientsLeft(recipientData.Tempid);
				var documentData = await _documentHelper.GetDocumentById(recipientData.Tempid);

				var currentRecipient = recipientList.FirstOrDefault(r => r.Email == recipientData.Email) ?? recipientList.First();
				docId = recipientData.Tempid;
				suid = recipientData.Suid;
				docName = documentData.DocumentName;

				// Failure cases
				if (!document.success || document.signfile == null)
				{
					if (currentRecipient.Status == RecepientStatus.SigningInProgress && !currentRecipient.TakenAction)
					{
						currentRecipient.Status = RecepientStatus.Failed;
						await _recepientsRepository.UpdateRecepientsById(currentRecipient);
					}

					redisStatus = DocumentStatusConstants.Failed;
					return;
				}

				_logger.LogInformation("Begin processing successful signed document: {0}", docName);

				// If final recipient
				if (recipientList.Count == 1)
				{
					documentData.CompleteTime = DateTime.UtcNow;
					documentData.UpdatedAt = DateTime.UtcNow;
					documentData.Status = DocumentStatusConstants.Completed;

					if (currentRecipient.Email.ToLower() != recipientData.Email.ToLower())
					{
						_backgroundService.RunBackgroundTask<INotificationService>(s =>
							s.CreateNotificationAsync(new NotificationDTO
							{
								Receiver = documentData.OwnerID,
								Sender = recipientData.Email,
								Text = $"{recipientData.Name} has signed the document {documentData.DocumentName}",
								Link = $"/dashboard/document/{recipientData.Tempid}/status"
							}, documentData.OrganizationId,
							new(NotificationTypeConstants.Document, recipientData.Tempid)));
					}

					var edmsUpdate = await _documentHelper.UpdateDocumentToEDMS(documentData.EdmsId, document.signfile, documentData.DocumentName, suid);
					if (!edmsUpdate.Success)
					{
						_logger.LogError("EDMS update failed: {0}", edmsUpdate.Message);

						if (currentRecipient.Status == RecepientStatus.SigningInProgress && !currentRecipient.TakenAction)
						{
							currentRecipient.Status = RecepientStatus.Failed;
							await _recepientsRepository.UpdateRecepientsById(currentRecipient);
						}

						redisStatus = DocumentStatusConstants.Failed;
						return;
					}

					await _documentRepository.UpdateDocumentById(documentData);

					if (documentData.OwnerEmail.ToLower() != recipientData.Email.ToLower())
					{
						_backgroundService.RunBackgroundTask<IDocumentHelper>(s =>
							s.SendAnEmailToSender(new SendEmailObj
							{
								Id = recipientData.Tempid,
								UserEmail = documentData.OwnerEmail,
								UserName = recipientData.Name
							}));
					}

					_backgroundService.RunBackgroundTask<IDocumentHelper>(s =>
						s.SendSignedDocumentDetailsNotifiactionGroupSigning(document.correlationID, "Document signed successfully.", true));

					isAllSignComplete = true;
				}
				else // Not final recipient
				{
					var edmsUpdate = await _documentHelper.UpdateDocumentToEDMS(documentData.EdmsId, document.signfile, "document", suid);
					if (!edmsUpdate.Success)
					{
						_logger.LogError("EDMS update failed: {0}", edmsUpdate.Message);

						if (currentRecipient.Status == RecepientStatus.SigningInProgress && !currentRecipient.TakenAction)
						{
							currentRecipient.Status = RecepientStatus.Failed;
							await _recepientsRepository.UpdateRecepientsById(currentRecipient);
						}

						redisStatus = DocumentStatusConstants.Failed;
						return;
					}

					_backgroundService.RunBackgroundTask<INotificationService>(s =>
						s.CreateNotificationAsync(new NotificationDTO
						{
							Receiver = documentData.OwnerID,
							Sender = recipientData.Email,
							Text = $"{recipientData.Name} has signed the document {documentData.DocumentName}",
							Link = $"/dashboard/document/{recipientData.Tempid}/status"
						},
						documentData.OrganizationId,
						new(NotificationTypeConstants.Document, recipientData.Tempid)));

					if (documentData.OwnerEmail.ToLower() != recipientData.Email.ToLower())
					{
						_backgroundService.RunBackgroundTask<IDocumentHelper>(s =>
							s.SendAnEmailToSender(new SendEmailObj
							{
								Id = recipientData.Tempid,
								UserEmail = documentData.OwnerEmail,
								UserName = recipientData.Name
							}));
					}

					_backgroundService.RunBackgroundTask<IDocumentHelper>(s =>
						s.SendSignedDocumentDetailsNotifiactionGroupSigning(document.correlationID, "Document signed successfully.", true));
				}

				// Update Pending/Completed list
				var completedList = documentData.CompleteSignList;
				var pendingList = documentData.PendingSignList;

				var completedRecipient = pendingList.FirstOrDefault(p =>
					p.suid == recipientData.Suid &&
					p.email == recipientData.Email.ToLower());

				if (completedRecipient != null)
				{
					completedList.Add(completedRecipient);
					pendingList.Remove(completedRecipient);
					documentData.UpdatedAt = DateTime.UtcNow;

					await _documentRepository.UpdateArrayInDocumentById(new Document
					{
						_id = recipientData.Tempid,
						CompleteSignList = completedList,
						PendingSignList = pendingList,
						UpdatedAt = DateTime.UtcNow
					});
				}

				var previewResponse = await _templateService.GetSignaturePreviewAsync(new UserDTO
				{
					AccountType = currentRecipient.AccountType,
					Suid = currentRecipient.Suid,
					OrganizationId = currentRecipient.OrganizationId
				});

				var updateRecepient = await _recepientsRepository.UpdateTakenActionOfRecepientById(currentRecipient._id, (string)previewResponse.Result);
				if (updateRecepient == false)
				{
					_logger.LogError("Failed to update recepient");
				}

				//Update next recepient Status
				var nextRecepient = documentData.Recepients.FirstOrDefault(x => x.Order == currentRecipient.Order + 1);
				if (!documentData.DisableOrder && nextRecepient is not null)
				{
					var updateNextRecepient = await _recepientsRepository.UpdateRecepientStatusById(nextRecepient._id, RecepientStatus.NeedToSign);
					if (updateNextRecepient == false)
					{
						_logger.LogError("Failed to update next recepient status");
					}
				}

				// Notify all if signing complete
				if (isAllSignComplete)
				{
					string message = !documentData.MultiSign
						? $"<b>{documentData.DocumentName}</b> has been signed successfully. Please find the attached signed document."
						: $"<b>{documentData.DocumentName}</b> has been signed by all signatories sent by {documentData.OwnerName}. Please find the attached signed document.";

					_backgroundService.RunBackgroundTask<IDocumentHelper>(s =>
						s.SendEmailToAllRecepients(docId, message, "Document Signed", true, true));

					if (recipientData.Email != documentData.OwnerEmail)
					{
						var notification = new NotificationDTO
						{
							Receiver = documentData.OwnerID,
							Sender = recipientData.Email,
							Text = recipientData.Name + " has signed the document " + documentData.DocumentName,
							Link = $"/dashboard/document/{recipientData.Tempid}/status"
						};

						if (documentData.Recepients.Count == 1)
							notification.Text = $"{recipientData.Name} has signed the document {documentData.DocumentName}";

						_backgroundService.RunBackgroundTask<INotificationService>(
							s => s.CreateNotificationAsync(
								notification,
								documentData.OrganizationId,
								new(NotificationTypeConstants.Document, recipientData.Tempid)));


						bool pushEnabled = _configuration.GetValue<bool>("PushNotification");

						if (!string.IsNullOrEmpty(recipientData.AccessToken) && pushEnabled)
						{
							_backgroundService.RunBackgroundTask<IGenericPushNotificationService>(
								sender => sender.SendGenericPushNotification(recipientData.AccessToken, documentData.OwnerEmail, notification.Text));
						}
					}
				}

				_logger.LogInformation("Email sent for CorrelationId: {0} at {1}", recipientData.CorrelationId, DateTime.UtcNow.ToString("s"));
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, "Unhandled exception in RecieveDocumentAsync");
				redisStatus = DocumentStatusConstants.Failed;
			}
			finally
			{
				if (redisStatus != DocumentStatusConstants.Failed)
				{
					//Debit Credits
					await DebitSubscriberCredits(user, isPrepaid, isEseal);
				}
				await _documentRepository.UpdateDocumentBlockedStatusAsync(docId, false);
				_logger.LogInformation("RecieveDocument end time: {0}", DateTime.UtcNow.ToString("s"));

				GroupSigningDocumentStatus status = new GroupSigningDocumentStatus
				{
					DocumentId = docId,
					DocumentName = docName,
					Status = redisStatus,
					FailureReason = !string.IsNullOrEmpty(document.errorMessage) ? document.errorMessage : string.Empty
				};

				var (ret, err) = await _redisClient.AddHashRecordAsync(document.requestId, docId, status);
				if (ret != 0)
					_logger.LogError("Failed to update Redis for group signing: {0}", err);

				_ = CheckCompleteDocumentSigningStatusAsync(document.requestId, recipientData.AccessToken, recipientData.SignedBy);

			}
		}

		private async Task CheckCompleteDocumentSigningStatusAsync(string requestId, string acToken, string email)
		{
			bool sendNotification = false;
			GroupSigning groupSigning = null;
			string notificationMSG = "Selected documents signed successfully (all documents completed signing)";
			try
			{
				if (string.IsNullOrEmpty(requestId))
				{
					_logger.LogError("CheckCompleteDocumentSigningStatusAsync called with null requestId");
					return;
				}

				groupSigning = await _groupSigningRepository.GetGroupSigningRequestByIdAsync(requestId);
				if (groupSigning == null)
				{
					_logger.LogError("Group signing request not found in DB for requestId: {0}", requestId);
					return;
				}

				if (groupSigning.Status == DocumentStatusConstants.Completed)
				{
					sendNotification = true;
					return;
				}

				var statusResult = await GroupSigningStatusAsync(requestId);
				if (!statusResult.Success || statusResult.Result is not GroupSigningStatusResponse status)
				{
					_logger.LogError("Failed to fetch group signing status from Redis for requestId: {0}", requestId);
					return;
				}

				if (status.TotalFileCount != status.SuccessFileCount + status.FailedFileCount)
				{
					_logger.LogInformation("Signing not yet complete for requestId: " + requestId);
					return;
				}

				groupSigning.Status = DocumentStatusConstants.Completed;
				groupSigning.SuccessFileCount = status.SuccessFileCount;
				groupSigning.FailedFileCount = status.FailedFileCount;
				groupSigning.UpdatedAt = DateTime.UtcNow;

				foreach (var signingGroup in groupSigning.SigningGroups)
				{
					var document = await _documentRepository.GetDocumentById(signingGroup.DocumentId);
					if (document == null)
					{
						_logger.LogError("Document not found in DB for docId: {0}", signingGroup.DocumentId);
						continue;
					}

					var docStatus = status.GroupSignStatus
						.FirstOrDefault(x => x.DocumentId == signingGroup.DocumentId);

					if (docStatus != null)
					{
						signingGroup.RecepientStatus = docStatus.Status;
						signingGroup.DocumentStatus = document.Status;
						signingGroup.FailureReason = docStatus.FailureReason;
					}
				}

				await _groupSigningRepository.UpdateGroupSigningAsync(groupSigning);

				sendNotification = true;

				if (groupSigning.FailedFileCount > 0)
				{
					notificationMSG = "Selected documents signed partially (few failed and few completed siging )";
				}
				else if (groupSigning.FailedFileCount == groupSigning.TotalFileCount)
				{
					notificationMSG = "Selected documents signing failed (all documents failed)";
				}

				_logger.LogInformation("Group signing marked as completed for requestId: {0}", requestId);

			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, "Unhandled error in CheckCompleteDocumentSigningStatusAsync for requestId: {0}", requestId);
			}
			finally
			{
				if (sendNotification)
				{
					//Notification after Group signing is completed

					var notification = new NotificationDTO
					{
						Receiver = groupSigning.SignerSuid,
						Sender = email,
						Text = notificationMSG,
						Link = ""
					};

					_backgroundService.RunBackgroundTask<INotificationService>(
						s => s.CreateNotificationAsync(
							notification,
							groupSigning.SignerOrganizationId,
							new(NotificationTypeConstants.GroupSigning, groupSigning._id)));

					bool pushEnabled = _configuration.GetValue<bool>("PushNotification");

					if (!string.IsNullOrEmpty(acToken) && pushEnabled)
					{
						_backgroundService.RunBackgroundTask<IGenericPushNotificationService>(
							sender => sender.SendGenericPushNotification(acToken, email, notification.Text));
					}
				}
			}
		}

		private async Task DebitSubscriberCredits(UserDTO user, bool isPrepaid, bool isEseal)
		{
			try
			{
				string signatureType = isEseal ? "ESEAL_SIGNATURE" : "DIGITAL_SIGNATURE";

				string url = isPrepaid ?
					_configuration.GetValue<string>("Config:PrepaidDebitUrl") :
					_configuration.GetValue<string>("Config:PostpaidDebitUrl");

				HttpClient httpClient = new();

				HttpResponseMessage response;

				if (isPrepaid)
				{
					var debitSubscriberRequest = new PrepaidDebitRequestDTO
					{
						organizationId = user.OrganizationId,
						totalDebits = 1.0,
						serviceDefinitions = new Dictionary<string, string>
						{
							{ "serviceName", signatureType }
						}
					};

					response = await httpClient.PostAsJsonAsync(url, debitSubscriberRequest);
				}
				else
				{
					var postPaidRequest = new PostpaidDebitRequestDTO
					{
						subscriberSuid = user.Suid,
						organizationId = user.OrganizationId,
						transactionForOrganization = true,
						serviceName = signatureType
					};

					response = await httpClient.PostAsJsonAsync(url, postPaidRequest);
				}

				if (!response.IsSuccessStatusCode)
				{
					var errorContent = await response.Content.ReadAsStringAsync();
					_logger.LogError($"Debit API call failed. StatusCode: {response.StatusCode}, Content: {errorContent}");
				}
				else
				{
					var responseContent = await response.Content.ReadAsStringAsync();
					APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(responseContent);
					if (apiResponse.Success)
					{
						_logger.LogInformation($"Credits debited successfully for suid : {user.Suid} & OrganizationId : {user.OrganizationId}");
					}
					else
					{
						_logger.LogError($"Credits not debited for suid : {user.Suid} & OrganizationId : {user.OrganizationId}");
						_logger.LogError($"Response Message: {apiResponse.Message}");
					}
				}
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Unhandled exception in DebitSubscriberCredits");
			}
		}


	}
}

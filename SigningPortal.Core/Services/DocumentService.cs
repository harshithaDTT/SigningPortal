using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.Domain.Services.Communication.Documents;
using SigningPortal.Core.Domain.Services.Communication.SigningService;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using StackExchange.Redis;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace SigningPortal.Core.Services
{
    public class DocumentService : IDocumentService
    {
        private readonly ILogger<DocumentService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IDocumentRepository _documentRepository;
        private readonly IDocumentHelper _documentHelper;
        private readonly IRecepientsRepository _recepientsRepository;
        private readonly IDelegationRepository _delegationRepository;
        private readonly IBackgroundService _backgroundService;
        private readonly ITemplateService _templateService;
        private readonly IConstantError _constantError;
        private readonly IEDMSService _edmsService;
        public readonly IPaymentService _paymentService;
        private readonly ICacheClient _cacheClient;
        private readonly HttpClient _client;
        private readonly ILogClient _logClient;

        public DocumentService(ILogger<DocumentService> logger,
            IConfiguration configuration,
            IDocumentRepository documentRepository,
            IDocumentHelper documentHelper,
            IEDMSService edmsService,
            ITemplateService templateService,
            IRecepientsRepository recepientsRepository,
            IDelegationRepository delegationRepository,
            HttpClient httpClient,
            ILogClient logClient,
            IBackgroundService backgroundService,
            IPaymentService paymentService,
            ICacheClient cacheClient,
            IConstantError constantError)
        {
            _logger = logger;
            _client = httpClient;
            _client.Timeout = TimeSpan.FromMinutes(10);
            _configuration = configuration;
            _documentRepository = documentRepository;
            _documentHelper = documentHelper;
            _edmsService = edmsService;
            _templateService = templateService;
            _recepientsRepository = recepientsRepository;
            _delegationRepository = delegationRepository;
            _constantError = constantError;
            _logClient = logClient;
            _backgroundService = backgroundService;
            _paymentService = paymentService;
            _cacheClient = cacheClient;
        }

        public ServiceResult GetFileConfigurationAsync(string orgId)
        {
            try
            {
                FileConfigurationResponse allowedFileSize = new FileConfigurationResponse
                {
                    AllowedFileSize = _configuration.GetValue<string>("FileSizeLimit"),
                    GlobalLatancyPeriod = _configuration.GetValue<int>("GlobalLatancyPeriod"),
                    LatancyPeriod = _configuration.GetValue<int>("LatancyPeriod")
                };

                return new ServiceResult(allowedFileSize, "Successfully received allowed file size");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("GetAllowedFileSizeAsync Exception :  {0}", ex.Message);
            }

            return new ServiceResult(_constantError.GetMessage("102518"));
            //return new ServiceResult("An error occurred while receiving allowed file size");
        }

        public async Task UpdateExpiredDocuments(string suid)
        {
            try
            {
                List<string> tempIdList = new List<string>();

                var documents = await _documentRepository.GetAllDocumentsBySuid(suid);

                foreach (var document in documents)
                {
                    tempIdList.Add(document._id);
                }

                var result = await _documentRepository.UpdateExpiredDocumentStatusByTempIdList(tempIdList);

                _logger.LogInformation($"Expired documents updated for :: {suid} :: count :: {result}");
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("UpdateExpiredDocuments Excp'  :: " + e.Message);
            }
        }

        public async Task<ServiceResult> OwnDocumentStatusAsync(UserDTO userDTO)
        {
            try
            {
                var inProgressTask = _documentRepository.GetOwnDocumentStatusCountAsync(userDTO.Suid, userDTO.AccountType.ToLower(), userDTO.OrganizationId, DocumentStatusConstants.InProgress);
                var completedTask = _documentRepository.GetOwnDocumentStatusCountAsync(userDTO.Suid, userDTO.AccountType.ToLower(), userDTO.OrganizationId, DocumentStatusConstants.Completed);
                var declinedTask = _documentRepository.GetOwnDocumentStatusCountAsync(userDTO.Suid, userDTO.AccountType.ToLower(), userDTO.OrganizationId, DocumentStatusConstants.Declined);
                var expiredTask = _documentRepository.GetOwnDocumentStatusCountAsync(userDTO.Suid, userDTO.AccountType.ToLower(), userDTO.OrganizationId, DocumentStatusConstants.Expired);

                await Task.WhenAll(inProgressTask, completedTask, declinedTask, expiredTask);

                OwnDocumentStatusResponse response = new OwnDocumentStatusResponse
                {
                    cnt_completed = await completedTask,
                    cnt_declined = await declinedTask,
                    cnt_expired = await expiredTask,
                    cnt_in_progress = await inProgressTask
                };

                return new ServiceResult(response, "Successfully received own document status count");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("OwnDocumentStatusAsync Exception :  {0}", ex.Message);
            }

            return new ServiceResult(_constantError.GetMessage("102519"));
        }

        public async Task<ServiceResult> DashboardDocumentStatusAsync(UserDTO userDTO)
        {
            try
            {
                var allDocumentList = await GetAllSelfDocumentListAsync(userDTO);

                if (allDocumentList?.Result is not AllDocumentListDTO allList)
                {
                    return new ServiceResult("Error occured while receiving self document list");
                }

                var response = new DashboardDocumentStatusResponse
                {
                    cnt_draft = allList.DraftList.Count,
                    cnt_received = allList.ReceivedList.Count,
                    cnt_referred = allList.ReferredList.Count,
                    cnt_send = allList.SendList.Count
                };

                return new ServiceResult(response, "Successfully received own document status count");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, "DashboardDocumentStatusAsync Exception: {Message}", ex.Message);
                return new ServiceResult("An error occurred while receiving dashboard document status count.");
            }
        }

        //public async Task<ServiceResult> OtherDocumentStatusAsyncOld(UserDTO userDTO)
        //{
        //    try
        //    {
        //        List<string> actionRequiredArray = new List<string>();

        //        List<string> expireSoonArray = new List<string>();

        //        var recepientsList = await _recepientsRepository.GetRecepientsListByTakenActionAsync(userDTO.Suid, false);

        //        foreach (var recepient in recepientsList)
        //        {
        //            var documents = await _documentRepository.GetDocumentByRecepientsTempIdAsync(recepient.Tempid);
        //            if (documents != null)
        //            {
        //                DateTime untilDate = documents.CreatedAt.AddDays(Convert.ToDouble(documents.DaysToComplete));
        //                var expiredays = Math.Round(Math.Abs((untilDate - DateTime.UtcNow).TotalDays));

        //                if (Convert.ToInt32(recepient.Order) == 1 && expiredays >= 0)
        //                {
        //                    actionRequiredArray.Add(recepient.Tempid);
        //                    if (expiredays <= 2)
        //                    {
        //                        expireSoonArray.Add(recepient.Tempid);
        //                    }

        //                    if (userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && !string.IsNullOrEmpty(recepient.EsealOrgId) && userDTO.OrganizationId != recepient.EsealOrgId)
        //                    {
        //                        actionRequiredArray.Remove(recepient.Tempid);
        //                    }

        //                    if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId))
        //                    {
        //                        actionRequiredArray.Remove(recepient.Tempid);
        //                    }
        //                }
        //                else if (Convert.ToInt32(recepient.Order) > 1 && expiredays >= 0)
        //                {
        //                    if (documents.DisableOrder)
        //                    {
        //                        actionRequiredArray.Add(recepient.Tempid);

        //                        if (!string.IsNullOrEmpty(recepient.EsealOrgId) && userDTO.OrganizationId != recepient.EsealOrgId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
        //                        {
        //                            actionRequiredArray.Remove(recepient.Tempid);
        //                        }

        //                        if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId))
        //                        {
        //                            actionRequiredArray.Remove(recepient.Tempid);
        //                        }

        //                        if (expiredays <= 2)
        //                        {
        //                            expireSoonArray.Add(recepient.Tempid);

        //                            if (!string.IsNullOrEmpty(recepient.EsealOrgId) && userDTO.OrganizationId != recepient.EsealOrgId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
        //                            {
        //                                expireSoonArray.Remove(recepient.Tempid);
        //                            }

        //                            if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId))
        //                            {
        //                                expireSoonArray.Remove(recepient.Tempid);
        //                            }
        //                        }
        //                    }
        //                    else
        //                    {
        //                        var prevOrderRecepient = _recepientsRepository.GetRecepientsListByTempIdAsync(recepient).Result;
        //                        if (prevOrderRecepient[0].TakenAction)
        //                        {
        //                            actionRequiredArray.Add(recepient.Tempid);

        //                            if (!string.IsNullOrEmpty(recepient.EsealOrgId) && userDTO.OrganizationId != recepient.EsealOrgId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
        //                            {
        //                                actionRequiredArray.Remove(recepient.Tempid);
        //                            }

        //                            if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId))
        //                            {
        //                                actionRequiredArray.Remove(recepient.Tempid);
        //                            }

        //                            if (expiredays <= 2)
        //                            {
        //                                expireSoonArray.Add(recepient.Tempid);

        //                                if (!string.IsNullOrEmpty(recepient.EsealOrgId) && userDTO.OrganizationId != recepient.EsealOrgId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
        //                                {
        //                                    expireSoonArray.Remove(recepient.Tempid);
        //                                }

        //                                if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId))
        //                                {
        //                                    expireSoonArray.Remove(recepient.Tempid);
        //                                }
        //                            }
        //                        }
        //                    }
        //                }
        //            }
        //        }

        //        var actionRequiredDocs = await _documentRepository.OtherDocumentStatusAsync(actionRequiredArray);
        //        var actionRequiredDocsCount = actionRequiredDocs.Count;

        //        var expiringSoonDocs = await _documentRepository.OtherDocumentStatusAsync(expireSoonArray);
        //        var expiringSoonDocsCount = expiringSoonDocs.Count;

        //        OtherDocumentStatusResponse otherDocumentStatus = new OtherDocumentStatusResponse
        //        {
        //            action_required_cnt = actionRequiredDocsCount,
        //            expiry_soon_count = expiringSoonDocsCount
        //        };

        //        return new ServiceResult(otherDocumentStatus, "Successfully received action required and expiring soon counts ");
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, ex.Message);
        //        _logger.LogError("OtherDocumentStatusAsync Exception :  {0}", ex.Message);
        //    }

        //    return new ServiceResult(_constantError.GetMessage("102520"));
        //    //return new ServiceResult("An error occurred while receiving other document status count");
        //}

        //public async Task<ServiceResult> OtherDocumentStatusAsyncLatestNotUse(UserDTO userDTO)
        //{
        //    try
        //    {
        //        List<string> actionRequiredArray = new List<string>();

        //        List<string> expireSoonArray = new List<string>();

        //        var recepientsList = await _recepientsRepository.GetRecepientsListByTakenActionAsync(userDTO.Suid, false);

        //        foreach (var recepient in recepientsList)
        //        {
        //            var documents = await _documentRepository.GetDocumentByRecepientsTempIdAsync(recepient.Tempid);
        //            if (documents != null)
        //            {
        //                DateTime untilDate = documents.CreatedAt.AddDays(Convert.ToDouble(documents.DaysToComplete));
        //                var expiredays = Math.Round(Math.Abs((untilDate - DateTime.UtcNow).TotalDays));

        //                if (Convert.ToInt32(recepient.Order) == 1 && expiredays >= 0)
        //                {
        //                    actionRequiredArray.Add(recepient.Tempid);
        //                    if (expiredays <= 2)
        //                    {
        //                        expireSoonArray.Add(recepient.Tempid);
        //                        if (documents.OwnerEmail != userDTO.Email)
        //                        {
        //                            if (userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && !string.IsNullOrEmpty(recepient.EsealOrgId) && userDTO.OrganizationId != recepient.EsealOrgId)
        //                            {
        //                                expireSoonArray.Remove(recepient.Tempid);
        //                            }
        //                            if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId))
        //                            {
        //                                expireSoonArray.Remove(recepient.Tempid);
        //                            }
        //                        }
        //                    }
        //                    if (documents.OwnerEmail != userDTO.Email)
        //                    {
        //                        if (userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && !string.IsNullOrEmpty(recepient.EsealOrgId) && userDTO.OrganizationId != recepient.EsealOrgId)
        //                        {
        //                            actionRequiredArray.Remove(recepient.Tempid);
        //                        }
        //                        if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId))
        //                        {
        //                            actionRequiredArray.Remove(recepient.Tempid);
        //                        }
        //                    }
        //                }
        //                else if (Convert.ToInt32(recepient.Order) > 1 && expiredays >= 0)
        //                {
        //                    if (documents.DisableOrder)
        //                    {
        //                        actionRequiredArray.Add(recepient.Tempid);

        //                        if (documents.OwnerEmail != userDTO.Email)
        //                        {
        //                            if (userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && !string.IsNullOrEmpty(recepient.EsealOrgId) && userDTO.OrganizationId != recepient.EsealOrgId)
        //                            {
        //                                actionRequiredArray.Remove(recepient.Tempid);
        //                            }
        //                            if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId))
        //                            {
        //                                actionRequiredArray.Remove(recepient.Tempid);
        //                            }
        //                        }

        //                        if (expiredays <= 2)
        //                        {
        //                            expireSoonArray.Add(recepient.Tempid);

        //                            if (documents.OwnerEmail != userDTO.Email)
        //                            {
        //                                if (userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && !string.IsNullOrEmpty(recepient.EsealOrgId) && userDTO.OrganizationId != recepient.EsealOrgId)
        //                                {
        //                                    expireSoonArray.Remove(recepient.Tempid);
        //                                }
        //                                if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId))
        //                                {
        //                                    expireSoonArray.Remove(recepient.Tempid);
        //                                }
        //                            }
        //                        }
        //                    }
        //                    else
        //                    {
        //                        var prevOrderRecepient = _recepientsRepository.GetRecepientsListByTempIdAsync(recepient).Result;
        //                        if (prevOrderRecepient[0].TakenAction)
        //                        {
        //                            actionRequiredArray.Add(recepient.Tempid);

        //                            if (documents.OwnerEmail != userDTO.Email)
        //                            {
        //                                if (userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && !string.IsNullOrEmpty(recepient.EsealOrgId) && userDTO.OrganizationId != recepient.EsealOrgId)
        //                                {
        //                                    actionRequiredArray.Remove(recepient.Tempid);
        //                                }
        //                                if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId))
        //                                {
        //                                    actionRequiredArray.Remove(recepient.Tempid);
        //                                }
        //                            }

        //                            if (expiredays <= 2)
        //                            {
        //                                expireSoonArray.Add(recepient.Tempid);

        //                                if (documents.OwnerEmail != userDTO.Email)
        //                                {
        //                                    if (userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && !string.IsNullOrEmpty(recepient.EsealOrgId) && userDTO.OrganizationId != recepient.EsealOrgId)
        //                                    {
        //                                        expireSoonArray.Remove(recepient.Tempid);
        //                                    }
        //                                    if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId))
        //                                    {
        //                                        expireSoonArray.Remove(recepient.Tempid);
        //                                    }

        //                                }
        //                            }
        //                        }
        //                    }
        //                }

        //                if (documents.OwnerEmail == userDTO.Email && documents.AccountType.ToLower() != userDTO.AccountType.ToLower())
        //                {
        //                    actionRequiredArray.Remove(recepient.Tempid);
        //                    expireSoonArray.Remove(recepient.Tempid);
        //                }
        //            }

        //        }

        //        var actionRequiredDocs = await _documentRepository.OtherDocumentStatusAsync(actionRequiredArray);
        //        var actionRequiredDocsCount = actionRequiredDocs.Count;

        //        var expiringSoonDocs = await _documentRepository.OtherDocumentStatusAsync(expireSoonArray);
        //        var expiringSoonDocsCount = expiringSoonDocs.Count;

        //        OtherDocumentStatusResponse otherDocumentStatus = new OtherDocumentStatusResponse
        //        {
        //            action_required_cnt = actionRequiredDocsCount,
        //            expiry_soon_count = expiringSoonDocsCount
        //        };

        //        return new ServiceResult(otherDocumentStatus, "Successfully received action required and expiring soon counts ");
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, ex.Message);
        //        _logger.LogError("OtherDocumentStatusAsync Exception :  {0}", ex.Message);
        //    }

        //    return new ServiceResult(_constantError.GetMessage("102520"));
        //    //return new ServiceResult("An error occurred while receiving other document status count");
        //}

        public async Task<ServiceResult> OtherDocumentStatusAsync(UserDTO userDTO)
        {
            try
            {
                var actionRequiredFilter = new FilterDocumentDTO
                {
                    Status = DocumentStatusConstants.InProgress,
                    ActionRequired = true,
                    ExpirySoon = false
                };

                var expirySoonFilter = new FilterDocumentDTO
                {
                    Status = DocumentStatusConstants.InProgress,
                    ActionRequired = true,
                    ExpirySoon = true
                };

                var allDocumentList = await GetAllSelfDocumentListAsync(userDTO);

                var allList = (AllDocumentListDTO)allDocumentList.Result;

                var actionRequiredTask = DocumentFilterListAsync(allList, actionRequiredFilter, userDTO);
                var expirySoonTask = DocumentFilterListAsync(allList, expirySoonFilter, userDTO);

                List<Document> actionRequiredList = actionRequiredTask.Result as List<Document>;
                List<Document> expirySoonList = expirySoonTask.Result as List<Document>;

                OtherDocumentStatusResponse response = new OtherDocumentStatusResponse
                {
                    action_required_cnt = actionRequiredList?.Count ?? 0,
                    expiry_soon_count = expirySoonList?.Count ?? 0
                };

                return new ServiceResult(response, "Successfully received action required and expiring soon counts");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("OtherDocumentStatusAsync Exception :  {0}", ex.Message);
            }

            return new ServiceResult(_constantError.GetMessage("102520"));
        }

        public async Task<ServiceResult> DocumentStatusAsync(UserDTO userDTO)
        {
            //_logger.LogInformation("DocumentStatusAsync start " + DateTime.UtcNow);
            try
            {
                DocumentStatusResponse documentStatus = new();
                OwnDocumentStatusResponse ownDocumentStatus = new();
                OtherDocumentStatusResponse otherDocumentStatus = new();

                var dashboardstatus = DashboardDocumentStatusAsync(userDTO);
                var otherdocstatus = OtherDocumentStatusAsync(userDTO);

                await Task.WhenAll(dashboardstatus, otherdocstatus);

                if (!dashboardstatus.Result.Success)
                {
                    return new ServiceResult("Own document status not recieved successfully");
                }

                if (!otherdocstatus.Result.Success)
                {
                    return new ServiceResult("Other document status not recieved successfully");
                }

                documentStatus.ownDocumentStatus = dashboardstatus.Result.Result as DashboardDocumentStatusResponse;
                documentStatus.otherDocumentStatus = otherdocstatus.Result.Result as OtherDocumentStatusResponse;

                return new ServiceResult(documentStatus, "Successfully recieved own document status and other document status");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("DocumentStatusAsync Exception :  {0}", ex.Message);
            }
            finally
            {
                //_logger.LogInformation("DocumentStatusAsync end " + DateTime.UtcNow);
            }
            return new ServiceResult("An error occurred while receiving document status count");
        }

        public async Task<ServiceResult> SaveNewDocumentAsync(SaveNewDocumentDTO document, UserDTO userDetails)
        {
            // Get Start Time
            DateTime startTime = DateTime.UtcNow;
            var logMessageType = "";
            var MessageForLog = "";
            CriticalData criticalData = null;

            if (document.file == null)
            {
                logMessageType = SigningPortalLogMessageType.Failed;
                MessageForLog = SigningPortalLogMessage.SaveDocumentFailed;

                return new ServiceResult(_constantError.GetMessage("102521"));
                //return new ServiceResult("File cannot be null");
            }

            double fileSizeLimit = _configuration.GetValue<double>("FileSizeLimit");
            long maxSizeInBytes = (long)(fileSizeLimit * 1024 * 1024);

            if (document.file.Length > maxSizeInBytes)
            {
                _logger.LogError($"File size should be {(int)maxSizeInBytes} MB or below.");
                return new ServiceResult($"File size should be {(int)maxSizeInBytes} MB or below.");
            }

            if (document.model == null)
            {
                logMessageType = SigningPortalLogMessageType.Failed;
                MessageForLog = SigningPortalLogMessage.SaveDocumentFailed;

                return new ServiceResult(_constantError.GetMessage("102522"));
                //return new ServiceResult("Model cannot be null");
            }

            try
            {
                //_logger.LogInformation("SaveNewDocumentAsync document : " + document.model);

                JObject esealCoordinatesObj = null;
                string qrCords = string.Empty;
                SaveNewDocumentResponse saveNewDocumentResponse = new SaveNewDocumentResponse();

                _logger.LogInformation($"Save Document Model :: {document.model}");

                Model modelObj = JsonConvert.DeserializeObject<Model>(document.model);
                JObject signCoordinatesObj = JObject.Parse(document.model);

                var signCords = signCoordinatesObj["signCords"].ToString();
                var esealCords = signCoordinatesObj["esealCords"].ToString();
                if (modelObj.qrCodeRequired)
                    qrCords = signCoordinatesObj["qrCords"].ToString();

                if (!string.IsNullOrEmpty(signCords))
                {
                    modelObj.signCords.coordinates = JsonConvert.SerializeObject(signCoordinatesObj["signCords"]);
                    //modelObj.esealCords.coordinates
                }

                if (!string.IsNullOrEmpty(esealCords))
                {
                    modelObj.esealCords.coordinates = JsonConvert.SerializeObject(signCoordinatesObj["esealCords"]);

                    esealCoordinatesObj = JObject.Parse(signCoordinatesObj["esealCords"].ToString());
                }

                if (!string.IsNullOrEmpty(qrCords))
                {
                    modelObj.QrCords.coordinates = JsonConvert.SerializeObject(signCoordinatesObj["qrCords"]);

                    criticalData = new()
                    {
                        entityName = string.IsNullOrEmpty(modelObj.entityName) ? string.Empty : modelObj.entityName,
                        docSerialNo = string.IsNullOrEmpty(modelObj.docSerialNo) ? string.Empty : modelObj.docSerialNo,
                        faceRequired = modelObj.faceRequired
                    };
                }

                //============================================
                if (!modelObj.multisign)
                {
                    var isEsealPresent = false;
                    StringComparison comp = StringComparison.OrdinalIgnoreCase;
                    if (!string.IsNullOrEmpty(esealCords) &&
                        modelObj.docdetails.receps[0].eseal &&
                        signCoordinatesObj["esealCords"].ToString().Contains(userDetails.Suid, comp))
                    {
                        isEsealPresent = true;
                    }

                    var isSignaturePresent = false;
                    StringComparison comp1 = StringComparison.OrdinalIgnoreCase;
                    if (!string.IsNullOrEmpty(signCords) &&
                        signCoordinatesObj["signCords"].ToString().Contains(userDetails.Suid, comp1))
                    {
                        isSignaturePresent = true;
                    }

                    if (!isSignaturePresent && !isEsealPresent) //if both flags false then it is quick sign
                    {
                        isSignaturePresent = true;
                    }

                    //check credit available or not
                    var res = await _paymentService.IsCreditAvailable(userDetails, isEsealPresent, isSignaturePresent);
                    if (res.Success && !(bool)res.Result)
                    {
                        return new ServiceResult(res.Message);
                    }
                }
                //============================================

                var EdmsDoc = await _documentHelper.SaveDocumentToEDMS(document.file, modelObj.docdetails.tempname, modelObj.docdetails.expiredate.ToString("yyyy-MM-dd HH:mm:ss"), userDetails.Suid);
                if (!EdmsDoc.Success)
                {
                    logMessageType = SigningPortalLogMessageType.Failed;
                    MessageForLog = SigningPortalLogMessage.SaveDocumentFailed;

                    return new ServiceResult(_constantError.GetMessage("102524"));
                    //return new ServiceResult("Failed to save document in edms.");
                }

                ServiceResult OriginalEdmsDoc = null;

                if (document.originalFile != null)
                {
                    OriginalEdmsDoc = await _documentHelper.SaveDocumentToEDMS(document.originalFile, modelObj.docdetails.tempname, modelObj.docdetails.expiredate.ToString("yyyy-MM-dd HH:mm:ss"), userDetails.Suid);
                    if (!OriginalEdmsDoc.Success)
                    {
                        logMessageType = SigningPortalLogMessageType.Failed;
                        MessageForLog = SigningPortalLogMessage.SaveDocumentFailed;

                        return new ServiceResult(_constantError.GetMessage("102524"));
                        //return new ServiceResult("Failed to save document in edms.");
                    }
                }

                var documentData = new Document
                {
                    DocumentName = modelObj.docdetails.tempname,
                    OwnerID = userDetails.Suid,
                    OwnerEmail = userDetails.Email,
                    OwnerName = modelObj.docdetails.ownerName,
                    DaysToComplete = modelObj.docdetails.daysToComplete,
                    AutoReminders = modelObj.docdetails.autoReminders,
                    RemindEvery = modelObj.docdetails.remindEvery,
                    Status = DocumentStatusConstants.InProgress,
                    Annotations = modelObj?.signCords?.coordinates,
                    EsealAnnotations = modelObj?.esealCords?.coordinates,
                    QrCodeAnnotations = modelObj?.QrCords?.coordinates,
                    ExpireDate = modelObj.docdetails.expiredate,
                    Watermark = modelObj.watermarkText,
                    DisableOrder = modelObj.disableOrder,
                    MultiSign = modelObj.multisign,
                    IsMobile = modelObj.isMobile,
                    AllowToAssignSomeone = modelObj.allowToAssignSomeone,
                    RecepientCount = modelObj.docdetails.receps.Count,
                    EdmsId = EdmsDoc.Result.ToString(),
                    OriginalEdmsId = OriginalEdmsDoc != null ? OriginalEdmsDoc.Result.ToString() : string.Empty,
                    HtmlSchema = modelObj.htmlschema,
                    PdfSchema = modelObj.pdfschema,
                    CreateTime = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    OrganizationId = userDetails.OrganizationId,
                    OrganizationName = userDetails.OrganizationName,
                    AccountType = userDetails.AccountType.ToLower(),
                    SignaturesRequiredCount = modelObj.docdetails.signaturesRequiredCount,
                    QrCriticalData = criticalData != null ? JsonConvert.SerializeObject(criticalData) : ""
                };

                var receps = modelObj.docdetails.receps;

                foreach (var recep in receps)
                {
                    documentData.PendingSignList.Add(new User()
                    {
                        email = recep.email.ToLower(),
                        suid = recep.suid
                    });
                }

                _logger.LogInformation("documentData : " + JsonConvert.SerializeObject(documentData));

                var savedDocument = await _documentRepository.SaveDocument(documentData);



                //savedDocument.RecepientsIds = new List<string>();

                IList<Recepients> recepientsList = new List<Recepients>();
                Recepients recepients;

                foreach (var recep in receps)
                {
                    recepients = new Recepients
                    {
                        Name = recep.name,
                        Suid = recep.suid,
                        Email = recep.email.ToLower(),
                        Order = recep.order,
                        AllowComments = recep.allowComments,
                        SignatureMandatory = recep.signatureMandatory,
                        Tempid = savedDocument._id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        SigningReqTime = DateTime.UtcNow,
                        OrganizationId = recep.orgUID.Trim(),
                        OrganizationName = recep.orgName,
                        Status = (!savedDocument.DisableOrder && recep.order != 1)
                                        ? RecepientStatus.WaitingForOthers
                                        : RecepientStatus.NeedToSign,
                        Initial = recep.initial,
                        HasDelegation = recep.hasDelegation,
                        DelegationId = recep.delegationId,
                        SignTemplate = recep.signTemplate,
                        EsealTemplate = recep.esealTemplate
                    };

                    if (string.IsNullOrEmpty(recep.orgUID.Trim()))
                    {
                        recepients.AccountType = AccountTypeConstants.Self;
                    }
                    else
                    {
                        recepients.AccountType = AccountTypeConstants.Organization;
                    }

                    if (recep.alternateSignatoriesList.Count != 0)
                    {
                        recepients.AlternateSignatories = recep.alternateSignatoriesList;
                    }

                    StringComparison comp = StringComparison.OrdinalIgnoreCase;
                    if (!string.IsNullOrEmpty(esealCords) && recep.eseal && signCoordinatesObj["esealCords"].ToString().Contains(recep.suid, comp))
                    {
                        var obj = esealCoordinatesObj[recep.suid.ToLower()].ToString();

                        if (!string.IsNullOrEmpty(obj))
                        {
                            JObject currentRecepientEsealObj = JObject.Parse(obj);
                            recepients.EsealOrgId = currentRecepientEsealObj["organizationID"].ToString();
                        }
                    }

                    recepientsList.Add(recepients);

                    //var savedRecepients = await _recepientsRepository.SaveReceipt(recepients);

                    //_logger.LogInformation("savedRecepients : "+ JsonConvert.SerializeObject(savedRecepients));
                    //savedDocument.RecepientsIds.Add(savedRecepients._id);
                }

                var savedRecepients = await _recepientsRepository.SaveRecepientsAsync(recepientsList);

                _logger.LogInformation("Final savedDocument :" + JsonConvert.SerializeObject(savedDocument));
                //await _documentRepository.UpdateRecepientsListInDocumentById(savedDocument);

                try
                {
                    SendEmailObj emailObj = new SendEmailObj()
                    {
                        UserEmail = userDetails.Email,
                        UserName = userDetails.Name,
                        Id = savedDocument._id
                    };

                    _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendAnEmailToRecipient(emailObj, modelObj.actoken, savedDocument));

                }
                catch (Exception ex)
                {
                    Monitor.SendException(ex);
                    _logger.LogError(ex, ex.Message);
                    _logger.LogError("SaveNewDocumentAsync Exception : send email {0}", ex.Message);
                }

                saveNewDocumentResponse.tempid = savedDocument._id;

                logMessageType = SigningPortalLogMessageType.Success;
                MessageForLog = SigningPortalLogMessage.SaveDocumentSuccess;

                _logger.LogInformation("SaveNewDocumentAsync function time execution: {0}" + DateTime.UtcNow.Subtract(startTime).TotalSeconds);

                return new ServiceResult(saveNewDocumentResponse, "Document sent successfully");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                logMessageType = SigningPortalLogMessageType.Failed;
                MessageForLog = SigningPortalLogMessage.SaveDocumentFailed;

                _logger.LogError(ex, ex.Message);
                _logger.LogError("SaveNewDocumentAsync Exception :  {0}", ex.Message);
            }
            finally
            {
                var result = _logClient.SendLog(userDetails.Suid, SigningPortalLogServiceName.SaveDocument,
                      startTime, MessageForLog, logMessageType);
                if (0 != result)
                {
                    _logger.LogError("Failed to send log message to service log server");
                    //return new ClientResponse("Failed to send log message to service " +
                    //    "log server");
                }
            }

            _logger.LogInformation("SaveNewDocumentAsync function time execution: {0}" + DateTime.UtcNow.Subtract(startTime).TotalSeconds);
            return new ServiceResult(_constantError.GetMessage("102525"));
            //return new ServiceResult("An error occurred while saving document");
        }

        //public async Task<ServiceResult> SaveNewDocumentAsyncOld(SaveNewDocumentDTO document, UserDTO userDetails)
        //{
        //    // Get Start Time
        //    DateTime startTime = DateTime.UtcNow;
        //    var logMessageType = "";
        //    var MessageForLog = "";



        //    if (document.file == null)
        //    {
        //        logMessageType = SigningPortalLogMessageType.Failed;
        //        MessageForLog = SigningPortalLogMessage.SaveDocumentFailed;

        //        return new ServiceResult(_constantError.GetMessage("102521"));
        //        //return new ServiceResult("File cannot be null");
        //    }

        //    if (document.model == null)
        //    {
        //        logMessageType = SigningPortalLogMessageType.Failed;
        //        MessageForLog = SigningPortalLogMessage.SaveDocumentFailed;

        //        return new ServiceResult(_constantError.GetMessage("102522"));
        //        //return new ServiceResult("Model cannot be null");
        //    }

        //    try
        //    {
        //        _logger.LogInformation("SaveNewDocumentAsync document : " + document.model);

        //        JObject esealCoordinatesObj = null;
        //        SaveNewDocumentResponse saveNewDocumentResponse = new SaveNewDocumentResponse();
        //        Model modelObj = JsonConvert.DeserializeObject<Model>(document.model);
        //        JObject signCoordinatesObj = JObject.Parse(document.model);

        //        var signCords = signCoordinatesObj["signCords"].ToString();
        //        var esealCords = signCoordinatesObj["esealCords"].ToString();

        //        if (!string.IsNullOrEmpty(signCords))
        //        {
        //            modelObj.signCords.coordinates = JsonConvert.SerializeObject(signCoordinatesObj["signCords"]);
        //            //modelObj.esealCords.coordinates
        //        }

        //        if (!string.IsNullOrEmpty(esealCords))
        //        {
        //            modelObj.esealCords.coordinates = JsonConvert.SerializeObject(signCoordinatesObj["esealCords"]);

        //            esealCoordinatesObj = JObject.Parse(signCoordinatesObj["esealCords"].ToString());
        //        }

        //        //============================================
        //        if (!modelObj.multisign)
        //        {
        //            var isEsealPresent = false;
        //            StringComparison comp = StringComparison.OrdinalIgnoreCase;
        //            if (!string.IsNullOrEmpty(esealCords) &&
        //                modelObj.docdetails.receps[0].eseal &&
        //                signCoordinatesObj["esealCords"].ToString().Contains(userDetails.Suid, comp))
        //            {
        //                isEsealPresent = true;
        //            }

        //            //check credit available or not
        //            var res = await _paymentService.IsCreditAvailable(userDetails, isEsealPresent);
        //            if (res.Success && !(bool)res.Result)
        //            {
        //                return new ServiceResult(res.Message);
        //            }
        //        }
        //        //============================================

        //        var EdmsDoc = await _documentHelper.SaveDocumentToEDMS(document.file, modelObj.docdetails.tempname, modelObj.docdetails.expiredate.ToString("yyyy-MM-dd HH:mm:ss"), userDetails.Suid);
        //        if (!EdmsDoc.Success)
        //        {
        //            logMessageType = SigningPortalLogMessageType.Failed;
        //            MessageForLog = SigningPortalLogMessage.SaveDocumentFailed;

        //            return new ServiceResult(_constantError.GetMessage("102524"));
        //            //return new ServiceResult("Failed to save document in edms.");
        //        }

        //        var documentData = new Document
        //        {
        //            DocumentName = modelObj.docdetails.tempname,
        //            OwnerID = userDetails.Suid,
        //            OwnerEmail = userDetails.Email,
        //            OwnerName = modelObj.docdetails.ownerName,
        //            DaysToComplete = modelObj.docdetails.daysToComplete,
        //            AutoReminders = modelObj.docdetails.autoReminders,
        //            RemindEvery = modelObj.docdetails.remindEvery,
        //            Status = DocumentStatusConstants.InProgress,
        //            Annotations = modelObj?.signCords?.coordinates,
        //            EsealAnnotations = modelObj?.esealCords?.coordinates,
        //            ExpireDate = modelObj.docdetails.expiredate,
        //            Watermark = modelObj.watermarkText,
        //            DisableOrder = modelObj.disableOrder,
        //            MultiSign = modelObj.multisign,
        //            AllowToAssignSomeone = modelObj.allowToAssignSomeone,
        //            RecepientCount = modelObj.docdetails.receps.Count,
        //            EdmsId = EdmsDoc.Result.ToString(),
        //            CreateTime = DateTime.UtcNow,
        //            CreatedAt = DateTime.UtcNow,
        //            UpdatedAt = DateTime.UtcNow,
        //            OrganizationId = userDetails.OrganizationId,
        //            OrganizationName = userDetails.OrganizationName,
        //            AccountType = userDetails.AccountType.ToLower(),
        //            SignaturesRequiredCount = modelObj.docdetails.signaturesRequiredCount
        //        };

        //        var receps = modelObj.docdetails.receps;

        //        foreach (var recep in receps)
        //        {
        //            documentData.PendingSignList.Add(new User()
        //            {
        //                email = recep.email.ToLower(),
        //                suid = recep.suid
        //            });
        //        }

        //        _logger.LogInformation("documentData : " + JsonConvert.SerializeObject(documentData));

        //        var savedDocument = await _documentRepository.SaveDocument(documentData);



        //        //savedDocument.RecepientsIds = new List<string>();

        //        IList<Recepients> recepientsList = new List<Recepients>();
        //        Recepients recepients;

        //        foreach (var recep in receps)
        //        {
        //            recepients = new Recepients
        //            {
        //                Name = recep.name,
        //                Suid = recep.suid,
        //                Email = recep.email.ToLower(),
        //                Order = recep.order,
        //                AllowComments = recep.allowComments,
        //                SignatureMandatory = recep.signatureMandatory,
        //                Tempid = savedDocument._id,
        //                CreatedAt = DateTime.UtcNow,
        //                UpdatedAt = DateTime.UtcNow,
        //                OrganizationId = string.Empty,
        //                OrganizationName = string.Empty,
        //                AccountType = string.Empty,
        //                Status = RecepientStatus.NeedToSign
        //            };

        //            if (recep.alternateSignatoriesList.Count != 0)
        //            {
        //                recepients.AlternateSignatories = recep.alternateSignatoriesList;
        //            }

        //            StringComparison comp = StringComparison.OrdinalIgnoreCase;
        //            if (!string.IsNullOrEmpty(esealCords) && recep.eseal && signCoordinatesObj["esealCords"].ToString().Contains(recep.suid, comp))
        //            {
        //                var obj = esealCoordinatesObj[recep.suid.ToLower()].ToString();

        //                if (!string.IsNullOrEmpty(obj))
        //                {
        //                    JObject currentRecepientEsealObj = JObject.Parse(obj);
        //                    recepients.EsealOrgId = currentRecepientEsealObj["organizationID"].ToString();
        //                }
        //            }

        //            recepientsList.Add(recepients);

        //            //var savedRecepients = await _recepientsRepository.SaveReceipt(recepients);

        //            //_logger.LogInformation("savedRecepients : "+ JsonConvert.SerializeObject(savedRecepients));
        //            //savedDocument.RecepientsIds.Add(savedRecepients._id);
        //        }

        //        var savedRecepients = await _recepientsRepository.SaveRecepientsAsync(recepientsList);

        //        _logger.LogInformation("Final savedDocument :" + JsonConvert.SerializeObject(savedDocument));
        //        //await _documentRepository.UpdateRecepientsListInDocumentById(savedDocument);

        //        try
        //        {
        //            SendEmailObj emailObj = new SendEmailObj()
        //            {
        //                UserEmail = userDetails.Email,
        //                UserName = userDetails.Name,
        //                Id = savedDocument._id
        //            };

        //            await _documentHelper.SendAnEmailToRecipient(emailObj, modelObj.actoken, savedDocument);
        //        }
        //        catch (Exception ex)
        //        {
        //            _logger.LogError(ex, ex.Message);
        //            _logger.LogError("SaveNewDocumentAsync Exception : send email {0}", ex.Message);
        //        }

        //        saveNewDocumentResponse.tempid = savedDocument._id;

        //        logMessageType = SigningPortalLogMessageType.Success;
        //        MessageForLog = SigningPortalLogMessage.SaveDocumentSuccess;

        //        _logger.LogInformation("SaveNewDocumentAsync function time execution: {0}" + DateTime.UtcNow.Subtract(startTime).TotalSeconds);

        //        return new ServiceResult(saveNewDocumentResponse, "Successfully saved document");
        //    }
        //    catch (Exception ex)
        //    {
        //        logMessageType = SigningPortalLogMessageType.Failed;
        //        MessageForLog = SigningPortalLogMessage.SaveDocumentFailed;

        //        _logger.LogError(ex, ex.Message);
        //        _logger.LogError("SaveNewDocumentAsync Exception :  {0}", ex.Message);
        //    }
        //    finally
        //    {
        //        var result = _logClient.SendLog(userDetails.Suid, SigningPortalLogServiceName.SaveDocument,
        //              startTime, MessageForLog, logMessageType);
        //        if (0 != result)
        //        {
        //            _logger.LogError("Failed to send log message to service log server");
        //            //return new ClientResponse("Failed to send log message to service " +
        //            //    "log server");
        //        }
        //    }

        //    _logger.LogInformation("SaveNewDocumentAsync function time execution: {0}" + DateTime.UtcNow.Subtract(startTime).TotalSeconds);
        //    return new ServiceResult(_constantError.GetMessage("102525"));
        //    //return new ServiceResult("An error occurred while saving document");
        //}

        public async Task<ServiceResult> GetAllDocumentsAsync(UserDTO user)
        {
            if (user == null)
            {
                return new ServiceResult(_constantError.GetMessage("102526"));
                //return new ServiceResult("User details cannot be null");
            }

            try
            {
                var allDocuments = await _documentRepository.GetAllDocumentsBySuid(user.Suid);



                AllDocumentsResponse response = new AllDocumentsResponse()
                {
                    data = allDocuments,
                    allowed_no_of_files = _configuration.GetValue<int>("AllowedNoOfFileSize")
                };


                return new ServiceResult(response, "Successfully received documents");

            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("GetAllDocumentsAsync Exception :  {0}", ex.Message);
            }

            return new ServiceResult(_constantError.GetMessage("102527"));
            //return new ServiceResult("An error occurred while receiving documents");
        }

        public async Task<ServiceResult> GetDocumentDetaildByIdAsync(string id)
        {
            if (id == null)
            {
                return new ServiceResult(_constantError.GetMessage("102528"));
                //return new ServiceResult("Id cannot be null");
            }

            try
            {
                var response = await _documentHelper.GetDocumentById(id)
                ?? throw new InvalidOperationException("Document not found.");

                response.Recepients = response.Recepients?
                                        .OrderBy(r => r.Order)
                                        .ToList();

                return new ServiceResult(response, "Successfully received documents");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("GetDocumentDetaildByIdAsync Exception :  {0}", ex.Message);
            }

            return new ServiceResult(_constantError.GetMessage("102527"));
            //return new ServiceResult("An error occurred while receiving document");
        }

        public async Task<ServiceResult> GetDocumentDisplayDetaildByIdAsync(string id)
        {
            if (id == null)
            {
                //return new ServiceResult(_constantError.GetMessage("102528"));
                return new ServiceResult("Id cannot be null");
            }

            try
            {
                var response = await _documentHelper.GetDocumentById(id);
                if (response == null)
                {
                    _logger.LogInformation("Document not found");
                    return new ServiceResult("Document not found");
                }

                DocDisplayDTO docDisplay = new()
                {
                    DocumentName = response.DocumentName,
                    OwnerName = response.OwnerName,
                    OwnerEmail = response.OwnerEmail,
                    Status = response.Status,
                    SignatoryCount = response.RecepientCount,
                };
                //foreach (var recep in response.Recepients)
                //{
                //    UserDetails detail = new UserDetails() 
                //    {
                //        Name = recep.Name,
                //        Email = recep.Email
                //    };
                //    docDisplay.SignerDetails.Add(detail);
                //}

                var serviceResult = await _edmsService.GetDocumentAsync(response.EdmsId);
                if (!serviceResult.Success)
                {
                    _logger.LogInformation(serviceResult.Message);
                    return new ServiceResult(serviceResult.Message);
                }

                byte[] file = (byte[])serviceResult.Result;

                docDisplay.Document = Convert.ToBase64String(file);

                VerifySignedDocumentDTO verifySignedDocumentDTO = new VerifySignedDocumentDTO()
                {
                    docData = docDisplay.Document,
                    suid = response.OwnerID,
                    email = response.OwnerEmail,
                };

                var verify = await VerifySignedDocumentAsync(verifySignedDocumentDTO);
                if (verify == null)
                {
                    _logger.LogInformation(verify.Message);
                    return new ServiceResult(verify.Message);
                }

                docDisplay.VerificationDetails = (VerifySigningRequestResponse)verify.Result;

                return new ServiceResult(docDisplay, "Successfully received documents");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("GetDocumentDetaildByIdAsync Exception :  {0}", ex.Message);
            }

            //return new ServiceResult(_constantError.GetMessage("102527"));
            return new ServiceResult("An error occurred while receiving document");
        }

        public async Task<ServiceResult> DeleteDocumentByIdListAsync(DeleteDocumentDTO idList)
        {
            if (idList == null)
            {
                return new ServiceResult(_constantError.GetMessage("102529"));
                //return new ServiceResult("List of id cannot be empty");
            }

            try
            {
                await _documentRepository.DeleteDocumentsByIdsAsync(idList.dele);
                await _recepientsRepository.DeleteRecepientsByTempId(idList.dele);

                return new ServiceResult(null, "Documents deleted successfully");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("DeleteDocumentByIdListAsync Exception :  {0}", ex.Message);
            }

            return new ServiceResult(_constantError.GetMessage("102530"));
            //return new ServiceResult("An error occurred while deleting document");
        }

        public async Task<ServiceResult> DeleteAllDocumentsBySuidAsync(string suid)
        {
            if (string.IsNullOrWhiteSpace(suid))
            {
                return new ServiceResult(_constantError.GetMessage("102529"));
            }

            try
            {
                var documentIds = new List<string>();

                // Step 1: Get documents directly by SUID
                var documents = await _documentRepository.GetAllDocumentsBySuid(suid);
                if (documents != null)
                {
                    documentIds.AddRange(documents.Select(d => d._id));
                }

                // Step 2: Get recipients by SUID and alternate email SUID
                var recipients = await _recepientsRepository.GetRecepientsBySuidAsync(suid);
                var altRecipients = await _recepientsRepository.GetRecepientsByAlternateEmailSuidAsync(suid);

                // Step 3: Collect TempIDs
                var tempIdList = recipients
                    .Concat(altRecipients)
                    .Select(r => r.Tempid)
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .Distinct()
                    .ToList();

                // Step 4: Get documents linked to TempIDs
                var tempIdDocs = await _documentRepository.GetDocumentByTempIdList(tempIdList);
                if (tempIdDocs != null)
                {
                    documentIds.AddRange(tempIdDocs.Select(d => d._id));
                }

                // Final distinct list of document IDs to delete
                documentIds = documentIds.Distinct().ToList();

                // Step 5: Perform deletions
                if (documentIds.Count > 0)
                {
                    await _documentRepository.DeleteDocumentsByIdsAsync(documentIds);
                    await _recepientsRepository.DeleteRecepientsByTempId(documentIds);
                }

                return new ServiceResult(null, "Documents deleted successfully");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("DeleteAllDocumentsBySuidAsync Exception: {0}", ex.Message);
                return new ServiceResult(_constantError.GetMessage("102530"));
            }
        }

        public async Task<ServiceResult> GetDeclinedCommentDetailsAsync(string tempid)
        {
            if (tempid == null)
            {
                return new ServiceResult(_constantError.GetMessage("102528"));
                //return new ServiceResult("Id cannot be null");
            }

            try
            {
                var response = await _recepientsRepository.DeclinedCommentDetailsAsync(tempid);
                return new ServiceResult(response, "Successfully recieved decline comment");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("GetDeclinedCommentDetailsAsync Exception :  {0}", ex.Message);
            }

            return new ServiceResult(_constantError.GetMessage("102531"));
            //return new ServiceResult("An error occurred while receiving signing declined comment");
        }

        public async Task<ServiceResult> DeclineDocumentSigningAsync(string tempId, DeclineDocumentSigningDTO declineDocumentSigning)
        {
            if (tempId == null)
            {
                return new ServiceResult(_constantError.GetMessage("102528"));
                //return new ServiceResult("Id cannot be null");
            }

            if (declineDocumentSigning == null)
            {
                return new ServiceResult(_constantError.GetMessage("102532"));
                //return new ServiceResult("Data cannot be null");
            }

            try
            {
                var rejectedByUser = new User()
                {
                    email = declineDocumentSigning.UserEmail,
                    suid = declineDocumentSigning.Suid
                };

                var document = await _documentHelper.GetDocumentById(tempId);
                if (document == null)
                {
                    _logger.LogError($"Document details not found for documentId :: {tempId}");
                    return new ServiceResult("Document details not found");
                }

                if (document.Status == DocumentStatusConstants.Declined)
                {
                    _logger.LogError("Document has already been rejected.");
                    return new ServiceResult("This document has already been rejected by one of the signatories");
                }

                //current recepient
                var recepient = document.Recepients.FirstOrDefault(x =>
                                                                    x.Suid == rejectedByUser.suid ||
                                                                    x.AlternateSignatories.Any(a => a.suid == rejectedByUser.suid));

                if (recepient?.TakenAction == true)
                {
                    var msg = recepient.Status == RecepientStatus.Rejected
                        ? "Document has already been rejected"
                        : "Document has already been signed";

                    return new ServiceResult(msg);
                }


                var update = await _recepientsRepository.DeclineSigningAsync(tempId, rejectedByUser, declineDocumentSigning.Comment);
                if (update == false)
                {
                    _logger.LogError("Failed to update recepient");
                    return new ServiceResult(_constantError.GetMessage("102533"));
                }

                var updateDoc = await _documentRepository.UpdateDocumentStatusAsync(tempId, DocumentStatusConstants.Declined);
                if (updateDoc == false)
                {
                    _logger.LogError("Failed to update document status");
                    return new ServiceResult(_constantError.GetMessage("102533"));
                }

                NotificationDTO notification = new NotificationDTO()
                {
                    Receiver = document.OwnerID,
                    Sender = declineDocumentSigning.UserEmail,
                    Text = declineDocumentSigning.UserName + " has declined to sign the document",
                    Link = "/dashboard/document/" + tempId + "/status"
                };

                _backgroundService.RunBackgroundTask<INotificationService>(sender =>
                    sender.CreateNotificationAsync(
                        notification,
                        document.OrganizationId,
                        new(NotificationTypeConstants.Document, tempId)));

                bool pushNotification = _configuration.GetValue<bool>("PushNotification");

                if (pushNotification && declineDocumentSigning.acToken is string acToken)
                {
                    _backgroundService.RunBackgroundTask<IGenericPushNotificationService>(
                        sender => sender.SendGenericPushNotification(
                            acToken,
                            document.OwnerID,
                            $"{notification.Text} {document.DocumentName}"
                        )
                    );
                }

                _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendDeclineSignatureNotifiactionToAllRecepient(tempId, notification, declineDocumentSigning.acToken));

                //var content = declineDocumentSigning.UserName + " has declined to sign the document sent by "+document.OwnerName;

                var content = "The document " + "<b>" + document.DocumentName + "</b>" + " sent by " + document.OwnerName + " has been rejected by " + declineDocumentSigning.UserName;

                content = (!string.IsNullOrEmpty(declineDocumentSigning.Comment)) ? content + ". <br/> Rejection Comment : " + declineDocumentSigning.Comment + ".<br/>" : content;

                _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendEmailToAllRecepients(tempId, content, "Document Rejected", false, false));

                return new ServiceResult(null, "Signing declined sucessfully");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("DeclineDocumentSigningAsync Exception :  {0}", ex.Message);
            }

            return new ServiceResult(_constantError.GetMessage("102533"));
            //return new ServiceResult("An error occurred while decline signing");
        }

        public async Task<ServiceResult> RecallDocumentToSignAsync(string tempId)
        {
            if (tempId == null)
            {
                return new ServiceResult(_constantError.GetMessage("102528"));
                //return new ServiceResult("Id cannot be null");
            }

            try
            {
                var updateDoc = await _documentRepository.UpdateDocumentStatusAsync(tempId, DocumentStatusConstants.Recalled);
                if (updateDoc == false)
                {
                    _logger.LogError("Failed to update document");
                }

                return new ServiceResult(null, "Successfully recalled document to sign");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("RecallDocumentToSignAsync Exception :  {0}", ex.Message);
            }

            //return new ServiceResult(_constantError.GetMessage("102534"));
            return new ServiceResult("Failed to recall document");
        }

        //Currently not using
        //public async Task<ServiceResult> GetPendingActionListAsync(string email)
        //{
        //    if (email == null)
        //    {
        //        return new ServiceResult(_constantError.GetMessage("102535"));
        //        //return new ServiceResult("Email cannot be null");
        //    }

        //    try
        //    {
        //        List<string> actionRequiredArray = new List<string>();

        //        List<string> expireSoonArray = new List<string>();

        //        var recepientsList = await _recepientsRepository.GetRecepientsListByTakenActionAsync(email, false);

        //        //_logger.LogInformation("recepientsList : " + JsonConvert.SerializeObject(recepientsList));

        //        foreach (var recepient in recepientsList)
        //        {

        //            var documents = await _documentRepository.GetDocumentByRecepientsTempIdAsync(recepient.Tempid);
        //            if (documents != null)
        //            {
        //                DateTime untilDate = documents.CreatedAt.AddDays(Convert.ToDouble(documents.DaysToComplete));
        //                var expiredays = Math.Round(Math.Abs((untilDate - DateTime.UtcNow).TotalDays));

        //                if (Convert.ToInt32(recepient.Order) == 1 && expiredays >= 0)
        //                {
        //                    actionRequiredArray.Add(recepient.Tempid);
        //                    if (expiredays <= 2)
        //                    {
        //                        expireSoonArray.Add(recepient.Tempid);
        //                    }
        //                }
        //                else if (Convert.ToInt32(recepient.Order) > 1 && expiredays >= 0)
        //                {
        //                    if (documents.DisableOrder)
        //                    {
        //                        actionRequiredArray.Add(recepient.Tempid);
        //                        if (expiredays <= 2)
        //                        {
        //                            expireSoonArray.Add(recepient.Tempid);
        //                        }
        //                    }
        //                    else
        //                    {
        //                        var prevOrderRecepient = _recepientsRepository.GetRecepientsListByTempIdAsync(recepient).Result;
        //                        if (prevOrderRecepient[0].TakenAction)
        //                        {
        //                            actionRequiredArray.Add(recepient.Tempid);
        //                            if (expiredays <= 2)
        //                            {
        //                                expireSoonArray.Add(recepient.Tempid);
        //                            }
        //                        }
        //                    }
        //                }
        //            }
        //        }

        //        var actionRequiredDocs = await _documentRepository.GetPendingDocumentListAsync(actionRequiredArray, new List<string>() { DocumentStatusConstants.InProgress });
        //        //_logger.LogInformation("actionRequiredDocs : " + actionRequiredDocs.Count());
        //        IList<Recepients> completedRecepients = await _recepientsRepository.GetRecepientsListByTakenActionAsync(email, true);

        //        var complete = completedRecepients.Select(x => x.Tempid).ToList<string>();
        //        //var complete = completedRecepients.Select(x => x._id).ToList<string>();
        //        //_logger.LogInformation("complete : " + complete.Count());
        //        var completedDocuments = await _documentRepository.GetPendingDocumentListAsync(complete, new List<string>() { DocumentStatusConstants.InProgress, DocumentStatusConstants.Completed });

        //        PendingActionList pendingActionList = new PendingActionList
        //        {
        //            ActionRequiredDocs = actionRequiredDocs,
        //            CompletedDocs = completedDocuments
        //        };

        //        PendingActionListResponse pendingList = new PendingActionListResponse
        //        {
        //            Docs_data = pendingActionList
        //        };

        //        return new ServiceResult(pendingList, "Successfully received pending action document list");

        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, ex.Message);
        //        _logger.LogError("GetPendingActionListAsync Exception :  {0}", ex.Message);
        //    }

        //    return new ServiceResult(_constantError.GetMessage("102536"));
        //    //return new ServiceResult("Failed to get pending action document list");
        //}

        //Currently not using
        //public async Task<ServiceResult> GetExpireActionListAsync(string email)
        //{
        //    if (email == null)
        //    {
        //        return new ServiceResult(_constantError.GetMessage("102535"));
        //        //return new ServiceResult("Email cannot be null");
        //    }

        //    try
        //    {
        //        List<string> actionRequiredArray = new List<string>();

        //        List<string> expireSoonArray = new List<string>();

        //        var recepientsList = await _recepientsRepository.GetRecepientsListByTakenActionAsync(email, false);

        //        foreach (var recepient in recepientsList)
        //        {

        //            var documents = await _documentRepository.GetDocumentByRecepientsTempIdAsync(recepient.Tempid);
        //            if (documents != null)
        //            {
        //                DateTime untilDate = documents.CreatedAt.AddDays(Convert.ToDouble(documents.DaysToComplete));
        //                var expiredays = Math.Round(Math.Abs((untilDate - DateTime.UtcNow).TotalDays));

        //                if (Convert.ToInt32(recepient.Order) == 1 && expiredays >= 0)
        //                {
        //                    actionRequiredArray.Add(recepient.Tempid);
        //                    if (expiredays <= 2)
        //                    {
        //                        expireSoonArray.Add(recepient.Tempid);
        //                    }
        //                }
        //                else if (Convert.ToInt32(recepient.Order) > 1 && expiredays >= 0)
        //                {
        //                    var prevOrderRecepient = _recepientsRepository.GetRecepientsListByTempIdAsync(recepient).Result;
        //                    if (prevOrderRecepient[0].TakenAction)
        //                    {
        //                        actionRequiredArray.Add(recepient.Tempid);
        //                        if (expiredays <= 2)
        //                        {
        //                            expireSoonArray.Add(recepient.Tempid);
        //                        }
        //                    }
        //                }
        //            }
        //        }

        //        var expiringSoonDocuments = await _documentRepository.GetPendingDocumentListAsync(expireSoonArray, new List<string>() { DocumentStatusConstants.InProgress });

        //        ExpiringSoonDocumentListDTO expiringSoonDocumentList = new ExpiringSoonDocumentListDTO()
        //        {
        //            ExpiringSoonDocs = expiringSoonDocuments
        //        };

        //        return new ServiceResult(expiringSoonDocumentList, "Successfully received expired action document list");
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, ex.Message);
        //        _logger.LogError("GetExpireActionListAsync Exception :  {0}", ex.Message);
        //    }

        //    return new ServiceResult(_constantError.GetMessage("102537"));
        //    //return new ServiceResult("Failed to get expired action document list");
        //}

        public async Task<ServiceResult> SendSigningRequestAsync(SigningRequestDTO signingRequest, UserDTO userDTO)
        {
            // Get Start Time
            DateTime startTime = DateTime.UtcNow;
            var logMessageType = "";
            var MessageForLog = "";
            var Suid = "";
            bool isEsealPresent = false;
            bool isSignaturePresent = false;
            SigningRequestModel modelObj = null;
            Recepients recepient = null;
            bool unBlockDoc = false;


            if (signingRequest == null)
            {
                logMessageType = SigningPortalLogMessageType.Failed;
                MessageForLog = SigningPortalLogMessage.SendDocumentFailed;

                return new ServiceResult(_constantError.GetMessage("102538"));
                //return new ServiceResult("Signing request data cannot be null");
            }
            if (signingRequest.signfile == null)
            {
                logMessageType = SigningPortalLogMessageType.Failed;
                MessageForLog = SigningPortalLogMessage.SendDocumentFailed;
                return new ServiceResult(_constantError.GetMessage("102521"));
                //return new ServiceResult("File cannot be null");
            }

            double fileSizeLimit = _configuration.GetValue<double>("FileSizeLimit");
            long maxSizeInBytes = (long)(fileSizeLimit * 1024 * 1024);

            if (signingRequest.signfile.Length > maxSizeInBytes)
            {
                _logger.LogError($"File size should be {(int)maxSizeInBytes} MB or below.");
                return new ServiceResult($"File size should be {(int)maxSizeInBytes} MB or below.");
            }

            if (signingRequest.model == null)
            {
                logMessageType = SigningPortalLogMessageType.Failed;
                MessageForLog = SigningPortalLogMessage.SendDocumentFailed;
                return new ServiceResult(_constantError.GetMessage("102522"));
                //return new ServiceResult("Model cannot be null");
            }

            try
            {
                _logger.LogInformation("Signing Request Object : {0}", signingRequest.model);

                modelObj = JsonConvert.DeserializeObject<SigningRequestModel>(signingRequest.model);

                var document = await _documentRepository.GetDocumentByTempIdAsync(modelObj.tempid);
                if (document == null)
                {
                    _logger.LogError("Document details not found");
                    return new ServiceResult("Document details not found");
                }

                if (document.Status == DocumentStatusConstants.Declined)
                {
                    _logger.LogError("Document has already been rejected.");
                    return new ServiceResult("This document has already been rejected by one of the signatories");
                }

                if (document.DisableOrder && (document.CompleteSignList?.Count ?? 0) != modelObj.completeSignCount)
                {
                    return new ServiceResult("The original document has been updated. Please refresh the document.");
                }

                // Redis Document Block Check
                var docBlock = await _cacheClient.Get<string>(modelObj.tempid, "BlockStatus");
                if (!string.IsNullOrEmpty(docBlock))
                {
                    string msg = "Another signatory is currently signing this document. Please try again shortly.";
                    if (docBlock == userDTO.Suid)
                        msg = "Document signing has initiated. Please try again shortly.";

                    _logger.LogInformation($"Document Id: {modelObj.tempid}");
                    _logger.LogInformation("Redis: Document is blocked.");
                    return new ServiceResult(document, msg, false);

                }
                else
                {
                    await _cacheClient.Add(modelObj.tempid, "BlockStatus", userDTO.Suid);
                    _logger.LogInformation($"Document Blocked in Redis :: {modelObj.tempid}");
                }

                if (document.IsDocumentBlocked)
                {
                    _logger.LogInformation("Document Id : " + modelObj.tempid);
                    _logger.LogInformation("Document is blocked.");
                    return new ServiceResult(document, "Document signing is in progress please retry after some time", false);
                }
                else
                {
                    var update = await _documentRepository.UpdateDocumentBlockedStatusAsync(modelObj.tempid, true);
                    if (!update)
                    {
                        _logger.LogError("Failed to update document blocked status");
                    }
                }

                if (string.IsNullOrEmpty(modelObj.actoken))
                {
                    unBlockDoc = true;
                    return new ServiceResult("Access token cannot be null");
                }

                var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
                var isDevelopment = environment == Environments.Development;

                _logger.LogInformation("SigningRequest Environment : " + environment);

                Suid = modelObj.suid;
                var fileName = signingRequest.signfile.FileName;

                SigningServiceDTO data = new SigningServiceDTO()
                {
                    accountType = userDTO.AccountType.ToLower(),
                    accountId = (userDTO.AccountType.ToLower() == AccountTypeConstants.Self) ? userDTO.Suid : userDTO.OrganizationId,
                    documentType = _configuration.GetValue<string>("SigningService:SignDocType"),
                    subscriberUniqueId = modelObj.suid,
                    organizationUid = modelObj.organizationID,
                    authPin = modelObj.AuthPin,
                    signPin = modelObj.SignPin,
                    mobile = modelObj.IsMobile,
                    userPhoto = modelObj.UserPhoto,
                    signatureTemplateId = modelObj.SignTemplate,
                    esealTemplateId = modelObj.EsealTemplate,

                    placeHolderCoordinates = new placeHolderCoordinates
                    {
                        pageNumber = modelObj.pageNumber?.ToString(),
                        signatureXaxis = modelObj.posX?.ToString(),
                        signatureYaxis = modelObj.posY?.ToString(),
                        imgHeight = modelObj.height?.ToString(),
                        imgWidth = modelObj.width?.ToString(),
                    },

                };

                if (isDevelopment)
                {
                    data.callbackURL = _configuration.GetValue<string>("CallBackUrl") + "/api/signed-document";
                }
                else
                {
                    data.callbackURL = _configuration.GetValue<string>("Config:Signing_portal:BACKEND_URL") + "/api/signed-document";
                }

                if (modelObj.signVisible > 0)
                {

                    if (modelObj.posX < 0 && modelObj.posY < 0 && modelObj.EsealPosX < 0 && modelObj.EsealPosY < 0)
                    {
                        unBlockDoc = true;
                        return new ServiceResult("The annotation is invalid or exceeding the PDF boundaries. Please adjust its size or position to fit within the document limits.");
                    }

                    if (modelObj.pageNumber != null && modelObj.posX != null && modelObj.posY != null &&
                        modelObj.pageNumber > 0 && modelObj.posX >= 0 && modelObj.posY >= 0)
                    {
                        isSignaturePresent = true;
                    }

                    if (modelObj.EsealPageNumber != null && modelObj.EsealPosX != null && modelObj.EsealPosY != null &&
                        modelObj.EsealPageNumber > 0 && modelObj.EsealPosX >= 0 && modelObj.EsealPosY >= 0)
                    {
                        data.esealPlaceHolderCoordinates = new esealplaceHolderCoordinates
                        {
                            pageNumber = modelObj.EsealPageNumber?.ToString(),
                            signatureXaxis = modelObj.EsealPosX?.ToString(),
                            signatureYaxis = modelObj.EsealPosY?.ToString(),
                            imgWidth = modelObj.EsealWidth?.ToString(),
                            imgHeight = modelObj.EsealHeight?.ToString(),
                        };
                        isEsealPresent = true;
                    }
                }
                else
                {
                    isSignaturePresent = true;
                }

                if (modelObj.QrPageNumber != null && modelObj.QrPosX != null && modelObj.QrPosY != null &&
                        modelObj.QrPageNumber > 0 && modelObj.QrPosX >= 0 && modelObj.QrPosY >= 0)
                {
                    data.qrPlaceHolderCoordinates = new qrPlaceHolderCoordinates
                    {
                        pageNumber = modelObj.QrPageNumber?.ToString(),
                        signatureXaxis = modelObj.QrPosX?.ToString(),
                        signatureYaxis = modelObj.QrPosY?.ToString(),
                        imgHeight = modelObj.QrHeight?.ToString(),
                        imgWidth = modelObj.QrWidth?.ToString(),
                    };
                    data.qrCodeRequired = true;

                    var crit = JsonConvert.DeserializeObject<CriticalData>(document.QrCriticalData ?? string.Empty);

                    var isEnncrypted = _configuration.GetValue<bool>("EncryptionEnabled");


                    var myTrustDTOQRObject = new QRCodeObjectMyTrustDTO
                    {
                        publicData = new List<string>
                        {
                            userDTO.Name,
                            userDTO.OrganizationName ?? string.Empty
                        },
                        privateData = new List<string>
                        {
                            modelObj.tempid,
                            crit?.entityName ?? string.Empty,
                            crit?.docSerialNo ?? string.Empty
                        },
                        credentialId = isEnncrypted ?
                                        PKIMethods.Instance.PKIDecryptSecureWireData(_configuration.GetValue<string>("QRCredentialId")) :
                                        _configuration.GetValue<string>("QRCredentialId")
                    };
                    data.qrCodeData = JsonConvert.SerializeObject(myTrustDTOQRObject);

                }

                recepient = await _recepientsRepository.GetRecepientsBySuidAndTempId(modelObj.suid, modelObj.tempid);
                if (recepient.TakenAction == true)
                {
                    _logger.LogInformation("Document Id : " + modelObj.tempid);
                    _logger.LogInformation("Signatory has already taken action for this document");
                    unBlockDoc = true;

                    var msg = recepient.Status == RecepientStatus.Rejected
                        ? "Document has already been rejected"
                        : "Document has already been signed";

                    return new ServiceResult(msg);
                }

                if (recepient != null)
                {
                    data.deligationSign = recepient.HasDelegation;
                }

                //get delegation details
                if (recepient.HasDelegation)
                {
                    var delegatorDetails = await _delegationRepository.GetDelegateById(recepient.DelegationId);
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

                            unBlockDoc = true;
                            return new ServiceResult("Delegation period is expired.");
                        }
                    }

                    if (delegatorDetails.DelegationStatus == DelegateConstants.Expired)
                    {
                        unBlockDoc = true;
                        return new ServiceResult("Delegation period is expired.");
                    }

                    if (delegatorDetails.DelegationStatus == DelegateConstants.Cancelled)
                    {
                        unBlockDoc = true;
                        return new ServiceResult("Delegation has been revoked.");
                    }
                }

                //check credit available or not
                var res = await _paymentService.IsCreditAvailable(userDTO, isEsealPresent, isSignaturePresent);
                if (res.Success && !(bool)res.Result)
                {
                    _logger.LogInformation("Credits not available for " + userDTO.Email);
                    unBlockDoc = true;
                    return new ServiceResult(res.Message);
                }

                recepient.Status = RecepientStatus.Signing;

                var updateRecep = await _recepientsRepository.UpdateRecepientsById(recepient);
                if (!updateRecep)
                {
                    _logger.LogError("Failed to update Recepient");
                }

                if (!fileName.Contains(".pdf"))
                {
                    fileName = fileName + ".pdf";
                }
                HttpResponseMessage response = null;
                var url = string.Empty;
                if (isSignaturePresent == false && isEsealPresent == true)
                {
                    url = _configuration.GetValue<string>("Config:ESealSignServiceUrl");
                }
                else
                {
                    url = _configuration.GetValue<string>("Config:SignServiceUrl");
                }

                using (var multipartFormContent = new MultipartFormDataContent())
                {
                    // Read file stream into memory to avoid "Broken pipe" errors
                    var memoryStream = new MemoryStream();
                    await signingRequest.signfile.OpenReadStream().CopyToAsync(memoryStream);
                    memoryStream.Position = 0;

                    var fileSize = memoryStream.Length;
                    _logger.LogInformation("File size: {0} bytes", fileSize);

                    var fileStreamContent = new StreamContent(memoryStream);
                    fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");

                    var json = JsonConvert.SerializeObject(data);
                    _logger.LogInformation("Json Signing Request Body: " + json);

                    // Add file and JSON model
                    multipartFormContent.Add(fileStreamContent, name: "file", fileName: fileName);
                    multipartFormContent.Add(new StringContent(json), "model");

                    _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modelObj.actoken);
                    _logger.LogInformation("actoken: " + modelObj.actoken);
                    _logger.LogInformation("Document Id: " + modelObj.tempid);

                    DateTime startTimeForAPI = DateTime.UtcNow;
                    _logger.LogInformation("Signing service call start: " + startTimeForAPI);

                    try
                    {
                        response = await _client.PostAsync(url, multipartFormContent);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError("Error during HTTP POST: " + ex.Message, ex);
                        throw;
                    }

                    DateTime endTimeForAPI = DateTime.UtcNow;
                    TimeSpan diff = endTimeForAPI - startTimeForAPI;

                    _logger.LogInformation("Signing service call end: " + endTimeForAPI);
                    _logger.LogInformation("Total time taken to update SignService call in seconds: {0}", diff.TotalSeconds);
                    _logger.LogInformation("Document Id: " + modelObj.tempid);
                }
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    var res1 = await response.Content.ReadAsStringAsync();
                    APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
                    if (apiResponse.Success)
                    {

                        _logger.LogInformation("Document Id : " + modelObj.tempid);
                        _logger.LogInformation("Signed request Corelation Id :{0} ", apiResponse.Result.ToString());
                        _logger.LogInformation("Signed request Recepient Email Id :{0} ", modelObj.userEmail.ToLower());
                        _logger.LogInformation("Signed request Recepient Tempid :{0} ", modelObj.tempid);

                        //recepient.Suid = modelObj.suid;
                        recepient.Name = modelObj.userName;
                        recepient.CorrelationId = apiResponse.Result.ToString();
                        recepient.UpdatedAt = DateTime.UtcNow;
                        recepient.SigningCompleteTime = DateTime.UtcNow;
                        recepient.AccessToken = modelObj.actoken;
                        recepient.SignedBy = userDTO.Email;
                        recepient.OrganizationName = userDTO.OrganizationName;
                        recepient.OrganizationId = userDTO.OrganizationId;
                        recepient.AccountType = userDTO.AccountType.ToLower();
                        recepient.Status = RecepientStatus.SigningInProgress;

                        var updateRecepient = await _recepientsRepository.UpdateRecepientsById(recepient);
                        if (updateRecepient == false)
                        {
                            _logger.LogError("Failed to update recepient");
                        }
                        SendSigningRequestResponse serviceResponse = new SendSigningRequestResponse
                        {
                            CorrelationId = apiResponse.Result.ToString()
                        };

                        logMessageType = SigningPortalLogMessageType.Success;
                        MessageForLog = SigningPortalLogMessage.SendDocumentSuccess;

                        _logger.LogInformation("Signing request complete for document id : " + modelObj.tempid);
                        return new ServiceResult(serviceResponse, apiResponse.Message);
                    }
                    else
                    {
                        recepient.Status = apiResponse.Result != null ? RecepientStatus.PinFailed : RecepientStatus.Failed;

                        var updateRecepient = await _recepientsRepository.UpdateRecepientsById(recepient);
                        if (!updateRecepient)
                        {
                            _logger.LogError("Failed to update Recepient");
                        }

                        unBlockDoc = true;
                        logMessageType = SigningPortalLogMessageType.Failed;
                        MessageForLog = SigningPortalLogMessage.SendDocumentFailed;
                        _logger.LogInformation("Document Id : " + modelObj.tempid);
                        _logger.LogError("Signing request response : " + apiResponse.Message);
                        _logger.LogError("SendSigningRequestAsync response");
                        return new ServiceResult(apiResponse.Message);
                    }
                }
                else
                {
                    if (recepient != null)
                    {
                        recepient.Status = RecepientStatus.Failed;

                        var updateRecepient = await _recepientsRepository.UpdateRecepientsById(recepient);
                        if (!updateRecepient)
                        {
                            _logger.LogError("Failed to update Recepient");
                        }
                    }

                    Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
                    $"with status code={response.StatusCode}");

                    unBlockDoc = true;
                    logMessageType = SigningPortalLogMessageType.Failed;
                    MessageForLog = SigningPortalLogMessage.SendDocumentFailed;
                    _logger.LogInformation("Document Id : " + modelObj.tempid);
                    _logger.LogError($"The request with URI={response.RequestMessage.RequestUri} failed " +
                               $"with status code={response.StatusCode}" + $" error = {response.ReasonPhrase}");
                    //return new ServiceResult(_constantError.GetMessage("102539"));
                    return new ServiceResult("Signing failed");
                }
            }
            catch (Exception ex)
            {
                if (recepient != null)
                {
                    recepient.Status = RecepientStatus.Failed;

                    var updateRecepient = await _recepientsRepository.UpdateRecepientsById(recepient);
                    if (!updateRecepient)
                    {
                        _logger.LogError("Failed to update Recepient");
                    }
                }


                Monitor.SendException(ex);
                logMessageType = SigningPortalLogMessageType.Failed;
                MessageForLog = SigningPortalLogMessage.SendDocumentFailed;

                unBlockDoc = true;

                _logger.LogError(ex, ex.Message);
                _logger.LogError("SendSigningRequestAsync Exception :  {0}", ex.Message);
            }
            finally
            {

                if (unBlockDoc)
                {
                    await _cacheClient.Remove(modelObj.tempid, "BlockStatus");
                    _logger.LogInformation($"Document Unblocked in Redis :: {modelObj.tempid}");

                    var update = await _documentRepository.UpdateDocumentBlockedStatusAsync(modelObj.tempid, false);
                    if (!update)
                    {
                        _logger.LogError("Failed to update document blocked status");
                    }
                }
                var result = _logClient.SendLog(Suid, SigningPortalLogServiceName.SendDocument,
                     startTime, MessageForLog, logMessageType);
                if (0 != result)
                {
                    _logger.LogError("Failed to send log message to service log server");
                    //return new ClientResponse("Failed to send log message to service " +
                    //    "log server");
                }
            }

            return new ServiceResult(_constantError.GetMessage("102541"));
            //return new ServiceResult("Signing request failed");
        }

        //used for id for africa flow
        public async Task<ServiceResult> SendSigningRequestNewAsync(SigningRequestNewDTO signingRequest, UserDTO userDTO)
        {
            // Get Start Time
            DateTime startTime = DateTime.UtcNow;
            var logMessageType = "";
            var MessageForLog = "";
            var Suid = "";
            bool isEsealPresent = false;
            bool isSignaturePresent = false;


            if (signingRequest == null)
            {
                logMessageType = SigningPortalLogMessageType.Failed;
                MessageForLog = SigningPortalLogMessage.SendDocumentFailed;

                return new ServiceResult(_constantError.GetMessage("102538"));
                //return new ServiceResult("Signing request data cannot be null");
            }
            if (signingRequest.signfile == null)
            {
                logMessageType = SigningPortalLogMessageType.Failed;
                MessageForLog = SigningPortalLogMessage.SendDocumentFailed;
                return new ServiceResult(_constantError.GetMessage("102521"));
                //return new ServiceResult("File cannot be null");
            }

            if (signingRequest.model == null)
            {
                logMessageType = SigningPortalLogMessageType.Failed;
                MessageForLog = SigningPortalLogMessage.SendDocumentFailed;
                return new ServiceResult(_constantError.GetMessage("102522"));
                //return new ServiceResult("Model cannot be null");
            }

            try
            {
                _logger.LogInformation("Signing Request Object : {0}", signingRequest.model);

                SigningRequestModelNew modelObj = JsonConvert.DeserializeObject<SigningRequestModelNew>(signingRequest.model);

                if (string.IsNullOrEmpty(modelObj.actoken))
                {
                    return new ServiceResult("Access token cannot be null");
                }

                var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
                var isDevelopment = environment == Environments.Development;

                _logger.LogInformation("SigningRequest Environment : " + environment);

                Suid = modelObj.suid;
                var fileName = signingRequest.signfile.FileName;

                SigningServiceNewDTO data = new SigningServiceNewDTO()
                {
                    accountType = userDTO.AccountType.ToLower(),
                    accountId = (userDTO.AccountType.ToLower() == AccountTypeConstants.Self) ? userDTO.Suid : userDTO.OrganizationId,
                    documentType = _configuration.GetValue<string>("SigningService:SignDocType"),
                    subscriberUniqueId = modelObj.suid,
                    organizationUid = modelObj.organizationID,
                    qrCodeRequired = modelObj.qrCodeRequired,
                    serialNumber = modelObj.SerialNumber,
                    entityName = modelObj.EntityName,
                    esealSignatureTemplateId = modelObj.esealSignatureTemplateId,
                    signatureTemplateId = modelObj.signatureTemplateId,
                    //subscriberFullName = userDTO.Name,
                    placeHolderCoordinates = new placeHolderCoordinates
                    {
                        pageNumber = modelObj.pageNumber != null ? modelObj.pageNumber.ToString() : null,
                        signatureXaxis = modelObj.posX != null ? modelObj.posX.ToString() : null,
                        signatureYaxis = modelObj.posY != null ? modelObj.posY.ToString() : null
                    },

                };

                if (isDevelopment)
                {
                    data.callbackURL = _configuration.GetValue<string>("CallBackUrl") + "/api/signed-document";
                }
                else
                {
                    data.callbackURL = _configuration.GetValue<string>("Config:Signing_portal:BACKEND_URL") + "/api/signed-document";
                }

                if (modelObj.signVisible == 1)
                {
                    if (modelObj.pageNumber != null && modelObj.posX != null && modelObj.posY != null)
                    {
                        isSignaturePresent = true;
                    }

                    if (modelObj.EsealPageNumber != null && modelObj.EsealPosX != null && modelObj.EsealPosY != null)
                    {
                        data.esealPlaceHolderCoordinates = new esealplaceHolderCoordinates
                        {
                            pageNumber = modelObj.EsealPageNumber != null ? modelObj.EsealPageNumber.ToString() : null,
                            signatureXaxis = modelObj.EsealPosX != null ? modelObj.EsealPosX.ToString() : null,
                            signatureYaxis = modelObj.EsealPosY != null ? modelObj.EsealPosY.ToString() : null
                        };
                        isEsealPresent = true;
                    }
                }
                else
                {
                    isSignaturePresent = true;
                }



                if (modelObj.QrPageNumber != null && modelObj.QrPosX != null && modelObj.QrPosY != null)
                {
                    data.qrPlaceHolderCoordinates = new placeHolderCoordinates
                    {
                        pageNumber = modelObj.QrPageNumber != null ? modelObj.QrPageNumber.ToString() : null,
                        signatureXaxis = modelObj.QrPosX != null ? modelObj.QrPosX.ToString() : null,
                        signatureYaxis = modelObj.QrPosY != null ? modelObj.QrPosY.ToString() : null
                    };
                }

                //check credit available or not
                var res = await _paymentService.IsCreditAvailable(userDTO, isEsealPresent, isSignaturePresent);
                if (res.Success && !(bool)res.Result)
                {
                    return new ServiceResult(res.Message);
                }

                var documentData = await _documentRepository.GetDocumentById(modelObj.tempid);

                if (documentData.IsDocumentBlocked)
                {
                    return new ServiceResult("Document signing of other user is in progress");
                }
                else
                {
                    if (documentData.MultiSign)
                    {
                        var update = await _documentRepository.UpdateDocumentBlockedStatusAsync(modelObj.tempid, true);
                        if (!update)
                        {
                            _logger.LogError("Failed to update document blocked status");
                        }
                    }
                }
                var recepient = await _recepientsRepository.GetRecepientsBySuidAndTempId(modelObj.suid, modelObj.tempid);
                if (recepient.TakenAction == true)
                {
                    return new ServiceResult("Document has signed already.");
                }

                if (!fileName.Contains(".pdf"))
                {
                    fileName = fileName + ".pdf";
                }
                HttpResponseMessage response = null;
                var url = string.Empty;
                if (isSignaturePresent == false && isEsealPresent == true)
                {
                    url = _configuration.GetValue<string>("Config:ESealSignServiceUrlNew");
                }
                else
                {
                    url = _configuration.GetValue<string>("Config:SignServiceUrlNew");
                }

                using (var multipartFormContent = new MultipartFormDataContent())
                {
                    StreamContent fileStreamContent = new StreamContent(signingRequest.signfile.OpenReadStream());
                    fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");

                    //Add the file
                    multipartFormContent.Add(fileStreamContent, name: "file", fileName: fileName + ".pdf");
                    multipartFormContent.Add(new StringContent(JsonConvert.SerializeObject(data)), "model");

                    _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modelObj.actoken);
                    _logger.LogInformation("actoken : " + modelObj.actoken);

                    DateTime startTimeForAPI = DateTime.UtcNow;
                    response = await _client.PostAsync(url, multipartFormContent);
                    DateTime endTimeForAPI = DateTime.UtcNow;
                    TimeSpan diff = endTimeForAPI - startTimeForAPI;
                    _logger.LogInformation("Total time taken to update SignService call in total seconds : {0} ", diff.TotalSeconds);
                }
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    var res1 = await response.Content.ReadAsStringAsync();
                    APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
                    if (apiResponse.Success)
                    {


                        _logger.LogInformation("Signed request Corelation Id :{0} ", apiResponse.Result.ToString());
                        _logger.LogInformation("Signed request Recepient Email Id :{0} ", modelObj.userEmail.ToLower());
                        _logger.LogInformation("Signed request Recepient Tempid :{0} ", modelObj.tempid);

                        //recepient.Suid = modelObj.suid;
                        recepient.Name = modelObj.userName;
                        recepient.CorrelationId = apiResponse.Result.ToString();
                        recepient.UpdatedAt = DateTime.UtcNow;
                        recepient.AccessToken = modelObj.actoken;
                        recepient.SignedBy = userDTO.Email;
                        recepient.OrganizationName = userDTO.OrganizationName;
                        recepient.OrganizationId = userDTO.OrganizationId;
                        recepient.AccountType = userDTO.AccountType.ToLower();

                        var updateRecepient = await _recepientsRepository.UpdateRecepientsById(recepient);
                        if (updateRecepient == false)
                        {
                            _logger.LogError("Failed to update recepient");
                        }
                        SendSigningRequestResponse serviceResponse = new SendSigningRequestResponse
                        {
                            CorrelationId = apiResponse.Result.ToString()
                        };

                        logMessageType = SigningPortalLogMessageType.Success;
                        MessageForLog = SigningPortalLogMessage.SendDocumentSuccess;

                        return new ServiceResult(serviceResponse, "Successfully sent signing request");
                    }
                    else
                    {
                        var update = await _documentRepository.UpdateDocumentBlockedStatusAsync(modelObj.tempid, false);
                        if (!update)
                        {
                            _logger.LogError("Failed to update document blocked status");
                        }
                        logMessageType = SigningPortalLogMessageType.Failed;
                        MessageForLog = SigningPortalLogMessage.SendDocumentFailed;
                        _logger.LogError("Signing request response : " + apiResponse.Message);
                        _logger.LogError("SendSigningRequestAsync response");
                        return new ServiceResult(apiResponse.Message);
                    }
                }
                else
                {
                    var update = await _documentRepository.UpdateDocumentBlockedStatusAsync(modelObj.tempid, false);
                    if (!update)
                    {
                        _logger.LogError("Failed to update document blocked status");
                    }
                    logMessageType = SigningPortalLogMessageType.Failed;
                    MessageForLog = SigningPortalLogMessage.SendDocumentFailed;

                    Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
                    $"with status code={response.StatusCode}");

                    _logger.LogError($"The request with URI={response.RequestMessage.RequestUri} failed " +
                               $"with status code={response.StatusCode}" + $" error = {response.ReasonPhrase}");
                    //return new ServiceResult(_constantError.GetMessage("102539"));
                    return new ServiceResult("Signing failed");
                }
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                logMessageType = SigningPortalLogMessageType.Failed;
                MessageForLog = SigningPortalLogMessage.SendDocumentFailed;
                _logger.LogError(ex, ex.Message);
                _logger.LogError("SendSigningRequestAsync Exception :  {0}", ex.Message);
            }
            finally
            {
                var result = _logClient.SendLog(Suid, SigningPortalLogServiceName.SendDocument,
                     startTime, MessageForLog, logMessageType);
                if (0 != result)
                {
                    _logger.LogError("Failed to send log message to service log server");
                    //return new ClientResponse("Failed to send log message to service " +
                    //    "log server");
                }
            }

            return new ServiceResult(_constantError.GetMessage("102541"));
            //return new ServiceResult("Signing request failed");
        }

        public async Task<ServiceResult> VerifySignedDocumentAsync(VerifySignedDocumentDTO signedDocument)
        {
            if (signedDocument == null)
            {
                return new ServiceResult(_constantError.GetMessage("102540"));
                //return new ServiceResult("Signed document cannot be null");
            }

            try
            {
                var data = new VerifySigningDTO
                {
                    documentType = _configuration.GetValue<string>("SigningService:SignDocType"),
                    docData = signedDocument.docData,
                    signature = _configuration.GetValue<string>("VerifySign"),
                    subscriberUid = signedDocument.suid,
                    //remove blow object for new api
                    digitalSignatureParams = new Digitalsignatureparams
                    {
                        verificationContext = new Verificationcontext
                        {
                            reportType = 2
                        }
                    }
                };

                string json = JsonConvert.SerializeObject(data);
                StringContent content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _client.PostAsync(_configuration.GetValue<string>("Config:SignVerifyUrl"), content);
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
                    if (apiResponse.Success)
                    {
                        //for old sign verify service

                        //string xmlString = Encoding.UTF8.GetString(Convert.FromBase64String(apiResponse.Result.ToString()));
                        //using TextReader reader = new StringReader(xmlString);
                        //var xmlResponse = (DiagnosticData)new XmlSerializer(typeof(DiagnosticData)).Deserialize(reader);
                        //var signature = xmlResponse.Signatures;
                        //if (signature == null || signature.Length == 0)
                        //{
                        //    // return new ServiceResult(_constantError.GetMessage("102541"));
                        //    return new ServiceResult("Signature not found");
                        //}
                        //var signatureCount = signature.Length;

                        //var certificate = xmlResponse.UsedCertificates;
                        //if (certificate == null || certificate.Length == 0)
                        //{
                        //    //return new ServiceResult(_constantError.GetMessage("102541"));
                        //    return new ServiceResult("Signature not found");
                        //}
                        //var certificateCount = certificate.Length;

                        //IList<signatureDeatils> signatureDeatilsList = new List<signatureDeatils>();

                        //foreach (var sign in signature)
                        //{
                        //    var obj = new signatureDeatils();
                        //    var currentCertificate = (certificateCount != 0) ? Array
                        //        .Find(certificate, x => x.Id == sign.SigningCertificate.Id) : null;
                        //    if (currentCertificate == null)
                        //        obj.signedBy = string.Empty;
                        //    else
                        //        obj.signedBy = currentCertificate.CommonName;
                        //    obj.signatureValid = sign.BasicSignature.SignatureValid;
                        //    obj.validationTime = xmlResponse.ValidationDate;
                        //    obj.signedTime = sign.DateTime;

                        //    signatureDeatilsList.Add(obj);
                        //}
                        //VerifySigningRequestResponse verifysigningResponse = new VerifySigningRequestResponse
                        //{
                        //    recpList = signatureDeatilsList,
                        //    signCount = signatureDeatilsList.Count
                        //};
                        //var res = new ServiceResult(verifysigningResponse, "success");

                        //return res;


                        //for latest sign verify service 

                        var resultString = apiResponse.Result?.ToString()
                     ?? throw new InvalidOperationException("API response result is null.");

                        var responseObj = JsonConvert.DeserializeObject<VerifySignedDocumentApiResponse>(resultString)
                                          ?? throw new InvalidOperationException("Failed to deserialize VerifySignedDocumentApiResponse.");

                        var verifysigningResponse = new VerifySigningRequestResponse
                        {
                            recpList = responseObj.signatureVerificationDetails,
                            signCount = responseObj.signatureVerificationDetails.Count
                        };

                        return new ServiceResult(verifysigningResponse, "Successfully verified signing request");
                    }
                    else
                    {
                        _logger.LogInformation("VerifySignedDocumentAsync : {0} ", apiResponse.Message);
                        //return new ServiceResult(_constantError.GetMessage("102542"));
                        return new ServiceResult(apiResponse.Message);
                    }
                }
                else
                {
                    Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
                    $"with status code={response.StatusCode}");

                    _logger.LogError($"The request with URI={response.RequestMessage.RequestUri} failed " +
                               $"with status code={response.StatusCode}" + $" error = {response.ReasonPhrase}");
                    return new ServiceResult(_constantError.GetMessage("102542"));
                    //return new ServiceResult("Failed to verify signing request");
                }

            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("VerifySignedDocumentAsync Exception :  {0}", ex.Message);
            }

            return new ServiceResult(_constantError.GetMessage("102542"));
            //return new ServiceResult("Failed to verify signed document");
        }

        public async Task<ServiceResult> RecieveDocumentAsync(RecieveDocumentDTO document)
        {
            // Get Start Time
            DateTime ReciveDocStartTime = DateTime.UtcNow;
            _logger.LogInformation("RecieveDocument call start time : {0}", ReciveDocStartTime.ToString("s"));
            var ReciveDoclogMessageType = "";
            var ReciveDocMessageForLog = "";
            var Suid = "";
            var docId = "";
            bool isAllSignComplete = false;

            if (document == null)
            {
                _logger.LogError("RecieveDocument request data null");
                //await _documentHelper.SendSignedDocumentDetailsNotifiaction(document.correlationID, "Document signing failed.");
                //_logger.LogInformation("RecieveDocument callback CorelationId :" + document.correlationID);
                return new ServiceResult(_constantError.GetMessage("102532"));
                //return new ServiceResult("Data cannot be null");
            }

            _logger.LogInformation("RecieveDocument callback CorelationId :" + document.correlationID);

            try
            {
                _logger.LogInformation("RecieveDocument callback :" + JsonConvert.SerializeObject(document));
                _logger.LogInformation("RecieveDocument callback CorelationId :" + document.correlationID);

                var recepientData = await _recepientsRepository.FindRecepientsByCorelationId(document.correlationID);
                if (recepientData == null)
                {
                    ReciveDoclogMessageType = SigningPortalLogMessageType.Failed;
                    ReciveDocMessageForLog = SigningPortalLogMessage.ReciveDocumentFailed;

                    _logger.LogError("RecieveDocument callback get recepient data by corelation id {0} failed", document.correlationID);

                    _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedDocumentDetailsNotifiaction(document.correlationID, "Document signing failed.", false));

                    _logger.LogInformation("RecieveDocument callback CorelationId :" + document.correlationID);
                    return new ServiceResult(_constantError.GetMessage("102532"));
                }

                docId = recepientData.Tempid;

                //_logger.LogInformation("Get recepient data by corelation id : ", document.correlationID);
                _logger.LogInformation("Recepient data : {0}", JsonConvert.SerializeObject(recepientData));

                Suid = recepientData.Suid;


                var currentRecepientList = _recepientsRepository.GetRecepientsLeft(recepientData.Tempid);
                var documentData = await _documentHelper.GetDocumentById(recepientData.Tempid);
                var currentRecepient = currentRecepientList.Result[0];
                if (currentRecepient.Email != recepientData.Email)
                {
                    currentRecepient = currentRecepientList.Result.Where(x => x.Email == recepientData.Email).FirstOrDefault();
                }


                if (document.success == false)
                {
                    string errorMessage;
                    if (string.IsNullOrEmpty(document.errorMessage))
                    {
                        errorMessage = "Something went wrong";
                    }
                    else
                    {
                        errorMessage = document.errorMessage;
                    }

                    _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedDocumentDetailsNotifiaction(document.correlationID, "Document signing failed.", false));

                    ReciveDoclogMessageType = SigningPortalLogMessageType.Failed;
                    ReciveDocMessageForLog = SigningPortalLogMessage.ReciveDocumentFailed;

                    _logger.LogInformation("RecieveDocument callback CorelationId :" + document.correlationID);

                    if (currentRecepient.Status == RecepientStatus.SigningInProgress && currentRecepient.TakenAction == false)
                    {
                        currentRecepient.Status = RecepientStatus.Failed;
                        var updateRecepient = await _recepientsRepository.UpdateRecepientsById(currentRecepient);
                        if (!updateRecepient)
                        {
                            _logger.LogError("Failed to update Recepient");
                        }
                    }

                    return new ServiceResult(errorMessage);
                }

                if (document.signfile == null)
                {
                    _logger.LogError("Recieve document signed file null");

                    _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedDocumentDetailsNotifiaction(document.correlationID, "Document signing failed.", false));

                    _logger.LogInformation("RecieveDocument callback CorelationId :" + document.correlationID);

                    if (currentRecepient.Status == RecepientStatus.SigningInProgress && currentRecepient.TakenAction == false)
                    {
                        currentRecepient.Status = RecepientStatus.Failed;
                        var updateRecepient = await _recepientsRepository.UpdateRecepientsById(currentRecepient);
                        if (!updateRecepient)
                        {
                            _logger.LogError("Failed to update Recepient");
                        }
                    }
                    return new ServiceResult(_constantError.GetMessage("102521"));
                    //return new ServiceResult("File cannot be null");
                }

                _logger.LogInformation("Recieve document callback : final process start");


                if (currentRecepientList.Result.Count == 1)
                {
                    documentData.CompleteTime = DateTime.UtcNow;
                    documentData.UpdatedAt = DateTime.UtcNow;
                    documentData.Status = DocumentStatusConstants.Completed;

                    //uncomment for cetificate generation time
                    //currentRecepient.SigningCompleteTime = DateTime.UtcNow;
                    //await _recepientsRepository.UpdateRecepientsById(currentRecepient);

                    if (currentRecepient.Email.ToLower() != recepientData.Email.ToLower())
                    {
                        NotificationDTO notification = new NotificationDTO
                        {
                            Receiver = documentData.OwnerID,
                            Sender = recepientData.Email,
                            Text = recepientData.Name + " has signed the document " + documentData.DocumentName,
                            Link = "/dashboard/document/" + recepientData.Tempid + "/status"
                        };

                        _backgroundService.RunBackgroundTask<INotificationService>(sender =>
                            sender.CreateNotificationAsync(
                                notification,
                                documentData.OrganizationId,
                                new(NotificationTypeConstants.Document, recepientData.Tempid)));

                        //try
                        //{
                        //	bool pushNotification = _configuration.GetValue<bool>("PushNotification");
                        //	if (recepientData.AccessToken != null && pushNotification)
                        //	{
                        //		_documentHelper.PushNotification(recepientData.AccessToken, documentData.OwnerEmail, recepientData.Name + " has signed the document " + documentData.DocumentName);
                        //	}
                        //}
                        //catch (Exception ex)
                        //{
                        //	_logger.LogError("Failed to send push notification");
                        //}
                    }

                    var updateDocumentToEDMS = await _documentHelper.UpdateDocumentToEDMS(documentData.EdmsId, document.signfile, documentData.DocumentName, Suid);
                    if (!updateDocumentToEDMS.Success)
                    {
                        _logger.LogError("Recieve document callback : Update document in edms failed" + updateDocumentToEDMS.Message);
                        ReciveDoclogMessageType = SigningPortalLogMessageType.Failed;
                        ReciveDocMessageForLog = SigningPortalLogMessage.ReciveDocumentFailed;

                        _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedDocumentDetailsNotifiaction(document.correlationID, "Document signing failed.", false));

                        _logger.LogInformation("RecieveDocument callback CorelationId :" + document.correlationID);

                        if (currentRecepient.Status == RecepientStatus.SigningInProgress && currentRecepient.TakenAction == false)
                        {
                            currentRecepient.Status = RecepientStatus.Failed;
                            var updateRecepient = await _recepientsRepository.UpdateRecepientsById(currentRecepient);
                            if (!updateRecepient)
                            {
                                _logger.LogError("Failed to update Recepient");
                            }
                        }

                        return new ServiceResult(updateDocumentToEDMS.Message);
                    }

                    _logger.LogInformation("Recieve document callback : Update document in edms success");

                    //save certificate in edms
                    //var certificate = await _documentHelper.SaveCertificateToEDMS(recepientData.Tempid, "certificate", Suid);
                    //if (!certificate.Success)
                    //{
                    //    _logger.LogError("Recieve document callback : save certificate in edms failed", certificate.Message);
                    //    ReciveDoclogMessageType = SigningPortalLogMessageType.Failed;
                    //    ReciveDocMessageForLog = SigningPortalLogMessage.ReciveDocumentFailed;

                    //    await _documentHelper.SendSignedDocumentDetailsNotifiaction(document.correlationID, "Document signing failed.");
                    //    return new ServiceResult(certificate.Message);
                    //}

                    //_logger.LogInformation("Recieve document callback : save certificate to edms success");

                    //documentData.CompletedDoc = certificate.Result.ToString();

                    var updateDocument = await _documentRepository.UpdateDocumentById(documentData);
                    if (updateDocument == false)
                    {
                        _logger.LogError("Failed to update document");
                    }

                    if (documentData.OwnerEmail.ToLower() != recepientData.Email.ToLower())
                    {
                        SendEmailObj sendEmail = new SendEmailObj
                        {
                            Id = recepientData.Tempid,
                            UserEmail = documentData.OwnerEmail,
                            UserName = recepientData.Name
                        };

                        _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendAnEmailToSender(sendEmail));

                    }

                    _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedDocumentDetailsNotifiaction(document.correlationID, "Document signed successfully.", true));

                    isAllSignComplete = true;

                }
                else
                {
                    var updateDocumentToEDMS = await _documentHelper.UpdateDocumentToEDMS(documentData.EdmsId, document.signfile, "document", Suid);
                    if (!updateDocumentToEDMS.Success)
                    {
                        _logger.LogError("Recieve document callback : Update document in edms failed" + updateDocumentToEDMS.Message);
                        ReciveDoclogMessageType = SigningPortalLogMessageType.Failed;
                        ReciveDocMessageForLog = SigningPortalLogMessage.ReciveDocumentFailed;

                        _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedDocumentDetailsNotifiaction(document.correlationID, "Document signing failed.", false));

                        _logger.LogInformation("RecieveDocument callback CorelationId :" + document.correlationID);

                        if (currentRecepient.Status == RecepientStatus.SigningInProgress && currentRecepient.TakenAction == false)
                        {
                            currentRecepient.Status = RecepientStatus.Failed;
                            var updateRecepient = await _recepientsRepository.UpdateRecepientsById(currentRecepient);
                            if (!updateRecepient)
                            {
                                _logger.LogError("Failed to update Recepient");
                            }
                        }

                        return new ServiceResult(updateDocumentToEDMS.Message);
                    }

                    _logger.LogInformation("Recieve document callback : Update document in edms success");

                    //uncomment for certificate generation time
                    //currentRecepient.SigningCompleteTime = DateTime.UtcNow;
                    //await _recepientsRepository.UpdateRecepientsById(currentRecepient);

                    NotificationDTO notification = new NotificationDTO
                    {
                        Receiver = documentData.OwnerID,
                        Sender = recepientData.Email,
                        Text = recepientData.Name + " has signed the document " + documentData.DocumentName,
                        Link = "/dashboard/document/" + recepientData.Tempid + "/status"
                    };

                    _backgroundService.RunBackgroundTask<INotificationService>(sender =>
                        sender.CreateNotificationAsync(
                            notification,
                            documentData.OrganizationId,
                            new(NotificationTypeConstants.Document, recepientData.Tempid)));

                    //try
                    //{
                    //	bool pushNotification = _configuration.GetValue<bool>("PushNotification");
                    //	if (recepientData.AccessToken != null && pushNotification)
                    //	{
                    //		_documentHelper.PushNotification(recepientData.AccessToken, documentData.OwnerEmail, recepientData.Name + " has signed the document");
                    //	}
                    //}
                    //catch (Exception ex)
                    //{
                    //	_logger.LogError("Failed to send push notification");
                    //}

                    if (documentData.OwnerEmail != recepientData.Email)
                    {
                        SendEmailObj sendEmail = new SendEmailObj
                        {
                            Id = recepientData.Tempid,
                            UserEmail = documentData.OwnerEmail,
                            UserName = recepientData.Name
                        };


                        _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendAnEmailToSender(sendEmail));

                    }

                    _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendSignedDocumentDetailsNotifiaction(document.correlationID, "Document signed successfully.", true));

                }

                try
                {
                    if (currentRecepientList.Result.Count > 0)
                    {
                        var docData = new Document
                        {
                            _id = recepientData.Tempid,
                            CompleteSignList = documentData.CompleteSignList,
                            PendingSignList = documentData.PendingSignList
                        };

                        var UserSignCompleted = docData.PendingSignList
                            .FirstOrDefault(o => o.suid == recepientData.Suid && o.email == recepientData.Email.ToLower());

                        if (UserSignCompleted != null)
                        {
                            docData.CompleteSignList.Add(UserSignCompleted);
                            docData.PendingSignList.Remove(UserSignCompleted);
                        }
                           
                        docData.UpdatedAt = DateTime.UtcNow;

                        var updateDoc = await _documentRepository.UpdateArrayInDocumentById(docData);
                        if (!updateDoc)
                        {
                            _logger.LogError("Failed to update pending signing array and complete signing array in document");
                        }

                        //currentRecepient.TakenAction = true;

                        var previewResponse = await _templateService.GetSignaturePreviewAsync(new UserDTO()
                        { AccountType = currentRecepient.AccountType, Suid = currentRecepient.Suid, OrganizationId = currentRecepient.OrganizationId });

                        var updateRecepient = await _recepientsRepository.UpdateTakenActionOfRecepientById(currentRecepient._id, (string)previewResponse.Result);
                        if (updateRecepient == false)
                        {
                            _logger.LogError("Failed to update recepient");
                        }

                        //Update next recepient Status
                        var nextRecepient = documentData.Recepients.FirstOrDefault(x => x.Order == currentRecepient.Order + 1);
                        if (!documentData.DisableOrder && nextRecepient is not null)
                        {
                            var updateNextRecepient = await _recepientsRepository.UpdateRecepientStatusById(nextRecepient._id, RecepientStatus.NeedToSign);
                            if (updateNextRecepient == false)
                            {
                                _logger.LogError("Failed to update next recepient status");
                            }
                        }

                        if (isAllSignComplete)
                        {
                            var content = string.Empty;
                            //send email to all recepients with signed document as attachment 
                            if (!documentData.MultiSign)
                            {
                                content = "<b>" + documentData.DocumentName + "</b> document has been signed successfully. <br/> Please find the attached signed document.";
                            }
                            else
                            {
                                content = "<b>" + documentData.DocumentName + "</b> document has been signed by all signatories sent by " + documentData.OwnerName + ". <br/> Please find the attached signed document.";
                            }

                            //Google drive file upload implementation inside
                            _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendEmailToAllRecepients(docId, content, "Document Signed", true, true));


                            // SignalR Notification for the OWNER

                            if (recepientData.Email != documentData.OwnerEmail)
                            {
                                NotificationDTO notification = new NotificationDTO
                                {
                                    Receiver = documentData.OwnerID,
                                    Sender = recepientData.Email,
                                    Text = "All signatures of document " + documentData.DocumentName + " have been signed successfully",
                                    Link = "/dashboard/document/" + recepientData.Tempid + "/status"
                                };

                                if (documentData.Recepients.Count == 1)
                                {
                                    notification.Text = $"{recepientData.Name} has signed the document {documentData.DocumentName}";
                                }

                                _backgroundService.RunBackgroundTask<INotificationService>(sender =>
                                    sender.CreateNotificationAsync(
                                        notification,
                                        documentData.OrganizationId,
                                        new(NotificationTypeConstants.Document, recepientData.Tempid)));


                                bool pushNotification = _configuration.GetValue<bool>("PushNotification");

                                if (recepientData.AccessToken != null && pushNotification)
                                {
                                    _backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(recepientData.AccessToken, documentData.OwnerID, notification.Text));
                                }
                            }

                        }
                        SendEmailObj sendEmail = new SendEmailObj
                        {
                            Id = recepientData.Tempid,
                            UserEmail = recepientData.Email,
                            UserName = recepientData.Name
                        };

                        _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendAnEmailToRecipient(sendEmail, recepientData.AccessToken, null));

                        _logger.LogInformation("Email sent successfully for corelation id : " + recepientData.CorrelationId);
                        _logger.LogInformation("Email sent time : " + DateTime.UtcNow);
                    }
                }
                catch (Exception ex)
                {
                    Monitor.SendException(ex);
                    _logger.LogError("Recieve document callback : send mail to recepient failed" + ex.Message);
                }

                ReciveDoclogMessageType = SigningPortalLogMessageType.Success;
                ReciveDocMessageForLog = SigningPortalLogMessage.ReciveDocumentSuccess;

                var res = new CallBackResponce();
                if (recepientData.AccountType.ToLower() == AccountTypeConstants.Self)
                {
                    res.AccountType = AccountTypeConstants.Self;
                    res.Value = recepientData.Suid;
                }
                else
                {
                    res.AccountType = AccountTypeConstants.Organization;
                    res.Value = recepientData.OrganizationId;
                }

                _logger.LogInformation("Recieve document callback : Final process end");

                _logger.LogInformation("RecieveDocument callback CorelationId :" + document.correlationID);
                return new ServiceResult(res, "Document signed successfully");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                ReciveDoclogMessageType = SigningPortalLogMessageType.Failed;
                ReciveDocMessageForLog = SigningPortalLogMessage.ReciveDocumentFailed;

                _logger.LogError(ex, ex.Message);
                _logger.LogError("RecieveDocumentAsync Exception :  {0}" + ex.Message);
            }
            finally
            {
                await _cacheClient.Remove(docId, "BlockStatus");
                _logger.LogInformation($"Document Unblocked in Redis :: {docId}");

                var update = await _documentRepository.UpdateDocumentBlockedStatusAsync(docId, false);
                if (!update)
                {
                    _logger.LogError("Failed to update document blocked status");
                }

                var result = _logClient.SendLog(Suid, SigningPortalLogServiceName.RecieveDocument,
                    ReciveDocStartTime, ReciveDocMessageForLog, ReciveDoclogMessageType);
                if (0 != result)
                {
                    _logger.LogError("Failed to send log message to service log server");
                    //return new ClientResponse("Failed to send log message to service " +
                    //    "log server");
                }
                _logger.LogInformation("RecieveDocument call end time : {0}", DateTime.UtcNow.ToString("s"));
            }

            _logger.LogInformation("RecieveDocument callback CorelationId :" + document.correlationID);
            return new ServiceResult(_constantError.GetMessage("102545"));
            //return new ServiceResult("Document signing failed.");
        }

        public async Task<ServiceResult> IsDocumentBlockedAsync(string documentId, UserDTO user)
        {
            try
            {
                var document = await _documentRepository.GetDocumentById(documentId);

                if (document == null)
                {
                    _logger.LogError($"Document not found for ID: {documentId}");
                    return new ServiceResult("Document not found");
                }


                if (document.IsDocumentBlocked)
                {
                    var blockTime = Math.Round(Math.Abs((document.DocumentBlockedTime - DateTime.UtcNow).TotalMinutes));
                    if (blockTime > 10)
                    {
                        var isBlocked = await _documentRepository.UpdateDocumentBlockedStatusAsync(document._id, false);
                        if (isBlocked)
                        {
                            var signingRecep = document.Recepients.FirstOrDefault(x => x.Status == RecepientStatus.SigningInProgress && x.TakenAction == false);
                            if (signingRecep != null)
                            {
                                signingRecep.Status = RecepientStatus.Failed;
                                var updateRecepient = await _recepientsRepository.UpdateRecepientsById(signingRecep);
                                if (!updateRecepient)
                                {
                                    _logger.LogError("Failed to update Recepient");
                                }
                            }

                            document.IsDocumentBlocked = false;
                            _logger.LogInformation("Document Unblocked Successfully for document: " + documentId);
                        }
                        else
                        {
                            _logger.LogError("Document Unblock failed for document: " + documentId);
                        }
                    }
                }

                var docBlock = await _cacheClient.Get<string>(documentId, "BlockStatus");
                if (!string.IsNullOrEmpty(docBlock) && !document.IsDocumentBlocked)
                {
                    await _cacheClient.Remove(documentId, "BlockStatus");
                    _logger.LogInformation($"Document Unblocked in Redis :: {documentId}");
                }

                string msg = document.IsDocumentBlocked ?
                    (docBlock == user.Suid ?
                    "Document signing has initiated. Please try again shortly." :
                    "Another signatory is currently signing this document. Please try again shortly.") :
                    "Successfully received document blocked status";

                return new ServiceResult(document.IsDocumentBlocked, msg);
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("IsDocumentBlockedAsync Exception :  {0}", ex.Message);
            }
            return new ServiceResult("Failed to receive document blocked status");
        }

        public async Task<ServiceResult> GetDraftDocumentListAsync(UserDTO userDTO, bool expired = false)
        {
            if (userDTO == null)
            {
                return new ServiceResult(_constantError.GetMessage("102535"));
            }

            _logger.LogInformation("GetDraftDocumentListAsync start");

            try
            {
                var documents = await _documentRepository.GetDocumnetListAsync(
                    userDTO.Suid, userDTO.AccountType.ToLower(), userDTO.OrganizationId, false);

                if (documents == null)
                {
                    _logger.LogError("Failed to receive draft document list.");
                    return new ServiceResult("Failed to receive draft document list.");
                }

                // Filter the documents if expired flag is false
                var filteredDocuments = expired
                    ? documents
                    : documents.Where(x => x.Status != DocumentStatusConstants.Expired);

                var newdocumentsList = filteredDocuments
                    .OrderByDescending(x => x.CreatedAt)
                    .ToList();

                _logger.LogInformation("GetDraftDocumentListAsync end");
                return new ServiceResult(newdocumentsList, "Successfully received draft document list.");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError($"GetDraftDocumentListAsync Exception : {ex.Message}");
            }

            _logger.LogInformation("GetDraftDocumentListAsync end");
            return new ServiceResult(_constantError.GetMessage("102567"));
        }

        public async Task<ServiceResult> GetSentDocumentListAsync(UserDTO userDTO, bool expired = false)
        {
            if (userDTO == null)
            {
                return new ServiceResult(_constantError.GetMessage("102535"));
                //return new ServiceResult("Email cannot be null");
            }

            try
            {
                _logger.LogInformation("GetSentDocumentListAsync start");
                var documents = await _documentRepository.GetSentDocumnetListAsync(userDTO.Suid, userDTO.AccountType.ToLower(), userDTO.OrganizationId, true);
                if (documents == null)
                {
                    _logger.LogError("Failed to receive sent document list.");
                    return new ServiceResult("Failed to receive sent document list.");
                }

                // Filter the documents if expired flag is false
                var filteredDocuments = expired
                    ? documents
                    : documents.Where(x => x.Status != DocumentStatusConstants.Expired);

                var newdocumentsList = filteredDocuments
                    .OrderByDescending(x => x.CreatedAt)
                    .ToList();

                _logger.LogInformation("GetSentDocumentListAsync end");
                return new ServiceResult(newdocumentsList, "Successfully received sent document list.");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError($"GetSentDocumentListAsync Exception : {ex.Message}");
            }

            _logger.LogInformation("GetSentDocumentListAsync end");
            return new ServiceResult(_constantError.GetMessage("102568"));
        }

        public async Task<ServiceResult> GetReceivedDocumentsList(UserDTO userDTO, bool expired = false)
        {
            try
            {
                _logger.LogInformation("GetReceivedDocumentsList start");

                // Fetch recipients and documents in parallel (or batch query if possible)
                var recepientList = await _recepientsRepository.GetRecepientsBySuidAsync(userDTO.Suid);

                // Step 1: Get distinct TempIDs
                List<string> tempIdList = recepientList.Select(x => x.Tempid).Distinct().ToList();

                // Step 2: Fetch all matching documents in one go
                var docList = await _documentRepository.GetDocumentByTempIdList(tempIdList, true);

                // Step 3: Map documents by Tempid for quick lookup
                var docDict = docList.ToDictionary(d => d._id, d => d);

                // Step 4: Combine into a list of { recepient, documentData }
                var documentResults = recepientList
                    .Where(r => docDict.ContainsKey(r.Tempid))
                    .Select(r => new { recepient = r, documentData = docDict[r.Tempid] })
                    .ToList();

                //var receivedListArray = new List<string>();

                var newDocList = new List<Document>();

                foreach (var result in documentResults)
                {
                    var recepient = result.recepient;
                    var documentData = result.documentData;

                    if (documentData != null && documentData.OwnerID != userDTO.Suid)
                    {
                        //receivedListArray.Add(recepient.Tempid);
                        newDocList.Add(documentData);

                        if (userDTO.AccountType.ToLower() != recepient.AccountType)
                        {
                            //receivedListArray.Remove(recepient.Tempid);
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && userDTO.OrganizationId != recepient.OrganizationId)
                        {
                            //receivedListArray.Remove(recepient.Tempid);
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (!string.IsNullOrEmpty(recepient.EsealOrgId.Trim()) && userDTO.OrganizationId != recepient.EsealOrgId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
                        {
                            //receivedListArray.Remove(recepient.Tempid);
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (!string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.OrganizationId != recepient.OrganizationId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
                        {
                            //receivedListArray.Remove(recepient.Tempid);
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && userDTO.OrganizationId != recepient.OrganizationId)
                        {
                            //receivedListArray.Remove(recepient.Tempid);
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId.Trim()))
                        {
                            //receivedListArray.Remove(recepient.Tempid);
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.OrganizationId.Trim()))
                        {
                            //receivedListArray.Remove(recepient.Tempid);
                            newDocList.Remove(documentData);
                            continue;
                        }
                    }
                }

                // Filter the documents if expired flag is false
                var filteredDocuments = expired
                    ? newDocList
                    : newDocList.Where(x => x.Status != DocumentStatusConstants.Expired);

                var newdocumentsList = filteredDocuments
                    .OrderByDescending(x => x.CreatedAt)
                    .ToList();

                _logger.LogInformation("GetReceivedDocumentsList end");
                return new ServiceResult(newdocumentsList, "Successfully received received document list.");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError($"GetReceivedDocumentsList Exception :  {ex.Message}");
            }
            _logger.LogInformation("GetReceivedDocumentsList end");
            return new ServiceResult(_constantError.GetMessage("102569"));
        }

        public async Task<ServiceResult> GetReferredDocumentsList(UserDTO userDTO, bool expired = false)
        {
            try
            {
                //List<string> receivedListArray = new List<string>();

                var recepientList = await _recepientsRepository.GetRecepientsByAlternateEmailSuidAsync(userDTO.Suid);
                // Step 1: Get distinct TempIDs
                List<string> tempIdList = recepientList.Select(x => x.Tempid).Distinct().ToList();

                // Step 2: Fetch all matching documents in one go
                var docList = await _documentRepository.GetDocumentByTempIdList(tempIdList, true);

                // Step 3: Map documents by Tempid for quick lookup
                var docDict = docList.ToDictionary(d => d._id, d => d);

                // Step 4: Combine into a list of { recepient, documentData }
                var documentResults = recepientList
                    .Where(r => docDict.ContainsKey(r.Tempid))
                    .Select(r => new { recepient = r, documentData = docDict[r.Tempid] })
                    .ToList();

                var newDocList = new List<Document>();

                foreach (var result in documentResults)
                {
                    var recepient = result.recepient;
                    var documentData = result.documentData;

                    if (documentData != null)
                    {
                        //receivedListArray.Add(recepient.Tempid);
                        newDocList.Add(documentData);

                        if (userDTO.AccountType.ToLower() != recepient.AccountType)
                        {
                            //receivedListArray.Remove(recepient.Tempid);
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && userDTO.OrganizationId != recepient.OrganizationId)
                        {
                            //receivedListArray.Remove(recepient.Tempid);
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (!string.IsNullOrEmpty(recepient.EsealOrgId.Trim()) && userDTO.OrganizationId != recepient.EsealOrgId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
                        {
                            //receivedListArray.Remove(recepient.Tempid);
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (!string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.OrganizationId != recepient.OrganizationId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
                        {
                            //receivedListArray.Remove(recepient.Tempid);
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (!string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && userDTO.OrganizationId != recepient.OrganizationId)
                        {
                            //receivedListArray.Remove(recepient.Tempid);
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId.Trim()))
                        {
                            //receivedListArray.Remove(recepient.Tempid);
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.OrganizationId.Trim()))
                        {
                            //receivedListArray.Remove(recepient.Tempid);
                            newDocList.Remove(documentData);
                            continue;
                        }
                    }
                }

                //var documents = await _documentRepository.GetDocumentByTempIdList(receivedListArray, true);
                //if (documents == null)
                //{
                //	_logger.LogError("Failed to receive referred document list.");
                //	return new ServiceResult("Failed to receive referred document list.");
                //}

                // Filter the documents if expired flag is false
                var filteredDocuments = expired
                    ? newDocList
                    : newDocList.Where(x => x.Status != DocumentStatusConstants.Expired);

                var newdocumentsList = filteredDocuments
                    .OrderByDescending(x => x.CreatedAt)
                    .ToList();

                _logger.LogInformation("GetReferredDocumentsList end");
                return new ServiceResult(newdocumentsList, "Successfully received referred document list.");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError($"GetReferredDocumentsList Exception :  {ex.Message}");
            }
            return new ServiceResult(_constantError.GetMessage("102572"));
        }

        //public async Task<ServiceResult> GetReceivedDocumentsListOld(UserDTO userDTO)
        //{
        //    try
        //    {
        //        List<string> receivedListArray = new List<string>();

        //        var recepientList = _recepientsRepository.GetRecepientsBySuidAsync(userDTO.Suid).Result;
        //        foreach (var recepient in recepientList)
        //        {
        //            var documentData = await _documentRepository.GetDocumentDetailsByRecepientsTempIdAsync(recepient.Tempid);
        //            //var documentData = await _documentRepository.GetDocumentByRecepientsTempIdAsync(recepient.Tempid);
        //            if (documentData != null && documentData.OwnerID != userDTO.Suid)
        //            {
        //                receivedListArray.Add(recepient.Tempid);
        //                if (!string.IsNullOrEmpty(recepient.EsealOrgId) && userDTO.OrganizationId != recepient.EsealOrgId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
        //                {
        //                    receivedListArray.Remove(recepient.Tempid);
        //                }

        //                if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId))
        //                {
        //                    receivedListArray.Remove(recepient.Tempid);
        //                }

        //                //if(userDTO.OrganizationId != recepient.EsealOrgId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
        //                //{
        //                //    receivedListArray.Remove(recepient.Tempid);
        //                //}

        //                //if(userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId))
        //                //{
        //                //    receivedListArray.Remove(recepient.Tempid);
        //                //}
        //            }
        //        }

        //        var documents = await _documentRepository.GetDocumentByTempIdList(receivedListArray, true);
        //        if (documents == null)
        //        {
        //            _logger.LogError("Failed to receive sent document list.");
        //            return new ServiceResult("Failed to receive received document list.");
        //        }
        //        return new ServiceResult(documents, "Successfully received received document list.");
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, ex.Message);
        //        _logger.LogError("GetReceivedDocumentsList Exception :  {0}", ex.Message);
        //    }
        //    return new ServiceResult(_constantError.GetMessage("102569"));
        //}

        //public async Task<ServiceResult> GetReferredDocumentsListOld(UserDTO userDTO)
        //{
        //    try
        //    {
        //        List<string> receivedListArray = new List<string>();

        //        var recepientList = _recepientsRepository.GetRecepientsByAlternateEmailSuidAsync(userDTO.Suid).Result;
        //        foreach (var recepient in recepientList)
        //        {
        //            var documentData = await _documentRepository.GetDocumentDetailsByRecepientsTempIdAsync(recepient.Tempid);
        //            //var documentData = await _documentRepository.GetDocumentByRecepientsTempIdAsync(recepient.Tempid);
        //            if (documentData != null)
        //            {
        //                receivedListArray.Add(recepient.Tempid);
        //                if (!string.IsNullOrEmpty(recepient.EsealOrgId) && userDTO.OrganizationId != recepient.EsealOrgId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
        //                {
        //                    receivedListArray.Remove(recepient.Tempid);
        //                }

        //                if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId))
        //                {
        //                    receivedListArray.Remove(recepient.Tempid);
        //                }

        //            }
        //        }

        //        var documents = await _documentRepository.GetDocumentByTempIdList(receivedListArray, true);
        //        if (documents == null)
        //        {
        //            _logger.LogError("Failed to receive referred document list.");
        //            return new ServiceResult("Failed to receive referred document list.");
        //        }
        //        return new ServiceResult(documents, "Successfully received referred document list.");
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, ex.Message);
        //        _logger.LogError("GetReferredDocumentsList Exception :  {0}", ex.Message);
        //    }
        //    return new ServiceResult(_constantError.GetMessage("102572"));
        //}

        public async Task<ServiceResult> AssignDocumentToSomeoneAsync(AssignDocumentToSomeoneDTO assignDocumentToSomeone, UserDTO userDTO)
        {
            try
            {
                var documentData = await _documentRepository.GetDocumentByTempIdAsync(assignDocumentToSomeone.TempId);
                if (documentData == null)
                {
                    _logger.LogError("Failed to get document details");
                    return new ServiceResult("Record not found.");
                }

                var docData = new Document
                {
                    _id = assignDocumentToSomeone.TempId,
                    CompleteSignList = documentData.CompleteSignList,
                    PendingSignList = documentData.PendingSignList,
                    Annotations = documentData.Annotations.Replace(userDTO.Suid, assignDocumentToSomeone.Suid)
                };

                var userSignCompleted = new User()
                {
                    email = userDTO.Email.ToLower(),
                    suid = userDTO.Suid
                };
                docData.CompleteSignList.Add(userSignCompleted);
                docData.PendingSignList.Remove(userSignCompleted);

                var assignDocument = new User()
                {
                    email = assignDocumentToSomeone.AssignedEmail.ToLower(),
                    suid = assignDocumentToSomeone.Suid
                };

                docData.PendingSignList.Add(assignDocument);

                var updateDoc = await _documentRepository.UpdateAssignSomeoneDetailsInDocumentById(docData);
                if (!updateDoc)
                {
                    _logger.LogError("Failed to update pending signing array and complete signing array in document");
                }

                var recepient = _recepientsRepository.GetRecepientsBySuidAndTempId(userDTO.Suid, assignDocumentToSomeone.TempId).Result;
                if (recepient == null)
                {
                    _logger.LogError("GetRecepientsBySuidAndTempId : null");
                    return new ServiceResult("Record not found.");
                }
                else
                {
                    Recepients newRecepient = new Recepients
                    {
                        Name = recepient.Name,
                        Order = recepient.Order,
                        AllowComments = recepient.AllowComments,
                        SignatureMandatory = recepient.SignatureMandatory,
                        Tempid = recepient.Tempid,
                        CreatedAt = DateTime.UtcNow,
                        OrganizationId = recepient.OrganizationId,
                        OrganizationName = recepient.OrganizationName,
                        AccountType = recepient.AccountType.ToLower(),
                        Status = RecepientStatus.NeedToSign
                    };

                    //Recepients newRecepient = recepient;
                    newRecepient.ReferredBy = userDTO.Email;
                    newRecepient.Email = assignDocumentToSomeone.AssignedEmail;
                    newRecepient._id = "";

                    var savedRecepients = await _recepientsRepository.SaveReceipt(newRecepient);

                    recepient.TakenAction = true;
                    recepient.ReferredTo = assignDocumentToSomeone.AssignedEmail;
                    recepient.Status = RecepientStatus.AssignedToSomeone;

                    var updateRecepient = await _recepientsRepository.UpdateRecepientsById(recepient);

                }
                return new ServiceResult(null, "Successfully assigned document to " + assignDocumentToSomeone.AssignedEmail + ".");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("AssignDocumentToSomeoneAsync Exception :  {0}", ex.Message);
            }
            return new ServiceResult(_constantError.GetMessage("102573"));
        }

        public async Task<ServiceResult> GetDocumentsListByFilter(FilterDocumentDTO Model, UserDTO userDTO)
        {
            try
            {
                // Parallelize the document list retrieval
                var draftTask = GetDraftDocumentListAsync(userDTO, true);
                var sentTask = GetSentDocumentListAsync(userDTO, true);
                var receivedTask = GetReceivedDocumentsList(userDTO, true);
                var referredTask = GetReferredDocumentsList(userDTO, true);

                await Task.WhenAll(draftTask, sentTask, receivedTask, referredTask);

                // Retrieve the result after all tasks are completed
                var draftList = (List<Document>)draftTask.Result.Result;
                var sendList = (List<Document>)sentTask.Result.Result;
                var receivedList = (List<Document>)receivedTask.Result.Result;
                var referredList = (List<Document>)referredTask.Result.Result;

                var ownList = draftList.Concat(sendList).ToList();
                var otherList = receivedList.Concat(referredList).ToList();
                var allList = ownList.Concat(otherList).ToList();

                List<Document> finalList = new List<Document>();

                if (Model.Status == DocumentStatusConstants.Completed)
                {
                    ownList.ForEach(x => { if (x.Status == DocumentStatusConstants.Completed) finalList.Add(x); });
                }
                else if (Model.Status == DocumentStatusConstants.Expired)
                {
                    ownList.ForEach(x => { if (x.Status == DocumentStatusConstants.Expired) finalList.Add(x); });
                }
                else if (Model.Status == DocumentStatusConstants.Declined)
                {
                    ownList.ForEach(x => { if (x.Status == DocumentStatusConstants.Declined) finalList.Add(x); });
                }
                else if (Model.Status == DocumentStatusConstants.InProgress)
                {
                    if (Model.ActionRequired)
                    {
                        foreach (var document in allList)
                        {
                            if (DocumentStatusConstants.InProgress == document.Status)
                            {
                                if (Model.ExpirySoon == false)
                                {
                                    if (document.MultiSign)
                                    {
                                        if (document.DisableOrder)
                                        {
                                            //if (document.PendingSignList.Contains(userDTO.Email))
                                            //{
                                            //    finalList.Add(document);
                                            //}
                                            foreach (var user in document.PendingSignList)
                                            {
                                                if (user.suid == userDTO.Suid)
                                                {
                                                    finalList.Add(document);
                                                }
                                            }

                                            if (document.Recepients.Any(x => x.AlternateSignatories.Any(x => x.suid == userDTO.Suid)))
                                            {
                                                finalList.Add(document);
                                            }

                                        }
                                        else
                                        {
                                            //if (document.PendingSignList[0].Equals(userDTO.Email))
                                            //{
                                            //    finalList.Add(document);
                                            //}                                            

                                            if (document.PendingSignList[0].suid.Equals(userDTO.Suid))
                                            {
                                                finalList.Add(document);
                                            }

                                            var signerSuid = document.PendingSignList[0].suid;

                                            if (document.Recepients
                                                .Where(x => x.Suid == signerSuid)
                                                .Any(x => x.AlternateSignatories.Any(x => x.suid == userDTO.Suid))
                                                )
                                            {
                                                finalList.Add(document);
                                            }
                                        }

                                    }
                                    else
                                    {
                                        finalList.Add(document);
                                    }
                                }
                                else
                                {
                                    DateTime untilDate = document.CreatedAt.AddDays(Convert.ToDouble(document.DaysToComplete));
                                    var expiredays = Math.Round(Math.Abs((untilDate - DateTime.UtcNow).TotalDays));
                                    if (expiredays >= 0 && expiredays <= 2)
                                    {
                                        if (document.MultiSign)
                                        {
                                            if (document.DisableOrder)
                                            {
                                                //if (document.PendingSignList.Contains(userDTO.Email))
                                                //{
                                                //    finalList.Add(document);
                                                //}

                                                foreach (var user in document.PendingSignList)
                                                {
                                                    if (user.suid == userDTO.Suid)
                                                    {
                                                        finalList.Add(document);
                                                    }
                                                }
                                            }
                                            else
                                            {
                                                //if (document.PendingSignList[0].Equals(userDTO.Email))
                                                //{
                                                //    finalList.Add(document);
                                                //}

                                                if (document.PendingSignList[0].suid.Equals(userDTO.Suid))
                                                {
                                                    finalList.Add(document);
                                                }
                                            }

                                        }
                                        else
                                        {
                                            finalList.Add(document);
                                        }

                                    }
                                }

                            }
                        }


                    }
                    else
                    {
                        ownList.ForEach(x => { if (x.Status == DocumentStatusConstants.InProgress) finalList.Add(x); });
                    }


                }

                finalList = finalList.OrderByDescending(x => x.CreatedAt).ToList();

                return new ServiceResult(finalList, "Successfully received received document list.");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("GetReceivedDocumentsList Exception :  {0}", ex.Message);
            }
            return new ServiceResult(_constantError.GetMessage("102570"));
        }

        public async Task<ServiceResult> GetAllSelfDocumentListAsync(UserDTO userDTO)
        {
            try
            {
                // Parallelize the document list retrieval
                var draftTask = GetDraftDocumentListAsync(userDTO, true);
                var sentTask = GetSentDocumentListAsync(userDTO, true);
                var receivedTask = GetReceivedDocumentsList(userDTO, true);
                var referredTask = GetReferredDocumentsList(userDTO, true);

                await Task.WhenAll(draftTask, sentTask, receivedTask, referredTask);

                // Retrieve the result after all tasks are completed
                var draftList = (List<Document>)draftTask.Result.Result;
                var sendList = (List<Document>)sentTask.Result.Result;
                var receivedList = (List<Document>)receivedTask.Result.Result;
                var referredList = (List<Document>)referredTask.Result.Result;

                var allList = new AllDocumentListDTO()
                {
                    DraftList = draftList,
                    SendList = sendList,
                    ReceivedList = receivedList,
                    ReferredList = referredList
                };

                return new ServiceResult(allList, "All document list received successfully");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("GetAllSelfDocumentListAsync Exception :  {0}", ex.Message);
            }
            return new ServiceResult("Failed to receive all self document list");
        }

        public ServiceResult DocumentFilterListAsync(AllDocumentListDTO listDTO, FilterDocumentDTO Model, UserDTO userDTO)
        {
            try
            {
                var ownList = listDTO.DraftList.Concat(listDTO.SendList).ToList();
                var otherList = listDTO.ReceivedList.Concat(listDTO.ReferredList).ToList();
                var allList = ownList.Concat(otherList).ToList();

                List<Document> finalList = new List<Document>();

                if (Model.Status == DocumentStatusConstants.Completed)
                {
                    ownList.ForEach(x => { if (x.Status == DocumentStatusConstants.Completed) finalList.Add(x); });
                }
                else if (Model.Status == DocumentStatusConstants.Expired)
                {
                    ownList.ForEach(x => { if (x.Status == DocumentStatusConstants.Expired) finalList.Add(x); });
                }
                else if (Model.Status == DocumentStatusConstants.Declined)
                {
                    ownList.ForEach(x => { if (x.Status == DocumentStatusConstants.Declined) finalList.Add(x); });
                }
                else if (Model.Status == DocumentStatusConstants.InProgress)
                {
                    if (Model.ActionRequired)
                    {
                        foreach (var document in allList)
                        {
                            if (DocumentStatusConstants.InProgress == document.Status)
                            {
                                if (!Model.ExpirySoon)
                                {
                                    if (document.MultiSign)
                                    {
                                        if (document.DisableOrder)
                                        {
                                            foreach (var user in document.PendingSignList)
                                            {
                                                if (user.suid == userDTO.Suid)
                                                {
                                                    finalList.Add(document);
                                                }
                                            }

                                            if (document.Recepients.Any(x => x.AlternateSignatories.Any(a => a.suid == userDTO.Suid)))
                                            {
                                                finalList.Add(document);
                                            }
                                        }
                                        else
                                        {
                                            if (document.PendingSignList != null && document.PendingSignList.Count > 0)
                                            {
                                                if (document.PendingSignList[0].suid.Equals(userDTO.Suid))
                                                {
                                                    finalList.Add(document);
                                                }

                                                var signerSuid = document.PendingSignList[0].suid;

                                                if (document.Recepients
                                                    .Where(x => x.Suid == signerSuid)
                                                    .Any(x => x.AlternateSignatories.Any(a => a.suid == userDTO.Suid)))
                                                {
                                                    finalList.Add(document);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        finalList.Add(document);
                                    }
                                }
                                else
                                {
                                    DateTime untilDate = document.CreatedAt.AddDays(Convert.ToDouble(document.DaysToComplete));
                                    var expiredays = Math.Round(Math.Abs((untilDate - DateTime.UtcNow).TotalDays));
                                    if (expiredays >= 0 && expiredays <= 2)
                                    {
                                        if (document.MultiSign)
                                        {
                                            if (document.DisableOrder)
                                            {
                                                foreach (var user in document.PendingSignList)
                                                {
                                                    if (user.suid == userDTO.Suid)
                                                    {
                                                        finalList.Add(document);
                                                    }
                                                }
                                            }
                                            else
                                            {
                                                if (document.PendingSignList != null && document.PendingSignList.Count > 0)
                                                {
                                                    if (document.PendingSignList[0].suid.Equals(userDTO.Suid))
                                                    {
                                                        finalList.Add(document);
                                                    }
                                                }
                                            }
                                        }
                                        else
                                        {
                                            finalList.Add(document);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        ownList.ForEach(x => { if (x.Status == DocumentStatusConstants.InProgress) finalList.Add(x); });
                    }
                }

                finalList = finalList.OrderByDescending(x => x.CreatedAt).ToList();

                return new ServiceResult(finalList, "Successfully received document list.");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("GetReceivedDocumentsList Exception :  {0}", ex.Message);
            }
            return new ServiceResult(_constantError.GetMessage("102570"));
        }

        public async Task<ServiceResult> GetOrganizationListAsync(string email)
        {
            try
            {
                if (string.IsNullOrEmpty(email))
                {
                    return new ServiceResult("email can not be null");
                }

                _logger.LogInformation("GetOrganizationListAsync start");

                _logger.LogInformation("GetOrganizationListAsync api start");
                var response = await _client.GetAsync(_configuration.GetValue<string>("Config:OrganizationListUrl") + email);
                _logger.LogInformation("GetOrganizationListAsync api end");

                if (response.StatusCode == HttpStatusCode.OK)
                {
                    APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
                    if (apiResponse.Success)
                    {
                        _logger.LogInformation("GetOrganizationListAsync api response : " + apiResponse.Result.ToString().Replace("\r\n", ""));
                        _logger.LogInformation("GetOrganizationListAsync end");
                        return new ServiceResult(apiResponse.Result.ToString().Replace("\r\n", ""), apiResponse.Message);
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
                _logger.LogError("GetOrganizationListAsync Exception :  {0}", ex.Message);
            }
            _logger.LogInformation("GetOrganizationListAsync end");
            return new ServiceResult("Failed to receive organization list");
        }

        public async Task<ServiceResult> GetOrganizationCertificateDetailstAsync(string orgId)
        {
            try
            {
                if (string.IsNullOrEmpty(orgId))
                {
                    return new ServiceResult("Organization id can not be null");
                }

                var response = await _client.GetAsync(_configuration.GetValue<string>("Config:OrganizationCertificateDetails") + orgId);

                if (response.StatusCode == HttpStatusCode.OK)
                {
                    APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
                    if (apiResponse.Success)
                    {
                        return new ServiceResult(apiResponse.Result.ToString().Replace("\r\n", ""), apiResponse.Message);
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
                _logger.LogError("GetOrganizationCertificateDetailstAsync Exception :  {0}", ex.Message);
            }
            return new ServiceResult("Failed to receive organization certificate details");
        }

        public async Task<ServiceResult> GetDocumentReportAsync(string docid)
        {
            try
            {
                var doc = await _documentRepository.GetDocumentById(docid);
                if (doc == null)
                    return new ServiceResult("Document details not found");

                DocumentReportResponse report = new();

                DocumentDetails docdetails = new()
                {
                    DocumentName = doc.DocumentName,
                    OwnerId = doc.OwnerID,
                    OwnerName = doc.OwnerName,
                    OwnerEmail = doc.OwnerEmail,
                    CreatedAt = doc.CreatedAt,
                    CompletedAt = doc.CompleteTime,
                    ExpireAt = doc.ExpireDate,
                    SignatureAnnotations = doc.Annotations,
                    EsealAnnotations = doc.EsealAnnotations,
                    QrCodeAnnotations = doc.QrCodeAnnotations,
                    SigningStatus = doc.Status,
                    MultiSign = doc.MultiSign,
                    RecepientCount = doc.RecepientCount,
                    MandatorySigns = doc.SignaturesRequiredCount,
                    DisableOrder = doc.DisableOrder,
                    PendingSignList = doc.PendingSignList,
                    CompleteSignList = doc.CompleteSignList,
                    Organization = new Organization()
                    {
                        OrganizationId = doc.OrganizationId,
                        OrganizationName = doc.OrganizationName,
                        AccountType = doc.AccountType,
                    }
                };
                report.DocumentDetails = docdetails;

                List<SignatoryDetails> sigDetails = new();

                foreach (var recep in doc.Recepients)
                {
                    SignatoryDetails signatory = new()
                    {
                        RecepientSuid = recep.Suid,
                        RecepientName = recep.Name,
                        RecepientEmail = recep.Email,
                        SignStatus = recep.Status,
                        Decline = recep.Decline,
                        DeclineRemark = recep.DeclineRemark,
                        DeclinedBy = recep.DeclinedBy,
                        Order = recep.Order,
                        AlternateSignatories = recep.AlternateSignatories,
                        SigningReqTime = recep.SigningReqTime,
                        SigningCompleteTime = recep.SigningCompleteTime,
                        SignatureMandatory = recep.SignatureMandatory,
                        Initial = recep.Initial,
                        HasDelegation = recep.HasDelegation,
                        SignedBy = recep.SignedBy,
                        ReferredBy = recep.ReferredBy,
                        ReferredTo = recep.ReferredTo,
                        AllowComments = recep.AllowComments,
                        Organization = new Organization
                        {
                            OrganizationId = recep.OrganizationId,
                            OrganizationName = recep.OrganizationName,
                            AccountType = recep.AccountType,
                        }
                    };


                    if (recep.HasDelegation)
                    {
                        var delegation = await _delegationRepository.GetDelegateById(recep.DelegationId);
                        if (delegation == null)
                            return new ServiceResult("Delegation not found");

                        foreach (var delegatee in delegation.Delegatees)
                        {
                            DelegateeDetails delegationDetails = new DelegateeDetails()
                            {
                                DelegationId = delegation._id,
                                StartDateTime = delegation.StartDateTime,
                                EndDateTime = delegation.EndDateTime,
                                DelegateeEmail = delegatee.DelegateeEmail,
                                DelegateeName = delegatee.FullName,
                                DelegateeSuid = delegatee.DelegateeSuid,
                                DelegationStatus = delegation.DelegationStatus
                            };

                            signatory.DelgationDetails.Add(delegationDetails);
                        }

                    }

                    sigDetails.Add(signatory);
                }
                report.SignatoryDetails = sigDetails;

                return new ServiceResult(report, "Document report received successfully");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("GetDocumentReportAsync Exception :  {0}", ex.Message);
            }
            return new ServiceResult("Failed to receive document report");
        }

        //public async Task<ServiceResult> GetPaginatedDraftDocumentListAsync(UserDTO userDTO, int pageNumber, int pageSize)
        //{
        //	if (userDTO == null)
        //	{
        //		return new ServiceResult(_constantError.GetMessage("102535"));
        //		//return new ServiceResult("Email cannot be null");
        //	}

        //	_logger.LogInformation("GetDraftDocumentListAsync start");

        //	try
        //	{
        //		var (documents, totalCount) = await _documentRepository.GetPaginatedDocumentListAsync(userDTO.Suid,
        //			userDTO.AccountType.ToLower(), userDTO.OrganizationId, false, pageNumber, pageSize);

        //		int totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        //		var paginatedList = new PaginatedList<Document>(documents, pageNumber, pageSize, totalPages, (int)totalCount);

        //		_logger.LogInformation("GetDraftDocumentListAsync start");
        //		return new ServiceResult(paginatedList, "Successfully received draft document list.");
        //	}
        //	catch (Exception ex)
        //	{
        //		Monitor.SendException(ex);
        //		_logger.LogError(ex, ex.Message);
        //		_logger.LogError("GetDraftDocumentListAsync Exception :  {0}", ex.Message);
        //	}

        //	_logger.LogInformation("GetDraftDocumentListAsync end");
        //	return new ServiceResult(_constantError.GetMessage("102567"));
        //}

        //public async Task<ServiceResult> GetPaginatedSentDocumentListAsync(UserDTO userDTO, int pageNumber, int pageSize)
        //{
        //	if (userDTO == null)
        //	{
        //		return new ServiceResult(_constantError.GetMessage("102535"));
        //		//return new ServiceResult("Email cannot be null");
        //	}

        //	try
        //	{
        //		_logger.LogInformation("GetSentDocumentListAsync start");
        //		var (documents, totalCount) = await _documentRepository.GetPaginatedSentDocumentListAsync(userDTO.Suid, userDTO.AccountType.ToLower(),
        //			userDTO.OrganizationId, true, pageNumber, pageSize);

        //		int totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        //		// Optionally format to PaginatedList<T> or send as-is to the frontend
        //		var result = new PaginatedList<Document>(documents, pageNumber, pageSize,
        //			totalPages, (int)totalCount);

        //		_logger.LogInformation("GetSentDocumentListAsync end");
        //		return new ServiceResult(result, "Successfully received sent document list.");
        //	}
        //	catch (Exception ex)
        //	{
        //		Monitor.SendException(ex);
        //		_logger.LogError(ex, ex.Message);
        //		_logger.LogError("GetSentDocumentListAsync Exception :  {0}", ex.Message);
        //	}

        //	_logger.LogInformation("GetSentDocumentListAsync end");
        //	return new ServiceResult(_constantError.GetMessage("102568"));
        //}

        //public async Task<ServiceResult> GetPaginatedReceivedDocumentsList(UserDTO userDTO, int pageNumber, int pageSize)
        //{
        //	try
        //	{
        //		_logger.LogInformation("GetReceivedDocumentsList start");

        //		// Fetch recipients and documents in parallel (or batch query if possible)
        //		var recepientList = await _recepientsRepository.GetRecepientsBySuidAsync(userDTO.Suid);

        //		// Step 1: Get distinct TempIDs
        //		List<string> tempIdList = recepientList.Select(x => x.Tempid).Distinct().ToList();

        //		// Step 2: Fetch all matching documents in one go
        //		var docList = await _documentRepository.GetDocumentByTempIdList(tempIdList, true);

        //		// Step 3: Map documents by Tempid for quick lookup
        //		var docDict = docList.ToDictionary(d => d._id, d => d);

        //		// Step 4: Combine into a list of { recepient, documentData }
        //		var documentResults = recepientList
        //		.Where(r => docDict.ContainsKey(r.Tempid))
        //		.Select(r => new { recepient = r, documentData = docDict[r.Tempid] })
        //		.ToList();

        //		//var receivedListArray = new List<string>();

        //		var newDocList = new List<Document>();

        //		foreach (var result in documentResults)
        //		{
        //			var recepient = result.recepient;
        //			var documentData = result.documentData;

        //			if (documentData != null && documentData.OwnerID != userDTO.Suid)
        //			{
        //				//receivedListArray.Add(recepient.Tempid);
        //				newDocList.Add(documentData);

        //				if (userDTO.AccountType.ToLower() != recepient.AccountType)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && userDTO.OrganizationId != recepient.OrganizationId)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (!string.IsNullOrEmpty(recepient.EsealOrgId.Trim()) && userDTO.OrganizationId != recepient.EsealOrgId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (!string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.OrganizationId != recepient.OrganizationId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && userDTO.OrganizationId != recepient.OrganizationId)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId.Trim()))
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.OrganizationId.Trim()))
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}
        //			}
        //		}

        //		IList<Document> newdocumentsList = [];

        //		newdocumentsList = newDocList.Where(x => x.Status != DocumentStatusConstants.Expired).ToList();

        //		int totalCount = newdocumentsList.Count;

        //		// Apply pagination
        //		var paginatedDocuments = newdocumentsList
        //			.Skip((pageNumber - 1) * pageSize)
        //			.Take(pageSize)
        //			.ToList();

        //		_logger.LogInformation("GetReceivedDocumentsList end");

        //		var paginatedResult = new PaginatedList<Document>(
        //			paginatedDocuments,
        //			pageNumber,
        //			pageSize,
        //			(int)Math.Ceiling(totalCount / (double)pageSize),
        //			totalCount
        //		);
        //		//if (newdocumentsList == null)
        //		//{
        //		//	_logger.LogInformation("GetReceivedDocumentsList end");
        //		//	return new ServiceResult(new List<Document>(), "Successfully received received document list.");
        //		//}

        //		_logger.LogInformation("GetReceivedDocumentsList end");
        //		return new ServiceResult(paginatedResult, "Successfully received received document list.");
        //	}
        //	catch (Exception ex)
        //	{
        //		Monitor.SendException(ex);
        //		_logger.LogError(ex, ex.Message);
        //		_logger.LogError($"GetReceivedDocumentsList Exception :  {ex.Message}");
        //	}
        //	_logger.LogInformation("GetReceivedDocumentsList end");
        //	return new ServiceResult(_constantError.GetMessage("102569"));
        //}

        //public async Task<ServiceResult> GetPaginatedReferredDocumentsList(UserDTO userDTO, int pageNumber, int pageSize)
        //{
        //	try
        //	{
        //		var recepientList = await _recepientsRepository.GetRecepientsByAlternateEmailSuidAsync(userDTO.Suid);
        //		// Step 1: Get distinct TempIDs
        //		List<string> tempIdList = recepientList.Select(x => x.Tempid).Distinct().ToList();

        //		// Step 2: Fetch all matching documents in one go
        //		var docList = await _documentRepository.GetDocumentByTempIdList(tempIdList, true);

        //		// Step 3: Map documents by Tempid for quick lookup
        //		var docDict = docList.ToDictionary(d => d._id, d => d);

        //		// Step 4: Combine into a list of { recepient, documentData }
        //		var documentResults = recepientList
        //		 .Where(r => docDict.ContainsKey(r.Tempid))
        //		 .Select(r => new { recepient = r, documentData = docDict[r.Tempid] })
        //		 .ToList();

        //		var newDocList = new List<Document>();

        //		foreach (var result in documentResults)
        //		{
        //			var recepient = result.recepient;
        //			var documentData = result.documentData;

        //			if (documentData != null)
        //			{
        //				//receivedListArray.Add(recepient.Tempid);
        //				newDocList.Add(documentData);

        //				if (userDTO.AccountType.ToLower() != recepient.AccountType)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && userDTO.OrganizationId != recepient.OrganizationId)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (!string.IsNullOrEmpty(recepient.EsealOrgId.Trim()) && userDTO.OrganizationId != recepient.EsealOrgId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (!string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.OrganizationId != recepient.OrganizationId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (!string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && userDTO.OrganizationId != recepient.OrganizationId)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId.Trim()))
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.OrganizationId.Trim()))
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}
        //			}
        //		}

        //		//var documents = await _documentRepository.GetDocumentByTempIdList(receivedListArray, true);
        //		//if (documents == null)
        //		//{
        //		// _logger.LogError("Failed to receive referred document list.");
        //		// return new ServiceResult("Failed to receive referred document list.");
        //		//}

        //		IList<Document> newdocumentsList = [];

        //		newdocumentsList = newDocList.Where(x => x.Status != DocumentStatusConstants.Expired).ToList();

        //		int totalCount = newdocumentsList.Count;

        //		// Apply pagination
        //		var paginatedDocuments = newdocumentsList
        //			.Skip((pageNumber - 1) * pageSize)
        //			.Take(pageSize)
        //			.ToList();

        //		_logger.LogInformation("GetReceivedDocumentsList end");

        //		var paginatedResult = new PaginatedList<Document>(
        //			paginatedDocuments,
        //			pageNumber,
        //			pageSize,
        //			(int)Math.Ceiling(totalCount / (double)pageSize),
        //			totalCount
        //		);
        //		//if (documents == null)
        //		//{
        //		//    _logger.LogError("Failed to receive referred document list.");
        //		//    return new ServiceResult("Failed to receive referred document list.");
        //		//}

        //		return new ServiceResult(paginatedResult, "Successfully received referred document list.");
        //	}
        //	catch (Exception ex)
        //	{
        //		Monitor.SendException(ex);
        //		_logger.LogError(ex, ex.Message);
        //		_logger.LogError("GetReferredDocumentsList Exception :  {0}", ex.Message);
        //	}
        //	return new ServiceResult(_constantError.GetMessage("102572"));
        //}

        //public async Task<ServiceResult> GetDraftDocumentListByFilterAsync(UserDTO userDTO, DocumentListFilterDTO documentFilter)
        //{
        //	if (userDTO == null)
        //	{
        //		return new ServiceResult(_constantError.GetMessage("102535"));
        //		//return new ServiceResult("Email cannot be null");
        //	}

        //	_logger.LogInformation("GetDraftDocumentListAsync start");

        //	try
        //	{
        //		var documnets = await _documentRepository.GetDocumnetListByFilterAsync(userDTO.Suid, userDTO.AccountType.ToLower(),
        //			userDTO.OrganizationId, false, documentFilter);
        //		if (documnets == null)
        //		{
        //			_logger.LogError("Failed to receive draft document list.");
        //			return new ServiceResult("Failed to receive draft document list.");
        //		}

        //		_logger.LogInformation("GetDraftDocumentListAsync start");
        //		return new ServiceResult(documnets, "Successfully received draft document list.");
        //	}
        //	catch (Exception ex)
        //	{
        //		Monitor.SendException(ex);
        //		_logger.LogError(ex, ex.Message);
        //		_logger.LogError($"GetDraftDocumentListAsync Exception : {ex.Message}");
        //	}

        //	_logger.LogInformation("GetDraftDocumentListAsync end");
        //	return new ServiceResult(_constantError.GetMessage("102567"));
        //}

        //public async Task<ServiceResult> GetSentDocumentListByFilterAsync(UserDTO userDTO, DocumentListFilterDTO documentFilter)
        //{
        //	if (userDTO == null)
        //	{
        //		return new ServiceResult(_constantError.GetMessage("102535"));
        //		//return new ServiceResult("Email cannot be null");
        //	}

        //	try
        //	{
        //		_logger.LogInformation("GetSentDocumentListAsync start");
        //		var documents = await _documentRepository.GetSentDocumnetListByFilterAsync(userDTO.Suid, userDTO.AccountType.ToLower(),
        //			userDTO.OrganizationId, true, documentFilter);
        //		if (documents == null)
        //		{
        //			_logger.LogError("Failed to receive sent document list.");
        //			return new ServiceResult("Failed to receive sent document list.");
        //		}

        //		_logger.LogInformation("GetSentDocumentListAsync end");
        //		return new ServiceResult(documents, "Successfully received sent document list.");
        //	}
        //	catch (Exception ex)
        //	{
        //		Monitor.SendException(ex);
        //		_logger.LogError(ex, ex.Message);
        //		_logger.LogError($"GetSentDocumentListAsync Exception : {ex.Message}");
        //	}

        //	_logger.LogInformation("GetSentDocumentListAsync end");
        //	return new ServiceResult(_constantError.GetMessage("102568"));
        //}

        //public async Task<ServiceResult> GetReceivedDocumentsListByFilterAsync(UserDTO userDTO, DocumentListFilterDTO documentFilter)
        //{
        //	try
        //	{
        //		_logger.LogInformation("GetReceivedDocumentsList start");

        //		// Fetch recipients and documents in parallel (or batch query if possible)
        //		var recepientList = await _recepientsRepository.GetRecepientsBySuidAsync(userDTO.Suid);

        //		// Step 1: Get distinct TempIDs
        //		List<string> tempIdList = recepientList.Select(x => x.Tempid).Distinct().ToList();

        //		documentFilter.IsReceivedDocumentList = true;

        //		// Step 2: Fetch all matching documents in one go
        //		var docList = await _documentRepository.GetDocumentByTempIdListByFilter(userDTO.Suid, tempIdList, true, documentFilter);

        //		// Step 3: Map documents by Tempid for quick lookup
        //		var docDict = docList.ToDictionary(d => d._id, d => d);

        //		// Step 4: Combine into a list of { recepient, documentData }
        //		var documentResults = recepientList
        //	.Where(r => docDict.ContainsKey(r.Tempid))
        //	.Select(r => new { recepient = r, documentData = docDict[r.Tempid] })
        //	.ToList();

        //		//var receivedListArray = new List<string>();

        //		var newDocList = new List<Document>();

        //		foreach (var result in documentResults)
        //		{
        //			var recepient = result.recepient;
        //			var documentData = result.documentData;

        //			if (documentData != null && documentData.OwnerID != userDTO.Suid)
        //			{
        //				//receivedListArray.Add(recepient.Tempid);
        //				newDocList.Add(documentData);

        //				if (userDTO.AccountType.ToLower() != recepient.AccountType)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && userDTO.OrganizationId != recepient.OrganizationId)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (!string.IsNullOrEmpty(recepient.EsealOrgId.Trim()) && userDTO.OrganizationId != recepient.EsealOrgId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (!string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.OrganizationId != recepient.OrganizationId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && userDTO.OrganizationId != recepient.OrganizationId)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId.Trim()))
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.OrganizationId.Trim()))
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}
        //			}
        //		}

        //		IList<Document> newdocumentsList = [];

        //		var filteredList = newDocList
        //			.Where(x => x.Status != DocumentStatusConstants.Expired)
        //			.OrderByDescending(x => x.CreatedAt);

        //		if (documentFilter.DocumentFilter?.ToLower() == "latest50")
        //		{
        //			newdocumentsList = filteredList.Take(50).ToList();
        //		}
        //		else
        //		{
        //			newdocumentsList = filteredList.ToList();
        //		}

        //		if (newdocumentsList == null)
        //		{
        //			_logger.LogInformation("GetReceivedDocumentsList end");
        //			return new ServiceResult(new List<Document>(), "Successfully received received document list.");
        //		}

        //		_logger.LogInformation("GetReceivedDocumentsList end");
        //		return new ServiceResult(newdocumentsList, "Successfully received received document list.");
        //	}
        //	catch (Exception ex)
        //	{
        //		Monitor.SendException(ex);
        //		_logger.LogError(ex, ex.Message);
        //		_logger.LogError($"GetReceivedDocumentsList Exception :  {ex.Message}");
        //	}
        //	_logger.LogInformation("GetReceivedDocumentsList end");
        //	return new ServiceResult(_constantError.GetMessage("102569"));
        //}

        //public async Task<ServiceResult> GetReferredDocumentsByFilterListAsync(UserDTO userDTO, DocumentListFilterDTO documentFilter)
        //{
        //	try
        //	{
        //		//List<string> receivedListArray = new List<string>();

        //		var recepientList = await _recepientsRepository.GetRecepientsByAlternateEmailSuidAsync(userDTO.Suid);
        //		// Step 1: Get distinct TempIDs
        //		List<string> tempIdList = recepientList.Select(x => x.Tempid).Distinct().ToList();

        //		// Step 2: Fetch all matching documents in one go
        //		var docList = await _documentRepository.GetDocumentByTempIdListByFilter(userDTO.Suid, tempIdList, true, documentFilter);

        //		// Step 3: Map documents by Tempid for quick lookup
        //		var docDict = docList.ToDictionary(d => d._id, d => d);

        //		// Step 4: Combine into a list of { recepient, documentData }
        //		var documentResults = recepientList
        //		 .Where(r => docDict.ContainsKey(r.Tempid))
        //		 .Select(r => new { recepient = r, documentData = docDict[r.Tempid] })
        //		 .ToList();

        //		var newDocList = new List<Document>();

        //		foreach (var result in documentResults)
        //		{
        //			var recepient = result.recepient;
        //			var documentData = result.documentData;

        //			if (documentData != null)
        //			{
        //				//receivedListArray.Add(recepient.Tempid);
        //				newDocList.Add(documentData);

        //				if (userDTO.AccountType.ToLower() != recepient.AccountType)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && userDTO.OrganizationId != recepient.OrganizationId)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (!string.IsNullOrEmpty(recepient.EsealOrgId.Trim()) && userDTO.OrganizationId != recepient.EsealOrgId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (!string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.OrganizationId != recepient.OrganizationId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (!string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && userDTO.OrganizationId != recepient.OrganizationId)
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId.Trim()))
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}

        //				if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.OrganizationId.Trim()))
        //				{
        //					//receivedListArray.Remove(recepient.Tempid);
        //					newDocList.Remove(documentData);
        //					continue;
        //				}
        //			}
        //		}

        //		//var documents = await _documentRepository.GetDocumentByTempIdList(receivedListArray, true);
        //		//if (documents == null)
        //		//{
        //		// _logger.LogError("Failed to receive referred document list.");
        //		// return new ServiceResult("Failed to receive referred document list.");
        //		//}

        //		IList<Document> newdocumentsList = [];

        //		var filteredList = newDocList
        //			.Where(x => x.Status != DocumentStatusConstants.Expired)
        //			.OrderByDescending(x => x.CreatedAt);

        //		if (documentFilter.DocumentFilter?.ToLower() == "latest50")
        //		{
        //			newdocumentsList = filteredList.Take(50).ToList();
        //		}
        //		else
        //		{
        //			newdocumentsList = filteredList.ToList();
        //		}

        //		if (newdocumentsList == null)
        //		{
        //			_logger.LogInformation("GetReferredDocumentsList end");
        //			return new ServiceResult(new List<Document>(), "Successfully received referred document list.");
        //		}

        //		_logger.LogInformation("GetReferredDocumentsList end");
        //		return new ServiceResult(newdocumentsList, "Successfully received referred document list.");
        //	}
        //	catch (Exception ex)
        //	{
        //		Monitor.SendException(ex);
        //		_logger.LogError(ex, ex.Message);
        //		_logger.LogError($"GetReferredDocumentsList Exception :  {ex.Message}");
        //	}
        //	return new ServiceResult(_constantError.GetMessage("102572"));
        //}

        public async Task<ServiceResult> GetPaginatedDraftDocumentListByFilterAsync(UserDTO userDTO,
            DocumentListFilterDTO documentFilter, int pageNumber, int pageSize, bool isPagination, string searchTerm)
        {
            if (userDTO == null)
            {
                return new ServiceResult(_constantError.GetMessage("102535"));
            }

            _logger.LogInformation("GetDraftDocumentListAsync start");

            try
            {
                var (documents, totalCount) = await _documentRepository.GetPaginatedDocumnetListByFilterAsync(userDTO.Suid, userDTO.AccountType.ToLower(),
                    userDTO.OrganizationId, false, documentFilter, pageNumber, pageSize, isPagination, searchTerm);

                int totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

                if (isPagination)
                {
                    // Optionally format to PaginatedList<T> or send as-is to the frontend
                    var result = new PaginatedList<Document>(documents, pageNumber, pageSize,
                        totalPages, (int)totalCount);

                    _logger.LogInformation("GetDraftDocumentListAsync start");
                    return new ServiceResult(result, "Successfully received draft document list.");
                }
                else
                {
                    _logger.LogInformation("GetDraftDocumentListAsync start");
                    return new ServiceResult(documents, "Successfully received draft document list.");
                }

            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError($"GetDraftDocumentListAsync Exception : {ex.Message}");
            }

            _logger.LogInformation("GetDraftDocumentListAsync end");
            return new ServiceResult(_constantError.GetMessage("102567"));
        }

        public async Task<ServiceResult> GetPaginatedSentDocumentListByFilterAsync(UserDTO userDTO,
            DocumentListFilterDTO documentFilter, int pageNumber, int pageSize, bool isPagination, string searchTerm)
        {
            if (userDTO == null)
            {
                return new ServiceResult(_constantError.GetMessage("102535"));
            }

            try
            {
                _logger.LogInformation("GetSentDocumentListAsync start");
                var (documents, totalCount) = await _documentRepository.GetPaginatedSentDocumnetListByFilterAsync(userDTO.Suid, userDTO.AccountType.ToLower(),
                    userDTO.OrganizationId, true, documentFilter, pageNumber, pageSize, isPagination, searchTerm);

                int totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

                if (isPagination)
                {
                    // Optionally format to PaginatedList<T> or send as-is to the frontend
                    var result = new PaginatedList<Document>(documents, pageNumber, pageSize,
                        totalPages, (int)totalCount);

                    _logger.LogInformation("GetSentDocumentListAsync end");
                    return new ServiceResult(result, "Successfully received sent document list.");
                }
                else
                {
                    _logger.LogInformation("GetSentDocumentListAsync end");
                    return new ServiceResult(documents, "Successfully received sent document list.");
                }

                //if (documents == null)
                //{
                //    _logger.LogError("Failed to receive sent document list.");
                //    return new ServiceResult("Failed to receive sent document list.");
                //}

                //_logger.LogInformation("GetSentDocumentListAsync end");
                //return new ServiceResult(documents, "Successfully received sent document list.");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError($"GetSentDocumentListAsync Exception : {ex.Message}");
            }

            _logger.LogInformation("GetSentDocumentListAsync end");
            return new ServiceResult(_constantError.GetMessage("102568"));
        }

        public async Task<ServiceResult> GetPaginatedReceivedDocumentsListByFilterAsync(UserDTO userDTO,
            DocumentListFilterDTO documentFilter, int pageNumber, int pageSize, bool isPagination, string searchTerm)
        {
            try
            {
                _logger.LogInformation("GetReceivedDocumentsList start");

                // Fetch recipients and documents in parallel (or batch query if possible)
                var recepientList = await _recepientsRepository.GetRecepientsBySuidAsync(userDTO.Suid);

                // Step 1: Get distinct TempIDs
                List<string> tempIdList = recepientList.Select(x => x.Tempid).Distinct().ToList();

                documentFilter.IsReceivedDocumentList = true;

                // Step 2: Fetch all matching documents in one go
                var docList = await _documentRepository.GetDocumentByTempIdListByFilter(userDTO.Suid, tempIdList, true, documentFilter);

                // Step 3: Map documents by Tempid for quick lookup
                var docDict = docList.ToDictionary(d => d._id, d => d);

                // Step 4: Combine into a list of { recepient, documentData }
                var documentResults = recepientList
            .Where(r => docDict.ContainsKey(r.Tempid))
            .Select(r => new { recepient = r, documentData = docDict[r.Tempid] })
            .ToList();


                var newDocList = new List<Document>();

                foreach (var result in documentResults)
                {
                    var recepient = result.recepient;
                    var documentData = result.documentData;

                    if (documentData != null && documentData.OwnerID != userDTO.Suid)
                    {
                        newDocList.Add(documentData);

                        if (userDTO.AccountType.ToLower() != recepient.AccountType)
                        {
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && userDTO.OrganizationId != recepient.OrganizationId)
                        {
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (!string.IsNullOrEmpty(recepient.EsealOrgId.Trim()) && userDTO.OrganizationId != recepient.EsealOrgId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
                        {
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (!string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.OrganizationId != recepient.OrganizationId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
                        {
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && userDTO.OrganizationId != recepient.OrganizationId)
                        {
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId.Trim()))
                        {
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.OrganizationId.Trim()))
                        {
                            newDocList.Remove(documentData);
                            continue;
                        }
                    }
                }

                // --- Search Filter Here ---
                IList<Document> documentsToPaginate = newDocList;

                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    string lowerSearchTerm = searchTerm.ToLower();
                    documentsToPaginate = documentsToPaginate.Where(d =>
                        (d.DocumentName != null && d.DocumentName.ToLower().Contains(lowerSearchTerm)) ||
                        (d.OwnerName != null && d.OwnerName.ToLower().Contains(lowerSearchTerm)) ||
                        (d.CreatedAt.ToString("dd/MM/yyyy").ToLower().Contains(lowerSearchTerm)) || // Search by "day/month/year" format
                        (d.CreatedAt.Year.ToString().Contains(lowerSearchTerm)) || // Search by year
                        (d.CreatedAt.Month.ToString().Contains(lowerSearchTerm)) || // Search by month number
                        (d.CreatedAt.Day.ToString().Contains(lowerSearchTerm)) ||
                        (d.ExpireDate.ToString("dd/MM/yyyy").ToLower().Contains(lowerSearchTerm)) || // Search by "day/month/year" format
                        (d.ExpireDate.Year.ToString().Contains(lowerSearchTerm)) || // Search by year
                        (d.ExpireDate.Month.ToString().Contains(lowerSearchTerm)) || // Search by month number
                        (d.ExpireDate.Day.ToString().Contains(lowerSearchTerm))
                    ).ToList(); // Convert to list after filtering
                }

                // --- End Search Filter ---

                var filteredList = documentsToPaginate
                    .OrderByDescending(x => x.CreatedAt);

                if (documentFilter.DocumentFilter?.ToLower() == "latest50")
                {
                    documentsToPaginate = filteredList.Take(50).ToList();
                }
                else if (documentFilter.DocumentFilter?.ToLower() == "latest30") // Use else if to avoid both being applied
                {
                    documentsToPaginate = filteredList.Take(30).ToList();
                }
                else
                {
                    documentsToPaginate = filteredList.ToList();
                }


                if (isPagination)
                {
                    int totalCount = documentsToPaginate.Count; // Count after all filters (including search)

                    // Apply pagination
                    var paginatedDocuments = documentsToPaginate
                        .Skip((pageNumber - 1) * pageSize)
                        .Take(pageSize)
                        .ToList();

                    var paginatedResult = new PaginatedList<Document>(
                        paginatedDocuments,
                        pageNumber,
                        pageSize,
                        (int)Math.Ceiling(totalCount / (double)pageSize),
                        totalCount
                    );

                    _logger.LogInformation("GetReceivedDocumentsList end");
                    return new ServiceResult(paginatedResult, "Successfully received received document list.");
                }
                else
                {
                    _logger.LogInformation("GetReceivedDocumentsList end");
                    return new ServiceResult(documentsToPaginate, "Successfully received received document list.");
                }


                //            IList<Document> newdocumentsList = [];

                //var filteredList = newDocList
                //	.OrderByDescending(x => x.CreatedAt);

                //if (documentFilter.DocumentFilter?.ToLower() == "latest50")
                //{
                //	newdocumentsList = filteredList.Take(50).ToList();
                //}
                //if (documentFilter.DocumentFilter?.ToLower() == "latest30")
                //{
                //	newdocumentsList = filteredList.Take(30).ToList();
                //}
                //else
                //{
                //	newdocumentsList = filteredList.ToList();
                //}

                //if (isPagination)
                //{
                //	int totalCount = newdocumentsList.Count;

                //	// Apply pagination
                //	var paginatedDocuments = newdocumentsList
                //		.Skip((pageNumber - 1) * pageSize)
                //		.Take(pageSize)
                //		.ToList();

                //	var paginatedResult = new PaginatedList<Document>(
                //		paginatedDocuments,
                //		pageNumber,
                //		pageSize,
                //		(int)Math.Ceiling(totalCount / (double)pageSize),
                //		totalCount
                //	);

                //	_logger.LogInformation("GetReceivedDocumentsList end");
                //	return new ServiceResult(paginatedResult, "Successfully received received document list.");
                //            }
                //            else
                //{
                //	_logger.LogInformation("GetReceivedDocumentsList end");
                //	return new ServiceResult(newdocumentsList, "Successfully received received document list.");
                //}
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError($"GetReceivedDocumentsList Exception :  {ex.Message}");
            }
            _logger.LogInformation("GetReceivedDocumentsList end");
            return new ServiceResult(_constantError.GetMessage("102569"));
        }

        public async Task<ServiceResult> GetPaginatedReferredDocumentsByFilterListAsync(UserDTO userDTO,
            DocumentListFilterDTO documentFilter, int pageNumber, int pageSize, bool isPagination, string searchTerm)
        {
            try
            {
                //List<string> receivedListArray = new List<string>();

                var recepientList = await _recepientsRepository.GetRecepientsByAlternateEmailSuidAsync(userDTO.Suid);
                // Step 1: Get distinct TempIDs
                List<string> tempIdList = recepientList.Select(x => x.Tempid).Distinct().ToList();

                // Step 2: Fetch all matching documents in one go
                var docList = await _documentRepository.GetDocumentByTempIdListByFilter(userDTO.Suid, tempIdList,
                    true, documentFilter);

                // Step 3: Map documents by Tempid for quick lookup
                var docDict = docList.ToDictionary(d => d._id, d => d);

                // Step 4: Combine into a list of { recepient, documentData }
                var documentResults = recepientList
                 .Where(r => docDict.ContainsKey(r.Tempid))
                 .Select(r => new { recepient = r, documentData = docDict[r.Tempid] })
                 .ToList();

                var newDocList = new List<Document>();

                foreach (var result in documentResults)
                {
                    var recepient = result.recepient;
                    var documentData = result.documentData;

                    if (documentData != null)
                    {
                        newDocList.Add(documentData);

                        if (userDTO.AccountType.ToLower() != recepient.AccountType)
                        {
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && userDTO.OrganizationId != recepient.OrganizationId)
                        {
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (!string.IsNullOrEmpty(recepient.EsealOrgId.Trim()) && userDTO.OrganizationId != recepient.EsealOrgId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
                        {
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (!string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.OrganizationId != recepient.OrganizationId && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization)
                        {
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (!string.IsNullOrEmpty(recepient.OrganizationId.Trim()) && userDTO.AccountType.ToLower() == AccountTypeConstants.Organization && userDTO.OrganizationId != recepient.OrganizationId)
                        {
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.EsealOrgId.Trim()))
                        {
                            newDocList.Remove(documentData);
                            continue;
                        }

                        if (userDTO.AccountType.ToLower() == AccountTypeConstants.Self && !string.IsNullOrEmpty(recepient.OrganizationId.Trim()))
                        {
                            newDocList.Remove(documentData);
                            continue;
                        }
                    }
                }

                // --- Search Filter Here ---
                IList<Document> documentsToPaginate = newDocList;

                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    string lowerSearchTerm = searchTerm.ToLower();
                    documentsToPaginate = documentsToPaginate.Where(d =>
                        (d.DocumentName != null && d.DocumentName.ToLower().Contains(lowerSearchTerm)) ||
                        (d.OwnerName != null && d.OwnerName.ToLower().Contains(lowerSearchTerm)) ||
                        (d.CreatedAt.ToString("dd/MM/yyyy").ToLower().Contains(lowerSearchTerm)) || // Search by "day/month/year" format
                        (d.CreatedAt.Year.ToString().Contains(lowerSearchTerm)) || // Search by year
                        (d.CreatedAt.Month.ToString().Contains(lowerSearchTerm)) || // Search by month number
                        (d.CreatedAt.Day.ToString().Contains(lowerSearchTerm)) ||
                        (d.ExpireDate.ToString("dd/MM/yyyy").ToLower().Contains(lowerSearchTerm)) || // Search by "day/month/year" format
                        (d.ExpireDate.Year.ToString().Contains(lowerSearchTerm)) || // Search by year
                        (d.ExpireDate.Month.ToString().Contains(lowerSearchTerm)) || // Search by month number
                        (d.ExpireDate.Day.ToString().Contains(lowerSearchTerm))
                    ).ToList(); // Convert to list after filtering
                }

                // --- End Search Filter ---

                var filteredList = documentsToPaginate
                    .OrderByDescending(x => x.CreatedAt);

                if (documentFilter.DocumentFilter?.ToLower() == "latest50")
                {
                    documentsToPaginate = filteredList.Take(50).ToList();
                }
                else if (documentFilter.DocumentFilter?.ToLower() == "latest30") // Use else if to avoid both being applied
                {
                    documentsToPaginate = filteredList.Take(30).ToList();
                }
                else
                {
                    documentsToPaginate = filteredList.ToList();
                }


                if (isPagination)
                {
                    int totalCount = documentsToPaginate.Count; // Count after all filters (including search)

                    // Apply pagination
                    var paginatedDocuments = documentsToPaginate
                        .Skip((pageNumber - 1) * pageSize)
                        .Take(pageSize)
                        .ToList();

                    var paginatedResult = new PaginatedList<Document>(
                        paginatedDocuments,
                        pageNumber,
                        pageSize,
                        (int)Math.Ceiling(totalCount / (double)pageSize),
                        totalCount
                    );

                    _logger.LogInformation("GetReceivedDocumentsList end");
                    return new ServiceResult(paginatedResult, "Successfully received received document list.");
                }
                else
                {
                    _logger.LogInformation("GetReceivedDocumentsList end");
                    return new ServiceResult(documentsToPaginate, "Successfully received received document list.");
                }

                //IList<Document> newdocumentsList = [];

                //var filteredList = newDocList
                //	.OrderByDescending(x => x.CreatedAt);

                //if (documentFilter.DocumentFilter?.ToLower() == "latest50")
                //{
                //	newdocumentsList = filteredList.Take(50).ToList();
                //}
                //if (documentFilter.DocumentFilter?.ToLower() == "latest30")
                //{
                //	newdocumentsList = filteredList.Take(30).ToList();
                //}
                //else
                //{
                //	newdocumentsList = filteredList.ToList();
                //}

                //_logger.LogInformation("GetReceivedDocumentsList end");

                //if (isPagination)
                //{
                //	int totalCount = newdocumentsList.Count;

                //	// Apply pagination
                //	var paginatedDocuments = newdocumentsList
                //		.Skip((pageNumber - 1) * pageSize)
                //		.Take(pageSize)
                //		.ToList();

                //	var paginatedResult = new PaginatedList<Document>(
                //		paginatedDocuments,
                //		pageNumber,
                //		pageSize,
                //		(int)Math.Ceiling(totalCount / (double)pageSize),
                //		totalCount
                //	);

                //	_logger.LogInformation("GetReferredDocumentsList end");
                //	return new ServiceResult(paginatedResult, "Successfully received referred document list.");
                //}
                //else
                //{
                //	_logger.LogInformation("GetReferredDocumentsList end");
                //	return new ServiceResult(newdocumentsList, "Successfully received referred document list.");
                //}

            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError($"GetReferredDocumentsList Exception :  {ex.Message}");
            }
            return new ServiceResult(_constantError.GetMessage("102572"));
        }

        public async Task<ServiceResult> GetPaginatedDocumentsListByFilter(FilterDocumentDTO model, UserDTO userDTO,
            int pageNumber, int pageSize, string searchTerm)
        {
            try
            {
                // Parallelize the document list retrieval
                var draftTask = GetDraftDocumentListAsync(userDTO, true);
                var sentTask = GetSentDocumentListAsync(userDTO, true);
                var receivedTask = GetReceivedDocumentsList(userDTO, true);
                var referredTask = GetReferredDocumentsList(userDTO, true);

                await Task.WhenAll(draftTask, sentTask, receivedTask, referredTask);

                // Retrieve the result after all tasks are completed
                var draftList = (List<Document>)draftTask.Result.Result;
                var sendList = (List<Document>)sentTask.Result.Result;
                var receivedList = (List<Document>)receivedTask.Result.Result;
                var referredList = (List<Document>)referredTask.Result.Result;

                var ownList = draftList.Concat(sendList).ToList();
                var otherList = receivedList.Concat(referredList).ToList();
                var allList = ownList.Concat(otherList).ToList();

                List<Document> finalList = new List<Document>();

                if (model.Status == DocumentStatusConstants.Completed)
                {
                    ownList.ForEach(x => { if (x.Status == DocumentStatusConstants.Completed) finalList.Add(x); });
                }
                else if (model.Status == DocumentStatusConstants.Expired)
                {
                    ownList.ForEach(x => { if (x.Status == DocumentStatusConstants.Expired) finalList.Add(x); });
                }
                else if (model.Status == DocumentStatusConstants.Declined)
                {
                    ownList.ForEach(x => { if (x.Status == DocumentStatusConstants.Declined) finalList.Add(x); });
                }
                else if (model.Status == DocumentStatusConstants.InProgress)
                {
                    if (model.ActionRequired)
                    {
                        foreach (var document in allList)
                        {
                            if (DocumentStatusConstants.InProgress == document.Status)
                            {
                                DateTime untilDate = document.CreatedAt.AddDays(Convert.ToDouble(document.DaysToComplete));
                                var expiredays = Math.Round(Math.Abs((untilDate - DateTime.UtcNow).TotalDays));
                                if (!model.ExpirySoon || (expiredays >= 0 && expiredays <= 2))
                                {
                                    if (document.MultiSign)
                                    {
                                        if (document.DisableOrder)
                                        {
                                            foreach (var user in document.PendingSignList)
                                            {
                                                if (user.suid == userDTO.Suid)
                                                {

                                                    finalList.Add(document);
                                                }
                                            }

                                            if (document.Recepients.Any(x => x.AlternateSignatories.Any(x => x.suid == userDTO.Suid)))
                                            {
                                                finalList.Add(document);
                                            }

                                        }
                                        else
                                        {
                                            if (document.PendingSignList[0].suid.Equals(userDTO.Suid))
                                            {
                                                finalList.Add(document);
                                            }

                                            var signerSuid = document.PendingSignList[0].suid;

                                            if (document.Recepients
                                                .Where(x => x.Suid == signerSuid)
                                                .Any(x => x.AlternateSignatories.Any(x => x.suid == userDTO.Suid))
                                                )
                                            {
                                                finalList.Add(document);
                                            }
                                        }

                                    }
                                    else
                                    {
                                        finalList.Add(document);
                                    }
                                }
                            }
                        }


                    }
                    else
                    {
                        ownList.ForEach(x => { if (x.Status == DocumentStatusConstants.InProgress) finalList.Add(x); });
                    }


                }


                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    string lowerSearchTerm = searchTerm.ToLower();
                    finalList = finalList.Where(d =>
                        (d.DocumentName != null && d.DocumentName.ToLower().Contains(lowerSearchTerm)) ||
                        (d.OwnerName != null && d.OwnerName.ToLower().Contains(lowerSearchTerm)) ||
                        (d.CreatedAt.ToString("dd/MM/yyyy").ToLower().Contains(lowerSearchTerm)) // Fixed this part
                    ).ToList();
                }

                finalList = finalList.OrderByDescending(x => x.CreatedAt).ToList();

                int totalCount = finalList.Count;

                // Apply pagination
                var paginatedDocuments = finalList
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                var paginatedResult = new PaginatedList<Document>(
                    paginatedDocuments,
                    pageNumber,
                    pageSize,
                    (int)Math.Ceiling(totalCount / (double)pageSize),
                    totalCount
                );

                return new ServiceResult(paginatedResult, "Successfully received action required document list.");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, ex.Message);
                _logger.LogError("GetReceivedDocumentsList Exception :  {0}", ex.Message);
            }
            return new ServiceResult(_constantError.GetMessage("102570"));
        }

        public async Task<ServiceResult> GetReferredDocumentStatusCountAsync(UserDTO userDTO)
        {
            try
            {
                var result = await GetReferredDocumentsList(userDTO, true);

                if (!result.Success)
                {
                    _logger.LogError("Document list is empty");
                    return new ServiceResult(new DocumentStatusCountDTO());
                }

                if (result.Result is not List<Document> documents || documents.Count == 0)
                {
                    _logger.LogError("Document list is empty");
                    return new ServiceResult(new DocumentStatusCountDTO());
                }

                var status = new DocumentStatusCountDTO
                {
                    Total = documents.Count,
                };

                foreach (var doc in documents)
                {
                    switch (doc.Status)
                    {
                        case DocumentStatusConstants.InProgress:
                            status.InProgress++;
                            break;

                        case DocumentStatusConstants.Completed:
                            status.Completed++;
                            break;

                        case DocumentStatusConstants.Expired:
                            status.Expired++;
                            break;

                        case DocumentStatusConstants.Declined:
                            status.Declined++;
                            break;

                        case DocumentStatusConstants.Recalled:
                            status.Recalled++;
                            break;

                        default:
                            _logger.LogWarning($"Unknown document status: {doc.Status} for document id: {doc._id} ");
                            break;
                    }
                }

                return new ServiceResult(status, "Referred Document status count received successfully");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, "GetReferredDocumentStatusCountAsync failed");
                return new ServiceResult("Error occurred while getting referred document status count");
            }
        }

        public async Task<ServiceResult> GetMyDocumentStatusCountAsync(UserDTO userDTO)
        {
            try
            {
                var result = await GetDraftDocumentListAsync(userDTO, true);

                if (!result.Success)
                {
                    _logger.LogError("Document list is empty");
                    return new ServiceResult(new DocumentStatusCountDTO());
                }

                if (result.Result is not List<Document> documents || documents.Count == 0)
                {
                    _logger.LogError("Document list is empty");
                    return new ServiceResult(new DocumentStatusCountDTO());
                }

                var status = new DocumentStatusCountDTO
                {
                    Total = documents.Count,
                };

                foreach (var doc in documents)
                {
                    switch (doc.Status)
                    {
                        case DocumentStatusConstants.InProgress:
                            status.InProgress++;
                            break;

                        case DocumentStatusConstants.Completed:
                            status.Completed++;
                            break;

                        case DocumentStatusConstants.Expired:
                            status.Expired++;
                            break;

                        case DocumentStatusConstants.Declined:
                            status.Declined++;
                            break;

                        case DocumentStatusConstants.Recalled:
                            status.Recalled++;
                            break;

                        default:
                            _logger.LogWarning($"Unknown document status: {doc.Status} for document id: {doc._id} ");
                            break;
                    }
                }

                return new ServiceResult(status, "My document status count received successfully");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, "GetMyDocumentStatusAsync failed");
                return new ServiceResult("Error occurred while getting my document status count");
            }
        }

        public async Task<ServiceResult> GetSentDocumentStatusCountAsync(UserDTO userDTO)
        {
            try
            {
                var result = await GetSentDocumentListAsync(userDTO, true);

                if (!result.Success)
                {
                    _logger.LogError("Document list is empty");
                    return new ServiceResult(new DocumentStatusCountDTO());
                }

                if (result.Result is not List<Document> documents || documents.Count == 0)
                {
                    _logger.LogError("Document list is empty");
                    return new ServiceResult(new DocumentStatusCountDTO());
                }

                var status = new DocumentStatusCountDTO
                {
                    Total = documents.Count,
                };

                foreach (var doc in documents)
                {
                    switch (doc.Status)
                    {
                        case DocumentStatusConstants.InProgress:
                            status.InProgress++;
                            break;

                        case DocumentStatusConstants.Completed:
                            status.Completed++;
                            break;

                        case DocumentStatusConstants.Expired:
                            status.Expired++;
                            break;

                        case DocumentStatusConstants.Declined:
                            status.Declined++;
                            break;

                        case DocumentStatusConstants.Recalled:
                            status.Recalled++;
                            break;

                        default:
                            _logger.LogWarning($"Unknown document status: {doc.Status} for document id: {doc._id} ");
                            break;
                    }
                }

                return new ServiceResult(status, "Sent Document status count received successfully");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, "GetSentDocumentStatusCountAsync failed");
                return new ServiceResult("Error occurred while getting sent document status count");
            }
        }

        public async Task<ServiceResult> GetReceivedDocumentStatusCountAsync(UserDTO userDTO)
        {
            try
            {
                var result = await GetReceivedDocumentsList(userDTO, true);

                if (!result.Success)
                {
                    _logger.LogError("Document list is empty");
                    return new ServiceResult(new DocumentStatusCountDTO());
                }

                if (result.Result is not List<Document> documents || documents.Count == 0)
                {
                    _logger.LogError("Document list is empty");
                    return new ServiceResult(new DocumentStatusCountDTO());
                }

                var status = new DocumentStatusCountDTO
                {
                    Total = documents.Count,
                };

                foreach (var doc in documents)
                {
                    switch (doc.Status)
                    {
                        case DocumentStatusConstants.InProgress:
                            status.InProgress++;
                            break;

                        case DocumentStatusConstants.Completed:
                            status.Completed++;
                            break;

                        case DocumentStatusConstants.Expired:
                            status.Expired++;
                            break;

                        case DocumentStatusConstants.Declined:
                            status.Declined++;
                            break;

                        case DocumentStatusConstants.Recalled:
                            status.Recalled++;
                            break;

                        default:
                            _logger.LogWarning($"Unknown document status: {doc.Status} for document id: {doc._id} ");
                            break;
                    }
                }

                return new ServiceResult(status, "Received Document status count received successfully");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, "GetReceivedDocumentStatusCountAsync failed");
                return new ServiceResult("Error occurred while getting received document status count");
            }
        }


    }
}

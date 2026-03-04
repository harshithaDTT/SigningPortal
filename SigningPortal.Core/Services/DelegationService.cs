using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.Domain.Services.Communication.Delegate;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace SigningPortal.Core.Services
{
	public class DelegationService : IDelegationService
	{
		private readonly ILogger<DelegationService> _logger;
		private readonly IConfiguration _configuration;
		private readonly HttpClient _client;
		private readonly IDocumentHelper _documentHelper;
		private readonly IDelegationRepository _delegatorRepository;
		private readonly IDelegateeRepository _delegateeRepository;
		private readonly IBackgroundService _backgroundService;

		public DelegationService(ILogger<DelegationService> logger,
			IDelegationRepository delegatorRepository,
			IDelegateeRepository delegateeRepository,
			IBackgroundService backgroundService,
			IDocumentHelper documentHelper,
			IConfiguration configuration,
			HttpClient httpClient)
		{
			_logger = logger;
			_delegatorRepository = delegatorRepository;
			_delegateeRepository = delegateeRepository;
			_backgroundService = backgroundService;
			_documentHelper = documentHelper;
			_configuration = configuration;
			_client = httpClient;

			_ = GetScheduledDelegationListAsync();
		}

		public async Task<ServiceResult> GetDelegateDetailsByIdAsync(string id)
		{
			try
			{
				var delegateDetails = await _delegatorRepository.GetDelegateById(id);

				return new ServiceResult(delegateDetails, "Successfully received delegate");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);

				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetDelegateDetailsByIdAsync Exception :  {0}", ex.Message);
			}
			return new ServiceResult("An error occurred while receiving delegate");
		}

		public async Task<ServiceResult> GetDelegateDetailsByOrgIdAndSuidAsync(string orgId, string suid)
		{
			try
			{
				IList<Delegatee> list = new List<Delegatee>();

				//update scheduled delegation 
				try
				{
					await GetScheduledDelegationListAsync();
				}
				catch (Exception ex)
				{
					Monitor.SendException(ex);
					_logger.LogError(ex.Message);
					_logger.LogError("GetDelegateDetailsByOrgIdAndSuidAsync : GetDelegationListAsync");
				}

				var delegateDetails = await _delegatorRepository.GetDelegateByOrgIdAndSuid(orgId, suid);
				if (delegateDetails == null)
				{
					_logger.LogInformation("DelegateDetails is Null");
					return new ServiceResult(list, "Successfully received delegate");
				}

				_logger.LogInformation($"DelegationStatus  :: {delegateDetails.DelegationStatus} DelegationID :: {delegateDetails._id}");

				if (DateTime.UtcNow <= delegateDetails.EndDateTime.ToUniversalTime() && delegateDetails.DelegationStatus == DelegateConstants.Active)
				//if(DateTime.UtcNow <= delegateDetails.StartDateTime..ToUniversalTime() && DateTime.UtcNow <= delegateDetails.EndDateTime.ToUniversalTime())
				{
					list = delegateDetails.Delegatees;
				}

				if (DateTime.UtcNow > delegateDetails.EndDateTime.ToUniversalTime() && delegateDetails.DelegationStatus != DelegateConstants.Expired)
				{
					delegateDetails.DelegationStatus = DelegateConstants.Expired;
					var update = await _delegatorRepository.UpdateDelegateById(delegateDetails);
				}
				_logger.LogInformation($"Delegatee List Count :: {list.Count}");
				return new ServiceResult(list, "Successfully received delegate");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetDelegateDetailsByOrgIdAndSuidAsync Exception :  {0}", ex.Message);
			}
			return new ServiceResult("An error occurred while receiving delegate");
		}

		public async Task<ServiceResult> RevokeDelegateAsync(string id)
		{
			try
			{
				var delegateDetails = await _delegatorRepository.GetDelegateById(id);
				if (delegateDetails == null)
				{
					_logger.LogError("No details found");
					return new ServiceResult("No details found");
				}

				delegateDetails.DelegationStatus = DelegateConstants.Cancelled;
				delegateDetails.UpdatedAt = DateTime.UtcNow;

				var updateDelegate = await _delegatorRepository.UpdateDelegateById(delegateDetails);
				if (!updateDelegate)
				{
					return new ServiceResult("Failed to revoke delegate");
				}

				try
				{
					_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendEmailToDelegatee(id, "Signature Delegation Revoked", false));
				}
				catch (Exception ex)
				{
					Monitor.SendException(ex);
					_logger.LogError("SendEmailToDelegatee Exception");
					_logger.LogError(ex.Message);
				}

				return new ServiceResult(null, "Successfully revoked delegation");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("RevokeDelegateAsync Exception :  {0}", ex.Message);
			}
			return new ServiceResult("An error occurred while revoking delegate");
		}

		public async Task<ServiceResult> SaveDelegatorAsync(SaveDelegatorDTO delegateDTO, UserDTO user)
		{
			try
			{
				_logger.LogInformation("Delegate data received : " + JsonConvert.SerializeObject(delegateDTO));
				bool isDateValid = true;
				string errorMessage = string.Empty;
				SaveDelegateResponse saveDelegatorResponse = new SaveDelegateResponse();

				DelegatorModel modelObj = JsonConvert.DeserializeObject<DelegatorModel>(delegateDTO.Model);

				if (modelObj.StartDateTime.ToUniversalTime() == modelObj.EndDateTime.ToUniversalTime())
				{
					return new ServiceResult("Delegation start date time and end date time cannot be same.");
				}

				foreach (var delegatee in modelObj.Delegatees)
				{
					if (delegatee.Suid == user.Suid)
					{
						isDateValid = false;
						errorMessage = "Cannot assign delegate to self";
						break;
					}

					if (!isDateValid)
					{
						return new ServiceResult(errorMessage);
					}
				}

				//validation for current user is delegatee or not.
				var currentUserDelList = await _delegateeRepository.GetDelegateeListBySuidAndOrgIdAsync(user.Suid, user.OrganizationId);
				if (currentUserDelList != null && currentUserDelList.Count > 0)
				{
					List<string> ids = new List<string>();
					foreach (var del in currentUserDelList)
					{
						ids.Add(del.DelegationId);
					}

					var deleList = await _delegatorRepository.GetDelegateByIdList(ids);
					if (deleList != null && deleList.Count > 0)
					{
						foreach (var dele in deleList)
						{
							if (dele.DelegationStatus == DelegateConstants.Active ||
								dele.DelegationStatus == DelegateConstants.Pending ||
								dele.DelegationStatus == DelegateConstants.Scheduled)
							{
								if (((dele.StartDateTime.ToUniversalTime() <= modelObj.StartDateTime.ToUniversalTime()) &&  //start date validation
								(modelObj.StartDateTime.ToUniversalTime() <= dele.EndDateTime.ToUniversalTime())) ||
								// end date validation
								((dele.StartDateTime.ToUniversalTime().ToUniversalTime() <= modelObj.EndDateTime.ToUniversalTime()) &&
								(modelObj.EndDateTime.ToUniversalTime() <= dele.EndDateTime.ToUniversalTime())))
								{
									isDateValid = false;
									errorMessage = "Delegation is assigned to you in this time period";
									break;
								}

								if ((modelObj.StartDateTime.ToUniversalTime() <= dele.StartDateTime.ToUniversalTime()) && //start date validation
								(dele.StartDateTime.ToUniversalTime() <= modelObj.EndDateTime.ToUniversalTime()) ||
								//end date validation
								(modelObj.StartDateTime.ToUniversalTime() <= dele.EndDateTime.ToUniversalTime()) &&
								(dele.EndDateTime.ToUniversalTime() <= modelObj.EndDateTime.ToUniversalTime()))
								{
									isDateValid = false;
									errorMessage = "Delegation is assigned to you in this time period";
									break;
								}
							}
						}
					}
					if (!isDateValid)
					{
						return new ServiceResult(errorMessage);
					}
				}

				//validation for delegators StartTime-EndTime
				var delegateList = await _delegatorRepository.GetDelegatesListByOrgIdAndSuid(user.OrganizationId, user.Suid);
				if (delegateList != null && delegateList.Count > 0)
				{
					foreach (var delegat in delegateList)
					{
						if (delegat.DelegationStatus == DelegateConstants.Active ||
							delegat.DelegationStatus == DelegateConstants.Pending ||
							delegat.DelegationStatus == DelegateConstants.Scheduled)
						{
							if (((delegat.StartDateTime.ToUniversalTime() <= modelObj.StartDateTime.ToUniversalTime()) &&  //start date validation
							(modelObj.StartDateTime.ToUniversalTime() <= delegat.EndDateTime.ToUniversalTime())) ||
							// end date validation
							((delegat.StartDateTime.ToUniversalTime() <= modelObj.EndDateTime.ToUniversalTime()) &&
							(modelObj.EndDateTime.ToUniversalTime() <= delegat.EndDateTime.ToUniversalTime())))
							{
								isDateValid = false;
								errorMessage = "You already have delegation in this time period";
								break;
							}

							if ((modelObj.StartDateTime.ToUniversalTime() <= delegat.StartDateTime.ToUniversalTime()) && //start date validation
								(delegat.StartDateTime.ToUniversalTime() <= modelObj.EndDateTime.ToUniversalTime()) ||
								//end date validation
								(modelObj.StartDateTime.ToUniversalTime() <= delegat.EndDateTime.ToUniversalTime()) &&
								(delegat.EndDateTime.ToUniversalTime() <= modelObj.EndDateTime.ToUniversalTime()))
							{
								isDateValid = false;
								errorMessage = "You already have delegation in this time period";
								//errorMessage = "You have already created delegate till " + delegat.EndDateTime.ToUniversalTime();
								break;
							}
						}
					}
					if (!isDateValid)
					{
						return new ServiceResult(errorMessage);
					}
				}


				//validation for delegatees StartTime-Endtime
				//List<string> idList = [];

				//foreach (var delegatee in modelObj.Delegatees)
				//{
				//    var delList = await _delegateeRepository.GetDelegateeListBySuidAndOrgIdAsync(delegatee.Suid, user.OrganizationId);
				//    if (delList != null && delList.Count > 0)
				//    {
				//        foreach (var del in delList)
				//            idList.Add(del.DelegationId);
				//    }
				//}

				//var delList1 = await _delegatorRepository.GetDelegateByIdList(idList);
				//if (delList1 != null && delList1.Count > 0)
				//{
				//    foreach (var delegat in delList1)
				//    {
				//        if (delegat.OrganizationId == user.OrganizationId)
				//        {
				//            if (delegat.DelegationStatus == DelegateConstants.Active ||
				//            delegat.DelegationStatus == DelegateConstants.Pending ||
				//            delegat.DelegationStatus == DelegateConstants.Scheduled)
				//            {
				//                if (((delegat.StartDateTime <= modelObj.StartDateTime) &&  //start date validation
				//                    (modelObj.StartDateTime <= delegat.EndDateTime.ToUniversalTime())) ||
				//                    // end date validation
				//                    ((delegat.StartDateTime <= modelObj.EndDateTime) &&
				//                    (modelObj.EndDateTime <= delegat.EndDateTime)))
				//                {
				//                    isDateValid = false;
				//                    errorMessage = "Delegatee have delegation in this time period";
				//                    break;
				//                }

				//                if ((modelObj.StartDateTime <= delegat.StartDateTime) && //start date validation
				//                    (delegat.StartDateTime <= modelObj.EndDateTime) ||
				//                    //end date validation
				//                    (modelObj.StartDateTime <= delegat.EndDateTime) &&
				//                    (delegat.EndDateTime <= modelObj.EndDateTime))
				//                {
				//                    isDateValid = false;
				//                    errorMessage = "Delegatee have delegation in this time period";
				//                    break;
				//                }
				//            }
				//        }
				//    }
				//}


				// Validation to check if the delegatee is an delegator in the time period

				var delList2 = new List<Delegation>();

				foreach (var delegatee in modelObj.Delegatees)
				{
					var delList = await _delegatorRepository.GetDelegatesListByOrgIdAndSuid(user.OrganizationId, delegatee.Suid);
					if (delList != null && delList.Count > 0)
					{
						foreach (var del in delList)
							delList2.Add(del);
					}
				}

				if (delList2 != null && delList2.Count > 0)
				{
					foreach (var delegat in delList2)
					{
						if (delegat.OrganizationId == user.OrganizationId)
						{
							if (delegat.DelegationStatus == DelegateConstants.Active ||
							delegat.DelegationStatus == DelegateConstants.Pending ||
							delegat.DelegationStatus == DelegateConstants.Scheduled)
							{
								if (((delegat.StartDateTime.ToUniversalTime() <= modelObj.StartDateTime.ToUniversalTime()) &&  //start date validation
									(modelObj.StartDateTime.ToUniversalTime() <= delegat.EndDateTime.ToUniversalTime())) ||
									// end date validation
									((delegat.StartDateTime.ToUniversalTime() <= modelObj.EndDateTime.ToUniversalTime()) &&
									(modelObj.EndDateTime.ToUniversalTime() <= delegat.EndDateTime.ToUniversalTime())))
								{
									isDateValid = false;
									errorMessage = "Delegatee have delegation in this time period";
									break;
								}

								if ((modelObj.StartDateTime.ToUniversalTime() <= delegat.StartDateTime.ToUniversalTime()) && //start date validation
									(delegat.StartDateTime.ToUniversalTime() <= modelObj.EndDateTime.ToUniversalTime()) ||
									//end date validation
									(modelObj.StartDateTime.ToUniversalTime() <= delegat.EndDateTime.ToUniversalTime()) &&
									(delegat.EndDateTime.ToUniversalTime() <= modelObj.EndDateTime.ToUniversalTime()))
								{
									isDateValid = false;
									errorMessage = "Delegatee have delegation in this time period";
									break;
								}
							}
						}
					}
				}


				if (!isDateValid)
				{
					return new ServiceResult(errorMessage);
				}

				var delegateData = new Delegation
				{
					DelegatorSuid = user.Suid,
					DelegatorName = user.Name,
					DelegatorEmail = user.Email,
					OrganizationId = user.OrganizationId,
					StartDateTime = modelObj.StartDateTime,
					EndDateTime = modelObj.EndDateTime,
					DocumentType = modelObj.DocumentType,
					DelegationStatus = DelegateConstants.Pending,
					ConsentData = modelObj.ConsentData,
					DelegatorConsentDataSignature = modelObj.DelegatorConsentDataSignature,
					CreatedAt = DateTime.UtcNow,
					CreatedBy = user.Suid
				};

				DelegateConsentData consentData = new DelegateConsentData()
				{
					DelegatorSuid = user.Suid,
					DelegatorName = user.Name,
					OrganizationId = user.OrganizationId,
					OrganizationName = user.OrganizationName,
					StartDateTime = modelObj.StartDateTime,
					EndDateTime = modelObj.EndDateTime,
					DocumentType = "",
					RequestDateTime = DateTime.UtcNow,
				};

				foreach (var delegatee in modelObj.Delegatees)
				{
					consentData.DelegateList.Add(delegatee.Suid);
				}


				_logger.LogInformation("Delegate Data : " + JsonConvert.SerializeObject(delegateData));

				var saveDelegate = await _delegatorRepository.SaveDelegate(delegateData);


				//save consent data
				consentData.DelegatorId = saveDelegate._id;
				delegateData.ConsentData = JsonConvert.SerializeObject(consentData);

				var saveConsent = await _delegatorRepository.UpdateDelegateConsentDataById(delegateData);


				IList<Delegatee> delegateeList = new List<Delegatee>();

				foreach (var delegatee in modelObj.Delegatees)
				{
					var delegateRecep = new Delegatee
					{
						DelegationId = saveDelegate._id,
						DelegateeSuid = delegatee.Suid,
						OrganizationId = user.OrganizationId,
						DelegateeEmail = delegatee.Email,
						FullName = delegatee.FullName,
						Thumbnail = delegatee.Thumbnail,
						ConsentStatus = DelegateConstants.Pending,
						CreatedAt = DateTime.UtcNow,
						CreatedBy = user.Suid
					};

					delegateeList.Add(delegateRecep);
				}

				var saveDelegateRecepient = await _delegateeRepository.SaveDelegatee(delegateeList);

				//this is for mobile push notification
				//ConsentData consent = new ConsentData()
				//{

				//    DelegationId = saveDelegate._id,
				//    FullName = user.Name,
				//    DelegatorSuid = user.Suid,
				//    OrganizationId = user.OrganizationId,
				//    OrganizationName = user.OrganizationName,
				//    StartDateTime = modelObj.StartDateTime,
				//    EndDateTime = modelObj.EndDateTime,
				//    DocumentType = "",
				//    RequestDateTime = DateTime.UtcNow,
				//    DelegateeList = modelObj.Delegatees
				//};

				try
				{
					//bool pushNotification = _configuration.GetValue<bool>("PushNotification");
					if (modelObj.AccessToken != null)
					{
						var list = new List<string>();

						foreach (var delegatee in modelObj.Delegatees)
						{
							list.Add(delegatee.Suid);
						}

						DelegationPushNotificationDTO pushNotificationObj = new DelegationPushNotificationDTO
						{
							AccessToken = modelObj.AccessToken,
							//Email = email,
							DelegateeList = list,
							Title = "Delegation Request",
							Body = "You have delegation Request from " + user.Name,
							ConsentData = (string)saveDelegate._id
							//ConsentData = JsonConvert.SerializeObject(consent)                            
						};

						_backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendNotificationDelegationRequest(pushNotificationObj));

					}
				}
				catch (Exception ex)
				{
					Monitor.SendException(ex);
					_logger.LogError("Failed to send push notification");
				}

				saveDelegatorResponse.DelegatorId = saveDelegate._id;

				try
				{
					_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendEmailToDelegatee(saveDelegate._id, "Signature Delegation Request", false));
				}
				catch (Exception ex)
				{
					Monitor.SendException(ex);
					_logger.LogError("SendEmailToDelegatee Exception");
					_logger.LogError(ex.Message);
				}

				return new ServiceResult(saveDelegatorResponse, "Successfully saved delegation");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("SaveDelegateAsync Exception :  {0}", ex.Message);
			}
			return new ServiceResult("An error occurred while saving delegate");
		}

		public async Task<ServiceResult> SaveNewDelegatorAsync(SaveDelegatorDTO delegateDTO, UserDTO user)
		{
			try
			{
				_logger.LogInformation("Delegate data received : " + JsonConvert.SerializeObject(delegateDTO));
				bool isDateValid = true;
				string errorMessage = string.Empty;
				SaveDelegateResponse saveDelegatorResponse = new SaveDelegateResponse();

				DelegatorModel modelObj = JsonConvert.DeserializeObject<DelegatorModel>(delegateDTO.Model);

				if (modelObj.StartDateTime.ToUniversalTime() == modelObj.EndDateTime.ToUniversalTime())
				{
					return new ServiceResult("Delegation start date time and end date time cannot be same.");
				}

				foreach (var delegatee in modelObj.Delegatees)
				{
					if (delegatee.Suid == user.Suid)
					{
						isDateValid = false;
						errorMessage = "Cannot assign delegate to self";
						break;
					}

					if (!isDateValid)
					{
						return new ServiceResult(errorMessage);
					}
				}

				//validation for current user is delegatee or not.
				var currentUserDelList = await _delegateeRepository.GetDelegateeListBySuidAndOrgIdAsync(user.Suid, user.OrganizationId);
				if (currentUserDelList != null && currentUserDelList.Count > 0)
				{
					List<string> ids = new List<string>();
					foreach (var del in currentUserDelList)
					{
						ids.Add(del.DelegationId);
					}

					var deleList = await _delegatorRepository.GetDelegateByIdList(ids);
					if (deleList != null && deleList.Count > 0)
					{
						foreach (var dele in deleList)
						{
							if (dele.DelegationStatus == DelegateConstants.Active ||
								dele.DelegationStatus == DelegateConstants.Pending ||
								dele.DelegationStatus == DelegateConstants.Scheduled)
							{
								if (((dele.StartDateTime.ToUniversalTime() <= modelObj.StartDateTime.ToUniversalTime()) &&  //start date validation
								(modelObj.StartDateTime.ToUniversalTime() <= dele.EndDateTime.ToUniversalTime())) ||
								// end date validation
								((dele.StartDateTime.ToUniversalTime() <= modelObj.EndDateTime.ToUniversalTime()) &&
								(modelObj.EndDateTime.ToUniversalTime() <= dele.EndDateTime.ToUniversalTime())))
								{
									isDateValid = false;
									errorMessage = "Delegation is assigned to you in this time period";
									break;
								}

								if ((modelObj.StartDateTime.ToUniversalTime() <= dele.StartDateTime.ToUniversalTime()) && //start date validation
								(dele.StartDateTime.ToUniversalTime() <= modelObj.EndDateTime.ToUniversalTime()) ||
								//end date validation
								(modelObj.StartDateTime.ToUniversalTime() <= dele.EndDateTime.ToUniversalTime()) &&
								(dele.EndDateTime.ToUniversalTime() <= modelObj.EndDateTime.ToUniversalTime()))
								{
									isDateValid = false;
									errorMessage = "Delegation is assigned to you in this time period";
									break;
								}
							}
						}
					}
					if (!isDateValid)
					{
						return new ServiceResult(errorMessage);
					}
				}

				//validation for delegators StartTime-EndTime
				var delegateList = await _delegatorRepository.GetDelegatesListByOrgIdAndSuid(user.OrganizationId, user.Suid);
				if (delegateList != null && delegateList.Count > 0)
				{
					foreach (var delegat in delegateList)
					{
						if (delegat.DelegationStatus == DelegateConstants.Active ||
							delegat.DelegationStatus == DelegateConstants.Pending ||
							delegat.DelegationStatus == DelegateConstants.Scheduled)
						{
							if (((delegat.StartDateTime.ToUniversalTime() <= modelObj.StartDateTime.ToUniversalTime()) &&  //start date validation
							(modelObj.StartDateTime.ToUniversalTime() <= delegat.EndDateTime.ToUniversalTime())) ||
							// end date validation
							((delegat.StartDateTime.ToUniversalTime() <= modelObj.EndDateTime.ToUniversalTime()) &&
							(modelObj.EndDateTime.ToUniversalTime() <= delegat.EndDateTime.ToUniversalTime())))
							{
								isDateValid = false;
								errorMessage = "You already have delegation in this time period";
								break;
							}

							if ((modelObj.StartDateTime.ToUniversalTime() <= delegat.StartDateTime.ToUniversalTime()) && //start date validation
								(delegat.StartDateTime.ToUniversalTime() <= modelObj.EndDateTime.ToUniversalTime()) ||
								//end date validation
								(modelObj.StartDateTime.ToUniversalTime() <= delegat.EndDateTime.ToUniversalTime()) &&
								(delegat.EndDateTime.ToUniversalTime() <= modelObj.EndDateTime.ToUniversalTime()))
							{
								isDateValid = false;
								errorMessage = "You already have delegation in this time period";
								//errorMessage = "You have already created delegate till " + delegat.EndDateTime.ToUniversalTime();
								break;
							}
						}
					}
					if (!isDateValid)
					{
						return new ServiceResult(errorMessage);
					}
				}


				//validation for delegatees StartTime-Endtime
				//List<string> idList = [];

				//foreach (var delegatee in modelObj.Delegatees)
				//{
				//    var delList = await _delegateeRepository.GetDelegateeListBySuidAndOrgIdAsync(delegatee.Suid, user.OrganizationId);
				//    if (delList != null && delList.Count > 0)
				//    {
				//        foreach (var del in delList)
				//            idList.Add(del.DelegationId);
				//    }
				//}

				//var delList1 = await _delegatorRepository.GetDelegateByIdList(idList);
				//if (delList1 != null && delList1.Count > 0)
				//{
				//    foreach (var delegat in delList1)
				//    {
				//        if (delegat.OrganizationId == user.OrganizationId)
				//        {
				//            if (delegat.DelegationStatus == DelegateConstants.Active ||
				//            delegat.DelegationStatus == DelegateConstants.Pending ||
				//            delegat.DelegationStatus == DelegateConstants.Scheduled)
				//            {
				//                if (((delegat.StartDateTime <= modelObj.StartDateTime) &&  //start date validation
				//                    (modelObj.StartDateTime <= delegat.EndDateTime)) ||
				//                    // end date validation
				//                    ((delegat.StartDateTime <= modelObj.EndDateTime) &&
				//                    (modelObj.EndDateTime <= delegat.EndDateTime)))
				//                {
				//                    isDateValid = false;
				//                    errorMessage = "Delegatee have delegation in this time period";
				//                    break;
				//                }

				//                if ((modelObj.StartDateTime <= delegat.StartDateTime) && //start date validation
				//                    (delegat.StartDateTime <= modelObj.EndDateTime) ||
				//                    //end date validation
				//                    (modelObj.StartDateTime <= delegat.EndDateTime) &&
				//                    (delegat.EndDateTime <= modelObj.EndDateTime))
				//                {
				//                    isDateValid = false;
				//                    errorMessage = "Delegatee have delegation in this time period";
				//                    break;
				//                }
				//            }
				//        }
				//    }
				//}


				// Validation to check if the delegatee is an delegator in the time period

				var delList2 = new List<Delegation>();

				foreach (var delegatee in modelObj.Delegatees)
				{
					var delList = await _delegatorRepository.GetDelegatesListByOrgIdAndSuid(user.OrganizationId, delegatee.Suid);
					if (delList != null && delList.Count > 0)
					{
						foreach (var del in delList)
							delList2.Add(del);
					}
				}

				if (delList2 != null && delList2.Count > 0)
				{
					foreach (var delegat in delList2)
					{
						if (delegat.OrganizationId == user.OrganizationId)
						{
							if (delegat.DelegationStatus == DelegateConstants.Active ||
							delegat.DelegationStatus == DelegateConstants.Pending ||
							delegat.DelegationStatus == DelegateConstants.Scheduled)
							{
								if (((delegat.StartDateTime.ToUniversalTime() <= modelObj.StartDateTime.ToUniversalTime()) &&  //start date validation
									(modelObj.StartDateTime.ToUniversalTime() <= delegat.EndDateTime.ToUniversalTime())) ||
									// end date validation
									((delegat.StartDateTime.ToUniversalTime() <= modelObj.EndDateTime.ToUniversalTime()) &&
									(modelObj.EndDateTime.ToUniversalTime() <= delegat.EndDateTime.ToUniversalTime())))
								{
									isDateValid = false;
									errorMessage = "Delegatee have delegation in this time period";
									break;
								}

								if ((modelObj.StartDateTime.ToUniversalTime() <= delegat.StartDateTime.ToUniversalTime()) && //start date validation
									(delegat.StartDateTime.ToUniversalTime() <= modelObj.EndDateTime.ToUniversalTime()) ||
									//end date validation
									(modelObj.StartDateTime.ToUniversalTime() <= delegat.EndDateTime.ToUniversalTime()) &&
									(delegat.EndDateTime.ToUniversalTime() <= modelObj.EndDateTime.ToUniversalTime()))
								{
									isDateValid = false;
									errorMessage = "Delegatee have delegation in this time period";
									break;
								}
							}
						}
					}
				}


				if (!isDateValid)
				{
					return new ServiceResult(errorMessage);
				}

				var delegateData = new Delegation
				{
					DelegatorSuid = user.Suid,
					DelegatorName = user.Name,
					DelegatorEmail = user.Email,
					OrganizationId = user.OrganizationId,
					StartDateTime = modelObj.StartDateTime,
					EndDateTime = modelObj.EndDateTime,
					DocumentType = modelObj.DocumentType,
					DelegationStatus = DelegateConstants.New,
					ConsentData = modelObj.ConsentData,
					DelegatorConsentDataSignature = modelObj.DelegatorConsentDataSignature,
					CreatedAt = DateTime.UtcNow,
					CreatedBy = user.Suid
				};

				DelegateConsentData consentData = new DelegateConsentData()
				{
					DelegatorSuid = user.Suid,
					DelegatorName = user.Name,
					OrganizationId = user.OrganizationId,
					OrganizationName = user.OrganizationName,
					StartDateTime = modelObj.StartDateTime,
					EndDateTime = modelObj.EndDateTime,
					DocumentType = "",
					RequestDateTime = new DateTime(DateTime.UtcNow.Ticks - (DateTime.UtcNow.Ticks % TimeSpan.TicksPerSecond), DateTimeKind.Utc)
				};

				foreach (var delegatee in modelObj.Delegatees)
				{
					consentData.DelegateList.Add(delegatee.Suid);
				}


				_logger.LogInformation("Delegate Data : " + JsonConvert.SerializeObject(delegateData));

				var saveDelegate = await _delegatorRepository.SaveDelegate(delegateData);


				_logger.LogInformation($"StartTime: {saveDelegate.StartDateTime}");
				_logger.LogInformation($"StartTimeToString: {saveDelegate.StartDateTime.ToString()}");
				_logger.LogInformation($"EndTime: {saveDelegate.EndDateTime}");
				_logger.LogInformation($"EndTimeToString: {saveDelegate.EndDateTime.ToString()}");

				//save consent data
				consentData.DelegatorId = saveDelegate._id;
				delegateData.ConsentData = JsonConvert.SerializeObject(consentData);

				var saveConsent = await _delegatorRepository.UpdateDelegateConsentDataById(delegateData);


				IList<Delegatee> delegateeList = new List<Delegatee>();

				foreach (var delegatee in modelObj.Delegatees)
				{
					var delegateRecep = new Delegatee
					{
						DelegationId = saveDelegate._id,
						DelegateeSuid = delegatee.Suid,
						OrganizationId = user.OrganizationId,
						DelegateeEmail = delegatee.Email,
						FullName = delegatee.FullName,
						Thumbnail = delegatee.Thumbnail,
						ConsentStatus = DelegateConstants.Pending,
						CreatedAt = DateTime.UtcNow,
						CreatedBy = user.Suid
					};

					delegateeList.Add(delegateRecep);
				}

				var saveDelegateRecepient = await _delegateeRepository.SaveDelegatee(delegateeList);

				//this is for mobile push notification
				//ConsentData consent = new ConsentData()
				//{

				//    DelegationId = saveDelegate._id,
				//    FullName = user.Name,
				//    DelegatorSuid = user.Suid,
				//    OrganizationId = user.OrganizationId,
				//    OrganizationName = user.OrganizationName,
				//    StartDateTime = modelObj.StartDateTime,
				//    EndDateTime = modelObj.EndDateTime,
				//    DocumentType = "",
				//    RequestDateTime = DateTime.UtcNow,
				//    DelegateeList = modelObj.Delegatees
				//};

				try
				{
					//bool pushNotification = _configuration.GetValue<bool>("PushNotification");


					// Delegator Consent Notification
					if (modelObj.AccessToken != null)
					{
						DelegationPushNotificationDTO pushNotificationObj = new DelegationPushNotificationDTO
						{
							AccessToken = modelObj.AccessToken,
							DelegateeList = [user.Suid],
							Title = "Delegation Request",
							Body = "Please consent to your delegation request",
							ConsentData = (string)saveDelegate._id,
							IsDelegator = true
						};

						_backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendNotificationDelegationRequest(pushNotificationObj));
					}
				}
				catch (Exception ex)
				{
					Monitor.SendException(ex);
					_logger.LogError("Failed to send push notification");
				}

				saveDelegatorResponse.DelegatorId = saveDelegate._id;

				return new ServiceResult(saveDelegatorResponse, "Successfully saved delegation");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("SaveDelegateAsync Exception :  {0}", ex.Message);
			}
			return new ServiceResult("An error occurred while saving delegate");
		}

		public async Task<ServiceResult> GetNewDelegationListBySuidAndOrgIdAsync(string suid, string orgId)
		{
			try
			{
				IList<Delegation> list = [];
				IList<Delegation> listToRemove = [];

				list = await _delegatorRepository.GetNewDelegationListBySuidAndOrgIdAsync(suid, orgId);

				if (list != null)
				{
					foreach (var delegator in list)
					{
						if (delegator.EndDateTime.ToUniversalTime() < DateTime.UtcNow && delegator.DelegationStatus != DelegateConstants.Expired)
						{
							delegator.DelegationStatus = DelegateConstants.Expired;

							var updateDelegate = await _delegatorRepository.UpdateDelegateById(delegator);
							if (!updateDelegate)
							{
								_logger.LogError("Failed to update delegate");
								return new ServiceResult("Failed to udpate delegate");
							}

							try
							{
								_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendEmailToDelegatee(delegator._id, "Signature Delegation Expired", true));
							}
							catch (Exception ex)
							{
								Monitor.SendException(ex);
								_logger.LogError("SendEmailToDelegatee Exception");
								_logger.LogError(ex.Message);
							}

							//listToRemove.Add(delegator); // Remove from the list
						}
					}
				}
				//foreach (var delegator in listToRemove)
				//{
				//    list.Remove(delegator);
				//}
				if (list != null){
					return new ServiceResult(list, "Successfully recieved delegation list");
				}
				
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetNewDelegationListBySuidAsync Exception :  {0}", ex.Message);
			}
			return new ServiceResult("An error occurred while recieving delegation list");
		}

		public async Task<ServiceResult> DelegatorActionAsync(DelegatorActionDTO action)
		{
			string filePath = String.Empty;
			bool isDateValid = true;
			string errorMessage = string.Empty;
			try
			{
				var delegation = await _delegatorRepository.GetDelegateById(action.DelegationId);
				if (delegation == null)
				{
					_logger.LogError("No records found");
					return new ServiceResult("No records found");
				}
				if (delegation.DelegationStatus == DelegateConstants.Cancelled)
				{
					return new ServiceResult("Delegation has been revoked");
				}

				if (delegation.DelegationStatus == DelegateConstants.Pending)
				{
					return new ServiceResult("Consent has already been given to this request");
				}

				if (delegation.DelegatorSuid != action.DelegatorSuid)
				{
					return new ServiceResult("Invalid request");
				}

				foreach (var delegatee in delegation.Delegatees)
				{
					if (delegatee.ConsentStatus != DelegateConstants.Pending)
					{
						return new ServiceResult("Invalid request");
					}
				}

				if (delegation.EndDateTime.ToUniversalTime() < DateTime.UtcNow) // UtcNow to avoid potential time zone issues.
				{
					delegation.DelegationStatus = DelegateConstants.Expired;
					delegation.UpdatedAt = DateTime.UtcNow;
					var update = await _delegatorRepository.UpdateDelegateById(delegation);
					if (!update)
					{
						_logger.LogError($"Failed to update delegate for delegationId: {delegation._id}");
						return new ServiceResult("Failed to update delegate");
					}
					return new ServiceResult("Delegation period has expired");
				}


				if (!action.Action)
				{
					delegation.DelegationStatus = DelegateConstants.Cancelled;
					var update = await _delegatorRepository.UpdateDelegateById(delegation);
					if (!update)
					{
						_logger.LogError("Failed to update delegate");
						return new ServiceResult("Failed to update delegate");
					}

					try
					{
						_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendDelegateeActionEmailToDelegator(action.DelegationId, "Signature Delegation Rejected"));
					}
					catch (Exception ex)
					{
						Monitor.SendException(ex);
						_logger.LogError("SendResponseEmailToDelegator Exception");
						_logger.LogError(ex.Message);
					}

					return new ServiceResult(null, "Signature delegation rejected successfully");
				}
				else
				{

					//validation for current user is delegatee or not.
					var currentUserDelList = await _delegateeRepository.GetDelegateeListBySuidAndOrgIdAsync(delegation.DelegatorSuid, delegation.OrganizationId);
					if (currentUserDelList != null && currentUserDelList.Count > 0)
					{
						List<string> ids = new List<string>();
						foreach (var del in currentUserDelList)
						{
							ids.Add(del.DelegationId);
						}

						var deleList = await _delegatorRepository.GetDelegateByIdList(ids);
						if (deleList != null && deleList.Count > 0)
						{
							foreach (var dele in deleList)
							{
								if (delegation._id != dele._id)
								{
									if (dele.DelegationStatus == DelegateConstants.Active ||
										dele.DelegationStatus == DelegateConstants.Pending ||
										dele.DelegationStatus == DelegateConstants.Scheduled)
									{
										if (((dele.StartDateTime.ToUniversalTime() <= delegation.StartDateTime.ToUniversalTime()) &&  //start date validation
										(delegation.StartDateTime.ToUniversalTime() <= dele.EndDateTime.ToUniversalTime())) ||
										// end date validation
										((dele.StartDateTime.ToUniversalTime() <= delegation.EndDateTime.ToUniversalTime()) &&
										(delegation.EndDateTime.ToUniversalTime() <= dele.EndDateTime.ToUniversalTime())))
										{
											isDateValid = false;
											errorMessage = "Delegation is assigned to you in this time period";
											break;
										}

										if ((delegation.StartDateTime.ToUniversalTime() <= dele.StartDateTime.ToUniversalTime()) && //start date validation
										(dele.StartDateTime.ToUniversalTime() <= delegation.EndDateTime.ToUniversalTime()) ||
										//end date validation
										(delegation.StartDateTime.ToUniversalTime() <= dele.EndDateTime.ToUniversalTime()) &&
										(dele.EndDateTime.ToUniversalTime() <= delegation.EndDateTime.ToUniversalTime()))
										{
											isDateValid = false;
											errorMessage = "Delegation is assigned to you in this time period";
											break;
										}
									}
								}
							}
						}
						if (!isDateValid)
						{
							delegation.DelegationStatus = DelegateConstants.Cancelled;
							delegation.UpdatedAt = DateTime.UtcNow;

							var update = await _delegatorRepository.UpdateDelegateById(delegation);
							if (!update)
							{
								_logger.LogError("Failed to update delegate");
							}

							return new ServiceResult(errorMessage);
						}
					}

					//validation for delegators StartTime-EndTime
					var delegateList = await _delegatorRepository.GetDelegatesListByOrgIdAndSuid(delegation.OrganizationId, delegation.DelegatorSuid);
					if (delegateList != null && delegateList.Count > 0)
					{
						foreach (var delegat in delegateList)
						{
							if (delegation._id != delegat._id)
							{
								if (delegat.DelegationStatus == DelegateConstants.Active ||
								delegat.DelegationStatus == DelegateConstants.Pending ||
								delegat.DelegationStatus == DelegateConstants.Scheduled)
								{
									if (((delegat.StartDateTime.ToUniversalTime() <= delegation.StartDateTime.ToUniversalTime()) &&  //start date validation
									(delegation.StartDateTime.ToUniversalTime() <= delegat.EndDateTime.ToUniversalTime())) ||
									// end date validation
									((delegat.StartDateTime.ToUniversalTime() <= delegation.EndDateTime.ToUniversalTime()) &&
									(delegation.EndDateTime.ToUniversalTime() <= delegat.EndDateTime.ToUniversalTime())))
									{
										isDateValid = false;
										errorMessage = "You already have delegation in this time period";
										break;
									}

									if ((delegation.StartDateTime.ToUniversalTime() <= delegat.StartDateTime.ToUniversalTime()) && //start date validation
										(delegat.StartDateTime.ToUniversalTime() <= delegation.EndDateTime.ToUniversalTime()) ||
										//end date validation
										(delegation.StartDateTime.ToUniversalTime() <= delegat.EndDateTime.ToUniversalTime()) &&
										(delegat.EndDateTime.ToUniversalTime() <= delegation.EndDateTime.ToUniversalTime()))
									{
										isDateValid = false;
										errorMessage = "You already have delegation in this time period";
										//errorMessage = "You have already created delegate till " + delegat.EndDateTime.ToUniversalTime();
										break;
									}
								}
							}
						}
						if (!isDateValid)
						{

							delegation.DelegationStatus = DelegateConstants.Cancelled;
							delegation.UpdatedAt = DateTime.UtcNow;

							var update = await _delegatorRepository.UpdateDelegateById(delegation);
							if (!update)
							{
								_logger.LogError("Failed to update delegate");
							}

							return new ServiceResult(errorMessage);
						}
					}


					var delList2 = new List<Delegation>();

					foreach (var delegatee in delegation.Delegatees)
					{
						var delList = await _delegatorRepository.GetDelegatesListByOrgIdAndSuid(delegation.OrganizationId, delegatee.DelegateeSuid);
						if (delList != null && delList.Count > 0)
						{
							foreach (var del in delList)
								delList2.Add(del);
						}
					}

					if (delList2 != null && delList2.Count > 0)
					{
						foreach (var delegat in delList2)
						{
							if (delegation._id != delegat._id)
							{
								if (delegat.OrganizationId == delegation.OrganizationId)
								{
									if (delegat.DelegationStatus == DelegateConstants.Active ||
									delegat.DelegationStatus == DelegateConstants.Pending ||
									delegat.DelegationStatus == DelegateConstants.Scheduled)
									{
										if (((delegat.StartDateTime.ToUniversalTime() <= delegation.StartDateTime.ToUniversalTime()) &&  //start date validation
											(delegation.StartDateTime.ToUniversalTime() <= delegat.EndDateTime.ToUniversalTime())) ||
											// end date validation
											((delegat.StartDateTime.ToUniversalTime() <= delegation.EndDateTime.ToUniversalTime()) &&
											(delegation.EndDateTime.ToUniversalTime() <= delegat.EndDateTime.ToUniversalTime())))
										{
											isDateValid = false;
											errorMessage = "Delegatee have delegation in this time period";
											break;
										}

										if ((delegation.StartDateTime.ToUniversalTime() <= delegat.StartDateTime.ToUniversalTime()) && //start date validation
											(delegat.StartDateTime.ToUniversalTime() <= delegation.EndDateTime.ToUniversalTime()) ||
											//end date validation
											(delegation.StartDateTime.ToUniversalTime() <= delegat.EndDateTime.ToUniversalTime()) &&
											(delegat.EndDateTime.ToUniversalTime() <= delegation.EndDateTime.ToUniversalTime()))
										{
											isDateValid = false;
											errorMessage = "Delegatee have delegation in this time period";
											break;
										}
									}
								}
							}
						}
						if (!isDateValid)
						{
							delegation.DelegationStatus = DelegateConstants.Cancelled;
							delegation.UpdatedAt = DateTime.UtcNow;

							var update = await _delegatorRepository.UpdateDelegateById(delegation);
							if (!update)
							{
								_logger.LogError("Failed to update delegate");
							}

							return new ServiceResult(errorMessage);
						}
					}


					HttpResponseMessage response = null;

					ConsentDataSignatureDTO signatureDTO = new ConsentDataSignatureDTO
					{
						documentType = "CADES",
						subscriberUniqueId = action.DelegatorSuid,
						signingPin = !string.IsNullOrEmpty(action.SigningPin) ? action.SigningPin : null,
						userPhoto = !string.IsNullOrEmpty(action.UserPhoto) ? action.UserPhoto : null,
						placeHolderCoordinates = new placeHolderCoordinates
						{
							pageNumber = null,
							signatureXaxis = null,
							signatureYaxis = null
						},
					};

					var url = _configuration.GetValue<string>("Config:ConsentDataSignUrl");

					using (var multipartFormContent = new MultipartFormDataContent())
					{
						// Your string content
						string content = delegation.ConsentData;

						// Create a temporary text file and write the content
						filePath = "textfile.txt";
						File.WriteAllText(filePath, content);

						// Create a StreamContent for the text file
						StreamContent fileStreamContent = new StreamContent(File.OpenRead(filePath));
						fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue("text/plain");

						// Add the file stream content to the multipart form data
						multipartFormContent.Add(fileStreamContent, name: "file", fileName: "textfile.txt");

						// Add other form fields if needed
						multipartFormContent.Add(new StringContent(JsonConvert.SerializeObject(signatureDTO)), "model");
						_logger.LogInformation("Model :" + JsonConvert.SerializeObject(signatureDTO));

						// Set authorization header
						//_client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

						// Measure API call time
						DateTime startTimeForAPI = DateTime.UtcNow;
						response = await _client.PostAsync(url, multipartFormContent);
						DateTime endTimeForAPI = DateTime.UtcNow;
						TimeSpan diff = endTimeForAPI - startTimeForAPI;
						_logger.LogInformation("Total time taken to consent data SignService call in total seconds : {0} ", diff.TotalSeconds);

					}

					// Delete the temporary text file
					File.Delete(filePath);

					if (response.StatusCode == HttpStatusCode.OK)
					{
						var res1 = await response.Content.ReadAsStringAsync();
						APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
						if (apiResponse.Success)
						{
							delegation.DelegatorConsentData = apiResponse.Result.ToString();
							delegation.DelegationStatus = DelegateConstants.Pending;

							var update = await _delegatorRepository.UpdateDelegatorConsentDataById(delegation);
							if (!update)
							{
								_logger.LogError("Failed to update delegate");
								return new ServiceResult("Failed to update delegate");
							}

							try
							{
								var list = new List<string>();

								foreach (var delegatee in delegation.Delegatees)
								{
									list.Add(delegatee.DelegateeSuid);
								}

								DelegationPushNotificationDTO pushNotificationObj = new DelegationPushNotificationDTO
								{
									AccessToken = string.Empty,
									DelegateeList = list,
									Title = "Delegation Request",
									Body = "You have delegation Request from " + delegation.DelegatorName,
									ConsentData = (string)delegation._id
								};


								_backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendNotificationDelegationRequest(pushNotificationObj));
							}
							catch (Exception ex)
							{
								Monitor.SendException(ex);

								_logger.LogError("Failed to send push notification");
							}

							try
							{
								_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendEmailToDelegatee(delegation._id, "Signature Delegation Request", false));
							}
							catch (Exception ex)
							{
								Monitor.SendException(ex);
								_logger.LogError("SendEmailToDelegatee Exception");
								_logger.LogError(ex.Message);
							}

							return new ServiceResult(null, "Signature delegation approved successfully");
						}
						else
						{
							return new ServiceResult(apiResponse.Message);
						}
					}
					else
					{
						Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
							$"with status code={response.StatusCode}");

						return new ServiceResult("Consent signing failed");
					}
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("DelegatorActionAsync Exception :  {0}", ex.Message);
			}
			return new ServiceResult("An error occurred while updating delegator action");
		}

		public async Task<ServiceResult> DelegateeActionAsync(DelegateeActionDTO delegateeAction)
		{
			string filePath = String.Empty;
			try
			{
				var acceptCount = 0;
				var rejectCount = 0;
				_logger.LogInformation("Delegatee Action request obj :" + JsonConvert.SerializeObject(delegateeAction));

				var delegateDetails = await _delegatorRepository.GetDelegateById(delegateeAction.DelegationId);
				if (delegateDetails == null)
				{
					_logger.LogError("No records found");
					return new ServiceResult("No records found");
				}

				if (delegateDetails.DelegationStatus == DelegateConstants.Cancelled)
				{
					return new ServiceResult("Delegation has been revoked");
				}

				if (delegateDetails.DelegationStatus == DelegateConstants.New)
				{
					return new ServiceResult("Invalid Request");
				}

				foreach (var delegatee in delegateDetails.Delegatees)
				{
					if (delegatee.DelegateeSuid == delegateeAction.DelegateeSuid)
					{
						if (delegatee.ConsentStatus != DelegateConstants.Pending)
						{
							return new ServiceResult("Invalid request");
						}
					}
				}

				if (!delegateeAction.Action)
				{
					Delegatee notificationDelegatee = new();
					foreach (var delegatee in delegateDetails.Delegatees)
					{
						if (delegatee.DelegateeSuid == delegateeAction.DelegateeSuid)
						{
							if (delegateeAction.Action)
							{
								delegatee.ConsentStatus = DelegateConstants.Approved;
							}
							else
							{
								delegatee.ConsentStatus = DelegateConstants.Rejected;
							}
							delegatee.UpdatedAt = DateTime.UtcNow;
							//delegatee.DelegateConsentDataSignature = apiResponse.Result.ToString();
							var updateDelegatee = await _delegateeRepository.UpdateDelegateeById(delegatee);
							if (!updateDelegatee)
							{
								_logger.LogError("Failed to update delegatee action");
								return new ServiceResult("Failed to update delegatee action");
							}
							notificationDelegatee = delegatee;
						}
						if (delegatee.ConsentStatus == DelegateConstants.Approved)
						{
							acceptCount++;
						}

						if (delegatee.ConsentStatus == DelegateConstants.Rejected)
						{
							rejectCount++;
						}
					}

					if (rejectCount > 0)
					{
						delegateDetails.DelegationStatus = DelegateConstants.Rejected;
					}

					if (acceptCount == delegateDetails.Delegatees.Count)
					{
						delegateDetails.DelegationStatus = DelegateConstants.Active;
					}

					delegateDetails.UpdatedAt = DateTime.UtcNow;

					var updateDelegate = await _delegatorRepository.UpdateDelegateById(delegateDetails);
					if (!updateDelegate)
					{
						_logger.LogError("Failed to update delegate");
						return new ServiceResult("Failed to update delegate");
					}

					try
					{
						_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendDelegateeActionEmailToDelegator(delegateeAction.DelegationId, "Signature Delegation Rejected"));

						Notification notification = new(notificationDelegatee.DelegateeEmail,
																delegateDetails.DelegatorSuid,
																"",
																$"{notificationDelegatee.DelegateeEmail} has rejected your delegation request",
																delegateDetails.OrganizationId,
																new(NotificationTypeConstants.Delegation, delegateDetails._id));
						_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotificationToDelgator(notification));

						DelegationPushNotificationDTO pushNotificationObj = new()
						{
							AccessToken = string.Empty,
							DelegateeList = [delegateDetails.DelegatorSuid],
							Title = "Delegation Action",
							Body = $"{notificationDelegatee.DelegateeEmail} has rejected your delegation request",
							ConsentData = (string)delegateDetails._id,
							IsDelegator = true,
							IsIdle = true,
						};

						_backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendNotificationDelegationRequest(pushNotificationObj));
					}
					catch (Exception ex)
					{
						Monitor.SendException(ex);
						_logger.LogError("SendResponseEmailToDelegator Exception");
						_logger.LogError(ex.Message);
					}

					return new ServiceResult(null, "Signature delegation rejected successfully");
				}
				else
				{
					//api call 

					HttpResponseMessage response = null;

					ConsentDataSignatureDTO signatureDTO = new ConsentDataSignatureDTO
					{
						documentType = "CADES",
						subscriberUniqueId = delegateeAction.DelegateeSuid,
						signingPin = !string.IsNullOrEmpty(delegateeAction.SigningPin) ? delegateeAction.SigningPin : null,
						userPhoto = !string.IsNullOrEmpty(delegateeAction.UserPhoto) ? delegateeAction.UserPhoto : null,
						placeHolderCoordinates = new placeHolderCoordinates
						{
							pageNumber = null,
							signatureXaxis = null,
							signatureYaxis = null
						},
					};

					var url = _configuration.GetValue<string>("Config:ConsentDataSignUrl");

					using (var multipartFormContent = new MultipartFormDataContent())
					{
						// Your string content
						string content = delegateDetails.ConsentData;

						// Create a temporary text file and write the content
						filePath = "textfile.txt";
						File.WriteAllText(filePath, content);

						// Create a StreamContent for the text file
						StreamContent fileStreamContent = new StreamContent(File.OpenRead(filePath));
						fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue("text/plain");

						// Add the file stream content to the multipart form data
						multipartFormContent.Add(fileStreamContent, name: "file", fileName: "textfile.txt");

						// Add other form fields if needed
						multipartFormContent.Add(new StringContent(JsonConvert.SerializeObject(signatureDTO)), "model");

						// Set authorization header
						//_client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

						// Measure API call time
						DateTime startTimeForAPI = DateTime.UtcNow;
						response = await _client.PostAsync(url, multipartFormContent);
						DateTime endTimeForAPI = DateTime.UtcNow;
						TimeSpan diff = endTimeForAPI - startTimeForAPI;
						_logger.LogInformation("Total time taken to consent data SignService call in total seconds : {0} ", diff.TotalSeconds);

					}

					// Delete the temporary text file
					File.Delete(filePath);

					if (response.StatusCode == HttpStatusCode.OK)
					{
						var res1 = await response.Content.ReadAsStringAsync();
						APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
						if (apiResponse.Success)
						{
							Delegatee notificationDelegatee = new Delegatee();
							foreach (var delegatee in delegateDetails.Delegatees)
							{
								if (delegatee.DelegateeSuid == delegateeAction.DelegateeSuid)
								{
									if (delegateeAction.Action)
									{
										delegatee.ConsentStatus = DelegateConstants.Approved;
									}
									else
									{
										delegatee.ConsentStatus = DelegateConstants.Rejected;
									}

									delegatee.DelegateConsentDataSignature = apiResponse.Result.ToString();
									var updateDelegatee = await _delegateeRepository.UpdateDelegateeById(delegatee);
									if (!updateDelegatee)
									{
										_logger.LogError("Failed to update delegatee action");
										return new ServiceResult("Failed to update delegatee action");
									}
									notificationDelegatee = delegatee;
								}
								if (delegatee.ConsentStatus == DelegateConstants.Approved)
								{
									acceptCount++;
								}

								if (delegatee.ConsentStatus == DelegateConstants.Rejected)
								{
									rejectCount++;
								}
							}

							if (rejectCount > 0)
							{
								delegateDetails.DelegationStatus = DelegateConstants.Rejected;
							}

							if (acceptCount == delegateDetails.Delegatees.Count)
							{
								if (delegateDetails.StartDateTime.ToUniversalTime() <= DateTime.UtcNow && DateTime.UtcNow <= delegateDetails.EndDateTime.ToUniversalTime())
								{
									delegateDetails.DelegationStatus = DelegateConstants.Active;
								}

								if (delegateDetails.StartDateTime.ToUniversalTime() >= DateTime.UtcNow)
								{
									delegateDetails.DelegationStatus = DelegateConstants.Scheduled;
								}
							}

							delegateDetails.UpdatedAt = DateTime.UtcNow;

							var updateDelegate = await _delegatorRepository.UpdateDelegateById(delegateDetails);
							if (!updateDelegate)
							{
								_logger.LogError("Failed to update delegate");
								return new ServiceResult("Failed to update delegate");
							}

							//// Delete the temporary text file
							//File.Delete(filePath);

							try
							{
								_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendDelegateeActionEmailToDelegator(delegateeAction.DelegationId, "Signature Delegation Approved"));

								Notification notification = new(notificationDelegatee.DelegateeEmail,
																delegateDetails.DelegatorSuid,
																"",
																$"{notificationDelegatee.DelegateeEmail} has accepted your delegation request",
																delegateDetails.OrganizationId,
																new(NotificationTypeConstants.Delegation, delegateDetails._id));
								_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotificationToDelgator(notification));

								DelegationPushNotificationDTO pushNotificationObj = new()
								{
									AccessToken = string.Empty,
									DelegateeList = [delegateDetails.DelegatorSuid],
									Title = "Delegation Action",
									Body = $"{notificationDelegatee.DelegateeEmail} has accepted your delegation request",
									ConsentData = (string)delegateDetails._id,
									IsDelegator = true,
									IsIdle = true,
								};

								_backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendNotificationDelegationRequest(pushNotificationObj));
							}
							catch (Exception ex)
							{
								Monitor.SendException(ex);
								_logger.LogError("SendResponseEmailToDelegator Exception");
								_logger.LogError(ex.Message);
							}

							return new ServiceResult(null, "Signature delegation approved successfully");
						}
						else
						{
							return new ServiceResult(apiResponse.Message);
						}
					}
					else
					{
						Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
						$"with status code={response.StatusCode}");

						return new ServiceResult("Consent signing failed");
					}

				}

			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("DelegateeActionAsync Exception :  {0}", ex.Message);
			}
			return new ServiceResult("An error occurred while updating delegatee action");
		}

		public async Task<ServiceResult> GetDelegatesListByOrgIdAndSuidAsync(UserDTO user)
		{
			try
			{
				//update scheduled delegation 
				try
				{
					await GetScheduledDelegationListAsync();
				}
				catch (Exception ex)
				{
					Monitor.SendException(ex);
					_logger.LogError(ex.Message);
					_logger.LogError("GetDelegateDetailsByOrgIdAndSuidAsync : GetDelegationListAsync");
				}

				var delegatorList = await _delegatorRepository.GetDelegatesListByOrgIdAndSuid(user.OrganizationId, user.Suid);
				if (delegatorList == null)
				{
					_logger.LogError("Failed to receive delegate list.");
					return new ServiceResult("Failed to receive delegate list.");
				}

				var list = new List<Delegation>();

				foreach (var delegator in delegatorList)
				{
					if (delegator.EndDateTime.ToUniversalTime() < DateTime.UtcNow)
					{
						if (delegator.DelegationStatus != DelegateConstants.Expired &&
							delegator.DelegationStatus != DelegateConstants.Cancelled)
						{
							delegator.DelegationStatus = DelegateConstants.Expired;

							var updateDelegate = await _delegatorRepository.UpdateDelegateById(delegator);
							if (!updateDelegate)
							{
								_logger.LogError("Failed to udpate delegate");
								return new ServiceResult("Failed to udpate delegate");
							}

							try
							{
								_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendEmailToDelegatee(delegator._id, "Signature Delegation Expired", true));
							}
							catch (Exception ex)
							{
								Monitor.SendException(ex);
								_logger.LogError("SendEmailToDelegatee Exception");
								_logger.LogError(ex.Message);
							}
						}
					}
					list.Add(delegator);
				}

				//list.Reverse();

				return new ServiceResult(list, "Successfully received delegator list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetDelegatesListByOrgIdAndSuidAsync Exception :  {0}", ex.Message);
			}
			return new ServiceResult("An error occurred while receiving delegate list");
		}

		public async Task<ServiceResult> GetBusinessUsersListByOrgAsync(UserDTO user)
		{
			try
			{
				var response = await _client.GetAsync(_configuration.GetValue<string>("Config:OrganizationBusinessUsers") + user.OrganizationId);

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
				_logger.LogError("GetOrganizationListAsync Exception :  {0}", ex.Message);
			}
			return new ServiceResult("Failed to receive organization list");
		}

		public async Task<ServiceResult> GetReceivedDelegatesBySuidAndOrgIdAsync(string suid, string orgId)
		{
			try
			{
				//List<string> receivedListArray = new List<string>();
				List<Delegation> receivedDelegatesList = [];

				var receivedDelegateList = await _delegateeRepository.GetDelegateeListBySuidAndOrgIdAsync(suid, orgId);
				if (receivedDelegateList == null)
				{
					_logger.LogError("Failed to receive delegatee list.");
					return new ServiceResult("Failed to receive delegatee list.");
				}

				foreach (var delegatee in receivedDelegateList)
				{
					var delegateData = await _delegatorRepository.GetDelegateById(delegatee.DelegationId);

					if (delegateData != null && delegateData.DelegatorSuid != suid)
					{
						receivedDelegatesList.Add(delegateData);
						if (delegateData.DelegationStatus == DelegateConstants.Cancelled || delegateData.DelegationStatus == DelegateConstants.New)
						{
							receivedDelegatesList.RemoveAll(x => x._id == delegateData._id);
						}
					}
				}

				receivedDelegateList = receivedDelegateList.OrderByDescending(x => x.CreatedAt).ToList();

				//var receivedDelegatesList = await _delegatorRepository.GetDelegateByIdList(receivedListArray);
				//if (receivedDelegatesList == null)
				//{
				//    _logger.LogError("Failed to receive received delegate list.");
				//    return new ServiceResult("Failed to receive received delegate list.");
				//}

				var list = new List<Delegation>();

				foreach (var delegator in receivedDelegatesList)
				{
					if (delegator.EndDateTime.ToUniversalTime() < DateTime.UtcNow)
					{
						if (delegator.DelegationStatus != DelegateConstants.Expired &&
							delegator.DelegationStatus != DelegateConstants.Cancelled
							)
						{
							delegator.DelegationStatus = DelegateConstants.Expired;

							var updateDelegate = await _delegatorRepository.UpdateDelegateById(delegator);
							if (!updateDelegate)
							{
								_logger.LogError("Failed to udpate delegate");
								return new ServiceResult("Failed to udpate delegate");
							}

							try
							{
								_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendEmailToDelegatee(delegator._id, "Signature Delegation Expired", true));
							}
							catch (Exception ex)
							{
								Monitor.SendException(ex);
								_logger.LogError("SendEmailToDelegatee Exception");
								_logger.LogError(ex.Message);
							}
						}
					}
					if (!string.IsNullOrEmpty(delegator.DelegatorConsentData))
						list.Add(delegator);
				}

				return new ServiceResult(list, "Successfully received received delegates list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetDelegatorListByOrgIdAndSuidAsync Exception :  {0}", ex.Message);
			}
			return new ServiceResult("An error occurred while receiving received delegate list");
		}

		public async Task<ServiceResult> GetScheduledDelegationListAsync()
		{
			bool update = false;
			try
			{
				_logger.LogInformation("GetScheduledDelegationListAsync Service call Start -----> " + DateTime.UtcNow);
				var delegationList = await _delegatorRepository.GetScheduledDelegationList();
				if (delegationList.Count > 0)
				{
					foreach (var delegator in delegationList)
					{

						if (delegator.StartDateTime.ToUniversalTime() <= DateTime.UtcNow)
						{
							delegator.DelegationStatus = DelegateConstants.Active;
							_logger.LogInformation("UpdateDelegateById Repo Call Start -----> " + DateTime.UtcNow);
							update = await _delegatorRepository.UpdateDelegateById(delegator);
							if (update)
							{
								_logger.LogInformation("Scheduled delgation status updated to Active for Id :: " + delegator._id);
							}
							_logger.LogInformation("UpdateDelegateById Repo Call End <----- " + DateTime.UtcNow);
						}
					}
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetScheduledDelegationListAsync Exception :  {0}", ex.Message);
			}
			finally
			{
				if (update)
					await Task.Delay(500);
				_logger.LogInformation("GetScheduledDelegationListAsync Service call End <----- " + DateTime.UtcNow);
			}
			return new ServiceResult(null, "GetScheduledDelegationListAsync");
		}
	}
}

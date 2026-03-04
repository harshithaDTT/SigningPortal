using Azure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Services;
using SigningPortal.Web.Models;
using SigningPortal.Web.ViewModels.SignatureDelegation;
using SigningPortal.Web.ViewModels.Templates;
using static Google.Apis.Requests.BatchRequest;
using DelegateRecep = SigningPortal.Core.DTOs.DelegateRecep;
//ing DelegateRecep = SigningPortal.Core.DTOs.DelegateRecep;

namespace SigningPortal.Web.Controllers
{
    [Authorize]
    public class SignatureDelegationController : BaseController
    {

        private readonly IDelegationService _delegatorService;
        public SignatureDelegationController(IDelegationService delegatorService)
        {
            _delegatorService = delegatorService;
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            try
            {
                var result = await _delegatorService.GetDelegatesListByOrgIdAndSuidAsync(UserDetails());
                if (!result.Success)
                {
                    AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = result.Message };
                    TempData["Alert"] = JsonConvert.SerializeObject(alert);
                    // return NotFound();
                    return RedirectToAction("Index", "Dashboard");
                }
                // var result1 = await _delegatorService.GetDelegatesListByOrgIdAndSuidAsync(UserDetails());


                var delegationList = (List<Delegation>)result.Result;

                var viewMOdel = new ListViewModel()
                {
                    DelegationList = delegationList
                };

                return View(viewMOdel);
            }
            catch (Exception)
            {

                return View();
            }
        }
        [HttpGet]
        public async Task<IActionResult> Listitems()
        {
            try
            {
               
                var response = await _delegatorService.GetDelegatesListByOrgIdAndSuidAsync(UserDetails());
                if (response == null || !response.Success)
                {
                    return Json(new
                    {
                        success = false,
                        message = response?.Message ?? "Unknown error"
                    });
                }

                var delegationList = (List<Delegation>)response.Result;

                var viewMOdel = new ListViewModel()
                {
                    DelegationList = delegationList
                };

                return Json(new
                {
                    success = true,
                    result=viewMOdel,

                });
            }
            catch (Exception)
            {

                return View();
            }
        }

        [HttpGet]
        public async Task<IActionResult> ReceivedListitems(string suid,string orgId)
        {
            try
            {

                var response = await _delegatorService.GetReceivedDelegatesBySuidAndOrgIdAsync(suid,orgId);
                if (response == null || !response.Success)
                {
                    return Json(new
                    {
                        success = false,
                        message = response?.Message ?? "Unknown error"
                    });
                }

                var delegationList = (List<Delegation>)response.Result;

                var viewMOdel = new ListViewModel()
                {
                    DelegationList = delegationList
                };

                return Json(new
                {
                    success = true,
                    result = viewMOdel,

                });
            }
            catch (Exception)
            {

                return View();
            }
        }
        /*[HttpGet]
        public async Task<IActionResult> Add()
        {
            var response = await _delegatorService.GetBusinessUsersListByOrgAsync(UserDetails());
            var jsonResponse = response.Result;

            if (!response.Success)
            {
                return NotFound();
            }

            var viewModel = new AddDelegationViewModel();
            viewModel.Emails = new List<string>();
            List<DelegationBusinessUserDTO> delegationUsersList = JsonConvert.DeserializeObject<List<DelegationBusinessUserDTO>>((string)jsonResponse);

            foreach (var item in delegationUsersList)
            {
                viewModel.Emails.Add(item.OrganizationEmail);
            }

            return View(viewModel);
        }*/

        public async Task<IActionResult> Index()
        {
            try
            {
                var response = await _delegatorService.GetBusinessUsersListByOrgAsync(UserDetails());
                var jsonResponse = response.Result;

                if (!response.Success)
                {
                    AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = response.Message };
                    TempData["Alert"] = JsonConvert.SerializeObject(alert);

                    return RedirectToAction("Index");
                    // return NotFound();
                }

                var viewModel = new AddDelegationViewModel();
                viewModel.Emails = new List<string>();
                List<DelegationBusinessUserDTO> delegationUsersList = JsonConvert.DeserializeObject<List<DelegationBusinessUserDTO>>((string)jsonResponse);

                foreach (var item in delegationUsersList)
                {
                    viewModel.Emails.Add(item.OrganizationEmail);
                }

                return View("Index",viewModel);

            }
            catch (Exception)
            {
                return RedirectToAction("Index");
            }
           
        }
        [HttpGet]
        public async Task<IActionResult> CreateDelegation()
        {
            try
            {
                var response = await _delegatorService.GetBusinessUsersListByOrgAsync(UserDetails());
                var jsonResponse = response.Result;

                if (!response.Success)
                {
                    AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = response.Message };
                    TempData["Alert"] = JsonConvert.SerializeObject(alert);

                    return RedirectToAction("List");
                    // return NotFound();
                }

                var viewModel = new AddDelegationViewModel();
                viewModel.Emails = new List<string>();
                List<DelegationBusinessUserDTO> delegationUsersList = JsonConvert.DeserializeObject<List<DelegationBusinessUserDTO>>((string)jsonResponse);

                foreach (var item in delegationUsersList)
                {
                    viewModel.Emails.Add(item.OrganizationEmail);
                }

                return View(viewModel);

            }
            catch (Exception)
            {
                return RedirectToAction("List");
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddDelegation([FromBody] AddDelegationViewModel model)
        {
            try
            {
                var response = await _delegatorService.GetBusinessUsersListByOrgAsync(UserDetails());
                var jsonResponse = response.Result;
				var json = jsonResponse?.ToString();

				var delegationUsersList = string.IsNullOrWhiteSpace(json)
					? new List<DelegationBusinessUserDTO>()
					: JsonConvert.DeserializeObject<List<DelegationBusinessUserDTO>>(json)
						?? new List<DelegationBusinessUserDTO>();
				var delegates = new List<DelegateRecep>();

                DelegateConsentData consentData = new DelegateConsentData()
                {
                    DelegatorSuid = UserDetails().Suid,
                    DelegatorName = UserDetails().Name,
                    OrganizationId = UserDetails().OrganizationId,
                    OrganizationName = UserDetails().OrganizationName,
                    StartDateTime = model.StartDateTime,
                    EndDateTime = model.EndDateTime,
                    DocumentType = "Type",
                    RequestDateTime = DateTime.UtcNow,
                    
                };

                foreach (string email in model.Emails)
                {
                    // Find a user in the delegationUsersList where the OrganizationEmail matches the email
                    var matchedUser = delegationUsersList.FirstOrDefault(user => user.OrganizationEmail.Equals(email, StringComparison.OrdinalIgnoreCase));

                    if (matchedUser != null)
                    {
                        var delegateRecep = new DelegateRecep
                        {
                            Email = matchedUser.OrganizationEmail,
                            Suid = matchedUser.Suid,
                            FullName = matchedUser.FullName,
                            Thumbnail = matchedUser.ThumbNailUri
                        };
                        

                        delegates.Add(delegateRecep);
                        consentData.DelegateList.Add(matchedUser.Suid);
                    }
                }

                string consentDataJson = JsonConvert.SerializeObject(consentData);

                var saveDelegatorDTO = new SaveDelegatorDTO
                {
                    Model = JsonConvert.SerializeObject(new DelegatorModel
                    {
                        AccessToken = "",
                        StartDateTime = model.StartDateTime,
                        EndDateTime = model.EndDateTime,
                        DocumentType = "TYPE",
                        DelegationStatus = "Pending",
                        ConsentData = consentDataJson,
                        DelegatorConsentDataSignature = "",
                        Delegatees = delegates,
                        //Reason=model.Reason
                    })
                };

                var response1 = await _delegatorService.SaveNewDelegatorAsync(saveDelegatorDTO, UserDetails());

                if (!response1.Success)
                {
                    return Json(new { Status = "Failed", Title = "Create New Delegation", Message = response1.Message });

                }
                else
                {
                    return Json(new { Status = "Success", Title = "Create New Delegation", Message = response1.Message });

                }
            }
            catch (Exception ex)
            {
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = ex.Message };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);

                return RedirectToAction("List");
            }
        }

        public async Task<IActionResult> Preview(string DelegationId)
        {
            try
            {
                var response = await _delegatorService.GetDelegateDetailsByIdAsync(DelegationId);
                var jsonResponse = response.Result;

                var preview = (Delegation)response.Result;

                if (preview == null)
                {
                    AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = response.Message };
                    TempData["Alert"] = JsonConvert.SerializeObject(alert);
                    return RedirectToAction("List");
                    //return NotFound();
                }

                var delegateesList = new List<SigningPortal.Web.ViewModels.SignatureDelegation.DelegateRecep>();

                foreach (var dele in preview.Delegatees)
                {
                    var delegateRecep = new SigningPortal.Web.ViewModels.SignatureDelegation.DelegateRecep
                    {
                        Email = dele.DelegateeEmail,
                        FullName = dele.FullName,
                        Thumbnail = dele.Thumbnail
                    };
                    delegateesList.Add(delegateRecep);
                }

                var viewModel = new SigningPortal.Web.ViewModels.SignatureDelegation.EditDelegationViewModel
                {
                    StartDateTime = preview.StartDateTime,
                    EndDateTime = preview.EndDateTime,
                    DelegationStatus = preview.DelegationStatus,
                    DelegationID = DelegationId,
                    Delegatees = delegateesList,
                };

                return View("Edit", viewModel);
            }
            catch (Exception ex)
            {

                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = ex.Message };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return RedirectToAction("List");
            }
        }


        public async Task<IActionResult> Previewdetails(string DelegationId)
        {
            try
            {
                var response = await _delegatorService.GetDelegateDetailsByIdAsync(DelegationId);
                var jsonResponse = response.Result;

                var preview = (Delegation)response.Result;

                if (preview == null)
                {
                    AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = response.Message };
                    TempData["Alert"] = JsonConvert.SerializeObject(alert);
                    return RedirectToAction("List");
                    //return NotFound();
                }

                var delegateesList = new List<SigningPortal.Web.ViewModels.SignatureDelegation.DelegateRecep>();

                foreach (var dele in preview.Delegatees)
                {
                    var delegateRecep = new SigningPortal.Web.ViewModels.SignatureDelegation.DelegateRecep
                    {
                        Email = dele.DelegateeEmail,
                        FullName = dele.FullName,
                        Thumbnail = dele.Thumbnail
                    };
                    delegateesList.Add(delegateRecep);
                }

                var viewModel = new SigningPortal.Web.ViewModels.SignatureDelegation.EditDelegationViewModel
                {
                    StartDateTime = preview.StartDateTime,
                    EndDateTime = preview.EndDateTime,
                    DelegationStatus = preview.DelegationStatus,
                    DelegationID = DelegationId,
                    Delegatees = delegateesList,
                };

                return Json(new
                {
                    success = true,
                    result = viewModel,

                });
            }
            catch (Exception ex)
            {

                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = ex.Message };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return RedirectToAction("List");
            }
        }


        public async Task<IActionResult> RevokeDelegate(string DelegationId)
        {
            try {
                var response = await _delegatorService.RevokeDelegateAsync(DelegationId);

                if (!response.Success)
                {
                    return Json(new { Status = "Failed", Title = "delegation", Message = response.Message });

                }
                else
                {
                    return Json(new { Status = "Success", Title = "Delegation", Message = response.Message });

                }
            }catch (Exception)
            {
                return RedirectToAction("List");
            }
        }
    }
}

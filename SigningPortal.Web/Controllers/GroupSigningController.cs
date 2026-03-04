using Azure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication.GroupSigning;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Services;
using SigningPortal.Web.Models;
using SigningPortal.Web.Models.GroupSigning;
using SigningPortal.Web.ViewModels.BulkSign;
using SigningPortal.Web.ViewModels.GroupSignings;
using static Google.Apis.Requests.BatchRequest;

namespace SigningPortal.Web.Controllers
{
    [Authorize]
    public class GroupSigningController : Controller
    {
        private readonly ITemplateService _templateService;
        private readonly IBulkSignService _bulkSignService;
        private readonly IEDMSService _edMSService;
        private readonly IGroupSigningService _groupSigningService;

        public GroupSigningController(ITemplateService templateService, IBulkSignService bulkSignService, IEDMSService eDMSService,IGroupSigningService groupSigningService)
        {
            _templateService = templateService;
            _bulkSignService = bulkSignService;
            _edMSService = eDMSService;
            _groupSigningService= groupSigningService;
        }

        public IActionResult Index()
        {
            return View();
        }


        [HttpGet]
        public async Task<IActionResult> GetGroupSigningList()
        {
            try
            {
				var userJson = HttpContext.User.Claims
	 .FirstOrDefault(c => c.Type == "user")?.Value;

				if (string.IsNullOrWhiteSpace(userJson))
				{
					return Unauthorized(new
					{
						success = false,
						message = "User claim missing or invalid."
					});
				}

				var userDTO = JsonConvert.DeserializeObject<UserDTO>(userJson);

				if (userDTO == null)
				{
					return BadRequest(new
					{
						success = false,
						message = "Invalid user data."
					});
				}
				var response = await _groupSigningService.GetGroupSigningListAsync(userDTO);

                if (response == null || !response.Success)
                {
                    return Json(new
                    {
                        success = false,
                        message = response?.Message ?? "Unknown error"
                    });
                }

                IList<GroupSigning> groups = (List<GroupSigning>)response.Result;

                TransactionListViewModel model = new TransactionListViewModel()
                {
                    GroupSigninglist = groups
                };

                return Json(new
                {
                    success = true,
                    result = model
                });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> DocumentsSigningStatus(string groupId)
        {


            var response = await _groupSigningService.GetGroupSigningRequestByIdAsync(groupId);
            if (response == null || !response.Success)
            {
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = response.Message };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return RedirectToAction("Index");
                //return Json(new { success = false, message = response.Message });
            }
            var model = (GroupSigning)response.Result;
            var fileArray = model.SigningGroups.Select(sg => new DocumentStatus
            {
                DocumentId = sg.DocumentId,
                DocumentName = sg.DocumentName,
                Status = sg.RecepientStatus
            }).ToList();
           
            var resultobj = new GroupsigningstatusdetailsViewModel()
            {
                GroupId=model._id,
                TotalFileCount=model.TotalFileCount,
                SuccessFileCount=model.SuccessFileCount,
                FailedFileCount=model.FailedFileCount,
                GroupSignStatus= fileArray

            };
           
            var groupsigningdetails = new GroupSigningDetailsViewModel()
            {
                Transaction = model.Transaction,
                SignerOrganizationId = model.SignerOrganizationId,
                SignerSuid = model.SignerSuid,
                SigningGroups = model.SigningGroups,
                Status = model.Status,
                CreatedAt= model.CreatedAt,
                UpdatedAt=model.UpdatedAt,
                GroupsigningstatusdetailsViewModel = resultobj,

            };
            return View(groupsigningdetails);
          

        }


        [HttpGet]
        public async Task<IActionResult> UpdateGroupDocumentSignDetails(string groupId)
        {
            var user = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "user").Value);
            var userDTO = JsonConvert.DeserializeObject<UserDTO>(user);
            var response = await _groupSigningService.GroupSigningStatusAsync(groupId);
            if (response == null || !response.Success)
            {
                return Json(new { success = false, message = response.Message });
            };
            
            var groupsigndto = (GroupSigningStatusResponse)response.Result;
            return Json(new { success = true, result = groupsigndto });
            
        }

        [HttpGet]
        public async Task<IActionResult> GroupDocumentStatusDetails(string groupId)
        {
           
            var response = await _groupSigningService.GetGroupSigningRequestByIdAsync(groupId);
            if (response == null || !response.Success)
            {
                return Json(new { success = false, message = response.Message });
            }
            var model = (GroupSigning)response.Result;
            var result1 = model.Status;
            return Json(new { success = true, result = result1 });
            //return Ok(result1);
        }



        [HttpGet]
        public async Task<IActionResult> DocumentResultDetails(string groupId)
        {

            var result = await _groupSigningService.UpdateGroupSigningStatusAsync(groupId);
            if (result == null || !result.Success)
            {
                // return NotFound();
                return Json(new { success = false, message = result.Message });

            }
            var model = (GroupSigning)result.Result;
            var fileArray = model.SigningGroups.Select(sg => new DocumentStatus
            {
                DocumentId = sg.DocumentId,
                DocumentName = sg.DocumentName,
                Status = sg.RecepientStatus
            }).ToList();

            var resultobj = new GroupsigningstatusdetailsViewModel()
            {
                GroupId = model._id,
                TotalFileCount = model.TotalFileCount,
                SuccessFileCount = model.SuccessFileCount,
                FailedFileCount = model.FailedFileCount,
                GroupSignStatus = fileArray

            };

            var groupsigningdetails = new GroupSigningDetailsViewModel()
            {
                Transaction = model.Transaction,
                SignerOrganizationId = model.SignerOrganizationId,
                SignerSuid = model.SignerSuid,
                SigningGroups = model.SigningGroups,
                Status = model.Status,
                CreatedAt = model.CreatedAt,
                UpdatedAt=model.UpdatedAt,
                GroupsigningstatusdetailsViewModel = resultobj,

            };
            return Json(new { success = true, message = result.Message, result = groupsigningdetails }) ;
        }

        [HttpPost]

        public async Task<IActionResult> PerformGroupSigning([FromBody] GroupSigningRequest request)

		{
            if (request.DocumentIds == null)
            {
                return Json(new { success = false, message = "No docuemnts" });
            }
			var userJson = HttpContext.User.Claims
	.FirstOrDefault(c => c.Type == "user")?.Value;

			if (string.IsNullOrWhiteSpace(userJson))
			{
				return Unauthorized(new
				{
					success = false,
					message = "User claim missing or invalid."
				});
			}

			var userDTO = JsonConvert.DeserializeObject<UserDTO>(userJson);

			if (userDTO == null)
			{
				return BadRequest(new
				{
					success = false,
					message = "Invalid user data."
				});
			}
			var accessToken = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "apiToken").Value);
            var response = await _groupSigningService.SaveAndSignGroupRequestAsync(request.DocumentIds, "Group1", userDTO,accessToken);
            if(response.Success)
            {
                return Json(new { success = true ,message=response.Message,result=response.Result});
            }
            else
            {
                return Json(new { success = false ,message=response.Message});
            }
            
        }

    }
}

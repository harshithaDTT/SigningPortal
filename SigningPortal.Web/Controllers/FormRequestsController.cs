using Azure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using SigningPortal.Web.Models;
using SigningPortal.Web.ViewModels.DigitalForms;
using System;

namespace SigningPortal.Web.Controllers
{
	[Authorize]
	public class FormRequestsController : BaseController
	{

		private readonly ITemplateService _templateService;
		private readonly IConfiguration _configuration;
		private readonly ITemplateDocumentService _templateDocumentService;
		private readonly IDigitalFormTemplateService _digitalFormTemplateService;
		private readonly IEDMSService _edmService;
		private readonly IDigitalFormResponseService _digitalFormResponseService;
		private readonly IDigitalFormTemplateRoleService _roleService;
        private readonly IDelegationService _delegatorService;


        public FormRequestsController(ITemplateService templateService, ITemplateDocumentService templateDocumentService,
		   IConfiguration configuration, IDigitalFormTemplateService digitalFormTemplateService, IEDMSService edmService, IDigitalFormResponseService digitalFormResponseService, IDigitalFormTemplateRoleService digitalFormTemplateRoleService, IDelegationService delegatorService)
		{

			_templateService = templateService;
			_configuration = configuration;
			_templateDocumentService = templateDocumentService;
			_digitalFormTemplateService = digitalFormTemplateService;
			_edmService = edmService;
			_digitalFormResponseService = digitalFormResponseService;
			_roleService = digitalFormTemplateRoleService;
			_delegatorService = delegatorService;
		}
		public async Task<IActionResult> Index(string? viewName)
		{
			var result2 = await _templateDocumentService.SentTemplateDocumentListExists(UserDetails());
			if (result2 == null || !result2.Success)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = result2.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index", "Dashboard");
			}
			var issentlist = (bool)result2.Result;
			var issent = true;

			if (!issentlist && User.IsInRole("DigitalForms") == false)
			{
				issent = false;
			}

			var model = new ViewModels.FormRequests.Sentformspresent()
			{

				isformspresent = issent

			};



			TempData["ViewName"] = viewName;
			ViewBag.ViewName = TempData["ViewName"];
			return View(model);

		}

		public async Task<IActionResult> draft()
		{

			var result = await _templateDocumentService.GetMyTemplateDocumentList(UserDetails());

			if (result == null || !result.Success)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = result.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index", "DigitalForms");
			}
			var model = new ViewModels.FormRequests.AllFormRequestsListViewModel()
			{
				myRequests = (List<TemplateDocument>)result.Result,


			};


			return PartialView("_myFormList", model);
		}
		public async Task<IActionResult> sent()
		{

			var result2 = await _templateDocumentService.GetSentTemplateDocumentList(UserDetails());
			if (result2 == null || !result2.Success)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = result2.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return RedirectToAction("Index", "Dashboard");
            }

			var model = new ViewModels.FormRequests.AllFormRequestsListViewModel()
			{

				sentRequests = (List<Core.Domain.Services.Communication.TemplateDocuments.SentTemplateDocumentListResponse>)result2.Result,

			};



			return PartialView("_sendFormList", model);
		}
		public async Task<IActionResult> recived()
		{


			var result1 = await _templateDocumentService.GetReceivedTemplateDocumentsList(UserDetails());

			if (result1 == null || !result1.Success)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = result1.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return RedirectToAction("Index", "Dashboard");
            }
			var model = new ViewModels.FormRequests.AllFormRequestsListViewModel()
			{

				receiveRequests = (List<TemplateDocument>)result1.Result,


			};

			return PartialView("_receivedFormList", model);
		}

		public async Task<IActionResult> reffered()
		{


			var result1 = await _templateDocumentService.GetReferredDocumentsList(UserDetails());

			if (result1 == null || !result1.Success)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = result1.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index", "Dashboard");
			}
			var model = new ViewModels.FormRequests.AllFormRequestsListViewModel()
			{

				receiveRequests = (List<TemplateDocument>)result1.Result,


			};

			return PartialView("_refferedFormList", model);
		}

		public async Task<IActionResult> BulksignSentFormList(string groupId)
		{


			var result1 = await _templateDocumentService.GetTemplateDocumentListByGroupIdAsync(groupId);

			if (result1 == null || !result1.Success)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = result1.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index", "DigitalForms");
			}
			var model = new ViewModels.FormRequests.AllFormRequestsListViewModel()
			{

				bulksignSentFormListRequests = (List<TemplateDocument>)result1.Result,


			};

			return View(model);
		}

		public async Task<IActionResult> FillFormData(string tempId, string edmsId, string documentName, string flag, string docuid, string Status)
		{
			//if (edmsId == "")
			//{
			//    var response = await _edmService.GetDocumentAsync(int.Parse(edmsId));
			//    var bytearray = (byte[])response.Result;

			//}
			//var details = await _digitalFormTemplateService.GetDigitalFormTemplateByIdAsync(tempId);

			//var detailsstring = (DigitalFormTemplate)details.Result;

			////JObject obj = JObject.Parse(detailsstring.HtmlSchema);


			////var file = File(bytearray, "application/pdf", documentName);
			//var filldata = new FillFormData()
			//{
			//    filename = documentName,
			//    tempid = tempId,
			//    htmlschma = detailsstring.HtmlSchema

			//};
			//return View("UseWebForm",filldata);

			var user = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "user").Value);
			var userDTO = JsonConvert.DeserializeObject<UserDTO>(user);
			var details = await _digitalFormTemplateService.GetDigitalFormTemplateByIdAsync(tempId);
			if (details.Result == null)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = details.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index", "DigitalForms");
			}
			var detailsstring = (DigitalFormTemplate)details.Result;
			if (flag == "previewsend")
			{
				edmsId = detailsstring.EdmsId;
			}

			if (detailsstring.Type == "WEB" && edmsId != null && edmsId != "" && Status != "New")
			{
				var response = await _edmService.GetDocumentAsync(edmsId);
				if (response.Result == null)
				{
					AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = details.Message };
					TempData["Alert"] = JsonConvert.SerializeObject(alert);
					return RedirectToAction("Index", "DigitalForms");
				}
				var bytearray = (byte[])response.Result;
				string base64String = Convert.ToBase64String(bytearray);
				var autofilldata = await _digitalFormResponseService.GetDigitalFormFillDataAsync(userDTO.Suid);
				//if (autofilldata.Result == null)
				//{
				//    return NotFound();
				//}
				var roledetails = await _templateDocumentService.GetTemplateDocumentByIdAsync(docuid);

				if (roledetails.Result == null)
				{
					//some code
				}
				TemplateDocument roleData = (TemplateDocument)roledetails.Result;
                var tempRecep = roleData.TemplateRecepients.Where(x => (x.Signer.suid == userDTO.Suid || (x.HasDelegation && x.AlternateSignatories.Any(a => a.suid == userDTO.Suid))) && x.OrganizationId == userDTO.OrganizationId && x.Status == DocumentStatusConstants.Pending).OrderBy(x => x.Order).FirstOrDefault();

                var filldata = new ViewModels.DigitalForms.FillFormData()
				{
					filename = documentName,
					tempid = tempId,
					htmlschma = roleData.HtmlSchema,
					pdfblob = base64String,
					autofilldata = (string)autofilldata.Result,
					flag = flag,
					UserRole = tempRecep?.RoleName,
					DocumentId = docuid,
					Status = Status,
					pdfschma = roleData.PdfSchema



				};

				if (flag == "preview" || flag == "previewsend")
				{
					return View("PdfPreview", filldata);
				}
				return View("UsePdfMulti", filldata);
			}
			if (detailsstring.Type == "PDF")
			{
				if (string.IsNullOrWhiteSpace(edmsId))
				{
					return BadRequest("EDMS Id is required.");
				}

				var response = await _edmService.GetDocumentAsync(edmsId);
				if (response.Result == null)
				{
					AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = details.Message };
					TempData["Alert"] = JsonConvert.SerializeObject(alert);
					return RedirectToAction("Index", "DigitalForms");
				}
				var bytearray = (byte[])response.Result;
				string base64String = Convert.ToBase64String(bytearray);
				var autofilldata = await _digitalFormResponseService.GetDigitalFormFillDataAsync(userDTO.Suid);
				
				var roledetails = await _templateDocumentService.GetTemplateDocumentByIdAsync(docuid);

				if (roledetails.Result == null)
				{
					//some code
				}
				TemplateDocument roleData = (TemplateDocument)roledetails.Result;
				var tempRecep = roleData.TemplateRecepients.Where(x => (x.Signer.suid == userDTO.Suid || (x.HasDelegation && x.AlternateSignatories.Any(a => a.suid == userDTO.Suid)))&& x.OrganizationId == userDTO.OrganizationId && x.Status == DocumentStatusConstants.Pending).OrderBy(x => x.Order).FirstOrDefault();

				var filldata = new ViewModels.DigitalForms.FillFormData()
				{
					filename = documentName,
					tempid = tempId,
					htmlschma = roleData.HtmlSchema,
					pdfblob = base64String,
					autofilldata = (string)autofilldata.Result,
					flag = flag,
					UserRole = tempRecep?.RoleName,
					DocumentId = docuid,
					Status = Status,


				};

				if (flag == "preview" || flag == "previewsend")
				{
					return View("PdfPreview", filldata);
				}
				return View("UsePdfMulti", filldata);

			}

			else
			{
				var autofilldata = await _digitalFormResponseService.GetDigitalFormFillDataAsync(userDTO.Suid);
				//if (autofilldata.Result == null)
				//{
				//    return NotFound();
				//}
				var roledetails = await _templateDocumentService.GetTemplateDocumentByIdAsync(docuid);

				if (roledetails.Result == null)
				{
					//some code
				}
				TemplateDocument roleData = (TemplateDocument)roledetails.Result;
                var tempRecep = roleData.TemplateRecepients.Where(x => (x.Signer.suid == userDTO.Suid || (x.HasDelegation && x.AlternateSignatories.Any(a => a.suid == userDTO.Suid))) && x.OrganizationId == userDTO.OrganizationId && x.Status == DocumentStatusConstants.Pending).OrderBy(x => x.Order).FirstOrDefault();

                var filldata = new ViewModels.DigitalForms.FillFormData()
				{
					filename = documentName,
					tempid = tempId,
					htmlschma = roleData.HtmlSchema,
					autofilldata = (string)autofilldata.Result,
					flag = flag,
					UserRole = tempRecep?.RoleName,
					DocumentId = docuid,
					Status = Status

				};

				if (flag == "preview" || flag == "previewsend")
				{
					return View("WebPreview", filldata);
				}
				return View("UseWebMulti", filldata);

			}





		}

		public async Task<IActionResult> ValidateEseal(string docuid)
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

			if (userDTO == null )

			{
				return BadRequest(new
				{
					success = false,
					message = "Invalid user data."
				});
			}
			var roledetails = await _templateDocumentService.GetTemplateDocumentByIdAsync(docuid);
			if (!roledetails.Success)
			{
                return Json(new { success = false, message = roledetails.Message });
            }
			TemplateDocument roleData = (TemplateDocument)roledetails.Result;
			var tempRecep = roleData.TemplateRecepients.Where(x => x.Signer.suid == userDTO.Suid && x.OrganizationId == userDTO.OrganizationId).OrderBy(x => x.Order).FirstOrDefault();
			esealplaceHolderCoordinates esealannotations = tempRecep?.EsealAnnotations;
			if (User.IsInRole("eSealSignatory") == false && esealannotations?.signatureXaxis != "" && esealannotations?.signatureXaxis != null)
			{
				return Json(new { success = false, message = "You don't have privilege of eseal sign" });
            }

			if (userDTO?.OrganizationId != "" ||  string.IsNullOrWhiteSpace(userDTO.OrganizationId) || string.IsNullOrWhiteSpace(userDTO.Suid))
			{
				var delegation = await _delegatorService.GetDelegateDetailsByOrgIdAndSuidAsync( userDTO.OrganizationId, userDTO.Suid);
				if (!delegation.Success)
                {
                    return Json(new { success = false, message = delegation.Message });
                }
                var responselist = delegation.Result as List<Delegatee>;

                if (responselist?.Count > 0)
                {
                    return Json(new { success = false, message = "Signing is not permitted as you have an active delegation." });
                }

            }

       


            return Json(new { success = true });

		}

		public async Task<IActionResult> SaveandSign(SaveDigitalFormResponse SaveDigitalFormResponse)
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

				var orgid = SaveDigitalFormResponse.isEsealPresent ? userDTO.OrganizationId : null;

				FormSigngingRequestDTO digitalFormResponseDTO = new FormSigngingRequestDTO()
				{
					File = SaveDigitalFormResponse.File,
					FormId = SaveDigitalFormResponse.FormId,
					AcToken = AccessToken,
					IdpToken = IdpToken,
					FormFieldData = SaveDigitalFormResponse.FormFieldData,
					OrganizationId = orgid,
					FormDocumentId = SaveDigitalFormResponse.DocumentId
				};

				var response = await _digitalFormResponseService.SendFormSigngingRequestAsync(digitalFormResponseDTO, userDTO);
				if (!response.Success)
				{

					return Json(new { Status = "Failed", Title = "Status", Message = response.Message });
				}
				else
				{
					return Json(new { Status = "Success", Title = "Status", Message = response.Message });

				}

			}
			catch (Exception ex)
			{
				return StatusCode(500, $"An error occurred: {ex.Message}");
			}

		}

		public async Task<IActionResult> DocumentStatus(string tempId, string docuid)
		{
			var roledetails = await _templateDocumentService.GetTemplateDocumentByIdAsync(docuid);
			TemplateDocument roleData = (TemplateDocument)roledetails.Result;

			var statusdata = new ViewModels.DigitalForms.StatusDoc()
			{
				DocumentName = roleData.DocumentName,
				CreateTime = roleData.CreateTime,
				CompleteTime = roleData.CompleteTime,
				Status = roleData.Status,
				EdmsId = roleData.EdmsId,
				TemplateRecepients = roleData.TemplateRecepients,
			};
			return View("DocumentStatus", statusdata);
		}


        public async Task<IActionResult> TemplateDocumentStatus(string tempDocuId)
        {
            var response = await _templateDocumentService.GetTemplateDocumentByIdAsync(tempDocuId);
            if (response == null || response.Result == null)
                return Json(new { success = false, message = "Document not found" });
            return Json(response.Result);
        }

    }
}

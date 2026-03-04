using Azure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using SigningPortal.Web.Models;
using SigningPortal.Web.ViewModels.DigitalForms;
using System;

namespace SigningPortal.Web.Controllers
{
	[Authorize]
	public class DigitalFormsController : BaseController
	{
		private readonly IDigitalFormTemplateService _digitalFormTemplateService;
		private readonly ITemplateDocumentService _templateDocumentService;
		private readonly IEDMSService _edmService;
		private readonly IDigitalFormResponseService _digitalFormResponseService;
		private readonly ITemplateService _templateService;
		private readonly IDigitalFormTemplateRoleService _roleService;
		private readonly IDelegationService _delegationService;
		private readonly IUserService _userService;
        private readonly IConfiguration _configuration;

        public DigitalFormsController(IDigitalFormTemplateService digitalFormTemplateService,
			ITemplateDocumentService templateDocumentService,
			IEDMSService edmService, IDigitalFormResponseService digitalFormResponseService,
			ITemplateService templateService,
			IDigitalFormTemplateRoleService digitalFormTemplateRoleService,
			IDelegationService delegationService, IUserService userService,
            IConfiguration configuration)
		{
			_digitalFormTemplateService = digitalFormTemplateService;
			_edmService = edmService;
			_digitalFormResponseService = digitalFormResponseService;
			_templateService = templateService;
			_roleService = digitalFormTemplateRoleService;
			_templateDocumentService = templateDocumentService;
			_delegationService = delegationService;
			_userService = userService;
            _configuration = configuration;
        }

		public IActionResult Index(string? ViewName)
		{
			ViewBag.ViewName = ViewName;
            double fileSize = _configuration.GetValue<double>("FileSizeLimit");
            ViewBag.FileSizeLimit = fileSize;
            return View();
		}

		public IActionResult Globalindex(string? ViewName)
		{

			return View();
		}

        public IActionResult Orgindex(string? ViewName)
        {

            return View();
        }


        public IActionResult CreateDigitalForm(DocumentTypeViewModel model)
		{

			var response = _templateService.GetSignatureTemplateList();
			if (response.Result == null)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = response.Result.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index");

			}
			var SignatureTemplateList = (IList<SignatureTemplatesDTO>)response.Result.Result;
			model.Templates = SignatureTemplateList;



			if (model.ExistingDoc)
			{
				return View("CreatePdfForm", model);
			}
			else
			{
				return View("CreateWebForm", model);
			}

		}
		public async Task<IActionResult> myforms()
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

			var result = await _digitalFormTemplateService.GetDigitalFormTemplateListAsync(userDTO);
			if (result.Result == null)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = result.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index");

			}

			var list = result.Result as List<DigitalFormTemplate>;
			List<DigitalformsViewModel> model = new List<DigitalformsViewModel>();
			foreach (var item in list)
			{
				var formresponselist = await _templateDocumentService.GetTemplateDocumentListByFormIdAsync(item._id);
				var responselist = formresponselist.Result as List<TemplateDocument>;

				var myforms = new DigitalformsViewModel()
				{
					TemplateName = item.TemplateName,
					OrganizationUid = item.OrganizationUid,
					Email = item.Email,
					Suid = item.Suid,
					ApplicableSubscriberType = item.ApplicableSubscriberType,
					//FormGroupId = item.FormGroupId,
					FormType = item.FormType,
					Order = item.Order,
					Status = item.Status,
					EdmsId = item.EdmsId,
					DocumentName = item.DocumentName,
					AdvancedSettings = item.AdvancedSettings,
					DaysToComplete = item.DaysToComplete,
					NumberOfSignatures = item.NumberOfSignatures,
					AllSigRequired = item.AllSigRequired,
					PublishGlobally = item.PublishGlobally,
					SequentialSigning = item.SequentialSigning,
					CreatedBy = item.CreatedBy,
					UpdatedBy = item.UpdatedBy,
					Type = item.Type,
					HtmlSchema = item.HtmlSchema,
					PdfSchema = item.PdfSchema,
					CreatedAt = item.CreatedAt,
					_id = item._id,
					ResponseCount = responselist.Count,
					Roles = item.Roles
				};


				model.Add(myforms);

			}



			return PartialView("_myforms", model);
		}

		public async Task<IActionResult> orgforms()
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

			var result = await _digitalFormTemplateService.GetNewDigitalFormTemplatePublishListAsync(userDTO);
			if (result.Result == null)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = result.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index");
			}

			var list = result.Result as List<Core.DTOs.NewFormTemplateResponseDTO>;
			List<FormTemplateResponse> model = new List<FormTemplateResponse>();
			foreach (var item in list)
			{
				FormResponse response = null;
				var templateform = new DigitalformsViewModel()
				{
					TemplateName = item.Template.TemplateName,
					OrganizationUid = item.Template.OrganizationUid,
					Email = item.Template.Email,
					Suid = item.Template.Suid,
					ApplicableSubscriberType = item.Template.ApplicableSubscriberType,
					//FormGroupId = item.Template.FormGroupId,
					FormType = item.Template.FormType,
					Order = item.Template.Order,
					Status = item.Template.Status,
					EdmsId = item.Template.EdmsId,
					DocumentName = item.Template.DocumentName,
					AdvancedSettings = item.Template.AdvancedSettings,
					DaysToComplete = item.Template.DaysToComplete,
					NumberOfSignatures = item.Template.NumberOfSignatures,
					AllSigRequired = item.Template.AllSigRequired,
					PublishGlobally = item.Template.PublishGlobally,
					SequentialSigning = item.Template.SequentialSigning,
					CreatedBy = item.Template.CreatedBy,
					UpdatedBy = item.Template.UpdatedBy,
					Type = item.Template.Type,
					HtmlSchema = item.Template.HtmlSchema,
					PdfSchema = item.Template.PdfSchema,
				
					CreatedAt = item.Template.CreatedAt,
					_id = item.Template._id,
					ResponseCount = 0,
				};



				if (item.FormResponse != null)
				{
					TemplateRecepient selfRecepient = item.FormResponse.TemplateRecepients.FirstOrDefault(x => x.Signer.suid == userDTO.Suid);
					response = new FormResponse()
					{
						FormId = selfRecepient.TemplateDocumentId,

						FormTemplateName = item.Template.TemplateName,

						CorelationId = selfRecepient.CorrelationId,

						Status = item.FormResponse.Status,

						SignerName = selfRecepient.SignerName,

						//SignerEmail = item.FormResponse.SignerEmail,

						//SignerSuid = item.FormResponse.SignerSuid,

						PendingSignList = item.FormResponse.PendingSignList,
						CompleteSignList = item.FormResponse.CompleteSignList,

						AcToken = selfRecepient.IdpToken,

						EdmsId = item.FormResponse.EdmsId,

						//CreatedBy = item.FormResponse.CreatedBy,

						//UpdatedBy = item.FormResponse.UpdatedBy,
						TemplateRecepients = item.FormResponse.TemplateRecepients,


					};
				}

				var finalmodel = new FormTemplateResponse()
				{
					Template = templateform,
					FormResponse = response,

				};
				model.Add(finalmodel);

			}



			return PartialView("_orgforms", model);
		}

		public async Task<IActionResult> globalforms()
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
			var result = await _digitalFormTemplateService.GetNewDigitalFormTemplatePublishGlobalListAsync(userDTO);
			if (result.Result == null)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = result.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index");
			}

			var list = result.Result as List<Core.DTOs.NewFormTemplateResponseDTO>;
			List<FormTemplateResponse> model = new List<FormTemplateResponse>();
			foreach (var item in list)
			{
				FormResponse response = null;
				var templateform = new DigitalformsViewModel()
				{
					TemplateName = item.Template.TemplateName,
					OrganizationUid = item.Template.OrganizationUid,
					Email = item.Template.Email,
					Suid = item.Template.Suid,
					ApplicableSubscriberType = item.Template.ApplicableSubscriberType,
					//FormGroupId = item.Template.FormGroupId,
					FormType = item.Template.FormType,
					Order = item.Template.Order,
					Status = item.Template.Status,
					EdmsId = item.Template.EdmsId,
					DocumentName = item.Template.DocumentName,
					AdvancedSettings = item.Template.AdvancedSettings,
					DaysToComplete = item.Template.DaysToComplete,
					NumberOfSignatures = item.Template.NumberOfSignatures,
					AllSigRequired = item.Template.AllSigRequired,
					PublishGlobally = item.Template.PublishGlobally,
					SequentialSigning = item.Template.SequentialSigning,
					CreatedBy = item.Template.CreatedBy,
					UpdatedBy = item.Template.UpdatedBy,
					Type = item.Template.Type,
					HtmlSchema = item.Template.HtmlSchema,
					PdfSchema = item.Template.PdfSchema,
				
					CreatedAt = item.Template.CreatedAt,
					_id = item.Template._id,
					ResponseCount = 0,
				};



				if (item.FormResponse != null)
				{
					TemplateRecepient selfRecepient = item.FormResponse.TemplateRecepients.FirstOrDefault(x => x.Signer.suid == userDTO.Suid);
					response = new FormResponse()
					{
						FormId = selfRecepient.TemplateDocumentId,

						FormTemplateName = item.Template.TemplateName,

						CorelationId = selfRecepient.CorrelationId,

						Status = item.FormResponse.Status,

						SignerName = selfRecepient.SignerName,

						//SignerEmail = item.FormResponse.SignerEmail,

						//SignerSuid = item.FormResponse.SignerSuid,



						AcToken = selfRecepient.IdpToken,

						EdmsId = item.FormResponse.EdmsId,

						//CreatedBy = item.FormResponse.CreatedBy,

						//UpdatedBy = item.FormResponse.UpdatedBy,

						PendingSignList = item.FormResponse.PendingSignList,
						CompleteSignList = item.FormResponse.CompleteSignList,
						TemplateRecepients = item.FormResponse.TemplateRecepients,
					};
				}

				var finalmodel = new FormTemplateResponse()
				{
					Template = templateform,
					FormResponse = response,

				};
				model.Add(finalmodel);

			}



			return PartialView("_globalforms", model);
		}

		public async Task<IActionResult> saveForm(SignatureTemplateViewModel signatureTemplateViewModel)
		{
			try
			{
				

					List<RoleDetails> rolesConfig = new List<RoleDetails>();

					JArray configObject = JArray.Parse(signatureTemplateViewModel.rolesConfig);

					foreach (JObject obj in configObject)
					{
						// Extract placeHolderCoordinates
						JObject signCordinates = (JObject)obj["placeHolderCoordinates"];
						var signCord = new placeHolderCoordinates()
						{


							signatureXaxis = !string.IsNullOrEmpty(Convert.ToString(signCordinates["signatureXaxis"]))
						 ? Convert.ToString(signCordinates["signatureXaxis"])
						 : null,
							signatureYaxis = !string.IsNullOrEmpty(Convert.ToString(signCordinates["signatureYaxis"]))
						 ? Convert.ToString(signCordinates["signatureYaxis"])
						 : null,
							pageNumber = !string.IsNullOrEmpty(Convert.ToString(signCordinates["pageNumber"]))
					 ? Convert.ToString(signCordinates["pageNumber"])
					 : null,
							imgWidth = (string)signCordinates["signaturewidth"],
							imgHeight = (string)signCordinates["signatureheight"]
						};

						// Extract esealplaceHolderCoordinates
						JObject esealCordinates = (JObject)obj["esealplaceHolderCoordinates"];
						var esealCord = new esealplaceHolderCoordinates()
						{
							signatureXaxis = !string.IsNullOrEmpty(Convert.ToString(esealCordinates["signatureXaxis"]))
						 ? Convert.ToString(esealCordinates["signatureXaxis"])
						 : null,


							signatureYaxis = !string.IsNullOrEmpty(Convert.ToString(esealCordinates["signatureYaxis"]))
						 ? Convert.ToString(esealCordinates["signatureYaxis"])
						 : null,

							pageNumber = !string.IsNullOrEmpty(Convert.ToString(esealCordinates["pageNumber"]))
									? Convert.ToString(esealCordinates["pageNumber"])
									: null,
							imgWidth = (string)esealCordinates["signaturewidth"],
							imgHeight = (string)esealCordinates["signatureheight"]
						};

						// Extract Role details
						Role role1 = new Role
						{
							name = (string)obj["role"]["name"],
							email = (string)obj["email"],
							description = (string)obj["description"]
						};

						// Create RoleDetails and add to rolesConfig
						var rolesCon = new RoleDetails
						{
							role = role1,
							annotationsList = (string)obj["annotationsList"],
							esealPlaceHolderCoordinates = esealCord,
							placeHolderCoordinates = signCord,
						};
						rolesConfig.Add(rolesCon);
					}





					var dataConfig = JsonConvert.SerializeObject(rolesConfig);



					var docConfig = new DigitalFormTemplateModel
					{
						documentName = signatureTemplateViewModel.documentName,
						name = signatureTemplateViewModel.name,
						daysToComplete = signatureTemplateViewModel.daysToComplete,
						numberOfSignatures = signatureTemplateViewModel.numberOfSignatures,
						allSigRequired = signatureTemplateViewModel.allSigRequired,
						publishGlobally = signatureTemplateViewModel.publishGlobally,
						sequentialSigning = signatureTemplateViewModel.sequentialSigning,
						advancedSettings = signatureTemplateViewModel.advancedSettings,
						docType = signatureTemplateViewModel.docType,
						htmlSchema = signatureTemplateViewModel.htmlSchema,
						pdfSchema = signatureTemplateViewModel.pdfSchema,
					};

					JArray rolesArray = JArray.Parse(signatureTemplateViewModel.roles);

					JObject rolesObject = rolesArray.FirstOrDefault() as JObject;

					List<Role> roles = new List<Role>();

					Role role = new Role
					{
						name = (string)rolesObject["name"],
						email = (string)rolesObject["email"],
						description = (string)rolesObject["description"]
					};

					roles.Add(role);


					var model = new TemplateModelDTO
					{
						docConfig = docConfig,
						roles = roles,
						rolesConfig = dataConfig
					};

					var dataJson = JsonConvert.SerializeObject(model);

					SaveNewDigitalFormTemplateDTO SaveNewDocumentTemplateDTO = new SaveNewDigitalFormTemplateDTO()
					{
						File = signatureTemplateViewModel.File,
						Model = dataJson
					};
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
				var response = await _digitalFormTemplateService.SaveNewDigitalFormTemplateAsync(SaveNewDocumentTemplateDTO, userDTO);
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

		//public async Task<IActionResult> saveForm(SignatureTemplateViewModel signatureTemplateViewModel)
		//{
		//    try
		//    {
		//        string logMessage;

		//        JArray configObject = JArray.Parse(signatureTemplateViewModel.rolesConfig);

		//        JObject firstObject = configObject.FirstOrDefault() as JObject;

		//        JObject signCordinates = (JObject)firstObject["placeHolderCoordinates"];
		//        var signCord = new placeHolderCoordinates()
		//        {
		//            signatureXaxis = (string)signCordinates["signatureXaxis"],
		//            signatureYaxis = (string)signCordinates["signatureYaxis"],
		//            pageNumber = (string)signCordinates["pageNumber"],
		//            imgWidth = (string)signCordinates["signaturewidth"],
		//            imgHeight = (string)signCordinates["signatureheight"]
		//        };

		//        JObject esealCordinates = (JObject)firstObject["esealplaceHolderCoordinates"];
		//        var esealCord = new esealplaceHolderCoordinates()
		//        {
		//            signatureXaxis = (string)esealCordinates["signatureXaxis"],
		//            signatureYaxis = (string)esealCordinates["signatureYaxis"],
		//            pageNumber = (string)esealCordinates["pageNumber"],
		//            imgWidth = (string)signCordinates["esealwidth"],
		//            imgHeight = (string)signCordinates["esealheight"]
		//        };

		//        List<RoleDetails> rolesConfig = new List<RoleDetails>();
		//        var rolesCon = new RoleDetails
		//        {
		//            esealPlaceHolderCoordinates = esealCord,
		//            placeHolderCoordinates = signCord,
		//        };
		//        rolesConfig.Add(rolesCon);

		//        var dataConfig = JsonConvert.SerializeObject(rolesConfig);

		//        var docConfig = new DigitalFormTemplateModel
		//        {
		//            documentName = signatureTemplateViewModel.documentName,
		//            name = signatureTemplateViewModel.name,
		//            daysToComplete = signatureTemplateViewModel.daysToComplete,
		//            numberOfSignatures = signatureTemplateViewModel.numberOfSignatures,
		//            allSigRequired = signatureTemplateViewModel.allSigRequired,
		//            publishGlobally = signatureTemplateViewModel.publishGlobally,
		//            sequentialSigning = signatureTemplateViewModel.sequentialSigning,
		//            advancedSettings = signatureTemplateViewModel.advancedSettings,
		//            docType = signatureTemplateViewModel.docType,
		//            htmlSchema = signatureTemplateViewModel.htmlSchema,
		//            pdfSchema = signatureTemplateViewModel.pdfSchema
		//        };

		//        JArray rolesArray = JArray.Parse(signatureTemplateViewModel.roles);

		//        JObject rolesObject = rolesArray.FirstOrDefault() as JObject;

		//        List<Role> roles = new List<Role>();

		//        Role role = new Role
		//        {
		//            name = (string)rolesObject["name"],
		//            email = (string)rolesObject["email"],
		//            description = (string)rolesObject["description"]
		//        };

		//        roles.Add(role);


		//        var model = new TemplateModelDTO
		//        {
		//            docConfig = docConfig,
		//            roles = roles,
		//            rolesConfig = dataConfig
		//        };

		//        var dataJson = JsonConvert.SerializeObject(model);

		//        SaveNewDigitalFormTemplateDTO SaveNewDocumentTemplateDTO = new SaveNewDigitalFormTemplateDTO()
		//        {
		//            File = signatureTemplateViewModel.File,
		//            Model = dataJson
		//        };
		//        var user = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "user").Value);
		//        var userDTO = JsonConvert.DeserializeObject<UserDTO>(user);

		//        var response = await _digitalFormTemplateService.SaveNewDigitalFormTemplateAsync(SaveNewDocumentTemplateDTO, userDTO);
		//        if (!response.Success)
		//        {

		//            return Json(new { Status = "Failed", Title = "Status", Message = response.Message });
		//        }
		//        else
		//        {
		//            return Json(new { Status = "Success", Title = "Status", Message = response.Message });

		//        }
		//    }
		//    catch (Exception ex)
		//    {
		//        return StatusCode(500, $"An error occurred: {ex.Message}");
		//    }
		//}

		public async Task<IActionResult> ChangeStatus(string templateId, string action)
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

				var response = await _digitalFormTemplateService.PublishUnpublishTemplateStatusAsync(templateId, action, userDTO);

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
				return Json(new { Error = ex.Message });
			}

		}


		public async Task<IActionResult> ValidateEseal(string tempId)
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
			var details = await _digitalFormTemplateService.GetDigitalFormTemplateByIdAsync(tempId);
            if (!details.Success)
            {
                return Json(new { success = false, message = details.Message });
            }

            var detailsstring = (DigitalFormTemplate)details.Result;
			DigitalFormTemplateRole roledetails = detailsstring.Roles[0];
			esealplaceHolderCoordinates esealannotations = roledetails.EsealPlaceHolderCoordinates;
			if (User.IsInRole("eSealSignatory") == false && esealannotations?.signatureXaxis != "" && esealannotations?.signatureXaxis != null)
			{
				return Json(new { success = false, message = "You don't have privilege of eseal sign" });
			}


			if (userDTO is
				{
					OrganizationId: { Length: > 0 } orgId,
					Suid: { Length: > 0 } suid
				})
			{
				var delegation = await _delegationService
					.GetDelegateDetailsByOrgIdAndSuidAsync(orgId, suid);

				if (!delegation.Success)
					return Json(new { success = false, message = delegation.Message });

				if (delegation.Result is List<Delegatee> responselist &&
					responselist.Count > 0)
				{
					return Json(new
					{
						success = false,
						message = "Signing is not permitted as you have an active delegation."
					});
				}
			}


			return Json(new { success = true });

		}
		public async Task<IActionResult> FillFormData(string tempId, string edmsId, string documentName, string flag)
		{

			var user = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "user").Value);
			var userDTO = JsonConvert.DeserializeObject<UserDTO>(user);
			var details = await _digitalFormTemplateService.GetDigitalFormTemplateByIdAsync(tempId);
			if (details.Result == null)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = details.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);

				if (userDTO.AccountType.ToLower() == "self")
				{
					return RedirectToAction("Globalindex");
				}

				return RedirectToAction("Index");
			}
			var detailsstring = (DigitalFormTemplate)details.Result;
			if (detailsstring.Type == "WEB" && !string.IsNullOrWhiteSpace(edmsId))
			{
				var response = await _edmService.GetDocumentAsync(edmsId);
				if (response.Result == null)
				{
					AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = response.Message };
					TempData["Alert"] = JsonConvert.SerializeObject(alert);
					if (userDTO.AccountType.ToLower() == "self")
					{
						return RedirectToAction("Globalindex");
					}
					return RedirectToAction("Index");
				}
				var bytearray = (byte[])response.Result;
				string base64String = Convert.ToBase64String(bytearray);
				var autofilldata = await _digitalFormResponseService.GetDigitalFormFillDataAsync(userDTO.Suid);
				if (autofilldata.Result == null)
				{

				}
				var filldata = new ViewModels.DigitalForms.FillFormData()
				{
					filename = documentName,
					tempid = tempId,
					pdfschema = detailsstring.PdfSchema,
					pdfblob = base64String,
					autofilldata = (string)autofilldata.Result,
					flag = flag,
					Roles = detailsstring.Roles,
					Daystocomplete = detailsstring.DaysToComplete

				};

				if (flag == "Preview" || flag == "PreviewTemplate")
				{
					return View("Preview", filldata);
				}
				return View("UsePdfForm", filldata);

			}
			else if (detailsstring.Type == "PDF")
			{
				var response = await _edmService.GetDocumentAsync(edmsId);
				if (response.Result == null)
				{
					AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = response.Message };
					TempData["Alert"] = JsonConvert.SerializeObject(alert);
					if (userDTO.AccountType.ToLower() == "self")
					{
						return RedirectToAction("Globalindex");
					}
					return RedirectToAction("Index");
				}
				var bytearray = (byte[])response.Result;
				string base64String = Convert.ToBase64String(bytearray);
				var autofilldata = await _digitalFormResponseService.GetDigitalFormFillDataAsync(userDTO.Suid);
				if (autofilldata.Result == null)
				{

				}
				var filldata = new ViewModels.DigitalForms.FillFormData()
				{
					filename = documentName,
					tempid = tempId,
					htmlschma = detailsstring.HtmlSchema,
					pdfblob = base64String,
					autofilldata = (string)autofilldata.Result,
					flag = flag,
					Roles = detailsstring.Roles,

					Daystocomplete = detailsstring.DaysToComplete

				};

				if (flag == "Preview" || flag == "PreviewTemplate")
				{
					return View("Preview", filldata);
				}
				return View("UsePdfForm", filldata);

			}

			else
			{
				var autofilldata = await _digitalFormResponseService.GetDigitalFormFillDataAsync(userDTO.Suid);
				//if (autofilldata.Result == null)
				//{
				//    return NotFound();
				//}
				var filldata = new ViewModels.DigitalForms.FillFormData()
				{
					filename = documentName,
					tempid = tempId,
					htmlschma = detailsstring.HtmlSchema,
					pdfschema = detailsstring.PdfSchema,
					autofilldata = (string)autofilldata.Result,
					Roles = detailsstring.Roles,
					flag = flag,
					Daystocomplete = detailsstring.DaysToComplete

				};

				if (flag == "Preview" || flag == "PreviewTemplate")
				{
					return View("WebPreview", filldata);
				}
				return View("UseWebForm", filldata);

			}





		}

		//public async Task<IActionResult> FillFormData(string tempId, string edmsId, string documentName, string flag)
		//{
		//    //if (edmsId == "")
		//    //{
		//    //    var response = await _edmService.GetDocumentAsync(int.Parse(edmsId));
		//    //    var bytearray = (byte[])response.Result;

		//    //}
		//    //var details = await _digitalFormTemplateService.GetDigitalFormTemplateByIdAsync(tempId);

		//    //var detailsstring = (DigitalFormTemplate)details.Result;

		//    ////JObject obj = JObject.Parse(detailsstring.HtmlSchema);


		//    ////var file = File(bytearray, "application/pdf", documentName);
		//    //var filldata = new FillFormData()
		//    //{
		//    //    filename = documentName,
		//    //    tempid = tempId,
		//    //    htmlschma = detailsstring.HtmlSchema

		//    //};
		//    //return View("UseWebForm",filldata);
		//    var user = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "user").Value);
		//    var userDTO = JsonConvert.DeserializeObject<UserDTO>(user);

		//    var response = await _edmService.GetDocumentAsync(int.Parse(edmsId));
		//    if (response.Result == null)
		//    {
		//        return NotFound();
		//    }
		//    var bytearray = (byte[])response.Result;
		//    string base64String = Convert.ToBase64String(bytearray);
		//    var details = await _digitalFormTemplateService.GetDigitalFormTemplateByIdAsync(tempId);
		//    if (details.Result == null)
		//    {
		//        return NotFound();
		//    }
		//    var detailsstring = (DigitalFormTemplate)details.Result;
		//    var autofilldata = await _digitalFormResponseService.GetDigitalFormFillDataAsync(userDTO.Suid);
		//    if (autofilldata.Result == null)
		//    {
		//        return NotFound();
		//    }
		//    var filldata = new ViewModels.DigitalForms.FillFormData()
		//    {
		//        filename = documentName,
		//        tempid = tempId,
		//        htmlschma = detailsstring.HtmlSchema,
		//        pdfblob = base64String,
		//        autofilldata = (string)autofilldata.Result,
		//        flag = flag

		//    };

		//    if (flag == "Preview")
		//    {
		//        return View("Preview", filldata);
		//    }
		//    return View("UsePdfForm", filldata);



		//}


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

				DigitalFormResponseDTO digitalFormResponseDTO = new DigitalFormResponseDTO()
				{
					File = SaveDigitalFormResponse.File,
					FormId = SaveDigitalFormResponse.FormId,
					AcToken = AccessToken,
					IdpToken = IdpToken,
					FormFieldData = SaveDigitalFormResponse.FormFieldData,
					OrganizationId = orgid
				};

				var response = await _digitalFormResponseService.NewSaveDigitalFormResponseAsync(digitalFormResponseDTO, userDTO);
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
		public async Task<IActionResult> GetPreviewConfig(string edmsId)
		{
			try
			{
				var response = await _edmService.GetDocumentAsync(edmsId);
				if (response.Result == null)
				{
					return Json(new { success = false, message = response.Message });
				}
				var bytearray = (byte[])response.Result;
				string base64String = Convert.ToBase64String(bytearray);

				return Json(new { success = true, message = response.Message, result = base64String });
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"An error occurred: {ex.Message}");
			}
		}
		public async Task<IActionResult> Responses(string tempId)
		{
			var result = await _digitalFormResponseService.GetDigitalFormResponseListByTemplateIdAsync(tempId);
			if (result.Result == null)
			{
				string msg = result != null ? result.Message : "Digital form response list not found";

				return Json(new { success = false, message = msg });
			}
			var list = result.Result as List<DigitalFormResponse>;
			List<FormResponse> model = new List<FormResponse>();
			foreach (var item in list)
			{
				var response = new FormResponse()
				{
					FormId = item.FormId,

					FormTemplateName = item.FormTemplateName,

					CorelationId = item.CorelationId,

					Status = item.Status,

					SignerName = item.SignerName,

					SignerEmail = item.SignerEmail,

					SignerSuid = item.SignerSuid,


					AcToken = item.AcToken,

					EdmsId = item.EdmsId,

					CreatedBy = item.CreatedBy,

					UpdatedBy = item.UpdatedBy,

					CreatedAt = item.CreatedAt


				};
				model.Add(response);

			}
			return View(model);
		}

		public async Task<IActionResult> FormResponses(string tempId)
		{
			var result = await _digitalFormResponseService.GetNewDigitalFormResponseListByTemplateIdAsync(tempId);
			if (result.Result == null)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = result.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index");
			}
			var list = result.Result as List<NewDigitalFormResponse>;
			List<FormResponse> model = new List<FormResponse>();
			foreach (var item in list)
			{
				var response = new FormResponse()
				{
					FormId = item.FormId,

					FormTemplateName = item.FormTemplateName,

					//CorelationId = item.SignerResponses[0].CorrelationId,

					Status = item.Status,

					//SignerName = item.SignerName,

					//SignerEmail = item.SignerEmail,

					//SignerSuid = item.SignerSuid,

					FormFieldData = JObject.Parse(item.SignerResponses[0].FormFieldData),

					//AcToken = item.AcToken,

					EdmsId = item.EdmsId,

					CreatedBy = item.CreatedBy,

					UpdatedBy = item.UpdatedBy,

					CreatedAt = item.CreatedAt,

					SignerResponses = item.SignerResponses

				};
				model.Add(response);

			}

			return View(model);
		}
		public async Task<IActionResult> downloadCSV(string templateId, string FormName)
		{
			try
			{
				var response = await _digitalFormResponseService.GenerateNewCSVResponseSheet(templateId);

				if (!response.Success)
				{
					AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = response.Message };
					TempData["Alert"] = JsonConvert.SerializeObject(alert);
					return RedirectToAction("Index");
				}
				var model = (FileContentResult)response.Result;

				//byte[] fileBytes = Convert.FromBase64String(model.fileContents);

				//return File(fileBytes, model.contentType, FormName + ".csv");
				return File(model.FileContents, model.ContentType, FormName + ".csv");

			}
			catch (Exception ex)
			{
				return StatusCode(500, $"An error occurred: {ex.Message}");
			}
		}

		public async Task<IActionResult> EditForm(string id,string flag)
		{
			try
			{


				var templatedetails = await _digitalFormTemplateService.GetDigitalFormTemplateByIdAsync(id);
				if (templatedetails.Result == null)
				{
					AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = templatedetails.Message };
					TempData["Alert"] = JsonConvert.SerializeObject(alert);
					return RedirectToAction("Index");
				}
				var digitalformsViewModel = (DigitalFormTemplate)templatedetails.Result;
				List<Rolesconfig> rolesconfiguration = new List<Rolesconfig>();

				List<Role> rolelist = new List<Role>();



				foreach (var item in digitalformsViewModel.Roles)
				{
					var model1 = new Rolesconfig()
					{
						roleId=item._id,
						email = item.Email,
						role = item.Roles,
						annotationsList = item.AnnotationsList,
						placeHolderCoordinates = item.PlaceHolderCoordinates,
						esealplaceHolderCoordinates = item.EsealPlaceHolderCoordinates
					};
					rolelist.Add(item.Roles);
					rolesconfiguration.Add(model1);
				
				}
				string jsonString = JsonConvert.SerializeObject(rolesconfiguration);

				string base64String;
				if (digitalformsViewModel.Type == "PDF")
				{
					var response = await _edmService.GetDocumentAsync(digitalformsViewModel.EdmsId);
					if (response.Result == null)
					{
						AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = response.Message };
						TempData["Alert"] = JsonConvert.SerializeObject(alert);
						return RedirectToAction("Index");
					}
					var bytearray = (byte[])response.Result;
					base64String = Convert.ToBase64String(bytearray);

				}
				else
				{
					base64String = "";
				}

				var tempresponse = await _templateService.GetSignatureTemplateList();
				if (tempresponse.Result == null)
				{
					AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = tempresponse.Message };
					TempData["Alert"] = JsonConvert.SerializeObject(alert);
					return RedirectToAction("Index");

				}
				var roleslist = await _roleService.GetDigitalFormTemplateRoleListByTemplateIdAsync(id);
				if (roleslist.Result == null)
				{
					AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = roleslist.Message };
					TempData["Alert"] = JsonConvert.SerializeObject(alert);
					return RedirectToAction("Index");
				}
				var temprole = (List<DigitalFormTemplateRole>)roleslist.Result;
				var model = new EditCreateViewModel()
				{
					documentName = digitalformsViewModel.DocumentName,
					name = digitalformsViewModel.TemplateName,
					daysToComplete = digitalformsViewModel.DaysToComplete,
					numberOfSignatures = digitalformsViewModel.NumberOfSignatures,
					allSigRequired = digitalformsViewModel.AllSigRequired,
					publishGlobally = digitalformsViewModel.PublishGlobally,
					sequentialSigning = digitalformsViewModel.SequentialSigning,
					advancedSettings = digitalformsViewModel.AdvancedSettings,
					rolesConfig = jsonString,
					roles = rolelist,
					docType = digitalformsViewModel.Type,
					htmlSchema = digitalformsViewModel.HtmlSchema,
					pdfSchema = digitalformsViewModel.PdfSchema,
					TemplateId = digitalformsViewModel._id,
					File = base64String,
					roleidlist = temprole,
					flag = flag
				};
				var SignatureTemplateList = (IList<SignatureTemplatesDTO>)tempresponse.Result;
				model.Templates = SignatureTemplateList;
				if (digitalformsViewModel.Type == "PDF")
				{
					return View("EditPdfForm", model);
				}
				return View("EditWebForm", model);
			}
            catch (Exception ex)
            {
             
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = ex.Message };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return RedirectToAction("Index");
            }
        }

		public async Task<IActionResult> UpdateForm(EditTemplateViewModel editTemplateViewModel)
		{
			try
			{

				List<RoleDetails> rolesConfig = new List<RoleDetails>();

				JArray configObject = JArray.Parse(editTemplateViewModel.rolesConfig);

				foreach (JObject obj in configObject)
				{
					// Extract placeHolderCoordinates
					JObject signCordinates = (JObject)obj["placeHolderCoordinates"];
					var signCord = new placeHolderCoordinates()
					{


						signatureXaxis = !string.IsNullOrEmpty(Convert.ToString(signCordinates["signatureXaxis"]))
					 ? Convert.ToString(signCordinates["signatureXaxis"])
					 : null,
						signatureYaxis = !string.IsNullOrEmpty(Convert.ToString(signCordinates["signatureYaxis"]))
					 ? Convert.ToString(signCordinates["signatureYaxis"])
					 : null,
						pageNumber = !string.IsNullOrEmpty(Convert.ToString(signCordinates["pageNumber"]))
				 ? Convert.ToString(signCordinates["pageNumber"])
				 : null,
						imgWidth = (string)signCordinates["signaturewidth"],
						imgHeight = (string)signCordinates["signatureheight"]
					};

					// Extract esealplaceHolderCoordinates
					JObject esealCordinates = (JObject)obj["esealplaceHolderCoordinates"];
					var esealCord = new esealplaceHolderCoordinates()
					{
						signatureXaxis = !string.IsNullOrEmpty(Convert.ToString(esealCordinates["signatureXaxis"]))
					 ? Convert.ToString(esealCordinates["signatureXaxis"])
					 : null,


						signatureYaxis = !string.IsNullOrEmpty(Convert.ToString(esealCordinates["signatureYaxis"]))
					 ? Convert.ToString(esealCordinates["signatureYaxis"])
					 : null,

						pageNumber = !string.IsNullOrEmpty(Convert.ToString(esealCordinates["pageNumber"]))
								? Convert.ToString(esealCordinates["pageNumber"])
								: null,
                        imgWidth = (string)esealCordinates["signaturewidth"],
                        imgHeight = (string)esealCordinates["signatureheight"]
                    };

					// Extract Role details
					Role role1 = new Role
					{
						name = (string)obj["role"]["name"],
						email = (string)obj["email"],
						description = (string)obj["description"]
					};

					// Create RoleDetails and add to rolesConfig
					var rolesCon = new RoleDetails
					{
						role = role1,
						annotationsList = (string)obj["annotationsList"],
						esealPlaceHolderCoordinates = esealCord,
						placeHolderCoordinates = signCord,
					};
					rolesConfig.Add(rolesCon);
				}

				var dataConfig = JsonConvert.SerializeObject(rolesConfig);

				var docConfig = new DigitalFormTemplateModel
				{
					documentName = editTemplateViewModel.documentName,
					name = editTemplateViewModel.name,
					daysToComplete = editTemplateViewModel.daysToComplete,
					numberOfSignatures = editTemplateViewModel.numberOfSignatures,
					allSigRequired = editTemplateViewModel.allSigRequired,
					publishGlobally = editTemplateViewModel.publishGlobally,
					sequentialSigning = editTemplateViewModel.sequentialSigning,
					advancedSettings = editTemplateViewModel.advancedSettings,
					docType = editTemplateViewModel.docType,
					htmlSchema = editTemplateViewModel.htmlSchema,
					pdfSchema = editTemplateViewModel.pdfSchema
				};

				JArray rolesArray = JArray.Parse(editTemplateViewModel.roles);

				JObject rolesObject = rolesArray.FirstOrDefault() as JObject;

				List<Role> roles = new List<Role>();

				Role role = new Role
				{
					name = (string)rolesObject["name"],
					email = (string)rolesObject["email"],
					description = (string)rolesObject["description"]
				};

				roles.Add(role);


				var model = new TemplateModelDTO
				{
					docConfig = docConfig,
					roles = roles,
					rolesConfig = dataConfig
				};

				var dataJson = JsonConvert.SerializeObject(model);

				UpdateDigitalFormTemplateDTO UpdateDocumentTemplateDTO = new UpdateDigitalFormTemplateDTO()
				{
					File = editTemplateViewModel.File,
					Model = dataJson,
					TemplateId = editTemplateViewModel.TemplateId
				};
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

				var response = await _digitalFormTemplateService.UpdateDigitalFormTemplateAsync(UpdateDocumentTemplateDTO, userDTO);
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

		public async Task<IActionResult> SendForm(string tempId, string edmsId, string documentName, string flag, string type)
		{


			var details = await _digitalFormTemplateService.GetDigitalFormTemplateByIdAsync(tempId);
			if (details.Result == null)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = details.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index");

			}
			var detailsstring = (DigitalFormTemplate)details.Result;

			List<Rolesconfig> rolesconfiguration = new List<Rolesconfig>();

	



			foreach (var item in detailsstring.Roles)
			{
				var model1 = new Rolesconfig()
				{
					roleId = item._id,
					email = item.Email,
					role = item.Roles,
					annotationsList = item.AnnotationsList,
					placeHolderCoordinates = item.PlaceHolderCoordinates,
					esealplaceHolderCoordinates = item.EsealPlaceHolderCoordinates
				};
			
				rolesconfiguration.Add(model1);

			}
			string jsonString = JsonConvert.SerializeObject(rolesconfiguration);






			if (detailsstring.Type == "PDF")
			{
				var response = await _edmService.GetDocumentAsync(edmsId);
				if (response.Result == null)
				{
					AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = response.Message };
					TempData["Alert"] = JsonConvert.SerializeObject(alert);
					return RedirectToAction("Index");
				}
				var bytearray = (byte[])response.Result;
				string base64String = Convert.ToBase64String(bytearray);

				var filldata = new ViewModels.DigitalForms.FillFormData()
				{
					filename = documentName,
					tempid = tempId,
					htmlschma = detailsstring.HtmlSchema,
					pdfblob = base64String,
					autofilldata = "",
					flag = flag,
					Roles = detailsstring.Roles,
					Model = jsonString,
				};


				return View("SendPdfBulk", filldata);

			}

			else
			{



				var filldata = new ViewModels.DigitalForms.FillFormData()
				{
					filename = documentName,
					tempid = tempId,
					htmlschma = detailsstring.HtmlSchema,
					autofilldata = "",
					flag = flag,
					Roles = detailsstring.Roles,
					Model = jsonString,

				};

				return View("SendWebBulk", filldata);
			}

		}

		public async Task<IActionResult> SendRequest(SendRequestDTO senRequestDto)
		{

			try
			{
				var roleSigningOrder = JsonConvert.DeserializeObject<Dictionary<string, int>>(senRequestDto.roleSigningOrder);

				var roleMappingsList = JsonConvert.DeserializeObject<List<Dictionary<string, Dictionary<string, string>>>>(senRequestDto.roleMappings);

				var roleAnnotations = JsonConvert.DeserializeObject<Dictionary<string, AnnotationTypes>>(senRequestDto.RoleAnnotations);

				var ann = new Dictionary<string, RoleAnnotationValue>();
				var roleMapping = new Dictionary<string, (User, string)>();

				var roles = new List<Dictionary<string, TemplateSignerDetails>>();



				foreach (var item in roleMappingsList)
				{

					var roleEntry = new Dictionary<string, TemplateSignerDetails>();


					foreach (var entry in item)
					{
						string id = entry.Key;
						var userdata = entry.Value;


						var user = new User
						{
							email = userdata["email"],
							suid = userdata["suid"]
						};

						if (userdata["accountType"] == "self")
						{
							roleEntry[id] = new TemplateSignerDetails
							{
								Signer = user,
								SignerName = "",
								OrganizationId = "",
								OrganizationName = "",
								RoleName = userdata["RoleName"]
							};
						}
						else
						{
							roleEntry[id] = new TemplateSignerDetails
							{
								Signer = user,
								SignerName = "",
								OrganizationId = userdata["orgUid"],
								OrganizationName = userdata["orgName"],
								RoleName = userdata["RoleName"],
								


							};

                            if (userdata["HasDelegation"] == "true")
                            {
                                List<User> alternateSignatories = JsonConvert.DeserializeObject<List<User>>(userdata["AlternateSignatories"]);
                                roleEntry[id].HasDelegation = true;
                                roleEntry[id].DelegationId = userdata["DelegationId"];
                                roleEntry[id].AlternateSignatories = alternateSignatories;

                            }

                        }

					}


					roles.Add(roleEntry);
				}




				foreach (var entry in roleAnnotations)
				{
					var roleId = entry.Key;
					var annotationType = entry.Value;

					ann[roleId] = new RoleAnnotationValue() { AnnotationType = annotationType, AnnotationList = "" };

				}


				var filldata = new TemplateSendingDTO()
				{
					DocumentName = senRequestDto.documentName,
					RequestType = senRequestDto.RequestType,
					HtmlSchema = senRequestDto.htmlSchema,
					PdfSchema = senRequestDto.pdfSchema,
					PreFilledData = senRequestDto.preFilledData,
					DisableOrder = senRequestDto.sequentialSigning,
					RoleSigningOrder = roleSigningOrder,
					RoleAnnotations = ann,
					RolesMapping = roles,
					FormId = senRequestDto.formId,
					AccessToken = AccessToken,
					TemplateType = senRequestDto.TemplateType
				};

				var sendRequest = await _templateDocumentService.SaveTemplateDocumentListAsync(filldata, UserDetails());

				return Json(new { Status = "Success", Title = "Status", Message = sendRequest.Message });


			}
			catch (Exception ex)
			{
				return StatusCode(500, $"An error occurred: {ex.Message}");
			}
		}


		public async Task<IActionResult> SavePublished(SendRequestDTO senRequestDto)
		{

			try
			{
				var roleSigningOrder = JsonConvert.DeserializeObject<Dictionary<string, int>>(senRequestDto.roleSigningOrder);

				var roleMappingsList = JsonConvert.DeserializeObject<List<Dictionary<string, Dictionary<string, string>>>>(senRequestDto.roleMappings);

				var roleAnnotations = JsonConvert.DeserializeObject<Dictionary<string, AnnotationTypes>>(senRequestDto.RoleAnnotations);

				var ann = new Dictionary<string, RoleAnnotationValue>();
				var roleMapping = new Dictionary<string, (User, string)>();

				var roles = new List<Dictionary<string, TemplateSignerDetails>>();

			



                foreach (var item in roleMappingsList)
				{

					var roleEntry = new Dictionary<string, TemplateSignerDetails>();


					foreach (var entry in item)
					{
						string id = entry.Key;
						var userdata = entry.Value;


						var user = new User
						{
							email = userdata["email"],
							suid = userdata["suid"]
						};

						if (userdata["accountType"] == "self")
						{
							roleEntry[id] = new TemplateSignerDetails
							{
								Signer = user,
								SignerName = "",
								OrganizationId = "",
								OrganizationName = "",
								RoleName = userdata["RoleName"]
							};
						}
						else
						{
							roleEntry[id] = new TemplateSignerDetails
							{
								Signer = user,
								SignerName = "",
								OrganizationId = userdata["orgUid"],
								OrganizationName = userdata["orgName"],
								RoleName = userdata["RoleName"]
							};
							if (userdata["delegationid"] != "" && userdata["delegationid"] != null)
							{
                                List<User> alternateSignatories = new List<User>();

                                var result = await _delegationService.GetDelegateDetailsByIdAsync(userdata["delegationid"]);
								if (!result.Success)
								{
									return Json(result);
								}
								var delegation=(Delegation)result.Result;
								foreach(var item1 in delegation.Delegatees)
								{
									  var user1 = new User {
											email=item1.DelegateeEmail,
											suid =item1.DelegateeSuid,
										};
                                    alternateSignatories.Add(user1);
                                }
								roleEntry[id].DelegationId = userdata["delegationid"];

								roleEntry[id].HasDelegation = true;

                                roleEntry[id].AlternateSignatories = alternateSignatories;


                            }

                        }

					}


					roles.Add(roleEntry);
				}




				foreach (var entry in roleAnnotations)
				{
					var roleId = entry.Key;
					var annotationType = entry.Value;

					ann[roleId] = new RoleAnnotationValue() { AnnotationType = annotationType, AnnotationList = "" };
				}


				var filldata = new TemplateSendingDTO()
				{
					DocumentName = senRequestDto.documentName,
					RequestType = senRequestDto.RequestType,
					HtmlSchema = senRequestDto.htmlSchema,
					PdfSchema = senRequestDto.pdfSchema,
					PreFilledData = senRequestDto.preFilledData,
					DisableOrder = senRequestDto.sequentialSigning,
					RoleSigningOrder = roleSigningOrder,
					RoleAnnotations = ann,
					RolesMapping = roles,
					FormId = senRequestDto.formId,
					AccessToken = AccessToken
				};

				var sendRequest = await _templateDocumentService.SaveTemplateDocumentListAsync(filldata, UserDetails());

				return Json(new { Status = "Success", Title = "Status", Message = sendRequest.Result });


			}
			catch (Exception ex)
			{
				return StatusCode(500, $"An error occurred: {ex.Message}");
			}
		}


		[HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> OrgDetailsByEmail(string email)
		{
			var result = await _userService.GetSubscriberOrgnizationListByEmailAsync(email);

			if (!result.Success)
			{
				return Json(result);
			}

			var json = result.Result?.ToString();

			if (string.IsNullOrWhiteSpace(json))
			{
				return Json(null);
			}

			var signs = JsonConvert.DeserializeObject<SignatoriesDTO>(json);

			return Json(signs);
		}

		public async Task<IActionResult> NewChangeStatus(string templateId, string action, string roles)
		{
			var roleData = JsonConvert.DeserializeObject<Dictionary<string, RoleUserDetails>>(roles);

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

				var dto = new PublishUnpublishTemplateDTO()
				{
					TemplateId = templateId,
					Action = action,
					RoleData = roleData
				};
				var response = await _digitalFormTemplateService.NewPublishUnpublishTemplateStatusAsync(dto, userDTO);

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
				return Json(new { Error = ex.Message });
			}

		}

		public async Task<IActionResult> PublishedDocumentStatus(string docuid)
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
			return View("PublishedDocumentStatus", statusdata);
		}
	}
}

using Azure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using SigningPortal.Web.Models;
using SigningPortal.Web.ViewModels.Templates;
using static Google.Apis.Requests.BatchRequest;

namespace SigningPortal.Web.Controllers
{
    [Authorize]
    public class TemplateController : BaseController
    {
        private readonly ITemplateService _templateService;
        private readonly IBulkSignService _bulkSignService;
        private readonly IEDMSService _edMSService;
        private readonly IConfiguration _configuration;

        public TemplateController(ITemplateService templateService, IBulkSignService bulkSignService, IEDMSService eDMSService, IConfiguration configuration)
        {
            _templateService = templateService;
            _bulkSignService = bulkSignService;
            _edMSService = eDMSService;
            _configuration = configuration;
        }
        public async Task<IActionResult> Index()
        {
            try
            {
               
                var response = await _templateService.GetTemplateListAsync(UserDetails());

                if (!response.Success)
                {
                    //return Json(new { success = false, response.Message });
                    AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = response.Message };
                    TempData["Alert"] = JsonConvert.SerializeObject(alert);
                    return RedirectToAction("Index", "Dashboard");
                }
                else
                {
                    IList<Template> result = (List<Template>)response.Result;
                    TemplateListViewModel model = new TemplateListViewModel()
                    {
                        TemplateList = result
                    };

                    return View(model);
                }
            }
            catch (Exception ex)
            {
                // return View();
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = ex.Message };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return RedirectToAction("Index", "Dashboard");
            }
        }
        public async Task<IActionResult> Templateslist()
        {
            try
            {

                var response = await _templateService.GetTemplateListAsync(UserDetails());

                if (!response.Success)
                {
                    //return Json(new { success = false, response.Message });
                    AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = response.Message };
                    TempData["Alert"] = JsonConvert.SerializeObject(alert);
                    return RedirectToAction("Index", "Dashboard");
                }
                else
                {
                    IList<Template> result = (List<Template>)response.Result;
                    TemplateListViewModel model = new TemplateListViewModel()
                    {
                        TemplateList = result
                    };

                    return Json(new { success = true, message = response.Message, result=model });
                }
            }
            catch (Exception ex)
            {
                // return View();
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = ex.Message };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return RedirectToAction("Index", "Dashboard");
            }
        }

        public IActionResult AgentUrl()
        {
            try
            {
                
                var agenturl = _configuration.GetValue<string>("Config:Signing_portal:AGENT_URL");
                if (string.IsNullOrEmpty(agenturl))
                {
                    return Json(new { success = false, message = "Agent Url not found" });
                }


                var url = (string)agenturl;

                return Json(new { success = true, message = agenturl });
			}
            catch (Exception ex)
            {
               // return View();
                return Json(new { success = false, message = ex.Message });
            }
        }

        //public async Task<IActionResult> CreateTemplate()
        //{
        //    try
        //    {
        //        var response = await _bulkSignService.GetBulkSignerListAsync(UserDetails().OrganizationId); //BulkSign Signatories
        //        var bulkSignerList = (BulkSignerListDTO)response.Result;

        //        if (!response.Success)
        //        {
        //            //return Json(new { success = false, response.Message });
        //            AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = (response == null ? "Internal error please contact to admin" : response.Message) };
        //            TempData["Alert"] = JsonConvert.SerializeObject(alert);
        //            //return Json(new { success = false, response.Message });
        //            return RedirectToAction("Index");
        //        }

        //        var response1 = await _templateService.GetSignatureTemplateList();  //Signature Template List in modal
        //        var signatureTemplates = (IList<SignatureTemplatesDTO>)response1.Result;
        //        foreach (var item in bulkSignerList.bulkSignerEsealList)
        //        {
        //            if (!bulkSignerList.bulkSignerList.Contains(item))
        //            {
        //                bulkSignerList.bulkSignerList.Add(item);
        //            }
        //        }
        //        BulkSignerListViewModel bulkSignList = new BulkSignerListViewModel
        //        {
        //            bulkSignerList = bulkSignerList.bulkSignerList,
        //            bulkSignerEsealList = bulkSignerList.bulkSignerEsealList,


        //        };


        //        if (!response1.Success)
        //        {
        //            //return Json(new { success = false, response.Message });
        //            AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = (response == null ? "Internal error please contact to admin" : response.Message) };
        //            TempData["Alert"] = JsonConvert.SerializeObject(alert);
        //            //return Json(new { success = false, response.Message });
        //            return RedirectToAction("Index");
        //        }
        //        else
        //        {
        //            CreateTemplateViewModel model = new CreateTemplateViewModel()
        //            {
        //                Templates = signatureTemplates,
        //                bulkSignerEmails = bulkSignerList,
        //                BulkSignerEmails = bulkSignList
        //            };



        //            return View(model);
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = ex.Message };
        //        TempData["Alert"] = JsonConvert.SerializeObject(alert);
        //        return RedirectToAction("Index");
        //    }
        //}

        public async Task<IActionResult> CreateTemplate()
		{
			try
			{
				// Initialize view model
				CreateTemplateViewModel model = new CreateTemplateViewModel();

				// Fetch Bulk Signer List
				var bulkSignerResponse = await _bulkSignService.GetBulkSignerListAsync(UserDetails().OrganizationId);
				if (bulkSignerResponse.Success && bulkSignerResponse.Result != null)
				{
					var bulkSignerList = (BulkSignerListDTO)bulkSignerResponse.Result;
					foreach (var item in bulkSignerList.bulkSignerEsealList)
					{
						if (!bulkSignerList.bulkSignerList.Contains(item))
						{
							bulkSignerList.bulkSignerList.Add(item);
						}
					}

					BulkSignerListViewModel bulkSignList = new BulkSignerListViewModel
					{
						bulkSignerList = bulkSignerList.bulkSignerList,
						bulkSignerEsealList = bulkSignerList.bulkSignerEsealList
					};

					model.bulkSignerEmails = bulkSignerList;
					model.BulkSignerEmails = bulkSignList;
				}
				else
				{
					AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = (bulkSignerResponse == null ? "Internal error please contact to admin" : bulkSignerResponse.Message) };
					TempData["Alert"] = JsonConvert.SerializeObject(alert);
					
					return RedirectToAction("Index");
				}

				// Fetch Signature Template List
				var templateResponse = await _templateService.GetSignatureTemplateList();
				if (templateResponse.Success && templateResponse.Result != null)
				{
					model.Templates = (IList<SignatureTemplatesDTO>)templateResponse.Result;
				}
				else
				{
					AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = (templateResponse == null ? "Internal error please contact to admin" : templateResponse.Message) };
					TempData["Alert"] = JsonConvert.SerializeObject(alert);
					
					return RedirectToAction("Index");
				}

				var user = HttpContext.User.Claims.FirstOrDefault(c => c.Type == "user")?.Value;

				if (string.IsNullOrWhiteSpace(user))
				{
					return Unauthorized(new
					{
						success = false,
						message = "User claim missing or invalid."
					});
				}

				if (!string.IsNullOrEmpty(user))
				{
					
					var userDTO = JsonConvert.DeserializeObject<UserDTO>(user);

					if (userDTO == null)
					{
						return BadRequest(new
						{
							success = false,
							message = "Invalid user data."
						});
					}
					var signatureResponse = await _templateService.GetSignaturePreviewAsync(userDTO);

					if (signatureResponse.Success && signatureResponse.Result != null)
					{
						var preview = (string)signatureResponse.Result;
						var previewDTO = JsonConvert.DeserializeObject<PreviewImageDTO>(preview);

						if (previewDTO != null)
						{
							ViewBag.SignatureImage = previewDTO.signatureImage;
							ViewBag.EsealImage = previewDTO.esealImage;
						}
						else
						{
							TempData["Alert"] = JsonConvert.SerializeObject(new AlertViewModel
							{
								IsSuccess = false,
								Message = "Error parsing signature preview data"
							});
						}
					}
					else
					{
						AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = (signatureResponse == null ? "Internal error please contact to admin" : signatureResponse.Message) };
						TempData["Alert"] = JsonConvert.SerializeObject(alert);
						
						return RedirectToAction("Index");
					}
				}

				// Return the view with populated model
				return View("CreateTemplateNew",model);
			}
			catch (Exception ex)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = ex.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index");
			}
		}


		[HttpPost]
		[ValidateAntiForgeryToken]
		public async Task<IActionResult> SaveTemplate(CreateTemplateViewModel viewModel)
        {
            try
            {
				if (string.IsNullOrWhiteSpace(viewModel.Config))
				{
					return Json(new { Status = "Failed", Message = "Invalid configuration data." });
				}
				JObject configObject = JObject.Parse(viewModel.Config);
				var signatureToken = configObject["Signature"];
				var esealToken = configObject["Eseal"];
				var qrToken = configObject["Qrcode"];

				if (signatureToken == null || string.IsNullOrWhiteSpace(viewModel.Signatory))
				{
					return Json(new { Status = "Failed", Message = "Invalid signature configuration." });
				}
				if (esealToken == null || string.IsNullOrWhiteSpace(viewModel.Signatory))
				{
					return Json(new { Status = "Failed", Message = "Invalid eseal signature configuration." });
				}
				if (qrToken == null || string.IsNullOrWhiteSpace(viewModel.Signatory))
				{
					return Json(new { Status = "Failed", Message = "Invalid qrcode signature configuration." });
				}
				CoordinatesData signCords = ExtractCoordinates(signatureToken, viewModel.Signatory);
				CoordinatesData esealCords = ExtractCoordinates(esealToken, viewModel.Signatory);
				CoordinatesData qrCords = ExtractCoordinates(qrToken, viewModel.Signatory);


                var pathobj = new PathsdataDTO
                {
                    inputpath = "",
                    outputpath = ""
                };

                var pathobject = JsonConvert.SerializeObject(pathobj);
                var emailList = viewModel.Signatory?.Split(',').Select(email => email.Trim()).ToList() ?? new List<string>();
                var role = new Roles
                {
                    Order = 0,
                    Role = "Signer",
                    Eseal = viewModel.esealRequired
                };
                var roleList = new List<Roles>();

                roleList.Add(role);
			
				var data = new SaveTemplateViewModel()
                {
                    templateName = viewModel.TemplateName,
                    documentName = viewModel.DocumentName,
                    roleList = roleList,
                    rotation = viewModel.Rotation,
                    emailList = emailList,
                    settingConfig = pathobject,
                    signatureTemplate = viewModel.SignatureTemplate,
                    esealSignatureTemplate = viewModel.EsealSignatureTemplate,
					signCords = signCords == null || string.IsNullOrWhiteSpace(viewModel?.Signatory)
	                    ? null
	                    : new Dictionary<string, CoordinatesData>
	                      {
		                      { viewModel.Signatory, signCords }
	                      },
				   qrCords = qrCords == null || string.IsNullOrWhiteSpace(viewModel?.Signatory)
							? null
	                        : new Dictionary<string, CoordinatesData>
	                          {
		                          { viewModel.Signatory, qrCords }
	                          },

				   esealCords = esealCords == null || string.IsNullOrWhiteSpace(viewModel?.Signatory)
							? null
	                        : new Dictionary<string, CoordinatesData>
	                          {
		                          { viewModel.Signatory, esealCords }
	                          },
					qrCodeRequired = configObject["QrCodeRequired"]?.Value<bool>() ?? false,
				htmlSchema =viewModel.htmlSchema,
                };
                data.templateName = viewModel.TemplateName;

                var dataJson = JsonConvert.SerializeObject(data);

                Template temp = new Template
                {
                    RoleList = roleList,
                };

                SaveNewTemplateDTO saveNewTemplateDTO = new SaveNewTemplateDTO()
                {
                    File = viewModel.File,
                    Model = dataJson,
                };

                var response = await _templateService.SaveNewTemplateAsync(saveNewTemplateDTO, UserDetails());

                if (!response.Success)
                {
                    return Json(new { Status = "Failed", Title = "Save New Template", Message = response.Message });
                }
                else
                {
                    return Json(new { Status = "Success", Title = "Save New Template", Message = response.Message });
                }


            }
            catch (Exception ex)
            {
                //return StatusCode(500, $"An error occurred: {ex.Message}");
                return Json(new { Status = "Failed", Title = "Save New Template", Message = ex.Message });
            }
        }

        private CoordinatesData ExtractCoordinates(JToken token, string email)
        {
            CoordinatesData coordinates = null;

            if (token != null && token.Type == JTokenType.Object)
            {
                JObject tokenObject = (JObject)token;

                if (tokenObject[email] != null)
                {
                    coordinates = tokenObject[email].ToObject<CoordinatesData>();
                }
            }

            return coordinates;
        }

		public async Task<IActionResult> GetTemplateDetails(string templateId)
		{
			var templateDetails = await _templateService.GetTemplateDetailsAsync(templateId);

			var details = (Template)templateDetails.Result;

			if (details == null)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = templateDetails.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index");
				//  return NotFound();
			}

			var templateList = await _templateService.GetSignatureTemplateList();
			var SignatureTemplateList = (IList<SignatureTemplatesDTO>)templateList.Result;
			if (SignatureTemplateList == null)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = "Something went wrong" };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index");
				//return NotFound();
			}

			var bulkSignerListDetails = await _bulkSignService.GetBulkSignerListAsync(UserDetails().OrganizationId);
			var org = (BulkSignerListDTO)bulkSignerListDetails.Result;
			if (org == null)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = bulkSignerListDetails.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index");
				// return NotFound();
			}

			foreach (var item in org.bulkSignerEsealList)
			{
				if (!org.bulkSignerList.Contains(item))
				{
					org.bulkSignerList.Add(item);
				}
			}

			BulkSignerListViewModel bulkSignerList = new BulkSignerListViewModel
			{
				bulkSignerList = org.bulkSignerList,
			};

			var viewModel = new EditTemplateViewModel
			{
				_id = details._id,
				DocumentName = details.DocumentName,
				TemplateName = details.TemplateName,
				Templates = SignatureTemplateList,
				bulkSignerEmails = org,
				annotations = details.Annotations,
				esealAnnotations = details.EsealAnnotations,
				qrCodeAnnotations = details.QrCodeAnnotations,
				QrCodeRequired = (bool)details.QrCodeRequired,
				settingConfig = details.SettingConfig,
				emailList = details.EmailList, /*JsonConvert.DeserializeObject<IList<string>>(details.EmailList),*/
				SignatureTemplate = (int)details.SignatureTemplate,
				EsealSignatureTemplate = (int)details.EsealSignatureTemplate,
				status = details.Status,
				//rotation = details.,
				edmsId = details.EdmsId,
				createdBy = details.CreatedBy,
				updatedBy = details.UpdatedBy,
                htmlSchema=details.HtmlSchema,  
			};

			if (details.RoleList != null)
			{
				//List<Roles> roleList = JsonConvert.DeserializeObject<IList<Roles>>(details.RoleList);
				List<Roles> roleList = ((List<Roles>)details.RoleList);

				// Accessing values
				Roles firstRole = roleList[0];

				// Access the Eseal property and assign it to viewModel.esealRequired
				viewModel.esealRequired = firstRole.Eseal;

			}
			var user = HttpContext.User.Claims
		.FirstOrDefault(c => c.Type == "user")?.Value;

			if (string.IsNullOrWhiteSpace(user))
			{
				return Unauthorized(new
				{
					success = false,
					message = "User claim missing or invalid."
				});
			}
			if (!string.IsNullOrEmpty(user))
            {
				var userDTO = JsonConvert.DeserializeObject<UserDTO>(user);

				if (userDTO == null)
				{
					return BadRequest(new
					{
						success = false,
						message = "Invalid user data."
					});
				}

				var signatureResponse = await _templateService.GetSignaturePreviewAsync(userDTO);

                if (signatureResponse.Success && signatureResponse.Result != null)
                {
                    var preview = (string)signatureResponse.Result;
                    var previewDTO = JsonConvert.DeserializeObject<PreviewImageDTO>(preview);

                    if (previewDTO != null)
                    {
                        ViewBag.SignatureImage = previewDTO.signatureImage;
                        ViewBag.EsealImage = previewDTO.esealImage;
                    }
                    else
                    {
                        TempData["Alert"] = JsonConvert.SerializeObject(new AlertViewModel
                        {
                            IsSuccess = false,
                            Message = "Error parsing signature preview data"
                        });
                    }
                }
                else
                {
                    AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = (signatureResponse == null ? "Internal error please contact to admin" : signatureResponse.Message) };
                    TempData["Alert"] = JsonConvert.SerializeObject(alert);

                    return RedirectToAction("Index");
                }
            }



            return View("EditTemplate", viewModel);

		}

		[HttpPost]
        public async Task<IActionResult> VerifyOrganizationUserBySignatureTemplate([FromBody] VerifyEmailViewModel viewModel)
        {

            VerifyOrganizationUserDTO verifyOrgUser = new VerifyOrganizationUserDTO()
            {
                Email = viewModel.Email,
                //Email = "nethasridatthatumati@gmail.com",
                TemplateId = viewModel.TemplateId,
            };

            var response = await _templateService.VerifyOrganizationUserBySignatureTemplateAsync(verifyOrgUser, UserDetails());

            if (!response.Success)
            {
                return Json(new { success = false, response.Message,response.Result });
            }
            else
            {

                return Json(new { success = true, response.Message,response.Result });
            }
        }

        [HttpPost]
		[ValidateAntiForgeryToken]
		public async Task<IActionResult> UpdateTemplate(EditTemplateViewModel viewModel)
        {
            try
            {
				/*var apiToken = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "apiToken").Value);*/

				if (string.IsNullOrWhiteSpace(viewModel.Config))
				{
					return Json(new { Status = "Failed", Message = "Invalid configuration data." });
				}
				JObject configObject = JObject.Parse(viewModel.Config);
				var signatureToken = configObject["Signature"];
				var esealToken = configObject["Eseal"];
				var qrToken = configObject["Qrcode"];

				if (signatureToken == null || string.IsNullOrWhiteSpace(viewModel.Signatory))
				{
					return Json(new { Status = "Failed", Message = "Invalid signature configuration." });
				}
				if (esealToken == null || string.IsNullOrWhiteSpace(viewModel.Signatory))
				{
					return Json(new { Status = "Failed", Message = "Invalid eseal signature configuration." });
				}
				if (qrToken == null || string.IsNullOrWhiteSpace(viewModel.Signatory))
				{
					return Json(new { Status = "Failed", Message = "Invalid qrcode signature configuration." });
				}
				CoordinatesData signCords = ExtractCoordinates(signatureToken, viewModel.Signatory);
				CoordinatesData qrCords = ExtractCoordinates(esealToken, viewModel.Signatory);
				CoordinatesData esealCords = ExtractCoordinates(qrToken, viewModel.Signatory);

				
                var emailList = viewModel.Signatory?.Split(',').Select(email => email.Trim()).ToList() ?? new List<string>();

                var role = new Roles
                {
                    Order = 0,
                    Role = "Signer",
                    Eseal = viewModel.esealRequired
                };
                var roleList = new List<Roles>();

                roleList.Add(role);

                var pathobj = new PathsdataDTO
                {
                    inputpath = "",
                    outputpath = ""
                };

                var pathobject = JsonConvert.SerializeObject(pathobj);


                var data = new SaveTemplateViewModel()
                {
                    TemplateId = viewModel._id,
                    templateName = viewModel.TemplateName,
                    documentName = viewModel.DocumentName,
                    roleList = roleList,
                    rotation = viewModel.Rotation,
                    emailList = emailList,
                    settingConfig = pathobject,
                    signatureTemplate = viewModel.SignatureTemplate,
                    esealSignatureTemplate = viewModel.EsealSignatureTemplate,
					signCords = signCords == null || string.IsNullOrWhiteSpace(viewModel.Signatory)
	                        ? null
	                        : new Dictionary<string, CoordinatesData>
	                          {
		                          { viewModel.Signatory, signCords }
	                          },
					esealCords = esealCords == null || string.IsNullOrWhiteSpace(viewModel.Signatory)
	                        ? null
	                        : new Dictionary<string, CoordinatesData>
	                          {
		                          { viewModel.Signatory, esealCords }
	                          },
					 qrCords = qrCords == null || string.IsNullOrWhiteSpace(viewModel.Signatory)
	                        ? null
	                        : new Dictionary<string, CoordinatesData>
	                          {
		                          { viewModel.Signatory, qrCords }
	                          },
				  qrCodeRequired = configObject["QrCodeRequired"]?.Value<bool>() ?? false,
                    htmlSchema = viewModel.htmlSchema,
                };

                var dataJson = JsonConvert.SerializeObject(data);

                Template temp = new Template
                {
                    RoleList = roleList,
                };

                UpdateTemplateDTO updateTemplateDTO = new UpdateTemplateDTO()
                {
                    Model = dataJson,
                };

                var response = await _templateService.UpdateTemplateAsync(updateTemplateDTO, UserDetails());
                if (!response.Success)
                {
                    return Json(new { Status = "Failed", Title = "Save New Template", Message = response.Message });
                }
                else
                {
                    return Json(new { Status = "Success", Title = "Save New Template", Message = response.Message });
                }
            }
            catch (Exception ex)
            {
               // return StatusCode(500, $"An error occurred: {ex.Message}");
                return Json(new { Status = "Failed", Title = "Save New Template", Message = ex.Message });
            }
        }

        public async Task<IActionResult> Preview(string templateId)
        {
            try
            {
                var previewTemplate = await _templateService.GetTemplateDetailsAsync(templateId);
                var preview = (Template)previewTemplate.Result;
				if (preview == null)
				{
					AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = previewTemplate.Message };
					TempData["Alert"] = JsonConvert.SerializeObject(alert);
					return RedirectToAction("Index");
					//return NotFound();
				}
                var viewModel = new PreviewTemplateViewModel
                {
                    templateName = preview.TemplateName,
                    documentName = preview.DocumentName,
                    annotations = preview.Annotations,
                    esealAnnotations = preview.EsealAnnotations,
                    qrCodeAnnotations = preview.QrCodeAnnotations,
                    qrCodeRequired = preview.QrCodeRequired,
                    settingConfig = preview.SettingConfig,
                    emailList = preview.EmailList,
                    signatureTemplate = preview.SignatureTemplate,
                    esealSignatureTemplate = preview.EsealSignatureTemplate,
                    status = preview.Status,
                    rotation = preview.Rotation,
                    edmsId = preview.EdmsId,
                    createdBy = preview.CreatedBy,
                    updatedBy = preview.UpdatedBy,
                    _id = preview._id,
                    htmlSchema=preview.HtmlSchema,
                };
                return View(viewModel);
            }
            catch (Exception ex)
            {
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = ex.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index");
            }
        }

        public async Task<IActionResult> GetPreviewConfig(string id)
        {
            var response = await _edMSService.GetDocumentAsync(id);
            if (!response.Success)
            {
                //return NotFound();
                return Json(new { success = false, message = response.Message });
            }
            else
            {                
                return Ok(response);
            }

        }

    }
}

using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using SigningPortal.Core;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using SigningPortal.Web.Attributes;

namespace SigningPortal.Web.Controllers.APIControllers
{
	[Route("api")]
	[ApiController]
	[ServiceFilter(typeof(AuthorizeAttribute))]
	public class DigitalFormsApiController : ApiBaseController
	{
		private readonly IDigitalFormTemplateService _digitalFormTemplateService;
		private readonly IEDMSService _edmService;
		private readonly IDigitalFormResponseService _digitalFormResponseService;
		private readonly ITemplateDocumentService _templateDocumentService;
		private readonly IDigitalFormHelper _helper;
		public DigitalFormsApiController(
			IDigitalFormTemplateService digitalFormTemplateService,
			IEDMSService edmService,
			IDigitalFormResponseService digitalFormResponseService,
			IDigitalFormHelper helper,
			ITemplateDocumentService templateDocumentService
			)
		{
			_digitalFormTemplateService = digitalFormTemplateService;
			_edmService = edmService;
			_digitalFormResponseService = digitalFormResponseService;
			_helper = helper;
			_templateDocumentService = templateDocumentService;
		}

		[HttpPost("forms/useForm")]
		public async Task<IActionResult> UseForm(UseFormDTO formDTO)
		{
			DigitalFormResponse userResponse;

			//var templateResult = await _digitalFormTemplateService.GetDigitalFormTemplateByIdAsync(formDTO.id);



			//var responsesResult = await _digitalFormResponseService.GetDigitalFormResponseByTemplateIdAndSuidAsync(formDTO.id, formDTO.suid);

			var templateTask = _digitalFormTemplateService.GetDigitalFormTemplateByIdAsync(formDTO.id);
			var responsesTask = _digitalFormResponseService.GetDigitalFormResponseByTemplateIdAndSuidAsync(formDTO.id, formDTO.suid);

			await Task.WhenAll(templateTask, responsesTask);
			var templateResult = await templateTask;
			var responsesResult = await responsesTask;

			if (responsesResult.Success)
			{

				userResponse = (DigitalFormResponse)responsesResult.Result;
				var response = await _edmService.GetDocumentAsync(userResponse.EdmsId);

				if (response.Result == null)
				{
					return NotFound();
				}
				var bytearray = (byte[])response.Result;
				string base64String = Convert.ToBase64String(bytearray);
				var filldata = new FillFormData()
				{
					filename = "",
					tempid = "",
					htmlschma = "",
					pdfblob = base64String,
					autofilldata = "",
					flag = "PDF",
					AccessToken = "",
					IdpToken = ""
				};
				var htmlString = _helper.ViewFilledForm(filldata);

				//return Content(htmlString, "text/html");
				return Ok(new APIResponse() { Result = htmlString, Message = "Filled Form fetched successfully", Success = true });
			}
			else
			{
				var template = (DigitalFormTemplate)templateResult.Result;

				var autofilldata = await _digitalFormResponseService.GetDigitalFormFillDataAsync(formDTO.suid);
				if (autofilldata.Result == null)
				{
					return NotFound();
				}

				if (template.Type == "PDF")
				{
					var response = await _edmService.GetDocumentAsync(template.EdmsId);

					if (response.Result == null)
					{
						return NotFound();
					}
					var bytearray = (byte[])response.Result;
					string base64String = Convert.ToBase64String(bytearray);
					var filldata = new FillFormData()
					{
						filename = (string)template.DocumentName,
						tempid = template._id,
						htmlschma = template.HtmlSchema,
						pdfblob = base64String,
						autofilldata = (string)autofilldata.Result,
						Roles = template.Roles,
						flag = "PDF",
						AccessToken = AccessToken,
						IdpToken = formDTO.idpToken
					};

					if (formDTO.type == "mobile")
					{
						var htmlString = _helper.GenerateHtmlString(filldata);

						//return Content(htmlString, "text/html");
						return Ok(new APIResponse() { Result = htmlString, Message = "Form fetched successfully", Success = true });
					}
					else
					{
						return Ok(new APIResponse() { Result = filldata, Message = "Form fetched successfully", Success = true });
					}
				}
				else if (template.Type == "WEB")
				{
					var filldata = new FillFormData()
					{
						filename = template.TemplateName,
						tempid = template._id,
						htmlschma = template.HtmlSchema,
						pdfblob = "",
						autofilldata = (string)autofilldata.Result,
						Roles = template.Roles,
						flag = "WEB",
						AccessToken = AccessToken,
						IdpToken = formDTO.idpToken
					};

					if (formDTO.type == "mobile")
					{
						var htmlString = _helper.WebhtmlString(filldata);

						//return Content(htmlString, "text/html");
						return Ok(new APIResponse() { Result = htmlString, Message = "Form fetched successfully", Success = true });


					}
					else
					{
						return Ok(new APIResponse() { Result = filldata, Message = "Form fetched successfully", Success = true });
					}
				}







			}



			return Ok(new APIResponse() { Result = "", Message = AccessToken, Success = true });

		}


		[HttpPost("forms/requestform")]
		public async Task<IActionResult> RequestForm(RequestFormDTO data)
		{




			var details = await _digitalFormTemplateService.GetDigitalFormTemplateByIdAsync(data.tempId);
			if (details.Result == null)
			{
				return Ok(new APIResponse() { Result = null, Message = "Document Not Found", Success = false });
			}
			var detailsstring = (DigitalFormTemplate)details.Result;


			if (detailsstring.Type == "WEB" && data.edmsId != null && data.edmsId != "" && data.Status != "New")
			{
				var response = await _edmService.GetDocumentAsync(data.edmsId);
				if (response.Result == null)
				{
					return Ok(new APIResponse() { Result = null, Message = "Document Not Found", Success = false });
				}
				var bytearray = (byte[])response.Result;
				string base64String = Convert.ToBase64String(bytearray);
				var autofilldata = await _digitalFormResponseService.GetDigitalFormFillDataAsync(data.Suid);
				//if (autofilldata.Result == null)
				//{
				//    return NotFound();
				//}
				var roledetails = await _templateDocumentService.GetTemplateDocumentByIdAsync(data.docuid);

				if (roledetails.Result == null)
				{
					//some code
					return NotFound();
				}
				TemplateDocument roleData = (TemplateDocument)roledetails.Result;
				//var tempRecep = roleData.TemplateRecepients.Where(x => x.Signer.suid == data.Suid && x.OrganizationId == data.OrganizationId).FirstOrDefault();
				var tempRecep = roleData?.TemplateRecepients.Where(x => (x.Signer.suid == data.Suid || (x.HasDelegation && x.AlternateSignatories.Any(a => a.suid == data.Suid))) && x.OrganizationId == data.OrganizationId && x.Status == DocumentStatusConstants.Pending).OrderBy(x => x.Order).FirstOrDefault();

				var filldata = new FillFormData()
				{
					//filename = documentName,
					tempid = data.tempId,
					htmlschma = roleData.HtmlSchema,
					pdfblob = base64String,
					autofilldata = (string)autofilldata.Result,
					//flag = data.flag,
					UserRole = tempRecep?.RoleName,
					Status = data.Status,
					pdfschema = roleData.PdfSchema



				};

				if (data.isfillable)
				{
					var htmlString = _helper.RequestGenerateHtmlString(filldata);

					//return Content(htmlString, "text/html");
					return Ok(new APIResponse() { Result = htmlString, Message = "Form fetched successfully", Success = true });
				}

				else
				{
					var htmlString = _helper.ViewFilledForm(filldata);

					//return Content(htmlString, "text/html");
					return Ok(new APIResponse() { Result = htmlString, Message = "Filled Form fetched successfully", Success = true });
				}



			}
			if (detailsstring.Type == "PDF")
			{
				var response = await _edmService.GetDocumentAsync(data.edmsId);
				if (response.Result == null)
				{
					return Ok(new APIResponse() { Result = null, Message = "Document Not Found", Success = false });
				}
				var bytearray = (byte[])response.Result;
				string base64String = Convert.ToBase64String(bytearray);
				var autofilldata = await _digitalFormResponseService.GetDigitalFormFillDataAsync(data.Suid);
				//if (autofilldata.Result == null)
				//{
				//    return NotFound();
				//}
				var roledetails = await _templateDocumentService.GetTemplateDocumentByIdAsync(data.docuid);

				if (roledetails.Result == null)
				{
					//some code
					return NotFound();
				}
				TemplateDocument roleData = (TemplateDocument)roledetails.Result;
				var tempRecep = roleData?.TemplateRecepients.Where(x => (x.Signer.suid == data.Suid || (x.HasDelegation && x.AlternateSignatories.Any(a => a.suid == data.Suid))) && x.OrganizationId == data.OrganizationId && x.Status == DocumentStatusConstants.Pending).OrderBy(x => x.Order).FirstOrDefault();

				var filldata = new FillFormData()
				{
					//filename = documentName,
					tempid = data.tempId,
					htmlschma = roleData.HtmlSchema,
					pdfblob = base64String,
					autofilldata = (string)autofilldata.Result,
					//flag = data.flag,
					UserRole = tempRecep?.RoleName,
					pdfschema = "onlypdf",
					Status = data.Status,


				};
				if (data.isfillable)
				{
					var htmlString = _helper.RequestGenerateHtmlString(filldata);

					//return Content(htmlString, "text/html");
					return Ok(new APIResponse() { Result = htmlString, Message = "Form fetched successfully", Success = true });
				}
				else
				{
					var htmlString = _helper.ViewFilledForm(filldata);

					// return Content(htmlString, "text/html");
					return Ok(new APIResponse() { Result = htmlString, Message = "Filled Form fetched successfully", Success = true });
				}

			}

			else
			{
				var autofilldata = await _digitalFormResponseService.GetDigitalFormFillDataAsync(data.Suid);
				//if (autofilldata.Result == null)
				//{
				//    return NotFound();
				//}
				var roledetails = await _templateDocumentService.GetTemplateDocumentByIdAsync(data.docuid);

				if (roledetails.Result == null)
				{
					//some code
					return NotFound();
				}
				TemplateDocument roleData = (TemplateDocument)roledetails.Result;
				var tempRecep = roleData?.TemplateRecepients.Where(x => (x.Signer.suid == data.Suid || (x.HasDelegation && x.AlternateSignatories.Any(a => a.suid == data.Suid))) && x.OrganizationId == data.OrganizationId && x.Status == DocumentStatusConstants.Pending).OrderBy(x => x.Order).FirstOrDefault();

				var filldata = new FillFormData()
				{
					//filename = documentName,
					tempid = data.tempId,
					htmlschma = roleData.HtmlSchema,
					autofilldata = (string)autofilldata.Result,
					/*flag = flag*/
					UserRole = tempRecep?.RoleName,

					Status = data.Status

				};

				if (data.isfillable)
				{
					var htmlString = _helper.RequestWebhtmlString(filldata);

					// return Content(htmlString, "text/html");
					return Ok(new APIResponse() { Result = htmlString, Message = "Form fetched successfully", Success = true });
				}
				else
				{
					var htmlString = _helper.ViewFilledForm(filldata);

					// return Content(htmlString, "text/html");
					return Ok(new APIResponse() { Result = htmlString, Message = "Filled Form fetched successfully", Success = true });
				}


			}













			//return Ok(new APIResponse() { Result = "", Message = AccessToken, Success = true });

		}

		[HttpPost("forms/saveandsign")]
		[IgnoreAntiforgeryToken]
		public async Task<IActionResult> SaveAndSign([FromForm] NewSaveDigitalFormResponse formContent)
		{
			var orgid = formContent.isEsealPresent ? OrganizationId : null;

			DigitalFormResponseDTO digitalFormResponseDTO = new()
			{
				AcToken = AccessToken,
				IdpToken = formContent.IdpToken,
				File = formContent.File,
				FormFieldData = formContent.FormFieldData,
				FormId = formContent.FormId,
				OrganizationId = orgid,
			};

			var response = await _digitalFormResponseService.NewSaveDigitalFormResponseAsync(digitalFormResponseDTO, UserDetails());


			return Ok(new APIResponse() { Message = response.Message, Result = response.Result, Success = response.Success });
		}

		[HttpPost("forms/sendformsigningrequest")]
		[IgnoreAntiforgeryToken]
		public async Task<IActionResult> SendFormSigngingRequestAsync([FromForm] FormSigngingRequestDTO dto)
		{
			var response = await _digitalFormResponseService.SendFormSigngingRequestAsync(dto, UserDetails());

			return Ok(new APIResponse() { Message = response.Message, Result = null, Success = response.Success });			//Instructed by Mobile to send null
		}

		[HttpPost("forms/useSimForm")]
		public async Task<IActionResult> UseSimForm([FromBody] SimFormDTO autofilldata)
		{

			var templateResult = await _digitalFormTemplateService.GetDigitalFormTemplateByIdAsync("67ef864bd45177559c4d2fe9");

			var template = (DigitalFormTemplate)templateResult.Result;

			var response = await _edmService.GetDocumentAsync(template.EdmsId);

			if (response.Result == null)
			{
				return NotFound();
			}
			var bytearray = (byte[])response.Result;
			string base64String = Convert.ToBase64String(bytearray);
			var filldata = new FillFormData()
			{
				filename = (string)template.DocumentName,
				tempid = template._id,
				htmlschma = template.HtmlSchema,
				pdfblob = base64String,
				autofilldata = JsonConvert.SerializeObject(autofilldata),
				Roles = template.Roles,
				flag = "PDF",
				AccessToken = AccessToken,
				IdpToken = ""
			};

			var htmlString = _helper.GenerateSimHtmlString(filldata);

			return Ok(new APIResponse() { Result = htmlString, Message = "Form fetched successfully", Success = true });

		}
	}
}

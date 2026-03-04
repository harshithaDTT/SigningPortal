using Microsoft.AspNetCore.Mvc;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using SigningPortal.Web.Attributes;

namespace SigningPortal.Web.Controllers.APIControllers
{
	[Route("api")]
	[ApiController]
	[ServiceFilter(typeof(AuthorizeAttribute))]
	public class DigitalFormTemplateApiController : ApiBaseController
	{
		private readonly IDigitalFormTemplateService _formTemplateService;
		public DigitalFormTemplateApiController(IDigitalFormTemplateService formTemplateService)
		{
			_formTemplateService = formTemplateService;
		}

		[HttpPost]
		[Route("formtemplate/save-newform-template")]
		[IgnoreAntiforgeryToken]
		public async Task<IActionResult> SaveNewDigitalFormTemplate([FromForm] SaveNewDigitalFormTemplateDTO newDigitalForm)
		{
			var result = await _formTemplateService.SaveNewDigitalFormTemplateAsync(newDigitalForm, UserDetails());

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpPost]
		[Route("formtemplate/update-template-status")]
		public async Task<IActionResult> UpdateTemplateStatus(string templateId, string action)
		{
			var result = await _formTemplateService.PublishUnpublishTemplateStatusAsync(templateId, action, UserDetails());

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpPost]
		[Route("formtemplate/new-update-template-status")]
		public async Task<IActionResult> NewUpdateTemplateStatus(PublishUnpublishTemplateDTO dto)
		{
			var result = await _formTemplateService.NewPublishUnpublishTemplateStatusAsync(dto, UserDetails());

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpGet]
		[Route("formtemplate/get-form-template-by-id")]
		public async Task<IActionResult> GetDigitalFormTemplateByIdAsync(string templateId)
		{
			var result = await _formTemplateService.GetDigitalFormTemplateByIdAsync(templateId);

			if (result.Success && result.Result is DigitalFormTemplate template)
			{
				var templateDto = new DigitalFormTemplateMobileDTO
				{
					_id = template._id,
					CreatedAt = template.CreatedAt,
					UpdatedAt = template.UpdatedAt,
					PdfSchema = template.PdfSchema,
					HtmlSchema = template.HtmlSchema,
					OrganizationUid = template.OrganizationUid,
					TemplateName = template.TemplateName,
					Status = template.Status,
					DocumentName = template.DocumentName,
					Roles = template.Roles?.Select(role => new DigitalFormTemplateRoleMobileDTO
					{
						_id = role._id,
						CreatedAt = role.CreatedAt,
						UpdatedAt = role.UpdatedAt,
						Roles = role.Roles,
						TemplateId = role.TemplateId,
						AnnotationsList = role.AnnotationsList,
						PlaceHolderCoordinates = role.PlaceHolderCoordinates,
						EsealPlaceHolderCoordinates = role.EsealPlaceHolderCoordinates,
					}).ToList() ?? new List<DigitalFormTemplateRoleMobileDTO>()
				};

				return Ok(new APIResponse
				{
					Success = true,
					Message = result.Message,
					Result = templateDto
				});
			}

			return Ok(new APIResponse
			{
				Success = result.Success,
				Message = result.Message,
				Result = result.Result
			});
		}

		[HttpGet]
		[Route("formtemplate/get-form-template/{templateId}")]
		public async Task<IActionResult> GetDigitalFormTemplateAsync(string templateId)
		{
			var result = await _formTemplateService.GetDigitalFormTemplateByIdAsync(templateId);

			return Ok(new APIResponse { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpGet]
		[Route("formtemplate/get-form-template-list")]
		public async Task<IActionResult> GetDigitalFormTemplateListAsync()
		{
			var result = await _formTemplateService.GetDigitalFormTemplateListAsync(UserDetails());

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		//[HttpGet]
		//[Route("formtemplate/get-form-template-list-by-groupid/{id}")]
		//public async Task<IActionResult> GetDigitalFormTemplateListAsync(string id)
		//{
		//    var result = await _formTemplateService.GetDigitalFormTemplateListByGroupIdAsync(id);

		//    return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		//}

		[HttpGet]
		[Route("formtemplate/get-form-template-publish-list")]
		public async Task<IActionResult> GetDigitalFormTemplatePublishListAsync()
		{
			var result = await _formTemplateService.GetDigitalFormTemplatePublishListAsync(UserDetails());

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpGet]
		[Route("formtemplate/get-new-form-template-publish-list")]
		public async Task<IActionResult> GetNewDigitalFormTemplatePublishListAsync()
		{
			var result = await _formTemplateService.GetNewDigitalFormTemplatePublishListAsync(UserDetails());

			if (result.Success && result.Result is List<NewFormTemplateResponseDTO> templates)
			{
				var templateDtos = templates.Select(template => new NewFormTemplateResonseMobileDTO
				{
					Template = new DigitalFormTemplateMobileDTO
					{
						_id = template.Template._id,
						CreatedAt = template.Template.CreatedAt,
						UpdatedAt = template.Template.UpdatedAt,
						PdfSchema = template.Template.PdfSchema,
						HtmlSchema = template.Template.HtmlSchema,
						OrganizationUid = template.Template.OrganizationUid,
						TemplateName = template.Template.TemplateName,
						Status = template.Template.Status,
						DocumentName = template.Template.DocumentName,
						Roles = template.Template.Roles?.Select(role => new DigitalFormTemplateRoleMobileDTO
						{
							_id = role._id,
							CreatedAt = role.CreatedAt,
							UpdatedAt = role.UpdatedAt,
							Roles = role.Roles,
							TemplateId = role.TemplateId,
							AnnotationsList = role.AnnotationsList,
							PlaceHolderCoordinates = role.PlaceHolderCoordinates,
							EsealPlaceHolderCoordinates = role.EsealPlaceHolderCoordinates
						}).ToList() ?? new List<DigitalFormTemplateRoleMobileDTO>()
					},

					FormResponse = template.FormResponse == null ? null : new TemplateDocumentMobileDTO
					{
						_id = template.FormResponse._id,
						CreatedAt = template.FormResponse.CreatedAt,
						UpdatedAt = template.FormResponse.UpdatedAt,
						Status = template.FormResponse.Status,
						FormTemplateName = template.FormResponse.FormTemplateName,
						DocumentName = template.FormResponse.DocumentName,
						ExpieryDate = template.FormResponse.ExpieryDate,
						CompleteTime = template.FormResponse.CompleteTime,
						EdmsId = template.FormResponse.EdmsId,
						PendingSignList = template.FormResponse.PendingSignList ?? new List<User>()
					}
				}).ToList();

				return Ok(new APIResponse
				{
					Success = true,
					Message = result.Message,
					Result = templateDtos
				});
			}

			return Ok(new APIResponse
			{
				Success = result.Success,
				Message = result.Message,
				Result = result.Result
			});
		}

		[HttpGet]
		[Route("formtemplate/get-form-template-publish-global-list")]
		public async Task<IActionResult> GetDigitalFormTemplatePublishGlobalListAsync()
		{
			var result = await _formTemplateService.GetDigitalFormTemplatePublishGlobalListAsync(UserDetails());

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpGet]
		[Route("formtemplate/get-new-form-template-publish-global-list")]
		public async Task<IActionResult> GetNewDigitalFormTemplatePublishGlobalListAsync()
		{
			var result = await _formTemplateService.GetNewDigitalFormTemplatePublishGlobalListAsync(UserDetails());

			if (result.Success && result.Result is List<NewFormTemplateResponseDTO> templates)
			{
				var templateDtos = templates.Select(template => new NewFormTemplateResonseMobileDTO
				{
					Template = new DigitalFormTemplateMobileDTO
					{
						_id = template.Template._id,
						CreatedAt = template.Template.CreatedAt,
						UpdatedAt = template.Template.UpdatedAt,
						PdfSchema = template.Template.PdfSchema,
						HtmlSchema = template.Template.HtmlSchema,
						OrganizationUid = template.Template.OrganizationUid,
						TemplateName = template.Template.TemplateName,
						Status = template.Template.Status,
						DocumentName = template.Template.DocumentName,
						Roles = template.Template.Roles?.Select(role => new DigitalFormTemplateRoleMobileDTO
						{
							_id = role._id,
							CreatedAt = role.CreatedAt,
							UpdatedAt = role.UpdatedAt,
							Roles = role.Roles,
							TemplateId = role.TemplateId,
							AnnotationsList = role.AnnotationsList,
							PlaceHolderCoordinates = role.PlaceHolderCoordinates,
							EsealPlaceHolderCoordinates = role.EsealPlaceHolderCoordinates
						}).ToList() ?? new List<DigitalFormTemplateRoleMobileDTO>()
					},

					FormResponse = template.FormResponse == null ? null : new TemplateDocumentMobileDTO
					{
						_id = template.FormResponse._id,
						CreatedAt = template.FormResponse.CreatedAt,
						UpdatedAt = template.FormResponse.UpdatedAt,
						Status = template.FormResponse.Status,
						FormTemplateName = template.FormResponse.FormTemplateName,
						DocumentName = template.FormResponse.DocumentName,
						ExpieryDate = template.FormResponse.ExpieryDate,
						CompleteTime = template.FormResponse.CompleteTime,
						EdmsId = template.FormResponse.EdmsId,
						PendingSignList = template.FormResponse.PendingSignList ?? new List<User>()
					}
				}).ToList();

				return Ok(new APIResponse
				{
					Success = true,
					Message = result.Message,
					Result = templateDtos
				});
			}

			return Ok(new APIResponse
			{
				Success = result.Success,
				Message = result.Message,
				Result = result.Result
			});
		}

		[HttpGet]
		[Route("formtemplate/get-global-form-template-list")]
		public async Task<IActionResult> GetGlobalTemplateListAsync()
		{
			var result = await _formTemplateService.GetGlobalTemplateListAsync();

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpPost]
		[Route("formtemplate/update-form-template")]
		[IgnoreAntiforgeryToken]
		public async Task<IActionResult> UpdateDigitalFormTemplate([FromForm] UpdateDigitalFormTemplateDTO newDigitalForm)
		{
			var result = await _formTemplateService.UpdateDigitalFormTemplateAsync(newDigitalForm, UserDetails());

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}
	}
}

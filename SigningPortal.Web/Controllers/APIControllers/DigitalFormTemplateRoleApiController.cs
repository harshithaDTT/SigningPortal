using Microsoft.AspNetCore.Mvc;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Services;

namespace SigningPortal.Web.Controllers.APIControllers
{
	[Route("api")]
	[ApiController]
	public class DigitalFormTemplateRoleApiController(IDigitalFormTemplateRoleService templateRoleService) : ApiBaseController
	{
		[HttpGet]
		[Route("templaterole/get-form-template-role-list")]
		public async Task<IActionResult> GetDigitalFormTemplateListByTemplateIdAsync(string templateId)
		{
			var result = await templateRoleService.GetDigitalFormTemplateRoleListByTemplateIdAsync(templateId);

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}
	}
}

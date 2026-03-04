using Microsoft.AspNetCore.Mvc;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using SigningPortal.Web.Attributes;
using SigningPortal.Web.Controllers.APIControllers;

namespace SigningPortal.Web.Controllers
{
    [Route("api")]
    [ApiController]
    [ServiceFilter(typeof(AuthorizeAttribute))]
    public class UserTemplateApiController : ApiBaseController
    {
        private readonly IUserTemplateService _userTemplateService;

        public UserTemplateApiController(IUserTemplateService templateService)
        {
            _userTemplateService = templateService;
        }

        [HttpGet]
        [Route("usertemplate/getalltemplatelist")]
        public async Task<IActionResult> GetAllTemplateList()
        {
            var result = await _userTemplateService.GetTemplateListAsync(UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpGet]
        [Route("usertemplate/getsignaturetemplatelist")]
        public async Task<IActionResult> GetSignatureTemplateList()
        {
            var result = await _userTemplateService.GetSignatureTemplateList();

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpGet]
        [Route("usertemplate/get-templatelist-for-bulksign")]
        public async Task<IActionResult> GetAllTemplateListForBulksign()
        {
            var result = await _userTemplateService.GetTemplateListForBulkSignAsync(UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpGet]
        [Route("usertemplate/gettemplatedeatils")]
        public async Task<IActionResult> GetTemplate(string templateId)
        {
            var result = await _userTemplateService.GetTemplateDetailsAsync(templateId);

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpPost]
        [Route("usertemplate/verifyorganizationuser")]
        public async Task<IActionResult> VerifyOrganizationUserBySignatureTemplate(VerifyOrganizationUserDTO verifyOrgUser)
        {
            var result = await _userTemplateService.VerifyOrganizationUserBySignatureTemplateAsync(verifyOrgUser, UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpPost]
        [Route("usertemplate/savenewtemplate")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> SaveNewTemplate([FromForm] SaveNewTemplateDTO newDocument)
        {
            var result = await _userTemplateService.SaveNewTemplateAsync(newDocument, UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpPost]
        [Route("usertemplate/updatetemplate")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> UpdateTemplate([FromForm] UpdateTemplateDTO newDocument)
        {
            var result = await _userTemplateService.UpdateTemplateAsync(newDocument, UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpPost]
        [Route("usertemplate/deletetemplate")]
        public async Task<IActionResult> DeleteTemplate(string id)
        {
            var result = await _userTemplateService.DeleteTemplateAsync(id, UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }
    }
}

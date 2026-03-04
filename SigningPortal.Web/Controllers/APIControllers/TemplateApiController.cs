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
    public class TemplateApiController : ApiBaseController
    {
        private readonly ITemplateService _templateService;

        public TemplateApiController(ITemplateService templateService)
        {
            _templateService = templateService;
        }

        [HttpGet]
        [Route("template/getalltemplatelist")]
        public async Task<IActionResult> GetAllTemplateList()
        {
            var result = await _templateService.GetTemplateListAsync(UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpGet]
        [Route("template/getsignaturetemplatelist")]
        public async Task<IActionResult> GetSignatureTemplateList()
        {
            var result = await _templateService.GetSignatureTemplateList();

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpGet]
        [Route("template/get-templatelist-for-bulksign")]
        public async Task<IActionResult> GetAllTemplateListForBulksign()
        {
            var result = await _templateService.GetTemplateListForBulkSignAsync(UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpGet]
        [Route("template/gettemplatedeatils")]
        public async Task<IActionResult> GetTemplate(string templateId)
        {
            var result = await _templateService.GetTemplateDetailsAsync(templateId);

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpPost]
        [Route("template/getsignaturepreviewimage")]
        public async Task<IActionResult> GetSignaturePreviewImage()
        {
            var result = await _templateService.GetSignaturePreviewAsync(UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpPost]
        [Route("template/verifyorganizationuser")]
        public async Task<IActionResult> VerifyOrganizationUserBySignatureTemplate(VerifyOrganizationUserDTO verifyOrgUser)
        {
            var result = await _templateService.VerifyOrganizationUserBySignatureTemplateAsync(verifyOrgUser, UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpPost]
        [Route("template/savenewtemplate")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> SaveNewTemplate([FromForm] SaveNewTemplateDTO newDocument)
        {
            var result = await _templateService.SaveNewTemplateAsync(newDocument, UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpPost]
        [Route("template/updatetemplate")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> UpdateTemplate([FromForm] UpdateTemplateDTO newDocument)
        {
            var result = await _templateService.UpdateTemplateAsync(newDocument, UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpPost]
        [Route("template/deletetemplate")]
        public async Task<IActionResult> DeleteTemplate(string id)
        {
            var result = await _templateService.DeleteTemplateAsync(id, UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }
    }
}

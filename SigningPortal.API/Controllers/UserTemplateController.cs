using Microsoft.AspNetCore.Mvc;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using SigningPortal.Core;
using System.Threading.Tasks;
using SigningPortal.API.Attributes;

namespace SigningPortal.API.Controllers
{
    [Route("api")]
    [ApiController]
    [ServiceFilter(typeof(AuthorizeAttribute))]
    public class UserTemplateController : BaseController
    {
        private readonly IUserTemplateService _userTemplateService;

        public UserTemplateController(IUserTemplateService templateService)
        {
            _userTemplateService = templateService;
        }

        [HttpGet]
        [Route("usertemplate/getalltemplatelist")]
        public async Task<IActionResult> GetAllTemplateList()
        {
            APIResponse response;

            var result = await _userTemplateService.GetTemplateListAsync(UserDetails());
            if (!result.Success)
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }
            else
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }

            return Ok(response);
        }

        [HttpGet]
        [Route("usertemplate/getsignaturetemplatelist")]
        public async Task<IActionResult> GetSignatureTemplateList()
        {
            APIResponse response;

            var result = await _userTemplateService.GetSignatureTemplateList();
            if (!result.Success)
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }
            else
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }

            return Ok(response);
        }

        [HttpGet]
        [Route("usertemplate/get-templatelist-for-bulksign")]
        public async Task<IActionResult> GetAllTemplateListForBulksign()
        {
            APIResponse response;

            var result = await _userTemplateService.GetTemplateListForBulkSignAsync(UserDetails());
            if (!result.Success)
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }
            else
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }

            return Ok(response);
        }

        [HttpGet]
        [Route("usertemplate/gettemplatedeatils")]
        public async Task<IActionResult> GetTemplate(string templateId)
        {
            APIResponse response;

            var result = await _userTemplateService.GetTemplateDetailsAsync(templateId);
            if (!result.Success)
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }
            else
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }

            return Ok(response);
        }

        [HttpPost]
        [Route("usertemplate/verifyorganizationuser")]
        public async Task<IActionResult> VerifyOrganizationUserBySignatureTemplate(VerifyOrganizationUserDTO verifyOrgUser)
        {
            APIResponse response;

            var result = await _userTemplateService.VerifyOrganizationUserBySignatureTemplateAsync(verifyOrgUser, UserDetails());
            if (!result.Success)
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }
            else
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }

            return Ok(response);
        }

        [HttpPost]
        [Route("usertemplate/savenewtemplate")]
        public async Task<IActionResult> SaveNewTemplate([FromForm] SaveNewTemplateDTO newDocument)
        {
            APIResponse response;

            var result = await _userTemplateService.SaveNewTemplateAsync(newDocument, UserDetails());
            if (!result.Success)
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }
            else
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }

            return Ok(response);
        }

        [HttpPost]
        [Route("usertemplate/updatetemplate")]
        public async Task<IActionResult> UpdateTemplate([FromForm] UpdateTemplateDTO newDocument)
        {
            APIResponse response;

            var result = await _userTemplateService.UpdateTemplateAsync(newDocument, UserDetails());
            if (!result.Success)
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }
            else
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }

            return Ok(response);
        }

        [HttpPost]
        [Route("usertemplate/deletetemplate")]
        public async Task<IActionResult> DeleteTemplate(string id)
        {
            APIResponse response;

            var result = await _userTemplateService.DeleteTemplateAsync(id, UserDetails());
            if (!result.Success)
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }
            else
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }

            return Ok(response);
        }
    }
}

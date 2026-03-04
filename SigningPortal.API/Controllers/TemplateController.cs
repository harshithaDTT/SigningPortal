using Microsoft.AspNetCore.Mvc;

using SigningPortal.API.Attributes;
using SigningPortal.Core.DTOs;
using SigningPortal.Core;
using System.Threading.Tasks;
using SigningPortal.Core.Domain.Services;

namespace SigningPortal.API.Controllers
{
    [Route("api")]
    [ApiController]
    [ServiceFilter(typeof(AuthorizeAttribute))]
    public class TemplateController : BaseController
    {
        private readonly ITemplateService _templateService;

        public TemplateController(ITemplateService templateService)
        {
            _templateService = templateService;
        }

        [HttpGet]
        [Route("template/getalltemplatelist")]
        public async Task<IActionResult> GetAllTemplateList()
        {
            APIResponse response;

            var result = await _templateService.GetTemplateListAsync(UserDetails());
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
        [Route("template/getsignaturetemplatelist")]
        public async Task<IActionResult> GetSignatureTemplateList()
        {
            APIResponse response;

            var result = await _templateService.GetSignatureTemplateList();
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
        [Route("template/get-templatelist-for-bulksign")]
        public async Task<IActionResult> GetAllTemplateListForBulksign()
        {
            APIResponse response;

            var result = await _templateService.GetTemplateListForBulkSignAsync(UserDetails());
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
        [Route("template/gettemplatedeatils")]
        public async Task<IActionResult> GetTemplate(string templateId)
        {
            APIResponse response;

            var result = await _templateService.GetTemplateDetailsAsync(templateId);
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
        [Route("template/getsignaturepreviewimage")]
        public async Task<IActionResult> GetSignaturePreviewImage()
        {
            APIResponse response;

            var result = await _templateService.GetSignaturePreviewAsync(UserDetails());
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
        [Route("template/verifyorganizationuser")]
        public async Task<IActionResult> VerifyOrganizationUserBySignatureTemplate(VerifyOrganizationUserDTO verifyOrgUser)
        {
            APIResponse response;

            var result = await _templateService.VerifyOrganizationUserBySignatureTemplateAsync(verifyOrgUser, UserDetails());
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
        [Route("template/savenewtemplate")]
        public async Task<IActionResult> SaveNewTemplate([FromForm] SaveNewTemplateDTO newDocument)
        {
            APIResponse response;

            var result = await _templateService.SaveNewTemplateAsync(newDocument, UserDetails());
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
        [Route("template/updatetemplate")]
        public async Task<IActionResult> UpdateTemplate([FromForm] UpdateTemplateDTO newDocument)
        {
            APIResponse response;

            var result = await _templateService.UpdateTemplateAsync(newDocument, UserDetails());
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
        [Route("template/deletetemplate")]
        public async Task<IActionResult> DeleteTemplate(string id)
        {
            APIResponse response;

            var result = await _templateService.DeleteTemplateAsync(id, UserDetails());
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

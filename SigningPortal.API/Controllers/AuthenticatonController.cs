using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

using SigningPortal.Core;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Domain.Services;
using SigningPortal.API.Attributes;

namespace SigningPortal.API.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthenticatonController : BaseController
    {
        private readonly IAuthenticatService _authenticationService;

        public AuthenticatonController(IAuthenticatService authenticationService)
        {
            _authenticationService = authenticationService;
        }

        [Route("getAuthenticationUrl")]
        [HttpGet]
        public IActionResult GetAuthorizationnUrl()
        {
            APIResponse response;

            var result = _authenticationService.GetAuthorizationUrl();
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


        [Route("authenticateuser")]
        [HttpPost]
        public async Task<IActionResult> authenticateuser(AuthenticateUserDTO requestObj)
        {
            APIResponse response;

            var result =await _authenticationService.AuthenticateUser(requestObj);
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


        [Route("GetApiAccess")]
        [HttpPost]
        public async Task<IActionResult> GetApiAccess(GetApiAccessTokenDTO requestObj)
        {
            APIResponse response;

            var Authtoken = HttpContext.Request.Headers["Authorization"].ToString();
            
            var result = await _authenticationService.GetApiAccess(requestObj, Authtoken);
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


        [Route("GetApiAccessOld")]
        [HttpPost]
        public async Task<IActionResult> GetApiAccessOld(GetApiAccessTokenDTOOld requestObj)
        {
            APIResponse response;

            var Authtoken = HttpContext.Request.Headers["Authorization"].ToString();

            var result = await _authenticationService.GetApiAccessOld(requestObj, Authtoken);
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

        [Route("updateaccesstoken")]
        [HttpPost]
        [ServiceFilter(typeof(AuthorizeAttribute))]
        public async Task<IActionResult> UpdateApiAccessToken(UpdateApiAccessTokenDTO requestObj)
        {
            APIResponse response;

            var result = _authenticationService.UpdateApiAccessTokenAsync(requestObj, UserDetails());
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

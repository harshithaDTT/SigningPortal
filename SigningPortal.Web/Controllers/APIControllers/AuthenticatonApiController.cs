using Microsoft.AspNetCore.Mvc;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using SigningPortal.Web.Attributes;
using SigningPortal.Web.Controllers.APIControllers;

namespace SigningPortal.Web.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthenticatonApiController : ApiBaseController
    {
        private readonly IAuthenticatService _authenticationService;

        public AuthenticatonApiController(IAuthenticatService authenticationService)
        {
            _authenticationService = authenticationService;
        }

        [Route("getAuthenticationUrl")]
        [HttpGet]
        public IActionResult GetAuthorizationnUrl()
        {
            var result = _authenticationService.GetAuthorizationUrl();

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }


        [Route("authenticateuser")]
        [HttpPost]
        public async Task<IActionResult> authenticateuser(AuthenticateUserDTO requestObj)
        {
            var result = await _authenticationService.AuthenticateUser(requestObj);

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }


        [Route("GetApiAccess")]
        [HttpPost]
        public async Task<IActionResult> GetApiAccess(GetApiAccessTokenDTO requestObj)
        {
            var Authtoken = HttpContext.Request.Headers["Authorization"].ToString();

            var result = await _authenticationService.GetApiAccess(requestObj, Authtoken);

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }


        [Route("GetApiAccessOld")]
        [HttpPost]
        public IActionResult GetApiAccessOld(GetApiAccessTokenDTOOld requestObj)
        {
            var Authtoken = HttpContext.Request.Headers["Authorization"].ToString();

            var result =  _authenticationService.GetApiAccessOld(requestObj, Authtoken);

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [Route("updateaccesstoken")]
        [HttpPost]
        [ServiceFilter(typeof(AuthorizeAttribute))]
        public IActionResult UpdateApiAccessToken(UpdateApiAccessTokenDTO requestObj)
        {
            var result = _authenticationService.UpdateApiAccessTokenAsync(requestObj, UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [Route("getVerificationAppAuthenticationUrl")]
        [HttpGet]
        public IActionResult GetVerificationAppAuthorizationUrl()
        {
            var result = _authenticationService.GetVerificationAuthorizationUrl();

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }


        [Route("authenticateverifier")]
        [HttpPost]
        public async Task<IActionResult> authenticateverifier(AuthenticateUserDTO requestObj)
        {
            var result = await _authenticationService.AuthenticateVerifier(requestObj);

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }
    }
}

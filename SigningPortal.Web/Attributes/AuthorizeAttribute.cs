using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Newtonsoft.Json;
using SigningPortal.Core;
using SigningPortal.Core.Security;
using SigningPortal.Core.Utilities;

namespace SigningPortal.Web.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class AuthorizeAttribute : Attribute, IAuthorizationFilter
    {
        private readonly OpenID openIDHelper;
        private readonly ILogger<AuthorizeAttribute> _logger;

        public AuthorizeAttribute(IConfiguration _configuration, IGlobalConfiguration _globalConfiguration, HttpClient _client, ILogger<AuthorizeAttribute> logger)
        {
            openIDHelper = new OpenID(_configuration, _client, _globalConfiguration);
            _logger = logger;
        }
        public void OnAuthorization(AuthorizationFilterContext context)
        {
            _logger.LogInformation("OnAuthorization start");
            var strArray = new List<string>
            {                
                "/api/delegate/delegateeaction",
                "/api/delegate/delegatoraction",
                "/api/delegate/getdelegatedetails",
                "/api/signed-document",
                "/api/bulksigne/bulksigned-document",
                "/api/documents/getdocdisplaydetails",
                "/api/digitalformresponse/new-callback-update",
                "/api/digitalformresponse/signed-form-document"

            };

            if (string.IsNullOrEmpty(context.HttpContext.Request.Path.Value))
            {
                throw new InvalidCastException("Request path value cannot be empty.");
            }

            if (strArray.Contains(context.HttpContext.Request.Path.Value))
            {
                return;
            }
            else
            {
                var token = context.HttpContext.Request.Headers["x-access-token"].FirstOrDefault()?.Split(" ").Last();
                if (token == null)
                {
                    context.Result = new JsonResult(new APIResponse() { Success = false, Message = "Unauthorized", Result = null }) { StatusCode = StatusCodes.Status401Unauthorized };
                    _logger.LogInformation(" OnAuthorization Result " + context.Result);

                    var unauthorizedResult = new JsonResult(new APIResponse() { Success = false, Message = "Unauthorized", Result = null }) { StatusCode = StatusCodes.Status401Unauthorized };

                    context.Result = unauthorizedResult;

                    // Log JsonResult content
                    _logger.LogInformation($"OnAuthorization Result {unauthorizedResult.StatusCode}: {JsonConvert.SerializeObject(unauthorizedResult.Value)}");
                }

                _logger.LogInformation("Token : " + token);
                var user = openIDHelper.ValidateApiToken(token!);
                if (string.IsNullOrEmpty(user))
                {
                    var unauthorizedResult = new JsonResult(new APIResponse() { Success = false, Message = "Unauthorized", Result = null }) { StatusCode = StatusCodes.Status401Unauthorized };

                    context.Result = unauthorizedResult;

                    // Log JsonResult content
                    _logger.LogInformation($"OnAuthorization Result {unauthorizedResult.StatusCode}: {JsonConvert.SerializeObject(unauthorizedResult.Value)}");

                    _logger.LogInformation("OnAuthorization User Not Authenticated");
                }
                _logger.LogInformation("User : " + user);
                context.HttpContext.Items["User"] = user;
                context.HttpContext.Items["apiToken"] = token;
            }

            _logger.LogInformation("OnAuthorization end");
        }
    }
}

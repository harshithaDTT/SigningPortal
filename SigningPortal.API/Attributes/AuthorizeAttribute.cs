using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SigningPortal.Core;
using SigningPortal.Core.Security;
using SigningPortal.Core.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;

namespace SigningPortal.API.Attributes
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
            var strArray = new List<string>();
            strArray.Add("/api/delegate/getreceiveddelegatelist");
            strArray.Add("/api/delegate/delegateeaction");
            strArray.Add("/api/delegate/getdelegatedetails");
            strArray.Add("/api/signed-document");
            strArray.Add("/api/bulksigne/bulksigned-document");

            //if ("/api/signed-document" == context.HttpContext.Request.Path.Value ||
            //    "/api/bulksigne/bulksigned-document" == context.HttpContext.Request.Path.Value)
            //{
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
                var user = openIDHelper.ValidateApiToken(token);
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
            }

            _logger.LogInformation("OnAuthorization end");
        }
    }
}

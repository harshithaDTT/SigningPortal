using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace SigningPortal.Web.Attributes
{
    public class SessionValidationAttribute : ActionFilterAttribute, IResultFilter
    {
        private readonly ILogger<SessionValidationAttribute> _logger;
        public SessionValidationAttribute(ILogger<SessionValidationAttribute> logger)
        {
            _logger = logger;
        }

        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            _logger.LogInformation("--> Custom Attribute :: OnActionExecuting");

            bool isAjax = filterContext.HttpContext.Request.Headers["X-Requested-With"] == "XMLHttpRequest";
            var RequestPath = filterContext.HttpContext.Request.Path.Value;

            if (!filterContext.HttpContext.User.Identity.IsAuthenticated)
            {
                filterContext.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

                if (isAjax)
                {
                    filterContext.Result = new StatusCodeResult(StatusCodes.Status401Unauthorized);
                }
                else
                {
                    filterContext.Result = new RedirectToRouteResult(
                    new RouteValueDictionary {
                            { "Controller", "Login" },
                            { "Action", "Index" }
                   });
                }
            }
            base.OnActionExecuting(filterContext);
        }
    }
}

using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using SigningPortal.Core.Security;

namespace SigningPortal.Web.Controllers
{
    public class LogoutController : Controller
    {
        private readonly IConfiguration _configuration;
        private readonly OpenID _helper;
        public LogoutController(IConfiguration configuration,OpenID openID)
        {
            _configuration = configuration;
            _helper = openID;
        }
        [HttpGet]
        public IActionResult Index()
        {
            if (!User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Index", "Login");
            }

            var state = Guid.NewGuid().ToString("N");

            var idToken = "";
            var isOpenId = _configuration.GetValue<bool>("OpenId_Connect");
            if (isOpenId)
            {
                var idTokenClaim = HttpContext.User.Claims
     .FirstOrDefault(c => c.Type == "ID_Token");

                idToken = idTokenClaim?.Value ?? string.Empty;
            }
            var logoutUrl = _helper.GetLogoutUrl(idToken, state);

            if (Url.IsLocalUrl(logoutUrl))
            {
                return Redirect(logoutUrl);
            }
            else
            {
                return RedirectToAction("Index", "Login");
            }
        }
        public async Task<IActionResult> CallBack()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("Index", "Login");
        }
    }
}

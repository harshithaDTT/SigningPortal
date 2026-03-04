using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication.Authentication;
using SigningPortal.Core.Domain.Services.Communication.Payment;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Security;
using SigningPortal.Core.Utilities;
using SigningPortal.Web.Models.Login;
using System.Security.Claims;

namespace SigningPortal.Web.Controllers
{
    public class LoginController : BaseController
    {
        private readonly IAuthenticatService _authenticatService;
        private readonly IConfiguration _configuration;
        private readonly OpenID _openIDHelper;
        private readonly IPaymentService _paymentService;
        private readonly ITemplateService _templateService;
        private readonly IDistributedCache _cache;
        private readonly ILogger<LoginController> _logger;
        private readonly ICacheClient _cacheClient;
        private readonly IMemoryCache _memoryCache;

        public LoginController(IAuthenticatService authenticatService, ILogger<LoginController> logger,
            IConfiguration configuration,
            OpenID openID,
            IMemoryCache memoryCache,

            ICacheClient cacheClient,
            IPaymentService paymentService,
            ITemplateService templateService,
            IDistributedCache cache)
        {
            _authenticatService = authenticatService;
            _configuration = configuration;
            _openIDHelper = openID;
            _paymentService = paymentService;
            _templateService = templateService;
            _cache = cache;
            _logger = logger;
            _cacheClient = cacheClient;
            _memoryCache = memoryCache;

        }
        public IActionResult Index()
        {
            if (User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Index", "Dashboard");
            }
            return View();
        }
        public IActionResult GetAuthorizationUrl()
        {
            var authorizationUrlResult = _authenticatService.GetAuthorizationUrl();
            var authorizationUrl = (AuthenticationUrlResponse)authorizationUrlResult.Result;
            return Redirect(authorizationUrl.Url);
        }
        public async Task<IActionResult> CallBack()
        {

            if (Request.Cookies.TryGetValue("UniqueKey", out string cookieValue))
            {
                var authenticateResponse = await _cache.GetStringAsync(cookieValue);

                if (authenticateResponse != null)
                {
                    var authUserObject = JsonConvert.DeserializeObject<AuthenticateUserResponse>(authenticateResponse);

                    return View(authUserObject);
                }
            }

            var openid = _configuration.GetValue<Boolean>("OpenId_Connect");

            if (!string.IsNullOrEmpty(Request.Query["error"]) && !string.IsNullOrEmpty(Request.Query["error_description"]))
            {
                if (Request.Query["error_description"].ToString() == "The request has expired jwt token in request parameter")
                {
                    var authorizationUrlResult = _authenticatService.GetAuthorizationUrl();
                    var authorizationUrl = (AuthenticationUrlResponse)authorizationUrlResult.Result;
                    return Redirect(authorizationUrl.Url);
                }
                ViewBag.error = Request.Query["error"].ToString();
                ViewBag.error_description = Request.Query["error_description"].ToString();
                return View("Errorp");
            }

            string code = Request.Query["code"].ToString();
            if (string.IsNullOrEmpty(code))
            {
                ViewBag.error = "Invalid code";
                ViewBag.error_description = "The code value is empty string or null";
                return View("Errorp");
            }

            AuthenticateUserDTO authenticateUserDTO = new AuthenticateUserDTO();

            authenticateUserDTO.code = code;

            var authenticationUser = await _authenticatService.AuthenticateUser(authenticateUserDTO);
            if (authenticationUser == null || !authenticationUser.Success)
            {
                string msg = authenticationUser != null ? authenticationUser.Message : "User not authenticated";
                ViewBag.error = msg;
                ViewBag.error_description = msg;
                return View("Errorp");
            }

            var authenticateUserResponse = (AuthenticateUserResponse)authenticationUser.Result;
            if (authenticateUserResponse.OrgDetailsList == null || authenticateUserResponse.OrgDetailsList.Count == 0 || authenticateUserResponse.allowAccountSelection == false)
            {
                var identity = new ClaimsIdentity(new[] {
                    new Claim(ClaimTypes.Name, authenticateUserResponse.name),
                    new Claim(ClaimTypes.Email,authenticateUserResponse.email),
                    new Claim(ClaimTypes.UserData,authenticateUserResponse.suid),
                }, CookieAuthenticationDefaults.AuthenticationScheme);

                if (openid)
                {
                    identity.AddClaim(new Claim("ID_Token", authenticateUserResponse.idp_token));
                }
                var OrganizationId = "";
                var OrganizationName = "";
                var AccountType = "Self";
                if (authenticateUserResponse.orgnizationId != null)
                {
                    OrganizationId = authenticateUserResponse.orgnizationId;
                    AccountType = "Organization";
                    string commaSeparatedEmails = string.Join(", ", authenticateUserResponse.SelfEmails);

                    identity.AddClaim(new Claim("SelfEmails", commaSeparatedEmails));
                }
                if (authenticateUserResponse.orgnizationName != null)
                {
                    OrganizationName = authenticateUserResponse.orgnizationName;

                }
                UserDTO userDTO = new UserDTO()
                {
                    Name = authenticateUserResponse.name,
                    Email = authenticateUserResponse.email,
                    Suid = authenticateUserResponse.suid,
                    OrganizationId = OrganizationId,
                    OrganizationName = OrganizationName,
                    AccountType = AccountType,
                    AccessTokenExpiryTime = DateTime.UtcNow.AddSeconds(3600)

                };
                var roleList = new List<Claim>();
                foreach (var org in authenticateUserResponse.OrgDetailsList)
                {
                    if (org.OrganizationUid == OrganizationId)
                    {
                        if (org.eSealSignatory)
                        {
                            roleList.Add(new Claim(ClaimTypes.Role, "eSealSignatory"));
                        }
                        if (org.eSealPrepatory)
                        {
                            roleList.Add(new Claim(ClaimTypes.Role, "eSealPrepatory"));
                        }
                        if (org.template)
                        {
                            roleList.Add(new Claim(ClaimTypes.Role, "template"));
                        }
                        if (org.bulkSign)
                        {
                            roleList.Add(new Claim(ClaimTypes.Role, "bulkSign"));
                        }
                        if (org.Signatory)
                        {
                            roleList.Add(new Claim(ClaimTypes.Role, "Signatory"));
                        }
                        if (org.Delegate)
                        {
                            roleList.Add(new Claim(ClaimTypes.Role, "Delegate"));
                        }
                        if (org.DigitalFormPrivilege)
                        {
                            roleList.Add(new Claim(ClaimTypes.Role, "DigitalForms"));
                        }
                    }
                }
                identity.AddClaims(roleList);
                identity.AddClaim(new Claim("OrganizationName", OrganizationName));
                identity.AddClaim(new Claim("OrganizationUid", OrganizationId));
                identity.AddClaim(new Claim("AccountType", AccountType));
                var apitoken = _openIDHelper.generateApiToken(userDTO, 3600);
                identity.AddClaim(new Claim("ID_Token", authenticateUserResponse.idp_token));
                identity.AddClaim(new Claim("apiToken", apitoken));

                var userObject = JsonConvert.SerializeObject(userDTO);

                identity.AddClaim(new Claim("user", userObject));

                string orgId = string.IsNullOrEmpty(userDTO.OrganizationId) ? AccountTypeConstants.Self : userDTO.OrganizationId;

                identity.AddClaim(new Claim("suid_orgid", $"{userDTO.Suid}_{orgId}"));

                var principal = new ClaimsPrincipal(identity);

                var properties = new AuthenticationProperties();

                properties.IsPersistent = true;

                properties.AllowRefresh = false;


                //int SessionValidatonTime = _configuration.GetSection("SessionValidationTime").Get<int>();

                properties.ExpiresUtc = DateTime.UtcNow.AddSeconds(Convert.ToDouble(authenticateUserResponse.expires_in));

                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal, properties);

                return RedirectToAction("Index", "Dashboard");
            }

            var guid = Guid.NewGuid().ToString() + authenticateUserResponse.suid;

            var cookieOptions = new CookieOptions
            {
                Expires = DateTime.UtcNow.AddSeconds(authenticateUserResponse.expires_in)
            };

            var authenticateUserString = JsonConvert.SerializeObject(authenticateUserResponse);

            Response.Cookies.Append("UniqueKey", guid, cookieOptions);

            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(authenticateUserResponse.expires_in)
            };

            await _cache.SetStringAsync(guid, authenticateUserString, options);

            //var userImageResponse = await _authenticatService.GetUserProfileImage(authenticateUserResponse.idp_token);
            //if (userImageResponse != null && !userImageResponse.Success)
            //{
            //	return Json(new { success = false });
            //}
            //var userImage = userImageResponse.Result;

            //var cookieOption = new CookieOptions
            //{
            //	Path = "/",
            //	Expires = DateTime.Now.AddDays(1),
            //};
            //         MemoryCache.Default.Set(
            //                "UserProfileImageBase64",
            //                userImage,
            //                DateTimeOffset.Now.AddHours(1)
            //            );




            return View(authenticateUserResponse);
        }


        [HttpPost]
        public async Task<JsonResult> CreateSession([FromBody] AuthenticationResponseViewModel model)
        {
            bool openid = true;

            try
            {
                var authResult = await HttpContext.AuthenticateAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme
                );

                bool isSwitchAccount = authResult.Succeeded;

                DateTime expiresUtc;
                int expiryTime;

                UserDTO existingUser = null;

                if (isSwitchAccount && authResult.Properties?.ExpiresUtc != null)
                {
                    expiresUtc = authResult.Properties.ExpiresUtc.Value.UtcDateTime;
                    expiryTime = (int)(expiresUtc - DateTime.UtcNow).TotalSeconds;

                    var userJson = authResult.Principal?.FindFirst("user")?.Value;

                    if (!string.IsNullOrWhiteSpace(userJson))
                    {
                        existingUser = JsonConvert.DeserializeObject<UserDTO>(userJson);
                    }
                    else
                    {
                        existingUser = null;
                    }
                    model.Name = existingUser.Name;
                    model.Email = existingUser.Email;
                    model.Suid = existingUser.Suid;
                    model.OrgDetailsList = existingUser.OrganizationDetails;
                }
                else
                {
                    expiryTime = model.expires_in;
                    expiresUtc = DateTime.UtcNow.AddSeconds(expiryTime);
                    if (Request.Cookies.ContainsKey("UniqueKey"))
                    {
                        string? cookieValue = Request.Cookies["UniqueKey"];

                        if (!string.IsNullOrWhiteSpace(cookieValue))
                        {
                            await _cache.RemoveAsync(cookieValue);
                        }
                        Response.Cookies.Delete("UniqueKey");
                    }
                }

                var identity = new ClaimsIdentity(
                    CookieAuthenticationDefaults.AuthenticationScheme
                );

                identity.AddClaim(new Claim(ClaimTypes.Name, model.Name));
                identity.AddClaim(new Claim(ClaimTypes.UserData, model.Suid));

                string commaSeparatedEmails = string.Join(", ", model.SelfEmails);
                identity.AddClaim(new Claim("SelfEmails", commaSeparatedEmails));
                if (openid && !string.IsNullOrEmpty(model.IdpToken))
                {
                    identity.AddClaim(new Claim("ID_Token", model.IdpToken));
                }

                string accountType;

                if (string.IsNullOrEmpty(model.OrganizationId))
                {
                    accountType = "Self";

                    identity.AddClaim(new Claim("AccountType", "Self"));
                    identity.AddClaim(new Claim(ClaimTypes.Email, model.Email));

                    model.OrganizationId = "";
                    model.OrganizationName = "";
                }
                else
                {
                    var selectedOrg = model.OrgDetailsList
                        ?.FirstOrDefault(o => o.OrganizationUid == model.OrganizationId);

                    if (selectedOrg == null)
                    {
                        return Json(new { success = false, message = "Invalid organization" });
                    }

                    accountType = "Organization";

                    model.OrganizationName = selectedOrg.OrganizationName;
                    model.Email = selectedOrg.SubscriberEmailList;

                    var roleClaims = new List<Claim>();

                    if (selectedOrg.eSealSignatory)
                        roleClaims.Add(new Claim(ClaimTypes.Role, "eSealSignatory"));

                    if (selectedOrg.eSealPrepatory)
                        roleClaims.Add(new Claim(ClaimTypes.Role, "eSealPrepatory"));

                    if (selectedOrg.template)
                        roleClaims.Add(new Claim(ClaimTypes.Role, "template"));

                    if (selectedOrg.bulkSign)
                        roleClaims.Add(new Claim(ClaimTypes.Role, "bulkSign"));

                    if (selectedOrg.Signatory)
                        roleClaims.Add(new Claim(ClaimTypes.Role, "Signatory"));

                    if (selectedOrg.Delegate)
                        roleClaims.Add(new Claim(ClaimTypes.Role, "Delegate"));

                    if (selectedOrg.DigitalFormPrivilege)
                        roleClaims.Add(new Claim(ClaimTypes.Role, "DigitalForms"));

                    identity.AddClaims(roleClaims);

                    identity.AddClaim(new Claim("AccountType", "Organization"));
                    identity.AddClaim(new Claim("OrganizationName", model.OrganizationName));
                    identity.AddClaim(new Claim("OrganizationUid", model.OrganizationId));
                    identity.AddClaim(new Claim(ClaimTypes.Email, model.Email));
                }

                var userDTO = new UserDTO
                {
                    Name = model.Name,
                    Email = model.Email,
                    Suid = model.Suid,
                    OrganizationId = model.OrganizationId,
                    OrganizationName = model.OrganizationName,
                    AccountType = accountType,
                    AccessTokenExpiryTime = expiresUtc,
                    OrganizationDetails = model.OrgDetailsList
                };

                var apiToken = _openIDHelper.generateApiToken(userDTO, expiryTime);

                identity.AddClaim(new Claim("apiToken", apiToken));
                identity.AddClaim(new Claim("user", JsonConvert.SerializeObject(userDTO)));

                string orgId = string.IsNullOrEmpty(model.OrganizationId)
                    ? AccountTypeConstants.Self
                    : model.OrganizationId;

                identity.AddClaim(new Claim("suid_orgid", $"{model.Suid}_{orgId}"));

                var principal = new ClaimsPrincipal(identity);

                var properties = new AuthenticationProperties
                {
                    IsPersistent = true,
                    AllowRefresh = false,
                    ExpiresUtc = expiresUtc
                };

                await HttpContext.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    principal,
                    properties
                );

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CreateSession error");
                return Json(new { success = false });
            }
        }


        //[HttpGet]

        //public async Task<IActionResult> GetProfileImage()
        //{
        //	try
        //	{
        //		var userImageResponse = await _authenticatService.GetUserProfileImage(IdpToken);
        //		if (userImageResponse != null && !userImageResponse.Success)
        //		{
        //			return Json(new { success = false });
        //		}
        //		var userImage = userImageResponse;

        //		//var cookieOption = new CookieOptions
        //		//{
        //		//	Path = "/",
        //		//	Expires = DateTime.Now.AddDays(1),
        //		//};
        //		//Response.Cookies.Append("UserProfileImage", userImage.ToString(), cookieOption);

        //		return Json(userImage);
        //	}

        //	catch (Exception ex)
        //	{
        //		return Json(new { success = false, message = ex.Message });
        //	}
        //}

        [HttpGet]
        public async Task<IActionResult> GetProfileImage(string userId)
        {
            try
            {
                var userImageResponse = await _authenticatService.GetUserProfileImage(IdpToken);

                byte[] imageBytes;

                string? base64Image = userImageResponse?.Result?.ToString();

                if (userImageResponse == null ||
                    !userImageResponse.Success ||
                    string.IsNullOrWhiteSpace(base64Image))
                {
                    imageBytes = System.IO.File.ReadAllBytes("wwwroot/images/default-profile.png");
                }
                else
                {
                    imageBytes = Convert.FromBase64String(base64Image);
                }

                // Tell browser to cache for 1 day
                Response.Headers["Cache-Control"] = "private,max-age=86400";

                return File(imageBytes, "image/png");
            }
            catch
            {
                var defaultImage = System.IO.File.ReadAllBytes("wwwroot/images/default-profile.png");
                Response.Headers["Cache-Control"] = "private,max-age=86400";
                return File(defaultImage, "image/png");
            }
        }


        public IActionResult MobileOrganizationLogin()
        {

            ViewBag.error_description = "Access denied to the organization account on mobile.";
            return View();
        }

        [HttpGet]
        public async Task<JsonResult> GetCredits()
        {
            var creditDetails = await _paymentService.GetCreditDeatails(UserDetails());
            if (creditDetails == null || !creditDetails.Success)
            {
                return Json(new { success = false, message = creditDetails.Message });
            }
            var availableCreditsDTO = (PaymentDetails)creditDetails.Result;
            var availableCredits = availableCreditsDTO.AvailableCredit;
            return Json(new { success = true, credits = availableCredits });
        }
    }
}
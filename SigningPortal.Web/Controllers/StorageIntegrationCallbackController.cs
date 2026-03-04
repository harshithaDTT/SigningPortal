using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using SigningPortal.Web.ViewModel;

namespace SigningPortal.Web.Controllers
{
    public class StorageIntegrationCallbackController : BaseController
    {
        private readonly IStorageIntegrationService _storageIntegrationService;
        private readonly StorageSecretsDTO googleSrcrets;
        public StorageIntegrationCallbackController(IStorageIntegrationService storageIntegrationService, IGlobalDriveStorageConfiguration configuration)
        {
            _storageIntegrationService = storageIntegrationService;
            googleSrcrets = configuration.GoogleStorageSecret;
        }

        public async Task<IActionResult> Index()
        {
            var redirect = string.Empty;

            string code = Request.Query["code"];

            var storageName = TempData["StorageName"].ToString();

            if (storageName.Contains("-CreateDocument"))
            {
                var data = storageName.Split("-");
                if (data.Length > 1)
                {
                    storageName = data[0];
                    redirect = data[1];
                }
            }

            TempData.Clear();

            if (storageName == StorageConstant.GOOGLE_DRIVE)    // Check Scope Permissions
            {
                bool allScopes = false;
                string[] requiredScopeArray = googleSrcrets.Scope.Split("+");

                // Check if scope is provided in the query
                string queryScope = Request.Query["scope"].ToString();
                if (!string.IsNullOrEmpty(queryScope))
                {
                    string[] callbackScopeArray = queryScope.Split(" ");
                    allScopes = requiredScopeArray.OrderBy(x => x).SequenceEqual(callbackScopeArray.OrderBy(x => x));
                }

                // If scopes are incomplete or missing, handle the error and redirect
                if (!allScopes)
                {
                    string message = string.IsNullOrEmpty(code) ? "Access denied. Try Again" : "Please grant consent for the necessary drive access permissions";
                    Alert alert = new Alert { IsSuccess = false, Message = message };
                    TempData["Alert"] = JsonConvert.SerializeObject(alert);

                    // Redirect even if the scopes are incorrect
                    return !string.IsNullOrEmpty(redirect)
                        ? RedirectToAction("CreateDocuments", "Documents")
                        : RedirectToAction("Index", "Integration");
                }
            }

            if (!string.IsNullOrEmpty(code))
            {
                var result = await _storageIntegrationService.LinkUserStorageAsync(storageName, code, UserDetails());
                if (!result.Success)
                {
                    Alert alert = new Alert { Message = (result.Message) };
                    TempData["Alert"] = JsonConvert.SerializeObject(alert);
                }
                else
                {
                    Alert alert = new Alert { IsSuccess = true, Message = result.Message };
                    TempData["Alert"] = JsonConvert.SerializeObject(alert);
                }
                if (!string.IsNullOrEmpty(redirect))
                {
                    return RedirectToAction("CreateDocuments", "Documents");
                }
            }
            else
            {
                Alert alert = new Alert { IsSuccess = false, Message = "Something went wrong" };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                if (!string.IsNullOrEmpty(redirect))
                {
                    return RedirectToAction("CreateDocuments", "Documents");
                }
            }

            return RedirectToAction("Index", "Integration");
        }

        public async Task<IActionResult> GetStoratgeConfiguration(string storageName)
        {
            TempData["StorageName"] = storageName + "-CreateDocument";
            var result = await _storageIntegrationService.GetDriveConfigurationAsync(storageName, UserDetails());
            if (!result.Success)
            {
                return Json(new { Success = result.Success, Message = result.Message, Result = result.Result });
            }
            else
            {
                return Json(new { Success = result.Success, Message = result.Message, Result = result.Result });
            }
        }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication.Authentication;
using SigningPortal.Core.DTOs;
using SigningPortal.Web.ViewModel;
using SigningPortal.Web.ViewModels.Integration;

namespace SigningPortal.Web.Controllers
{
    [Authorize]
    public class IntegrationController : BaseController
    {
        private readonly IStorageIntegrationService _storageIntegrationService;
        public IntegrationController(IStorageIntegrationService storageIntegrationService)
        {
            _storageIntegrationService = storageIntegrationService;
        }

        [HttpGet]
        public async Task<IActionResult> Index()
        {

            var list = await _storageIntegrationService.GetStorageListAsync(UserDetails());
            if (!list.Success)
            {
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = list.Message };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return RedirectToAction("Index", "Dashboard");
                // return NotFound();
            }
            var storageList = (IList<StorageListDTO>)list.Result;

            var viewModel = new StorageIntegrationListViewModel()
            {
                StrorageList = (IList<StorageListDTO>)list.Result
            };
            foreach (var storage in storageList)
            {
                if (storage.StorageName == "ONE_DRIVE")
                {
                    viewModel.OneDriveStorage.IsLinked = storage.IsLinked;
                    viewModel.OneDriveStorage.Active = storage.Active;
                    viewModel.OneDriveStorage.StorageName = storage.StorageName;
                    viewModel.OneDriveStorage.ExpiryDate = storage.ExpiryDate;
                    viewModel.OneDrive = true;
                }
                if (storage.StorageName == "GOOGLE_DRIVE")
                {
                    viewModel.GoogleDriveStorage.IsLinked = storage.IsLinked;
                    viewModel.GoogleDriveStorage.Active = storage.Active;
                    viewModel.GoogleDriveStorage.StorageName = storage.StorageName;
                    viewModel.GoogleDriveStorage.ExpiryDate = storage.ExpiryDate;
                    viewModel.GoogleDrive = true;
                }
            }
            return View(viewModel);
        }

        //[HttpPost]
        //public async Task<IActionResult> Index()
        //{
        //    return View();
        //}

        public async Task<JsonResult> GetStorageAuthenticationUrl(string storageName)
        {
            TempData["StorageName"] = storageName;
            var response = await _storageIntegrationService.GetAuthenticationUrlAsync(storageName);
            if (!response.Success)
                return Json(new { Status = "Failed", Message = response.Message });

            var result = (AuthenticationUrlResponse)response.Result;

            return Json(new { Status = "Success", Message = response.Message, data = result });
        }

        public async Task<IActionResult> UnlinkStorage(string storageName)
        {
            string message = String.Empty;

            if (storageName == "GOOGLE_DRIVE")
            {
                message = "You have unlinked Google drive";
            }

            if (storageName == "ONE_DRIVE")
            {
                message = "You have unlinked One drive";
            }

            var response = await _storageIntegrationService.UnlinkStorageAsync(storageName, UserDetails());
            if (!response.Success)
            {
                return Json(new { Status = "Failed", Message = response.Message });
            }

            return Json(new { Status = "Success", Message = message });
        }

        public async Task<IActionResult> SetStorageDrive(string storageName)
        {
            var result = await _storageIntegrationService.SetStorageActiveAsync(storageName, UserDetails());
            if (!result.Success)
            {
                return Json(new { Status = "Failed", Message = result.Message });
            }

            var storage = storageName == StorageConstant.ONE_DRIVE ? "One" : "Google";

            return Json(new { Status = "Success", Message = $"Storage drive set successfully\nYour signed documents will be stored in Signing Portal folder of the {storage} drive" });
        }

        public async Task<IActionResult> UnsetStorageDrive(string storageName)
        {
            var result = await _storageIntegrationService.UnsetStorageActiveAsync(storageName, UserDetails());
            if (!result.Success)
            {
                return Json(new { Status = "Failed", Message = result.Message });
            }

            return Json(new { Status = "Success", Message = result.Message });
        }
    }
}

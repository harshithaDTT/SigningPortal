using Microsoft.AspNetCore.Mvc;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Web.Attributes;
using SigningPortal.Web.Controllers.APIControllers;

namespace SigningPortal.Web.Controllers
{
    [Route("api")]
    [ApiController]
    [ServiceFilter(typeof(AuthorizeAttribute))]
    public class StorageIntegrationApiController : ApiBaseController
    {
        private readonly IStorageIntegrationService _storageIntegrationService;

        public StorageIntegrationApiController(IStorageIntegrationService storageIntegrationService)
        {
            _storageIntegrationService = storageIntegrationService;
        }

        [HttpGet]
        [Route("storageIntegration/getStorageList")]
        public async Task<IActionResult> GetStorageList()
        {
            var result = await _storageIntegrationService.GetStorageListAsync(UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpGet]
        [Route("storageIntegration/getAuthenticationUrl")]
        public async Task<IActionResult> GetAuthenticationUrl(string storageName)
        {
            var result = await _storageIntegrationService.GetAuthenticationUrlAsync(storageName);

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpGet]
        [Route("storageIntegration/unlinkStorage")]
        public async Task<IActionResult> UnlinkStorage(string storageName)
        {
            var result = await _storageIntegrationService.UnlinkStorageAsync(storageName, UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpGet]
        [Route("storageIntegration/setactivestorage")]
        public async Task<IActionResult> SetActiveStorage(string storageName)
        {
            var result = await _storageIntegrationService.SetStorageActiveAsync(storageName, UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpGet]
        [Route("storageIntegration/linkStorageDrive")]
        public async Task<IActionResult> LinkStorageDrive(string storageName, string code)
        {
            var result = await _storageIntegrationService.LinkUserStorageAsync(storageName, code, UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpGet]
        [Route("storageIntegration/getDriveConfiguration")]
        public async Task<IActionResult> GetDriveConfiguration(string storageName)
        {
            var result = await _storageIntegrationService.GetDriveConfigurationAsync(storageName, UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }
    }
}


using Microsoft.AspNetCore.Mvc;
using SigningPortal.API.Attributes;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Services;
using System.Threading.Tasks;

namespace SigningPortal.API.Controllers
{
    [Route("api")]
    [ApiController]
    [ServiceFilter(typeof(AuthorizeAttribute))]
    public class StorageIntegrationController : BaseController
    {
        private readonly IStorageIntegrationService _storageIntegrationService;

        public StorageIntegrationController(IStorageIntegrationService storageIntegrationService)
        {
            _storageIntegrationService = storageIntegrationService;
        }

        [HttpGet]
        [Route("storageIntegration/getStorageList")]
        public async Task<IActionResult> GetStorageList()
        {
            APIResponse response;

            var result = await _storageIntegrationService.GetStorageListAsync(UserDetails());
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

        [HttpGet]
        [Route("storageIntegration/getAuthenticationUrl")]
        public async Task<IActionResult> GetAuthenticationUrl(string storageName)
        {
            APIResponse response;

            var result = await _storageIntegrationService.GetAuthenticationUrlAsync(storageName);
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

        [HttpGet]
        [Route("storageIntegration/unlinkStorage")]
        public async Task<IActionResult> UnlinkStorage(string storageName)
        {
            APIResponse response;

            var result = await _storageIntegrationService.UnlinkStorageAsync(storageName, UserDetails());
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

        [HttpGet]
        [Route("storageIntegration/setactivestorage")]
        public async Task<IActionResult> SetActiveStorage(string storageName)
        {
            APIResponse response;

            var result = await _storageIntegrationService.SetStorageActiveAsync(storageName, UserDetails());
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

        [HttpGet]
        [Route("storageIntegration/linkStorageDrive")]
        public async Task<IActionResult> LinkStorageDrive(string storageName, string code)
        {
            APIResponse response;

            var result = await _storageIntegrationService.LinkUserStorageAsync(storageName, code, UserDetails());
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

        [HttpGet]
        [Route("storageIntegration/getDriveConfiguration")]
        public async Task<IActionResult> GetDriveConfiguration(string storageName)
        {
            APIResponse response;

            var result = await _storageIntegrationService.GetDriveConfigurationAsync(storageName, UserDetails());
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

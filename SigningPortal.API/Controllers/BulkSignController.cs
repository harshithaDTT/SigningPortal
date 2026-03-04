using Microsoft.AspNetCore.Mvc;
using SigningPortal.Core.DTOs;
using SigningPortal.Core;
using System.Threading.Tasks;
using SigningPortal.Core.Domain.Services;
using SigningPortal.API.Attributes;
using SigningPortal.Core.Services;
using System.IO;

namespace SigningPortal.API.Controllers
{
    [Route("api")]
    [ApiController]
    [ServiceFilter(typeof(AuthorizeAttribute))]
    public class BulkSignController : BaseController
    {
        private readonly IBulkSignService _bulkSignService;
        public BulkSignController(IBulkSignService bulkSignService)
        {
            _bulkSignService = bulkSignService;

        }

        [HttpGet]
        [Route("bulksign/get-bulksign-data-list")]
        public async Task<IActionResult> GetBulkSigDataList()
        {
            APIResponse response;

            var result = await _bulkSignService.GetBulkSigDataListAsync(UserDetails());
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
        [Route("bulksign/get-bulksign-data")]
        public async Task<IActionResult> GetBulkSigData(string corelationId)
        {
            APIResponse response;

            var result = await _bulkSignService.GetBulkSigDataAsync(corelationId);
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

        //[HttpPost]
        //[Route("bulksign/save-bulksign-data")]
        //public async Task<IActionResult> SaveBulksignConfig(string id)
        //{
        //    APIResponse response;

        //    var result = await _bulkSignService.SaveBulksignConfigAsync(id, UserDetails());
        //    if (!result.Success)
        //    {
        //        response = new APIResponse
        //        {
        //            Success = result.Success,
        //            Message = result.Message,
        //            Result = result.Result
        //        };
        //    }
        //    else
        //    {
        //        response = new APIResponse
        //        {
        //            Success = result.Success,
        //            Message = result.Message,
        //            Result = result.Result
        //        };
        //    }

        //    return Ok(response);
        //}

        [HttpPost]
        [Route("bulksign/prepare-bulksigning-request")]
        public async Task<IActionResult> PrepareBulkSigningRequest(string id)
        {
            APIResponse response;

            var result = await _bulkSignService.PrepareBulkSigningRequestAsync(id, UserDetails());
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


        //[HttpPost]
        //[Route("bulksign/Save-bulksigning-request")]
        //public async Task<IActionResult> SaveBulkSigningRequest(string id)
        //{
        //    APIResponse response;

        //    var result = await _bulkSignService.SaveBulkSigningRequestAsync(id, UserDetails());
        //    if (!result.Success)
        //    {
        //        response = new APIResponse
        //        {
        //            Success = result.Success,
        //            Message = result.Message,
        //            Result = result.Result
        //        };
        //    }
        //    else
        //    {
        //        response = new APIResponse
        //        {
        //            Success = result.Success,
        //            Message = result.Message,
        //            Result = result.Result
        //        };
        //    }

        //    return Ok(response);
        //}


        [HttpPost]
        [Route("bulksign/Fail-bulksigning-request")]
        public async Task<IActionResult> FailedBulkSigningRequest(string corelationId)
        {
            APIResponse response;

            var result = await _bulkSignService.FailBulkSigningRequestAsync(corelationId);
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

        [HttpPost]
        [Route("bulksigne/bulksigned-document")]
        public async Task<IActionResult> BulkSignCallBack(BulkSignCallBackDTO bulkSignCallBackDTO)
        {
            APIResponse response;

            var result = await _bulkSignService.BulkSignCallBackAsync(bulkSignCallBackDTO);
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
        [Route("bulksigne/download-signed-document")]
        public async Task<IActionResult> DownloadSignedDocument(string fileName, string corelationId)
        {
            var result = await _bulkSignService.DownloadSignedDocumentAsync(fileName, corelationId);
            if (!result.Success)
            {

                return StatusCode(500, result.Message);
            }
            else
            {
                MemoryStream stream = new MemoryStream((byte[])result.Result);

                return new FileStreamResult(stream, "application/octet-stream");
            }
        }

        [HttpGet]
        [Route("bulksign/get-bulksigner-list")]
        public async Task<IActionResult> GetBulkSignerList()
        {
            APIResponse response;

            var result = await _bulkSignService.GetBulkSignerListAsync(UserDetails().OrganizationId);
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
        [Route("bulksign/get-agent-url")]
        public async Task<IActionResult> GetAgentUrl()
        {
            APIResponse response;

            var result = await _bulkSignService.GetAgentUrlAsync(UserDetails().OrganizationId);
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

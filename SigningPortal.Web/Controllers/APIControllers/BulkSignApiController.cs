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
    public class BulkSignApiController : ApiBaseController
    {
        private readonly IBulkSignService _bulkSignService;
        public BulkSignApiController(IBulkSignService bulkSignService)
        {
            _bulkSignService = bulkSignService;
        }

        [HttpGet]
        [Route("bulksign/get-bulksign-data-list")]
        public async Task<IActionResult> GetBulkSigDataList()
        {
            var result = await _bulkSignService.GetBulkSigDataListAsync(UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpGet]
        [Route("bulksign/get-bulksign-data")]
        public async Task<IActionResult> GetBulkSigData(string corelationId)
        {
            var result = await _bulkSignService.GetBulkSigDataAsync(corelationId);

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
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
            var result = await _bulkSignService.PrepareBulkSigningRequestAsync(id, UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
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
            var result = await _bulkSignService.FailBulkSigningRequestAsync(corelationId);

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        //[HttpPost]
        //[Route("bulksigne/bulksigned-document")]
        //public async Task<IActionResult> BulkSignCallBack(BulkSignCallBackDTO bulkSignCallBackDTO)
        //{
        //    var result = await _bulkSignService.BulkSignCallBackAsync(bulkSignCallBackDTO);

        //    return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        //}

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
            var result = await _bulkSignService.GetBulkSignerListAsync(UserDetails().OrganizationId);

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }


        [HttpGet]
        [Route("bulksign/get-agent-url")]
        public async Task<IActionResult> GetAgentUrl()
        {
            var result = await _bulkSignService.GetAgentUrlAsync(UserDetails().OrganizationId);

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }
    }
}

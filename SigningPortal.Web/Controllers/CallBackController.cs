using Microsoft.AspNetCore.Mvc;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;

namespace SigningPortal.Web.Controllers
{
    [Route("api")]
    [ApiController]
    //[ServiceFilter(typeof(AuthorizeAttribute))]
    public class CallBackController : Controller
    {
        private readonly IBulkSignService _bulkSignService;
        private readonly IDocumentService _documentService;
        private readonly IDigitalFormResponseService _digitalFormResponseService;
        public CallBackController(IBulkSignService bulkSignService, IDocumentService documentService, IDigitalFormResponseService digitalFormResponseService)
        {
            _bulkSignService = bulkSignService;
            _documentService = documentService;
            _digitalFormResponseService = digitalFormResponseService;
        }
        [HttpPost]
        [Route("bulksigne/bulksigned-document")]
        public async Task<IActionResult> BulkSignCallBack(BulkSignCallBackDTO bulkSignCallBackDTO)
        {
            var result = await _bulkSignService.BulkSignCallBackAsync(bulkSignCallBackDTO);

            return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
        }

        [HttpPost]
        [Route("signed-document")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> DocumentCallBack([FromForm] RecieveDocumentDTO document)
        {
            var result = await _documentService.RecieveDocumentAsync(document);

            return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
        }


    }
}

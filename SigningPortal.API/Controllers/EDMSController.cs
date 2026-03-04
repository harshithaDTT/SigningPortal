using System;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

using SigningPortal.API.Attributes;

using SigningPortal.Core;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;

namespace SigningPortal.API.Controllers
{
    [Route("api")]
    [ApiController]
    [ServiceFilter(typeof(AuthorizeAttribute))]
    public class EDMSController : BaseController
    {
        private readonly IEDMSService _edmsService;

        public EDMSController(IEDMSService edmsService)
        {
            _edmsService = edmsService;
        }

        [HttpGet]
        [Route("downloaddoc/{id}")]
        public async Task<IActionResult> DownloadDocument(int id)
        {
            var result = await _edmsService.GetDocumentAsync(id);
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

        [HttpPost]
        [Route("save")]
        public async Task<IActionResult> DownloadDocument2([FromForm] SaveFileDTO file)
        {
            var result = await _edmsService.saveDocumentAsync(file);
            if (!result.Success)
            {

                return StatusCode(500, result.Message);
            }
            else
            {
                return Ok(result);
            }
        }
    }
}

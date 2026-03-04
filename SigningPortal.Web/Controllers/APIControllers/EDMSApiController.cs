using Microsoft.AspNetCore.Mvc;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Web.Attributes;

namespace SigningPortal.Web.Controllers.APIControllers
{
	[Route("api")]
	[ApiController]
	[ServiceFilter(typeof(AuthorizeAttribute))]
	public class EDMSApiController : ApiBaseController
	{
		private readonly IEDMSService _edmsService;
		//private readonly IDocumentHelper _documentHelper;

		public EDMSApiController(IEDMSService edmsService)//, IDocumentHelper documentHelper)
		{
			_edmsService = edmsService;
			//_documentHelper = documentHelper;
		}

		[HttpGet]
		[Route("downloaddoc/{id}")]
		public async Task<IActionResult> DownloadDocument(string id)
		{
			var result = await _edmsService.GetDocumentAsync(id);

			if (!result.Success)
			{
				return Ok(new APIResponse
				{
					Success = result.Success,
					Result = result.Result,
					Message = result.Message
				});
			}

			if (result.Result is not byte[] fileBytes || fileBytes.Length == 0)
			{
				return Ok(new APIResponse { Success = false, Result = null, Message = "Document not found or empty." });
			}

			return File(fileBytes, "application/octet-stream");
		}


		//[HttpPost]
		//[Route("edms/savedoc")]
		//public async Task<IActionResult> SaveDocumentToEDMS([FromForm] IFormFile file, [FromForm] string documentName)
		//{
		//	var expiryDate = DateTime.UtcNow.AddDays(365).ToString("yyyy-MM-dd HH:mm:ss");

		//	var result = await _documentHelper.SaveDocumentToEDMS(file, documentName, expiryDate, UserDetails().Suid);

		//	return Ok(new APIResponse() { Result = result.Result, Message = result.Message, Success = result.Success });
		//}

		//[HttpPost]
		//[Route("edms/updatedoc/{edmsId}")]
		//public async Task<IActionResult> UpdateDocumentToEDMS(string edmsId, [FromForm] IFormFile file, [FromForm] string documentName)
		//{
		//	var result = await _documentHelper.UpdateDocumentToEDMS(edmsId, file, documentName, UserDetails().Suid);

		//	return Ok(new APIResponse() { Result = result.Result, Message = result.Message, Success = result.Success });
		//}

		//[HttpPost]
		//[Route("save")]
		//public async Task<IActionResult> DownloadDocument2([FromForm] SaveFileDTO file)
		//{
		//	var result = await _edmsService.saveDocumentAsync(file);
		//	if (!result.Success)
		//	{

		//		return StatusCode(500, result.Message);
		//	}
		//	else
		//	{
		//		return Ok(result);
		//	}
		//}
	}
}

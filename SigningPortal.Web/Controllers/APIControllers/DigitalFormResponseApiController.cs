using Microsoft.AspNetCore.Mvc;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using SigningPortal.Web.Attributes;

namespace SigningPortal.Web.Controllers.APIControllers
{
	[Route("api")]
	[ApiController]
	[ServiceFilter(typeof(AuthorizeAttribute))]
	public class DigitalFormResponseApiController(IDigitalFormResponseService digitalFormResponseService) : ApiBaseController
	{
		[HttpPost]
		[Route("digitalformresponse/save-newdigitalform-response")]
		[IgnoreAntiforgeryToken]
		public async Task<IActionResult> SaveNewDigitalFormResponse([FromForm] DigitalFormResponseDTO document)
		{
			var result = await digitalFormResponseService.SaveDigitalFormResponseAsync(document, UserDetails());

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpGet]
		[Route("digitalformresponse/get-response-by-id")]
		public async Task<IActionResult> GetDigitalFormResponseByIdAsync(string formId)
		{
			var result = await digitalFormResponseService.GetDigitalFormResponseByIdAsync(formId);

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpGet]
		[Route("digitalformresponse/get-response-by-tempid-and-suid")]
		public async Task<IActionResult> GetDigitalFormResponseByTemplateIdAndSuidAsync(string templateId, string suid)
		{
			var result = await digitalFormResponseService.GetDigitalFormResponseByTemplateIdAndSuidAsync(templateId, suid);

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpGet]
		[Route("digitalformresponse/get-response-list")]
		public async Task<IActionResult> GetDigitalFormResponseListByTemplateIdAsync(string templateId)
		{
			var result = await digitalFormResponseService.GetDigitalFormResponseListByTemplateIdAsync(templateId);

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpGet]
		[Route("digitalformresponse/get-new-response-list")]
		public async Task<IActionResult> GetNewDigitalFormResponseListByTemplateIdAsync(string templateId)
		{
			var result = await digitalFormResponseService.GetNewDigitalFormResponseListByTemplateIdAsync(templateId);

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpGet]
		[Route("digitalformresponse/get-self-response-list")]
		public async Task<IActionResult> GetSelfDigitalFormResponseListAsync()
		{
			var result = await digitalFormResponseService.GetSelfDigitalFormResponseListAsync(UserDetails());

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpGet]
		[Route("digitalformresponse/get-digital-form-filldata/{suid}")]
		public async Task<IActionResult> GetDigitalFormFillDataAsync(string suid)
		{
			var result = await digitalFormResponseService.GetDigitalFormFillDataAsync(suid);

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpGet]
		[Route("digitalformresponse/delete-response-by-suid-and-templateid")]
		public async Task<IActionResult> FormPaymentGateway(string suid, string tempId)
		{
			var result = await digitalFormResponseService.DeleteFormResponseBySuidAndTempId(suid, tempId);

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpGet]
		[Route("digitalformresponse/get-csv-response-sheet")]
		public async Task<IActionResult> GetCSVResponseSheetAsync(string templateId)
		{
			var result = await digitalFormResponseService.GenerateCSVResponseSheet(templateId);

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpGet]
		[Route("digitalformresponse/get-new-csv-response-sheet")]
		public async Task<IActionResult> GetNewCSVResponseSheetAsync(string templateId)
		{
			var result = await digitalFormResponseService.GenerateNewCSVResponseSheet(templateId);

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpPost]
		[Route("digitalformresponse/new-save-newdigitalform-response")]
		[IgnoreAntiforgeryToken]
		public async Task<IActionResult> NewSaveNewDigitalFormResponse([FromForm] DigitalFormResponseDTO document)
		{
			var result = await digitalFormResponseService.NewSaveDigitalFormResponseAsync(document, UserDetails());

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		//[HttpPost]
		//[Route("digitalformresponse/new-callback-update")]
		//public async Task<IActionResult> NewUpdateDigitalFormResponse([FromForm] RecieveDocumentDTO document)
		//{
		//	var result = await digitalFormResponseService.NewCallBackDigitalFormResponseUpdateAsync(document);

		//	return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		//}

		[HttpPost]
		[Route("digitalformresponse/signed-form-document")]
		[IgnoreAntiforgeryToken]
		public async Task<IActionResult> ReceivedFormDocumentCallback([FromForm] RecieveDocumentDTO document)
		{
			var result = await digitalFormResponseService.ReceivedFormDocumentAsync(document);

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpPost]
		[Route("digitalformresponse/decline-form-signing/{tempDocumentId}")]
		public async Task<IActionResult> DeclineFormSigning(string tempDocumentId, DeclineDocumentSigningDTO declineDto)
		{
			var result = await digitalFormResponseService.DeclineTemplateDocumentSigningAsync(tempDocumentId, declineDto);

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}
	}
}

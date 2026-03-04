using Microsoft.AspNetCore.Mvc;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication.TemplateDocuments;
using SigningPortal.Core.DTOs;
using SigningPortal.Web.Attributes;

namespace SigningPortal.Web.Controllers.APIControllers
{
	[Route("api")]
	[ApiController]
	[ServiceFilter(typeof(AuthorizeAttribute))]
	public class TemplateDocumentApiController : ApiBaseController
	{
		private readonly ITemplateDocumentService _templateDocumentService;

		public TemplateDocumentApiController(ITemplateDocumentService templateDocumentService)
		{
			_templateDocumentService = templateDocumentService;
		}

		[HttpGet("template-doc/getmytempdoclist")]
		public async Task<IActionResult> GetMyTemplateDocumentList()
		{
			var result = await _templateDocumentService.GetMyTemplateDocumentList(UserDetails());

			return Ok(new APIResponse { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpGet("template-doc/getsenttempdoclist")]
		public async Task<IActionResult> GetSentTemplateDocumentList()
		{
			var result = await _templateDocumentService.GetSentTemplateDocumentList(UserDetails());

			if (result.Success && result.Result is SentTemplateDocumentListResponse response)
			{
				var mappedResponse = new SentTemplateDocumentListResponseMobileDTO
				{
					MyCommonDoc = new TemplateDocumentMobileDTO
					{
						_id = response.MyCommonDoc._id,
						CreatedAt = response.MyCommonDoc.CreatedAt,
						UpdatedAt = response.MyCommonDoc.UpdatedAt,
						Status = response.MyCommonDoc.Status,
						FormTemplateName = response.MyCommonDoc.FormTemplateName,
						DocumentName = response.MyCommonDoc.DocumentName,
						ExpieryDate = response.MyCommonDoc.ExpieryDate,
						CompleteTime = response.MyCommonDoc.CompleteTime,
						EdmsId = response.MyCommonDoc.EdmsId,
						PendingSignList = response.MyCommonDoc.PendingSignList
					},
					Recepients = response.Recepients?.Select(r => new TemplateRecepientMobileDTO
					{
						_id = r._id,
						CreatedAt = r.CreatedAt,
						UpdatedAt = r.UpdatedAt,
						Signer = r.Signer,
						Decline = r.Decline,
						TakenAction = r.TakenAction,
						SignatureMandatory = r.SignatureMandatory,
						Order = r.Order,
						AlternateSignatories = r.AlternateSignatories
					}).ToList() ?? new List<TemplateRecepientMobileDTO>(),
					SentDocCount = response.SentDocCount,
					CompleteStatusCount = response.CompleteStatusCount
				};

				return Ok(new APIResponse
				{
					Success = true,
					Message = result.Message,
					Result = mappedResponse
				});
			}

			return Ok(new APIResponse
			{
				Success = result.Success,
				Message = result.Message,
				Result = result.Result
			});
		}

		[HttpGet("template-doc/getreceivedtempdoclist")]
		public async Task<IActionResult> GetReceivedTemplateDocumentList()
		{
			var result = await _templateDocumentService.GetReceivedTemplateDocumentsList(UserDetails());

			if (result.Success && result.Result is List<TemplateDocument> response)
			{
				var mappedResponse = response.Select(doc => new TemplateDocumentMobileListDTO
				{
					_id = doc._id,
					CreatedAt = doc.CreatedAt,
					UpdatedAt = doc.UpdatedAt,
					Owner = doc.Owner,
					FormId = doc.FormId,
					TemplateType = doc.TemplateType,
					Status = doc.Status,
					FormTemplateName = doc.FormTemplateName,
					DocumentName = doc.DocumentName,
					EdmsId = doc.EdmsId,
					ExpieryDate = doc.ExpieryDate,
					CompleteTime = doc.CompleteTime,
					PendingSignList = doc.PendingSignList ?? new List<User>(),
					TemplateRecepients = doc.TemplateRecepients?.Select(r => new TemplateRecepientMobileDTO
					{
						_id = r._id,
						CreatedAt = r.CreatedAt,
						UpdatedAt = r.UpdatedAt,
						Signer = r.Signer,
						Decline = r.Decline,
						TakenAction = r.TakenAction,
						SignatureMandatory = r.SignatureMandatory,
						Order = r.Order,
						AlternateSignatories = r.AlternateSignatories ?? new List<User>()
					}).ToList() ?? new List<TemplateRecepientMobileDTO>()
				}).ToList();

				return Ok(new APIResponse
				{
					Success = true,
					Message = result.Message,
					Result = mappedResponse
				});
			}

			return Ok(new APIResponse
			{
				Success = result.Success,
				Message = result.Message,
				Result = result.Result
			});
		}

		[HttpGet("template-doc/getreferredtempdoclist")]
		public async Task<IActionResult> GetReferredDocumentsList()
		{
			var result = await _templateDocumentService.GetReferredDocumentsList(UserDetails());

			if (result.Success && result.Result is List<TemplateDocument> response)
			{
				var mappedResponse = response.Select(doc => new TemplateDocumentMobileListDTO
				{
					_id = doc._id,
					CreatedAt = doc.CreatedAt,
					UpdatedAt = doc.UpdatedAt,
					Owner = doc.Owner,
					FormId = doc.FormId,
					TemplateType = doc.TemplateType,
					Status = doc.Status,
					FormTemplateName = doc.FormTemplateName,
					DocumentName = doc.DocumentName,
					EdmsId = doc.EdmsId,
					ExpieryDate = doc.ExpieryDate,
					CompleteTime = doc.CompleteTime,
					PendingSignList = doc.PendingSignList ?? new List<User>(),
					TemplateRecepients = doc.TemplateRecepients?.Select(r => new TemplateRecepientMobileDTO
					{
						_id = r._id,
						CreatedAt = r.CreatedAt,
						UpdatedAt = r.UpdatedAt,
						Signer = r.Signer,
						Decline = r.Decline,
						TakenAction = r.TakenAction,
						SignatureMandatory = r.SignatureMandatory,
						Order = r.Order,
						AlternateSignatories = r.AlternateSignatories ?? new List<User>()
					}).ToList() ?? new List<TemplateRecepientMobileDTO>()
				}).ToList();

				return Ok(new APIResponse
				{
					Success = true,
					Message = result.Message,
					Result = mappedResponse
				});
			}

			return Ok(new APIResponse { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpPost("template-doc/savenewtemplatedocument")]
		public async Task<IActionResult> SaveTemplateDocument(TemplateSendingDTO templateDTO)
		{
			var result = await _templateDocumentService.SaveTemplateDocumentListAsync(templateDTO, UserDetails());

			return Ok(new APIResponse { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpGet("template-doc/gettemplatedoclistbyformid/{formId}")]
		public async Task<IActionResult> GetTemplateDocumentListByFormId(string formId)
		{
			var result = await _templateDocumentService.GetTemplateDocumentListByFormIdAsync(formId);

			return Ok(new APIResponse { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpGet("template-doc/gettemplatedoclistbyreqgroupid/{groupId}")]
		public async Task<IActionResult> GetTemplateDocumentListbyGroupId(string groupId)
		{
			var result = await _templateDocumentService.GetTemplateDocumentListByGroupIdAsync(groupId);

			return Ok(new APIResponse { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpGet("template-doc/gettemplatedocument/{id}")]
		public async Task<IActionResult> GetTemplateDocument(string id)
		{
			var result = await _templateDocumentService.GetTemplateDocumentByIdAsync(id);

			return Ok(new APIResponse { Message = result.Message, Result = result.Result, Success = result.Success });
		}

		[HttpGet("template-doc/gettemplatedocumentbyid/{id}")]
		public async Task<IActionResult> GetTemplateDocumentById(string id)
		{
			var result = await _templateDocumentService.GetTemplateDocumentByIdAsync(id);

			if (result.Success && result.Result is TemplateDocument doc)
			{
				var mappedResponse = new TemplateDocumentMobileListDTO()
				{
					_id = doc._id,
					CreatedAt = doc.CreatedAt,
					UpdatedAt = doc.UpdatedAt,
					Owner = doc.Owner,
					FormId = doc.FormId,
					TemplateType = doc.TemplateType,
					Status = doc.Status,
					FormTemplateName = doc.FormTemplateName,
					DocumentName = doc.DocumentName,
					EdmsId = doc.EdmsId,
					ExpieryDate = doc.ExpieryDate,
					CompleteTime = doc.CompleteTime,
					PendingSignList = doc.PendingSignList ?? new List<User>(),
					TemplateRecepients = doc.TemplateRecepients?.Select(r => new TemplateRecepientMobileDTO
					{
						_id = r._id,
						CreatedAt = r.CreatedAt,
						UpdatedAt = r.UpdatedAt,
						Signer = r.Signer,
						Decline = r.Decline,
						TakenAction = r.TakenAction,
						SignatureMandatory = r.SignatureMandatory,
						Order = r.Order,
						AlternateSignatories = r.AlternateSignatories ?? new List<User>()
					}).ToList() ?? new List<TemplateRecepientMobileDTO>()
				};

				return Ok(new APIResponse
				{
					Success = true,
					Message = result.Message,
					Result = mappedResponse
				});
			}

			return Ok(new APIResponse { Message = result.Message, Result = result.Result, Success = result.Success });
		}
	}
}

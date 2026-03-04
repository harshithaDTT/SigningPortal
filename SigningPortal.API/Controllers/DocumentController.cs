using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SigningPortal.API.Attributes;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using System.Threading.Tasks;

namespace SigningPortal.API.Controllers
{
	[Route("api")]
	[ApiController]
	[ServiceFilter(typeof(AuthorizeAttribute))]
	public class DocumentController : BaseController
	{
		private readonly IDocumentService _documentService;
		private readonly IDocumentHelper _documentHelper;

		public DocumentController(IDocumentService documentService,
			IDocumentHelper documentHelper)
		{
			_documentService = documentService;
			_documentHelper = documentHelper;
		}

		[HttpGet]
		[Route("docset/{orgId}")]
		public IActionResult GetAllowedFileSize(string orgId)
		{
			APIResponse response;

			var result = _documentService.GetFileConfigurationAsync(orgId);
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
		[Route("documents/ownstats")]
		public async Task<IActionResult> OwnDocumentStatus()
		{
			APIResponse response;

			var result = await _documentService.OwnDocumentStatusAsync(UserDetails());
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
		[Route("documents/otherstats")]
		public async Task<IActionResult> OtherDocumentStatus()
		{
			APIResponse response;

			var result = await _documentService.OtherDocumentStatusAsync(UserDetails());
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
		[Route("documents/docstats")]
		public async Task<IActionResult> DocumentStatus()
		{
			APIResponse response = new APIResponse();

			var result = await _documentService.DocumentStatusAsync(UserDetails());

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
		[Route("documents")]
		public async Task<IActionResult> GetAllDocuments()
		{
			APIResponse response;

			var result = await _documentService.GetAllDocumentsAsync(UserDetails());
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
		[Route("documents/{id}")]
		public async Task<IActionResult> GetDocumentDetaildById(string id)
		{
			APIResponse response;

			var result = await _documentService.GetDocumentDetaildByIdAsync(id);
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
		[Route("documents/edms/{tempId}")]
		public async Task<IActionResult> GetDocumentFromEDMSByTempId(string tempId)
		{
			APIResponse response;

			var result = await _documentService.GetDocumentDetaildByIdAsync(tempId);
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
		[Route("documents/declinecomment/{tempId}")]
		public async Task<IActionResult> GetDeclinedCommentDetails(string tempId)
		{
			APIResponse response;

			var result = await _documentService.GetDeclinedCommentDetailsAsync(tempId);
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

		//[HttpGet]
		//[Route("documents/sendemail/{tempId}")]
		//public async Task<IActionResult> SendEmailToRecepients(string tempId)
		//{
		//    APIResponse response;

		//    SendEmailObj emailObj = new SendEmailObj()
		//    {
		//        UserEmail = Email,
		//        UserName = Name,
		//        Id = tempId
		//    };

		//    var result = await _documentHelper.SendAnEmailToRecipient(emailObj);
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

		//Currently not using
		//[HttpGet]
		//[Route("documents/pendingactionlist")]
		//public async Task<IActionResult> GetPendingActionList()
		//{
		//    APIResponse response;

		//    var result = await _documentService.GetPendingActionListAsync(Email);
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

		//Currently not using
		//[HttpGet]
		//[Route("documents/expireactionlist")]
		//public async Task<IActionResult> GetExpireActionList()
		//{
		//    APIResponse response;

		//    var result = await _documentService.GetExpireActionListAsync(Email);
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

		[HttpGet]
		[Route("documents/documentblockedstatus/{id}")]
		public async Task<IActionResult> IsDocumentBlocked(string id)
		{
			APIResponse response;

			var result = await _documentService.IsDocumentBlockedAsync(id);
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

		[HttpPut]
		[Route("documents/decline/{tempId}")]
		public async Task<IActionResult> DeclineDocumentSigning(string tempId, DeclineDocumentSigningDTO declineDocumentSigningDTO)
		{
			APIResponse response;

			if (string.IsNullOrEmpty(declineDocumentSigningDTO.UserName))
			{
				declineDocumentSigningDTO.UserName = Name;
			}

			var result = await _documentService.DeclineDocumentSigningAsync(tempId, declineDocumentSigningDTO);
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

		[HttpPut]
		[Route("documents/recall/{tempId}")]
		public async Task<IActionResult> RecallDocumentToSign(string tempId)
		{
			APIResponse response;

			var result = await _documentService.RecallDocumentToSignAsync(tempId);
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
		[Route("documents/savenewdoc")]
		public async Task<IActionResult> SaveNewDocument([FromForm] SaveNewDocumentDTO newDocument)
		{
			APIResponse response;

			var result = await _documentService.SaveNewDocumentAsync(newDocument, UserDetails());
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
		[Route("documents/sendsigningrequest")]
		public async Task<IActionResult> SendSigningRequest([FromForm] SigningRequestDTO signingRequest)
		{
			APIResponse response;

			var result = await _documentService.SendSigningRequestAsync(signingRequest, UserDetails());
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
		[Route("documents/sendsigningrequestnew")]
		public async Task<IActionResult> SendSigningRequestNew([FromForm] SigningRequestNewDTO signingRequest)
		{
			APIResponse response;

			var result = await _documentService.SendSigningRequestNewAsync(signingRequest, UserDetails());
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
		[Route("documents/sendverifyrequest2")]
		public async Task<IActionResult> VerifySignedDocument(VerifySignedDocumentDTO signedDocument)
		{
			APIResponse response;

			var result = await _documentService.VerifySignedDocumentAsync(signedDocument);
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
		[Route("signed-document")]
		public async Task<IActionResult> RecieveDocument([FromForm] RecieveDocumentDTO document)
		{
			APIResponse response;

			var dd = HttpContext.Request.Body;

			var result = await _documentService.RecieveDocumentAsync(document);
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
		[Route("documents/delete")]
		public async Task<IActionResult> DeleteDocumentByIdList(DeleteDocumentDTO idList)
		{
			APIResponse response;

			var result = await _documentService.DeleteDocumentByIdListAsync(idList);
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

		///////////////////////////////////////////////////////////////


		/// <summary>
		/// New Flow for document list
		/// </summary>
		/// <returns></returns>

		[HttpGet]
		[Route("documents/getdraftdocumentlist")]
		public async Task<IActionResult> GetDraftDocumentList()
		{
			APIResponse response;

			var result = await _documentService.GetDraftDocumentListAsync(UserDetails());
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
		[Route("documents/getsentdocumentlist")]
		public async Task<IActionResult> GetSentDocumentList()
		{
			APIResponse response;

			var result = await _documentService.GetSentDocumentListAsync(UserDetails());
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
		[Route("documents/getreceiveddocumentlist")]
		public async Task<IActionResult> GetReceivedDocumentList()
		{
			APIResponse response;

			var result = await _documentService.GetReceivedDocumentsList(UserDetails());
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
		[Route("documents/getreferreddocumentlist")]
		public async Task<IActionResult> GetReferredDocumentList()
		{
			APIResponse response;

			var result = await _documentService.GetReferredDocumentsList(UserDetails());
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

		/// <summary>
		/// //////////////////////////////////////////////////////////////////////
		/// </summary>
		/// <param name="assignDocumentToSomeone"></param>
		/// <returns></returns>

		[HttpPost]
		[Route("documents/assigndocumenttosomeone")]
		public async Task<IActionResult> AssignDocumentToSomeone(AssignDocumentToSomeoneDTO assignDocumentToSomeone)
		{
			APIResponse response;

			var result = await _documentService.AssignDocumentToSomeoneAsync(assignDocumentToSomeone, UserDetails());
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
		[Route("documents/getfilterdocumentlist")]
		public async Task<IActionResult> GetDocumentsListByFilter(FilterDocumentDTO Model)
		{
			APIResponse response;

			var result = await _documentService.GetDocumentsListByFilter(Model, UserDetails());
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
		[Route("getorganizationlist/{email}")]
		public async Task<IActionResult> GetOrganizationList(string email)
		{
			APIResponse response;

			var result = await _documentService.GetOrganizationListAsync(email);
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
		[Route("getorganizationcertificatedetails/{organizationId}")]
		public async Task<IActionResult> GetOrganizationCertificateDetails(string organizationId)
		{
			APIResponse response;

			var result = await _documentService.GetOrganizationCertificateDetailstAsync(organizationId);
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

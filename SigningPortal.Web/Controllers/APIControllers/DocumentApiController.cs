using Microsoft.AspNetCore.Mvc;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using SigningPortal.Web.Attributes;
using System.Linq;

namespace SigningPortal.Web.Controllers.APIControllers
{
	[Route("api")]
	[ApiController]
	[ServiceFilter(typeof(AuthorizeAttribute))]
	public class DocumentApiController : ApiBaseController
	{
		private readonly IDocumentService _documentService;
		private readonly IDocumentHelper _documentHelper;

		public DocumentApiController(IDocumentService documentService,
			IDocumentHelper documentHelper)
		{
			_documentService = documentService;
			_documentHelper = documentHelper;
		}

		[HttpGet]
		[Route("docset/{orgId}")]
		public IActionResult GetAllowedFileSize(string orgId)
		{
			var result = _documentService.GetFileConfigurationAsync(orgId);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpGet]
		[Route("documents/ownstats")]
		public async Task<IActionResult> OwnDocumentStatus()
		{
			var result = await _documentService.DashboardDocumentStatusAsync(UserDetails());

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpGet]
		[Route("documents/otherstats")]
		public async Task<IActionResult> OtherDocumentStatus()
		{
			var result = await _documentService.OtherDocumentStatusAsync(UserDetails());

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpGet]
		[Route("documents/docstats")]
		public async Task<IActionResult> DocumentStatus()
		{
			var result = await _documentService.DocumentStatusAsync(UserDetails());

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpGet]
		[Route("documents")]
		public async Task<IActionResult> GetAllDocuments()
		{
			var result = await _documentService.GetAllDocumentsAsync(UserDetails());

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpGet]
		[Route("documents/{id}")]
		public async Task<IActionResult> GetDocumentDetaildById(string id)
		{
			var result = await _documentService.GetDocumentDetaildByIdAsync(id);

			if (!result.Success || result.Result == null)
			{
				return Ok(new APIResponse { Success = result.Success, Message = result.Message, Result = result.Result });
			}

			if (result.Result is not Document document)
			{
				return Ok(new APIResponse { Success = false, Message = "Invalid document data.", Result = null });
			}

			var docDTO = new DocumentDTO
			{
				_id = document._id,
				CreatedAt = document.CreatedAt,
				UpdatedAt = document.UpdatedAt,
				DocumentName = document.DocumentName,
				OwnerName = document.OwnerName,
				OwnerEmail = document.OwnerEmail,
				Status = document.Status,
				Annotations = document.Annotations,
				EsealAnnotations = document.EsealAnnotations,
				QrCodeAnnotations = document.QrCodeAnnotations,
				ExpireDate = document.ExpireDate,
				DisableOrder = document.DisableOrder,
				EdmsId = document.EdmsId,
				Recepients = document.Recepients?.Select(r => new RecepientsDTO
				{
					_id = r._id,
					CreatedAt = r.CreatedAt,
					UpdatedAt = r.UpdatedAt,
					SignedBy = r.SignedBy,
					Name = r.Name,
					Email = r.Email,
					Suid = r.Suid,
					Status = r.Status,
					Order = r.Order,
					SigningCompleteTime = r.SigningCompleteTime,
					TakenAction = r.TakenAction,
					SignatureMandatory = r.SignatureMandatory,
					HasDelegation = r.HasDelegation,
					AllowComments = r.AllowComments,
					SignTemplate = r.SignTemplate,
					EsealTemplate = r.EsealTemplate,
					AlternateSignatories = r.AlternateSignatories ?? new List<User>()
				}).ToList(),
				PendingSignList = document.PendingSignList ?? new List<User>(),
				CompleteSignList = document.CompleteSignList ?? new List<User>()
			};

			return Ok(new APIResponse
			{
				Success = true,
				Message = result.Message,
				Result = docDTO
			});
		}

		[HttpGet]
		[Route("documents/edms/{tempId}")]
		public async Task<IActionResult> GetDocumentFromEDMSByTempId(string tempId)
		{
			var result = await _documentService.GetDocumentDetaildByIdAsync(tempId);

			if (!result.Success || result.Result == null)
			{
				return Ok(new APIResponse { Success = result.Success, Message = result.Message, Result = result.Result });
			}

			var document = result.Result as Document;

			if (document == null)
			{
				return Ok(new APIResponse { Success = false, Message = "Invalid document data.", Result = null });
			}

			var docDTO = new DocumentDTO
			{
				_id = document._id,
				CreatedAt = document.CreatedAt,
				UpdatedAt = document.UpdatedAt,
				DocumentName = document.DocumentName,
				OwnerName = document.OwnerName,
				OwnerEmail = document.OwnerEmail,
				Status = document.Status,
				Annotations = document.Annotations,
				EsealAnnotations = document.EsealAnnotations,
				QrCodeAnnotations = document.QrCodeAnnotations,
				ExpireDate = document.ExpireDate,
				DisableOrder = document.DisableOrder,
				EdmsId = document.EdmsId,
				SignatureRequiredCount = document.SignaturesRequiredCount,
				Recepients = document.Recepients?.Select(r => new RecepientsDTO
				{
					_id = r._id,
					CreatedAt = r.CreatedAt,
					UpdatedAt = r.UpdatedAt,
					Name = r.Name,
					Email = r.Email,
					Suid = r.Suid,
					Status = r.Status,
					Order = r.Order,
					DeclineRemark = r.DeclineRemark,
					SignedBy = r.SignedBy,
					SigningCompleteTime = r.SigningCompleteTime,
					TakenAction = r.TakenAction,
					SignatureMandatory = r.SignatureMandatory,
					HasDelegation = r.HasDelegation,
					AllowComments = r.AllowComments,
					SignTemplate = r.SignTemplate,
					EsealTemplate = r.EsealTemplate,
					AlternateSignatories = r.AlternateSignatories ?? new List<User>()
				}).ToList(),
				PendingSignList = document.PendingSignList ?? new List<User>(),
				CompleteSignList = document.CompleteSignList ?? new List<User>()
			};

			return Ok(new APIResponse
			{
				Success = true,
				Message = result.Message,
				Result = docDTO
			});
		}

		[HttpGet]
		[Route("documents/declinecomment/{tempId}")]
		public async Task<IActionResult> GetDeclinedCommentDetails(string tempId)
		{
			var result = await _documentService.GetDeclinedCommentDetailsAsync(tempId);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		//[HttpGet]
		//[Route("documents/sendemail/{tempId}")]
		//public async Task<IActionResult> SendEmailToRecepients(string tempId)
		//{
		//	SendEmailObj emailObj = new SendEmailObj()
		//	{
		//		UserEmail = Email,
		//		UserName = Name,
		//		Id = tempId
		//	};

		//	var result = await _documentHelper.SendAnEmailToRecipient(emailObj);

		//	return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
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
			var result = await _documentService.IsDocumentBlockedAsync(id, UserDetails());

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpPut]
		[Route("documents/decline/{tempId}")]
		public async Task<IActionResult> DeclineDocumentSigning(string tempId, DeclineDocumentSigningDTO declineDocumentSigningDTO)
		{
			if (string.IsNullOrEmpty(declineDocumentSigningDTO.UserName))
			{
				declineDocumentSigningDTO.UserName = Name;
			}

			var result = await _documentService.DeclineDocumentSigningAsync(tempId, declineDocumentSigningDTO);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpPut]
		[Route("documents/recall/{tempId}")]
		public async Task<IActionResult> RecallDocumentToSign(string tempId)
		{
			var result = await _documentService.RecallDocumentToSignAsync(tempId);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpPost]
		[Route("documents/savenewdoc")]
		[IgnoreAntiforgeryToken]
		public async Task<IActionResult> SaveNewDocument([FromForm] SaveNewDocumentDTO newDocument)
		{
			var result = await _documentService.SaveNewDocumentAsync(newDocument, UserDetails());

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpPost]
		[Route("documents/sendsigningrequest")]
		[IgnoreAntiforgeryToken]
		public async Task<IActionResult> SendSigningRequest([FromForm] SigningRequestDTO signingRequest)
		{
			var result = await _documentService.SendSigningRequestAsync(signingRequest, UserDetails());

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpPost]
		[Route("documents/sendsigningrequestnew")]
		[IgnoreAntiforgeryToken]
		public async Task<IActionResult> SendSigningRequestNew([FromForm] SigningRequestNewDTO signingRequest)
		{
			var result = await _documentService.SendSigningRequestNewAsync(signingRequest, UserDetails());

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpPost]
		[Route("documents/sendverifyrequest2")]
		public async Task<IActionResult> VerifySignedDocument(VerifySignedDocumentDTO signedDocument)
		{
			var result = await _documentService.VerifySignedDocumentAsync(signedDocument);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		//[HttpPost]
		//[Route("signed-document")]
		//public async Task<IActionResult> RecieveDocument([FromForm] RecieveDocumentDTO document)
		//{
		//    var result = await _documentService.RecieveDocumentAsync(document);

		//    return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		//}

		[HttpPost]
		[Route("documents/delete")]
		public async Task<IActionResult> DeleteDocumentByIdList(DeleteDocumentDTO idList)
		{
			var result = await _documentService.DeleteDocumentByIdListAsync(idList);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpPost]
		[Route("documents/deletebysuid/{suid}")]
		public async Task<IActionResult> DeleteAllDocumentsBySuid(string suid)
		{
			var result = await _documentService.DeleteAllDocumentsBySuidAsync(suid);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpGet]
		[Route("documents/getdocdisplaydetails")]
		public async Task<IActionResult> GetDocumentDisplayDetaildById(string id)
		{
			var result = await _documentService.GetDocumentDisplayDetaildByIdAsync(id);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
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
			var result = await _documentService.GetDraftDocumentListAsync(UserDetails());

			var refinedDraftList = result.Result is List<Document> list
				? list.Select(document => new DocumentListDTO
				{
					_id = document._id,
					CreatedAt = document.CreatedAt,
					UpdatedAt = document.UpdatedAt,
					DocumentName = document.DocumentName,
					OwnerName = document.OwnerName,
					Status = document.Status,
					ExpireDate = document.ExpireDate,
				}).ToList()
				: [];

			return Ok(new APIResponse { Success = result.Success, Message = result.Message, Result = refinedDraftList });
		}

		//[HttpGet]
		//[Route("documents/getpaginteddraftdocumentlist")]
		//public async Task<IActionResult> GetPaginatedDraftDocumentList(int pageNumber)
		//{
		//	var result = await _documentService.GetPaginatedDraftDocumentListAsync(UserDetails(), pageNumber);

		//	return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		//}

		[HttpGet]
		[Route("documents/getsentdocumentlist")]
		public async Task<IActionResult> GetSentDocumentList()
		{
			var result = await _documentService.GetSentDocumentListAsync(UserDetails());

			var refinedSentList = result.Result is List<Document> list
				? list.Select(document => new DocumentListDTO
				{
					_id = document._id,
					CreatedAt = document.CreatedAt,
					UpdatedAt = document.UpdatedAt,
					DocumentName = document.DocumentName,
					OwnerName = document.OwnerName,
					Status = document.Status,
					ExpireDate = document.ExpireDate,
				}).ToList()
				: [];

			return Ok(new APIResponse { Success = result.Success, Message = result.Message, Result = refinedSentList });
		}

		//[HttpGet]
		//[Route("documents/getpaginatedsentdocumentlist")]
		//public async Task<IActionResult> GetPaginatedSentDocumentList(int pageNumber)
		//{
		//	var result = await _documentService.GetPaginatedSentDocumentListAsync(UserDetails(), pageNumber);

		//	return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		//}

		[HttpGet]
		[Route("documents/getreceiveddocumentlist")]
		public async Task<IActionResult> GetReceivedDocumentList()
		{
			var result = await _documentService.GetReceivedDocumentsList(UserDetails());

			var refinedReceivedList = result.Result is List<Document> list
				? list.Select(document => new DocumentListDTO
				{
					_id = document._id,
					CreatedAt = document.CreatedAt,
					UpdatedAt = document.UpdatedAt,
					DocumentName = document.DocumentName,
					OwnerName = document.OwnerName,
					Status = document.Status,
					ExpireDate = document.ExpireDate,
				}).ToList()
				: [];

			return Ok(new APIResponse { Success = result.Success, Message = result.Message, Result = refinedReceivedList });
		}

		//[HttpGet]
		//[Route("documents/getpaginatedreceiveddocumentlist")]
		//public async Task<IActionResult> GetPaginatedReceivedDocumentList(int pageNumber)
		//{
		//	var result = await _documentService.GetPaginatedReceivedDocumentsList(UserDetails(), pageNumber);

		//	return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		//}

		[HttpGet]
		[Route("documents/getreferreddocumentlist")]
		public async Task<IActionResult> GetReferredDocumentList()
		{
			var result = await _documentService.GetReferredDocumentsList(UserDetails());

			var refinedReferredList = result.Result is List<Document> list
				? list.Select(document => new DocumentListDTO
				{
					_id = document._id,
					CreatedAt = document.CreatedAt,
					UpdatedAt = document.UpdatedAt,
					DocumentName = document.DocumentName,
					OwnerName = document.OwnerName,
					Status = document.Status,
					ExpireDate = document.ExpireDate,
				}).ToList()
				: [];

			return Ok(new APIResponse { Success = result.Success, Message = result.Message, Result = refinedReferredList });
		}

		//[HttpGet]
		//[Route("documents/getpaginatedreferreddocumentlist")]
		//public async Task<IActionResult> GetPaginatedReferredDocumentList(int pageNumber)
		//{
		//	var result = await _documentService.GetPaginatedReferredDocumentsList(UserDetails(), pageNumber);

		//	return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		//}

		/// <summary>
		/// //////////////////////////////////////////////////////////////////////
		/// </summary>
		/// <param name="assignDocumentToSomeone"></param>
		/// <returns></returns>

		[HttpPost]
		[Route("documents/assigndocumenttosomeone")]
		public async Task<IActionResult> AssignDocumentToSomeone(AssignDocumentToSomeoneDTO assignDocumentToSomeone)
		{
			var result = await _documentService.AssignDocumentToSomeoneAsync(assignDocumentToSomeone, UserDetails());

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpPost]
		[Route("documents/getfilterdocumentlist")]
		public async Task<IActionResult> GetDocumentsListByFilter(FilterDocumentDTO Model)
		{
			var result = await _documentService.GetDocumentsListByFilter(Model, UserDetails());

			var filteredList = result.Result is List<Document> list
				? list.Select(document => new DocumentListDTO
				{
					_id = document._id,
					CreatedAt = document.CreatedAt,
					UpdatedAt = document.UpdatedAt,
					DocumentName = document.DocumentName,
					OwnerName = document.OwnerName,
					Status = document.Status,
					ExpireDate = document.ExpireDate,
				}).ToList()
				: [];

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = filteredList });
		}

		[HttpGet]
		[Route("getorganizationlist/{email}")]
		public async Task<IActionResult> GetOrganizationList(string email)
		{
			var result = await _documentService.GetOrganizationListAsync(email);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpGet]
		[Route("getorganizationcertificatedetails/{organizationId}")]
		public async Task<IActionResult> GetOrganizationCertificateDetails(string organizationId)
		{
			var result = await _documentService.GetOrganizationCertificateDetailstAsync(organizationId);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpGet]
		[Route("getdocumentreport/{docId}")]
		public async Task<IActionResult> GetDocumentReport(string docId)
		{
			var result = await _documentService.GetDocumentReportAsync(docId);

			return Ok(new APIResponse() { Message = result.Message, Result = result.Result, Success = result.Success });
		}

        /// <summary>
        /// Paginated List With Filters
        /// </summary>
        /// <param name="paginatedListDTO"></param>
        /// <returns></returns>

        [HttpPost]
        [Route("documents/getpaginteddraftdocumentlistbyfilter")]
        public async Task<IActionResult> GetPaginatedDraftDocumentList(PaginatedListDTO paginatedListDTO)
        {
            var result = await _documentService.GetPaginatedDraftDocumentListByFilterAsync(UserDetails(),
                paginatedListDTO.DocumentListFilter,
                paginatedListDTO.PageNumber,
                paginatedListDTO.PageSize,
                paginatedListDTO.Pagination);

            var refinedDraftList = result.Result is List<Document> list
                ? list.Select(document => new DocumentListDTO
                {
                    _id = document._id,
                    CreatedAt = document.CreatedAt,
                    UpdatedAt = document.UpdatedAt,
                    DocumentName = document.DocumentName,
                    OwnerName = document.OwnerName,
                    Status = document.Status,
                    ExpireDate = document.ExpireDate,
                    SigningStatus = document.Recepients != null
                    ? document.Recepients.FirstOrDefault(x => x.Suid == UserDetails().Suid)?.Status : null,
                    RecepientName = document.Recepients?
                    .Select(x => x.Name)
                    .ToList()
                ?? []
                }).ToList()
                : [];

            return Ok(new APIResponse { Success = result.Success, Message = result.Message, Result = refinedDraftList });
        }

        [HttpPost]
        [Route("documents/getpaginatedsentdocumentlistbyfilter")]
        public async Task<IActionResult> GetPaginatedSentDocumentList(PaginatedListDTO paginatedListDTO)
        {
            var result = await _documentService.GetPaginatedSentDocumentListByFilterAsync(UserDetails(),
                paginatedListDTO.DocumentListFilter,
                paginatedListDTO.PageNumber,
                paginatedListDTO.PageSize,
                paginatedListDTO.Pagination);

            var refinedSentList = result.Result is List<Document> list
                ? list.Select(document => new DocumentListDTO
                {
                    _id = document._id,
                    CreatedAt = document.CreatedAt,
                    UpdatedAt = document.UpdatedAt,
                    DocumentName = document.DocumentName,
                    OwnerName = document.OwnerName,
                    Status = document.Status,
                    ExpireDate = document.ExpireDate,
                    SigningStatus = document.Recepients != null
					? document.Recepients.FirstOrDefault(x => x.Suid == UserDetails().Suid)?.Status : null,
                    RecepientName = document.Recepients?
                    .Select(x => x.Name)
                    .ToList()
                ?? []
                }).ToList()
                : [];

            return Ok(new APIResponse { Success = result.Success, Message = result.Message, Result = refinedSentList });
        }

        [HttpPost]
        [Route("documents/getpaginatedreceiveddocumentlistbyfilter")]
        public async Task<IActionResult> GetPaginatedReceivedDocumentList(PaginatedListDTO paginatedListDTO)
        {
            var result = await _documentService.GetPaginatedReceivedDocumentsListByFilterAsync(UserDetails(),
                paginatedListDTO.DocumentListFilter,
                paginatedListDTO.PageNumber,
                paginatedListDTO.PageSize,
                paginatedListDTO.Pagination);

            var refinedReceivedList = result.Result is List<Document> list
                ? list.Select(document => new DocumentListDTO
                {
                    _id = document._id,
                    CreatedAt = document.CreatedAt,
                    UpdatedAt = document.UpdatedAt,
                    DocumentName = document.DocumentName,
                    OwnerName = document.OwnerName,
                    Status = document.Status,
                    ExpireDate = document.ExpireDate,
                    SigningStatus = document.Recepients != null
                    ? document.Recepients.FirstOrDefault(x => x.Suid == UserDetails().Suid)?.Status : null,
                    RecepientName = document.Recepients?
                    .Select(x => x.Name)
                    .ToList()
                ?? []
                }).ToList()
                : [];

            return Ok(new APIResponse { Success = result.Success, Message = result.Message, Result = refinedReceivedList });
        }

        [HttpPost]
        [Route("documents/getpaginatedreferreddocumentlistbyfilter")]
        public async Task<IActionResult> GetPaginatedReferredDocumentListByFilter(PaginatedListDTO paginatedListDTO)
        {
            var result = await _documentService.GetPaginatedReferredDocumentsByFilterListAsync(UserDetails(),
                paginatedListDTO.DocumentListFilter,
                paginatedListDTO.PageNumber,
                paginatedListDTO.PageSize,
                paginatedListDTO.Pagination);

            var refinedReferredList = result.Result is List<Document> list
                ? list.Select(document => new DocumentListDTO
                {
                    _id = document._id,
                    CreatedAt = document.CreatedAt,
                    UpdatedAt = document.UpdatedAt,
                    DocumentName = document.DocumentName,
                    OwnerName = document.OwnerName,
                    Status = document.Status,
                    ExpireDate = document.ExpireDate,
                    SigningStatus = document.Recepients != null
                    ? document.Recepients.FirstOrDefault(x => x.AlternateSignatories.Any(y => y.suid == UserDetails().Suid))?.Status : null,
                    RecepientName = document.Recepients?
                    .Select(x => x.Name)
                    .ToList()
                ?? []
                }).ToList()
                : [];

            return Ok(new APIResponse { Success = result.Success, Message = result.Message, Result = refinedReferredList });
        }

        [HttpPost]
        [Route("documents/getpaginatedactionrequireddocumentlistbyfilter")]
        public async Task<IActionResult> GetPaginatedActionRequiredDocumentListByFilter(PaginatedListDTO paginatedListDTO)
        {
            var result = await _documentService.GetPaginatedDocumentsListByFilter(paginatedListDTO.FilterDocument, 
				UserDetails(),                
                paginatedListDTO.PageNumber,
                paginatedListDTO.PageSize);

            var refinedActionRequiredList = result.Result is List<Document> list
                ? list.Select(document => new ActionRequiredDocumentListDTO
                {
                    _id = document._id,
                    CreatedAt = document.CreatedAt,
                    UpdatedAt = document.UpdatedAt,
                    DocumentName = document.DocumentName,
                    OwnerName = document.OwnerName,
					OwnerEmail = document.OwnerEmail,
					MultiSign = document.MultiSign,
                    Status = document.Status,
                    ExpireDate = document.ExpireDate,
					DisableOrder = document.DisableOrder,
                    PendingSignList = document.PendingSignList ?? new List<User>(),
                    CompleteSignList = document.CompleteSignList ?? new List<User>(),
                    Recepients = document.Recepients?.Select(r => new ActionRequiredRecepientDTO
                    {
                        Name = r.Name,
                        Email = r.Email,
						OrganizationId = r.OrganizationId,
						OrganizationName = r.OrganizationName,
                        Suid = r.Suid,
                        Status = r.Status,
                        Order = r.Order,
                        TakenAction = r.TakenAction,
                        AlternateSignatories = r.AlternateSignatories ?? new List<User>()
                    }).ToList(),
                }).ToList()
                : [];

            return Ok(new APIResponse { Success = result.Success, Message = result.Message, Result = refinedActionRequiredList });
        }
    }
}

using Azure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication.Documents;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.DTOs;
using DocumentFormat.OpenXml.EMMA;

namespace SigningPortal.Web.Controllers
{
	[Authorize]
	public class DashboardController : BaseController
	{
		private readonly IDocumentService _documentService;
		private readonly IPaymentService _paymentService;
		public DashboardController(IDocumentService documentService,
			IPaymentService paymentService)
		{
			_documentService = documentService;
			_paymentService = paymentService;
		}
		public IActionResult Index()
		{
			return View("IndexNew");
		}
		public async Task<IActionResult> DocStats()
		{
			//UserDTO userDTO = new UserDTO()
			//{
			//    Email = "ajaysatya111@gmail.com",
			//    Suid = "33d022e0-2625-4811-90b4-d54fe67417b2",
			//    Name = "naresh doti",
			//    OrganizationId = "45d2b6ac-685b-4308-adca-b6ae0ed43552",
			//    AccountType = "organization"
			//};

			UserDTO userDTO = UserDetails();

			_ = Task.Run(() => _documentService.UpdateExpiredDocuments(userDTO.Suid));

			

            FilterDocumentDTO model = new FilterDocumentDTO()
            {
                Status = "In Progress",
                ActionRequired = true,
                ExpirySoon = false
            };

            var filterDocumentsList =  _documentService.GetDocumentsListByFilter(model, UserDetails());
            var response = _documentService.DocumentStatusAsync(userDTO);

            await Task.WhenAll(filterDocumentsList, response);

            if (response == null || !response.Result.Success)
			{
				return Json(new { success = false, message = response.Result.Message });
			}

            if (filterDocumentsList == null || !filterDocumentsList.Result.Success)
            {
                return Json(new { success = false, message = filterDocumentsList.Result.Message });
            }

            var documentStats = (DocumentStatusResponse)response.Result.Result;
            var documentsList = (List<Document>)filterDocumentsList.Result.Result;

			documentStats.actionRequiredList = documentsList;

            return Json(new { success = true, message = response.Result.Message, result = documentStats });
		}
		public async Task<IActionResult> GetCredits()
		{
			UserDTO userDTO = UserDetails();

			var creditDetails = await _paymentService.GetCreditDeatails(userDTO);

			if (creditDetails == null || !creditDetails.Success)
			{
				return Json(new { success = false, message = "Failed to get Credit Details" });
			}

			var CreditsDTO = (CreditDetails)creditDetails.Result;

			return Json(new { success = true, message = "Get credit details successful", result = CreditsDTO.totalCredits });
		}


    }
}

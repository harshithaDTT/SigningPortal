using DinkToPdf;
using DinkToPdf.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Graph;
using MongoDB.Driver.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.Domain.Services.Communication.Documents;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
//using SigningPortal.Web.Attributes;
using SigningPortal.Web.Enums;
using SigningPortal.Web.Models;
using SigningPortal.Web.Utilities;
using SigningPortal.Web.ViewModels.Documents;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Buffers;
using User = SigningPortal.Core.DTOs.User;

namespace SigningPortal.Web.Controllers
{
    [Authorize]
    //[ServiceFilter(typeof(SessionValidationAttribute))]
    public class DocumentsController : BaseController
    {

        private readonly IDocumentService _documentService;
        private readonly IUserService _userService;
        private readonly IEDMSService _edmService;
        private readonly ITemplateService _templateService;
        private readonly IDelegationService _delegatorService;
        private readonly ILogger<DocumentsController> _logger;

        private readonly IConverter _converter;
        private readonly IRazorRendererHelper _razorRendererHelper;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;


        public DocumentsController(IDocumentService documentService, IUserService userService, IConverter converter, IEDMSService edmService, IRazorRendererHelper razorRendererHelper, IConfiguration configuration, IWebHostEnvironment environment, ITemplateService templateService, IDelegationService delegatorService, ILogger<DocumentsController> logger)
        {
            _documentService = documentService;
            _userService = userService;
            _edmService = edmService;
            _razorRendererHelper = razorRendererHelper;
            _environment = environment;
            _configuration = configuration;
            _converter = converter;
            _templateService = templateService;
            _delegatorService = delegatorService;
            _logger = logger;
        }
        public IActionResult Index(string? viewName)
        {


            TempData["ViewName"] = viewName;
            ViewBag.ViewName = TempData["ViewName"];

            return View();
        }
        public IActionResult draft()
        {



            return PartialView("_draft");
        }


        public IActionResult MyDocumentsList()
        {
            return View();
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> GetDraftDocuments()
        {
            var draw = Request.Form["draw"].FirstOrDefault();
            var start = Convert.ToInt32(Request.Form["start"].FirstOrDefault());
            var length = Convert.ToInt32(Request.Form["length"].FirstOrDefault());
            var searchValue = Request.Form["searchValue"].FirstOrDefault() ?? string.Empty;

            int pageNumber = length > 0 ? (start / length) + 1 : 1;

            var userDetails = UserDetails();

            var documentFilter = new DocumentListFilterDTO
            {
                DocumentStatus = Request.Form["documentStatus"].FirstOrDefault(),
                DocumentFilter = Request.Form["documentFilter"].FirstOrDefault(),
                SigningStatus = Request.Form["signingStatus"].FirstOrDefault()
            };

            var serviceResult = await _documentService
                .GetPaginatedDraftDocumentListByFilterAsync(
                    userDetails, documentFilter, pageNumber, length, true, searchValue);

            if (!serviceResult.Success || serviceResult.Result == null)
            {
                return Json(new
                {
                    draw,
                    recordsTotal = 0,
                    recordsFiltered = 0,
                    data = new List<object>(),
                    error = serviceResult.Message
                });
            }

            if (serviceResult.Result is not PaginatedList<Document> paginated)
            {
                return Json(new
                {
                    draw,
                    recordsTotal = 0,
                    recordsFiltered = 0,
                    data = new List<object>(),
                    error = serviceResult.Message
                });
            }

            var data = paginated.Select(item => new
            {
                id = item._id,
                documentName = item.DocumentName,
                createdAt = item.CreatedAt,
                expireDate = item.ExpireDate,
                status = item.Status,
                completeSignList = item.CompleteSignList,
                pendingSignList = item.PendingSignList,
                annotations = item.Annotations,
                esealannotations = item.EsealAnnotations,
                qrcodeannotations = item.QrCodeAnnotations,
                recepients = item.Recepients,
                recepientCount = item.RecepientCount,
                disableOrder = item.DisableOrder
            }).ToList();

            return Json(new
            {
                draw,
                recordsTotal = paginated.TotalCount,
                recordsFiltered = paginated.TotalCount,
                data
            });
        }
        public IActionResult SentDocumentsList()
        {
            return View();
        }


        public async Task<IActionResult> GetmyandsentandreceivedlistDocuments()
        {
            var pageNumber = 1;
            var length = 5;
            var searchValue = string.Empty;

            var documentFilter = new DocumentListFilterDTO();
            var userDetails = UserDetails();

            try
            {
                var myDocsTask = _documentService
                    .GetPaginatedDraftDocumentListByFilterAsync(
                        userDetails, documentFilter, pageNumber, length, true, searchValue);

                var sentDocsTask = _documentService
                    .GetPaginatedSentDocumentListByFilterAsync(
                        userDetails, documentFilter, pageNumber, length, true, searchValue);

                var receivedDocsTask = _documentService
                    .GetPaginatedReceivedDocumentsListByFilterAsync(
                        userDetails, documentFilter, pageNumber, length, true, searchValue);

                await Task.WhenAll(myDocsTask, sentDocsTask, receivedDocsTask);

                var myDocsResult = await myDocsTask;
                var sentDocsResult = await sentDocsTask;
                var receivedDocsResult = await receivedDocsTask;

                if (!myDocsResult.Success || !sentDocsResult.Success || !receivedDocsResult.Success ||
                    myDocsResult.Result is not PaginatedList<Document> myDocs ||
                    sentDocsResult.Result is not PaginatedList<Document> sentDocs ||
                    receivedDocsResult.Result is not PaginatedList<Document> receivedDocs)
                {
                    return Json(new
                    {
                        recordsTotal = 0,
                        recordsFiltered = 0,
                        data = new List<object>()
                    });
                }

                var myDocumentsData = myDocs.Select(item => new
                {
                    id = item._id,
                    documentName = item.DocumentName,
                    createdAt = item.CreatedAt,
                    expireDate = item.ExpireDate,
                    status = item.Status,
                    completeSignList = item.CompleteSignList,
                    pendingSignList = item.PendingSignList,
                    annotations = item.Annotations,
                    esealannotations = item.EsealAnnotations,
                    qrcodeannotations = item.QrCodeAnnotations,
                    recepients = item.Recepients,
                    recepientCount = item.RecepientCount,
                    disableOrder = item.DisableOrder,
                    source = "My Documents",
                    ownerEmail = item.OwnerEmail
                });

                var sentDocumentsData = sentDocs.Select(item => new
                {
                    id = item._id,
                    documentName = item.DocumentName,
                    createdAt = item.CreatedAt,
                    expireDate = item.ExpireDate,
                    status = item.Status,
                    completeSignList = item.CompleteSignList,
                    pendingSignList = item.PendingSignList,
                    annotations = item.Annotations,
                    esealannotations = item.EsealAnnotations,
                    qrcodeannotations = item.QrCodeAnnotations,
                    recepients = item.Recepients,
                    recepientCount = item.RecepientCount,
                    disableOrder = item.DisableOrder,
                    source = "Sent Documents",
                    ownerEmail = item.OwnerEmail
                });

                var receivedDocumentsData = receivedDocs.Select(item => new
                {
                    id = item._id,
                    documentName = item.DocumentName,
                    createdAt = item.CreatedAt,
                    expireDate = item.ExpireDate,
                    status = item.Status,
                    completeSignList = item.CompleteSignList,
                    pendingSignList = item.PendingSignList,
                    annotations = item.Annotations,
                    esealannotations = item.EsealAnnotations,
                    qrcodeannotations = item.QrCodeAnnotations,
                    recepients = item.Recepients,
                    recepientCount = item.RecepientCount,
                    disableOrder = item.DisableOrder,
                    source = "Received Documents",
                    ownerEmail = item.OwnerEmail
                });

                var combinedData = myDocumentsData
                    .Concat(sentDocumentsData)
                    .Concat(receivedDocumentsData)
                    .OrderByDescending(x => x.createdAt)
                    .ToList();

                var totalCount = myDocs.TotalCount + sentDocs.TotalCount + receivedDocs.TotalCount;

                return Json(new
                {
                    recordsTotal = totalCount,
                    recordsFiltered = totalCount,
                    data = combinedData
                });
            }
            catch
            {
                return Json(new
                {
                    recordsTotal = 0,
                    recordsFiltered = 0,
                    data = new List<object>(),
                    error = "Failed to load documents."
                });
            }
        }
        public IActionResult sent()
        {


            return PartialView("_sent");
        }

        public async Task<IActionResult> GetSentDocuments()
        {
            var draw = Request.Form["draw"].FirstOrDefault();
            var start = Convert.ToInt32(Request.Form["start"].FirstOrDefault());
            var length = Convert.ToInt32(Request.Form["length"].FirstOrDefault());
            var searchValue = Request.Form["searchValue"].FirstOrDefault() ?? string.Empty;

            int pageNumber = length > 0 ? (start / length) + 1 : 1;

            var userDetails = UserDetails();

            var documentFilter = new DocumentListFilterDTO
            {
                DocumentStatus = Request.Form["documentStatus"].FirstOrDefault(),
                DocumentFilter = Request.Form["documentFilter"].FirstOrDefault(),
                SigningStatus = Request.Form["signingStatus"].FirstOrDefault()
            };

            var serviceResult = await _documentService
                .GetPaginatedSentDocumentListByFilterAsync(
                    userDetails, documentFilter, pageNumber, length, true, searchValue);

            if (!serviceResult.Success || serviceResult.Result == null)
            {
                return Json(new
                {
                    draw,
                    recordsTotal = 0,
                    recordsFiltered = 0,
                    data = new List<object>(),
                    error = serviceResult.Message
                });
            }

            if (serviceResult.Result is not PaginatedList<Document> paginated)
            {
                return Json(new
                {
                    draw,
                    recordsTotal = 0,
                    recordsFiltered = 0,
                    data = new List<object>(),
                    error = serviceResult.Message
                });
            }

            var data = paginated.Select(item => new
            {
                id = item._id,
                documentName = item.DocumentName,
                createdAt = item.CreatedAt,
                expireDate = item.ExpireDate,
                status = item.Status,
                completeSignList = item.CompleteSignList,
                pendingSignList = item.PendingSignList,
                annotations = item.Annotations,
                esealannotations = item.EsealAnnotations,
                qrcodeannotations = item.QrCodeAnnotations,
                recepients = item.Recepients,
                recepientCount = item.RecepientCount,
                disableOrder = item.DisableOrder
            }).ToList();

            return Json(new
            {
                draw,
                recordsTotal = paginated.TotalCount,
                recordsFiltered = paginated.TotalCount,
                data
            });
        }
        public IActionResult ReceivedDocumentsList()
        {
            return View();
        }

        public IActionResult recived()
        {


            return PartialView("_recived");
        }

        public IActionResult ReferredDocumentsList()
        {
            return View();
        }
        public async Task<IActionResult> GetReceivedDocuments()
        {
            var draw = Request.Form["draw"].FirstOrDefault();
            var start = Convert.ToInt32(Request.Form["start"].FirstOrDefault());
            var length = Convert.ToInt32(Request.Form["length"].FirstOrDefault());
            var searchValue = Request.Form["searchValue"].FirstOrDefault() ?? string.Empty;

            int pageNumber = length > 0 ? (start / length) + 1 : 1;

            var userDetails = UserDetails();

            var documentFilter = new DocumentListFilterDTO
            {
                DocumentStatus = Request.Form["documentStatus"].FirstOrDefault(),
                DocumentFilter = Request.Form["documentFilter"].FirstOrDefault(),
                SigningStatus = Request.Form["signingStatus"].FirstOrDefault()
            };

            var serviceResult = await _documentService
                .GetPaginatedReceivedDocumentsListByFilterAsync(
                    userDetails, documentFilter, pageNumber, length, true, searchValue);

            if (!serviceResult.Success ||
                serviceResult.Result is not PaginatedList<Document> paginated)
            {
                return Json(new
                {
                    draw,
                    recordsTotal = 0,
                    recordsFiltered = 0,
                    data = new List<object>(),
                    error = serviceResult.Message
                });
            }

            var data = paginated.Select(item => new
            {
                id = item._id,
                documentName = item.DocumentName,
                createdAt = item.CreatedAt,
                expireDate = item.ExpireDate,
                status = item.Status,
                completeSignList = item.CompleteSignList,
                pendingSignList = item.PendingSignList,
                annotations = item.Annotations,
                esealannotations = item.EsealAnnotations,
                qrcodeannotations = item.QrCodeAnnotations,
                recepients = item.Recepients,
                recepientCount = item.RecepientCount,
                disableOrder = item.DisableOrder,
                ownerName = item.OwnerName,
                ownerEmail = item.OwnerEmail
            }).ToList();

            return Json(new
            {
                draw,
                recordsTotal = paginated.TotalCount,
                recordsFiltered = paginated.TotalCount,
                data
            });
        }
        public IActionResult referred()
        {


            return PartialView("_referred");
        }

        public async Task<IActionResult> GetReferredDocuments()
        {
            var draw = Request.Form["draw"].FirstOrDefault();
            var start = Convert.ToInt32(Request.Form["start"].FirstOrDefault());
            var length = Convert.ToInt32(Request.Form["length"].FirstOrDefault());
            var searchValue = Request.Form["searchValue"].FirstOrDefault() ?? string.Empty;

            int pageNumber = (start / length) + 1;
            var userDetails = UserDetails();
            var documentFilter = new DocumentListFilterDTO
            {
                DocumentStatus = Request.Form["documentStatus"].FirstOrDefault(),
                DocumentFilter = Request.Form["documentFilter"].FirstOrDefault(),
                SigningStatus = Request.Form["signingStatus"].FirstOrDefault()
            };

            var serviceResult = await _documentService.GetPaginatedReferredDocumentsByFilterListAsync(
                userDetails, documentFilter, pageNumber, length, isPagination: true, searchValue);


            if (!serviceResult.Success ||
                   serviceResult.Result is not PaginatedList<Document> paginated)
            {
                return Json(new
                {
                    draw,
                    recordsTotal = 0,
                    recordsFiltered = 0,
                    data = new List<object>(),
                    error = serviceResult.Message
                });
            }

            var data = paginated.Select(item => new
            {
                id = item._id,
                documentName = item.DocumentName,
                createdAt = item.CreatedAt,
                expireDate = item.ExpireDate,
                status = item.Status,
                completeSignList = item.CompleteSignList,
                pendingSignList = item.PendingSignList,
                annotations = item.Annotations,
                esealannotations = item.EsealAnnotations,
                qrcodeannotations = item.QrCodeAnnotations,
                recepients = item.Recepients,
                recepientCount = item.RecepientCount,
                disableOrder = item.DisableOrder,
                ownerName = item.OwnerName,
                ownerEmail = item.OwnerEmail
            }).ToList();

            return Json(new
            {
                draw = draw,
                recordsTotal = paginated.TotalCount,
                recordsFiltered = paginated.TotalCount,
                data = data
            });
        }

        public async Task<IActionResult> DocumentDetailsById(string id, string viewName)
        {
            // Get document details
            var DeclineRemark = "";
            var response = await _documentService.GetDocumentDetaildByIdAsync(id);
            if (response == null)
            {
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = (response == null ? "Internal error please contact to admin" : response.Message) };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return RedirectToAction("Index"); // Or handle this case as needed
                                                  //return NotFound();
            }
            Document document = response.Result as Document;

            bool isUserRelatedToDoc = (document.OwnerID == Suid && document.OrganizationId.Trim() == OrganizationId) ||
                    (document.Recepients.Any(x => x.Suid == Suid && x.OrganizationId.Trim() == OrganizationId)) ||
                    (document.Recepients.Any(rec => rec.AlternateSignatories.Any(x => x.suid == Suid && rec.OrganizationId.Trim() == OrganizationId)));    //Case to Check the relation of Document to the Logged-In User
            if (!isUserRelatedToDoc)
            {
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = "You are not authorized to view this document" };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return RedirectToAction("Index", "Dashboard");
            }


            // Get declined comment details
            var declinedCommentsResponse = await _documentService.GetDeclinedCommentDetailsAsync(id);
            if (declinedCommentsResponse.Success)
            {
                var responsedata = declinedCommentsResponse.Result as Recepients;
                if (responsedata == null)
                {

                    DeclineRemark = "";
                }
                else
                {

                    DeclineRemark = responsedata.DeclineRemark;
                }

            }
            else
            {
                //return Json(new { success = false, response.Message });
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = (response == null ? "Internal error please contact to admin" : response.Message) };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                //return Json(new { success = false, response.Message });
                return RedirectToAction("Index"); // Or handle this case as needed
            }

            // Map document details to view model			
            DocumentDetailsViewModel model = new DocumentDetailsViewModel
            {
                DocumentName = document.DocumentName,
                CreatedAt = document.CreatedAt,
                ExpiredAt = document.ExpireDate,
                CompleteTime = document.CompleteTime,
                CompleteSignList = (IList<User>)document.CompleteSignList,
                PendingSignList = (IList<User>)document.PendingSignList,
                SignaturesRequiredCount = document.SignaturesRequiredCount,
                Status = document.Status,
                Recepients = document.Recepients,
                RecepientCount = document.RecepientCount,
                edmsId = document.EdmsId,
                OwnerEmail = document.OwnerEmail,
                docId = document._id,
                DeclineRemark = DeclineRemark,
                AccountType = document.AccountType,
                OrganizationName = document.OrganizationName,
                ViewName = viewName,
                DisableOrder = document.DisableOrder
            };
            var response2 = await _documentService.GetDocumentReportAsync(id);
            if (response2 == null || !response2.Success)
            {
                ViewBag.DocumentReportResponse = null;
            }
            //return PartialView("ViewDetails", response.Result);
            else
            {
                ViewBag.DocumentReportResponse = response2.Result;
            }


            return View(model);
        }

        public IActionResult GetFileConfiguration()
        {
            double fileSize = _configuration.GetValue<double>("FileSizeLimit");
            FileSizeConfigDTO model = new FileSizeConfigDTO()
            {
                FileSize = fileSize
            };
            return Ok(model);
        }

        [HttpPut]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Recall(string documentid)
        {
            var response = await _documentService.RecallDocumentToSignAsync(documentid);
            if (!response.Success)
            {
                return Ok(response);
            }
            return Ok(response);
        }
        //public async Task<IActionResult> CreateDocument()
        //{
        //    return View();
        //}
        [HttpGet]
        public async Task<IActionResult> GetOrganizationStatus(string loginorgUid)
        {
            var response = await _documentService.GetOrganizationCertificateDetailstAsync(loginorgUid);
            if (!response.Success)
            {
                return Ok(response);
            }
            return Ok(response);
        }
        public IActionResult CreateDocuments(string param)
        {
            ViewBag.ParamValue = param;
            var response = _templateService.GetSignatureTemplateList();
            if (response.Result.Result == null || !response.Result.Success)
            {
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = response.Result.Message };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return RedirectToAction("Index");

            }
            var SignatureTemplateList = (IList<SignatureTemplatesDTO>)response.Result.Result;
            var viewModel = new DocumentCreateViewModel
            {
                Templates = SignatureTemplateList
            };
            return View("CreateDocumentsNew", viewModel);

        }
        [HttpPost]
        [Route("Documents/OrgDetailsByEmail")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> OrgDetailsByEmail(string email)
        {
            var result = await _userService.GetSubscriberOrgnizationListByEmailAsync(email);

            if (!result.Success || result.Result == null)
            {
                return Json(new
                {
                    success = false,
                    message = result.Message ?? "No data found."
                });
            }

            var jsonString = result.Result.ToString();

            if (string.IsNullOrWhiteSpace(jsonString))
            {
                return Json(new
                {
                    success = false,
                    message = "Invalid data format."
                });
            }

            var signs = JsonConvert.DeserializeObject<SignatoriesDTO>(jsonString);

            if (signs == null)
            {
                return Json(new
                {
                    success = false,
                    message = "Failed to deserialize data."
                });
            }

            return Json(signs);
        }

        [HttpGet]
        public async Task<IActionResult> GetDelegationbyorgidsuid(string organizationId, string suid)
        {
            var result = await _delegatorService.GetDelegateDetailsByOrgIdAndSuidAsync(organizationId, suid);
            if (!result.Success)
            {
                return Json(result);
            }
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetPreviewConfig(string id)
        {
            var response = await _edmService.GetDocumentAsync(id);
            return Ok(response);
        }

        [HttpGet]

        public async Task<IActionResult> GetMyDocumentsStatistics()
        {
            var userJson = HttpContext.User.Claims
                .FirstOrDefault(c => c.Type == "user")?.Value;

            if (string.IsNullOrWhiteSpace(userJson))
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "User claim missing or invalid."
                });
            }

            var userDTO = JsonConvert.DeserializeObject<UserDTO>(userJson);

            if (userDTO == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid user data."
                });
            }

            var response = await _documentService
                .GetMyDocumentStatusCountAsync(userDTO);

            return Ok(response);
        }
        [HttpGet]

        public async Task<IActionResult> GetSentDocumentsStatistics()
        {
            var userJson = HttpContext.User.Claims
        .FirstOrDefault(c => c.Type == "user")?.Value;

            if (string.IsNullOrWhiteSpace(userJson))
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "User claim missing or invalid."
                });
            }

            var userDTO = JsonConvert.DeserializeObject<UserDTO>(userJson);

            if (userDTO == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid user data."
                });
            }

            var response = await _documentService.GetSentDocumentStatusCountAsync(userDTO);

            return Ok(response);
        }
        [HttpGet]

        public async Task<IActionResult> GetReceivedDocumentsStatistics()
        {
            var userJson = HttpContext.User.Claims
       .FirstOrDefault(c => c.Type == "user")?.Value;

            if (string.IsNullOrWhiteSpace(userJson))
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "User claim missing or invalid."
                });
            }

            var userDTO = JsonConvert.DeserializeObject<UserDTO>(userJson);

            if (userDTO == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid user data."
                });
            }

            var response = await _documentService.GetReceivedDocumentStatusCountAsync(userDTO);

            return Ok(response);
        }
        [HttpGet]

        public async Task<IActionResult> GetReferredDocumentsStatistics()
        {
            var userJson = HttpContext.User.Claims
        .FirstOrDefault(c => c.Type == "user")?.Value;

            if (string.IsNullOrWhiteSpace(userJson))
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "User claim missing or invalid."
                });
            }

            var userDTO = JsonConvert.DeserializeObject<UserDTO>(userJson);

            if (userDTO == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid user data."
                });
            }

            var response = await _documentService.GetReferredDocumentStatusCountAsync(userDTO);
            return Ok(response);
        }

        [HttpGet]
        public async Task<IActionResult> ViewDetails(string docid)
        {
            var response = await _documentService.GetDocumentReportAsync(docid);
            if (response == null || !response.Success)
            {
                return Json(new { success = false, message = response.Message });
            }
            //var model = response.Result;
            //var image = Path.Combine(_environment.WebRootPath, _configuration["PDFLogoPath"]);
            //byte[] imageArray = System.IO.File.ReadAllBytes(image);
            //string base64Image = Convert.ToBase64String(imageArray);

            //var PdfLogo = "data:image/png;base64, " + base64Image;
            //return PartialView("_ViewDetails", model);
            return Json(response);
        }

        //[HttpGet]
        //public async Task<IActionResult> GetGeneratePdf([FromBody] DocumentDetailsViewModel datasent)
        //{
        //	_logger.LogInformation("generate pdf started");
        //	try
        //	{
        //		//var response = await _documentService.GetDocumentReportAsync(docid);
        //		//if (response == null || !response.Success)
        //		//{
        //		//	return Json(new { success = false, message = response.Message });
        //		//}

        //		var image = Path.Combine(_environment.WebRootPath, _configuration["PDFLogoPath"]);
        //		byte[] imageArray = System.IO.File.ReadAllBytes(image);
        //		string base64Image = Convert.ToBase64String(imageArray);
        //		//var model = response.Result;
        //		var model = datasent;
        //              var partialName = "/Views/Documents/_ViewDetails.cshtml";
        //		var htmlContent = _razorRendererHelper.RenderPartialToString(partialName, model);
        //		byte[] pdfBytes = GeneratePdf(htmlContent);

        //		return Json(new { Status = "Success", Title = "Generate PDF", Message = "Successfully Generated PDF bytes", Result = pdfBytes });
        //	}
        //	catch (Exception ex)
        //	{
        //		_logger.LogError(ex.ToString());
        //		return Json(new { Status = "Failed", Title = "Generate PDF", Message = ex.Message });
        //	}

        //}
        //[HttpGet] // Change from GET to POST
        //public async Task<IActionResult> GetGeneratePdf(DocumentStatusDetailsViewModel datasent)
        //{
        //    _logger.LogInformation("Generate PDF started");
        //    _logger.LogInformation("Received data: {@Data}", datasent);
        //    try
        //    {
        //        var image = Path.Combine(_environment.WebRootPath, _configuration["PDFLogoPath"]);
        //        byte[] imageArray = await System.IO.File.ReadAllBytesAsync(image);
        //        string base64Image = Convert.ToBase64String(imageArray);

        //        var model = datasent;
        //        var partialName = "/Views/Documents/_ViewDetails.cshtml";
        //        var htmlContent =  _razorRendererHelper.RenderPartialToString(partialName, model);
        //        byte[] pdfBytes = GeneratePdf(htmlContent);

        //        return Json(new { Status = "Success", Title = "Generate PDF", Message = "Successfully Generated PDF bytes", Result = Convert.ToBase64String(pdfBytes) });
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error generating PDF");
        //        return Json(new { Status = "Failed", Title = "Generate PDF", Message = ex.Message });
        //    }
        //}

        [HttpPost] // Change from GET to POST
        public async Task<IActionResult> GetGeneratePdf([FromBody] DocumentReportexportViewModel viewModel) // Use [FromBody] for JSON deserialization
        {
            _logger.LogInformation("Generate PDF started");
            _logger.LogInformation("Received data: {@Data}", viewModel);
            try
            {
                var logoPath = _configuration["PDFLogoPath"];

                if (string.IsNullOrWhiteSpace(logoPath))
                {
                    return Json(new { Status = "Failed", Message = "Logo path not configured." });
                }

                var image = Path.Combine(_environment.WebRootPath!, logoPath);
                byte[] imageArray = await System.IO.File.ReadAllBytesAsync(image);
                string base64Image = Convert.ToBase64String(imageArray);
                DocumentReportexportViewModel ViewModel = new DocumentReportexportViewModel()
                {
                    DocumentDetails = viewModel.DocumentDetails,
                    SignatoryDetails = viewModel.SignatoryDetails,
                    ReportGeneration = viewModel.ReportGeneration,
                    pdflogoimage = base64Image,
                };
                var model = ViewModel;
                var partialName = "/Views/Documents/_ViewDetails.cshtml";
                var htmlContent = _razorRendererHelper.RenderPartialToString(partialName, model);
                byte[] pdfBytes = GeneratePdf(htmlContent);

                return Json(new { Status = "Success", Title = "Generate PDF", Message = "Successfully Generated PDF bytes", Result = Convert.ToBase64String(pdfBytes) });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating PDF");
                return Json(new { Status = "Failed", Title = "Generate PDF", Message = ex.Message });
            }
        }


        [HttpGet]
        public async Task<IActionResult> GetPreviewimages(string email, string suid, string orgUid, string AccountType, int signtempid = 0)
        {
            var userDTO = new UserDTO
            {
                Email = email,
                Suid = suid,
                OrganizationId = orgUid,
                AccountType = AccountType
            };

            var signature = await _templateService.GetSignaturePreviewAsync(userDTO, signtempid);
            if (signature == null || !signature.Success)
            {
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = signature.Message };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return Json(new { success = false, message = signature.Message });
            }

            var preview = (string)signature.Result;
            if (preview == null)
            {
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = signature.Message };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return Json(new { success = false, message = signature.Message });
            }

            var previewDTO = JsonConvert.DeserializeObject<PreviewImageDTO>(preview);
            if (previewDTO == null)
            {
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = "Internal Error" };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return Json(new { success = false, message = "Internal Error" });
            }

            return Json(new { success = true, data = previewDTO });
        }


        [HttpGet]
        public async Task<IActionResult> GetTemplatePreviewimages(int signtempid = 0)
        {


            var response = await _templateService.GetSignatureTemplatePreviewById(signtempid);
            if (response == null || !response.Success)
            {
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = response.Message };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return Json(new { success = false, message = response.Message });
            }

            var preview = (string)response.Result;
            if (preview == null)
            {
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = response.Message };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return Json(new { success = false, message = response.Message });
            }




            return Json(new { success = true, data = response.Result, message = response.Message });
        }

        [HttpPost]
        public async Task<IActionResult> ProcessRecipients([FromBody] List<HasTemplateDTO> recipients)
        {
            var res = await _templateService.HasTemplateAsync(recipients);
            if (res == null)
            {
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = res.Message };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return Json(new { success = false, message = "Something went wrong" });
            }
            var ans = res.Result as IList<HasTemplateDTO>;
            return Json(new { success = res.Success, data = ans, message = res.Message });
        }

        [HttpGet]
        public async Task<IActionResult> DocumentDetails(string docid)
        {
            var response = await _documentService.GetDocumentReportAsync(docid);
            if (response == null || !response.Success)
            {
                return Json(new { success = false, message = response.Message });
            }
            //return PartialView("ViewDetails", response.Result);
            return Json(new { success = true, message = response.Message, result = response.Result });
        }

        public async Task<IActionResult> SignActionConfigByDocId(string docId, string viewName)
        {

            try
            {

                var previewTemplate = await _documentService.GetDocumentDetaildByIdAsync(docId);
                var preview = (Document)previewTemplate.Result;

                if (preview == null)
                {
                    //logMessage = $"Failed to get the Business User From Local DB";
                    //SendAdminLog(ModuleNameConstants.BusinessUsers, ServiceNameConstants.BusinessUsers,
                    //    "Get Business user details", LogMessageType.FAILURE.ToString(), logMessage);
                    AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = previewTemplate.Message };
                    TempData["Alert"] = JsonConvert.SerializeObject(alert);
                    return RedirectToAction("Index");
                    //return NotFound();
                }

                var viewModel = new PreviewConfigViewModel
                {

                    DocumentName = preview.DocumentName,
                    Annotations = preview.Annotations,
                    EsealAnnotations = preview.EsealAnnotations,
                    QrCodeAnnotations = preview.QrCodeAnnotations,
                    AccountType = preview.AccountType,
                    OrganizationId = preview.OrganizationId,
                    OrganizationName = preview.OrganizationName,
                    SignaturesRequiredCount = preview.SignaturesRequiredCount,
                    RecepientCount = preview.RecepientCount,
                    CompleteSignList = preview.CompleteSignList,
                    PendingSignList = preview.PendingSignList,
                    MultiSign = preview.MultiSign,
                    AllowToAssignSomeone = preview.AllowToAssignSomeone,
                    DisableOrder = preview.DisableOrder,
                    DocumentBlockedTime = preview.DocumentBlockedTime,
                    IsDocumentBlocked = preview.IsDocumentBlocked,
                    Watermark = preview.Watermark,
                    Recepients = preview.Recepients,
                    EdmsId = preview.EdmsId,
                    OriginalEdmsId = preview.OriginalEdmsId,
                    ExpireDate = preview.ExpireDate,
                    CompleteTime = preview.CompleteTime,
                    CreateTime = preview.CreateTime,
                    Status = preview.Status,
                    RemindEvery = preview.RemindEvery,
                    AutoReminders = preview.AutoReminders,
                    DaysToComplete = preview.DaysToComplete,
                    OwnerName = preview.OwnerName,
                    OwnerEmail = preview.OwnerEmail,
                    OwnerID = preview.OwnerID,
                    htmlSchema = preview.HtmlSchema,
                    DocId = docId,
                    ViewName = viewName,
                };

                return View(viewModel);
            }
            catch (Exception)
            {

                return RedirectToAction("Index");
            }
        }
        public async Task<IActionResult> SignActionByDocIdForReferedDoc(string docId, string viewName)
        {

            try
            {

                var previewTemplate = await _documentService.GetDocumentDetaildByIdAsync(docId);
                var preview = (Document)previewTemplate.Result;

                if (preview == null)
                {
                    //logMessage = $"Failed to get the Business User From Local DB";
                    //SendAdminLog(ModuleNameConstants.BusinessUsers, ServiceNameConstants.BusinessUsers,
                    //    "Get Business user details", LogMessageType.FAILURE.ToString(), logMessage);
                    AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = previewTemplate.Message };
                    TempData["Alert"] = JsonConvert.SerializeObject(alert);
                    return RedirectToAction("Index");
                    //return NotFound();
                }

                var viewModel = new PreviewConfigViewModel
                {

                    DocumentName = preview.DocumentName,
                    Annotations = preview.Annotations,
                    EsealAnnotations = preview.EsealAnnotations,
                    QrCodeAnnotations = preview.QrCodeAnnotations,
                    AccountType = preview.AccountType,
                    OrganizationId = preview.OrganizationId,
                    OrganizationName = preview.OrganizationName,
                    SignaturesRequiredCount = preview.SignaturesRequiredCount,
                    RecepientCount = preview.RecepientCount,
                    CompleteSignList = preview.CompleteSignList,
                    PendingSignList = preview.PendingSignList,
                    MultiSign = preview.MultiSign,
                    AllowToAssignSomeone = preview.AllowToAssignSomeone,
                    DisableOrder = preview.DisableOrder,
                    DocumentBlockedTime = preview.DocumentBlockedTime,
                    IsDocumentBlocked = preview.IsDocumentBlocked,
                    Watermark = preview.Watermark,
                    Recepients = preview.Recepients,
                    EdmsId = preview.EdmsId,
                    ExpireDate = preview.ExpireDate,
                    CompleteTime = preview.CompleteTime,
                    CreateTime = preview.CreateTime,
                    Status = preview.Status,
                    RemindEvery = preview.RemindEvery,
                    AutoReminders = preview.AutoReminders,
                    DaysToComplete = preview.DaysToComplete,
                    OwnerName = preview.OwnerName,
                    OwnerEmail = preview.OwnerEmail,
                    OwnerID = preview.OwnerID,
                    DocId = docId,
                    ViewName = viewName,
                    htmlSchema = preview.HtmlSchema,
                };
                return View(viewModel);
            }
            catch (Exception)
            {

                return RedirectToAction("Index");
            }
        }

        public async Task<IActionResult> IsDocumentBlocked(string docId, string suid)
        {
            // Check if document is blocked
            var blockCheck = await _documentService.IsDocumentBlockedAsync(docId, UserDetails());
            if (!blockCheck.Success)
            {
                return Json(new { success = false, message = "Error while processing", result = (string)null });
            }

            // Get document details
            var docResult = await _documentService.GetDocumentDetaildByIdAsync(docId);
            var selectedStatus = docResult.Success
                ? (docResult.Result as Document)?.Recepients.FirstOrDefault(x => x.Suid == suid)?.Status
                : null;

            // If document is blocked
            if (Convert.ToBoolean(blockCheck.Result))
            {
                return Json(new
                {
                    success = false,
                    message = blockCheck.Message,
                    result = selectedStatus
                });
            }

            // If document is not blocked
            return Json(new
            {
                success = true,
                message = "Document is not blocked",
                result = selectedStatus
            });
        }



        [HttpGet]
        public async Task<IActionResult> DownloadSignedDocument(string edmsid, string fileName)
        {
            try
            {
                var result = await _edmService.GetDocumentAsync(edmsid);

                if (!result.Success)
                {
                    return new JsonResult(new { success = false, message = result.Message });
                }
                //return Ok(result.Resource);
                var fileData = result.Result;

                if (fileData == null)
                {
                    return new JsonResult(new { success = false, message = result.Message });
                }


                var FileToDownLoad = File((byte[])fileData, "application/pdf", fileName);
                return new JsonResult(new { success = true, message = result.Message, result = FileToDownLoad });
            }
            catch (Exception ex)
            {
                return new JsonResult(new { success = false, message = ex.Message });
            }
        }
        [HttpPost]
        [RequestSizeLimit(524288000)] // 500 MB
        [RequestFormLimits(MultipartBodyLengthLimit = 524288000)]
        
        public async Task<IActionResult> SaveNewDocument([FromForm] DocumentCreateViewModel documentCreateViewModel)
        {
            string pageNumber = "";
            string posX = "";
            string posY = "";
            string width = "";
            string height = "";
            string esealpageNumber = "";
            string esealposX = "";
            string esealposY = "";
            string esealwidth = "";
            string esealheight = "";
            string organizationId = "";
            string qrcodepageNumber = "";
            string qrcodeposX = "";
            string qrcodeposY = "";
            string qrcodewidth = "";
            string qrcodeheight = "";
            try
            {
                var apiToken = HttpContext.User.Claims.FirstOrDefault(c => c.Type == "apiToken")?.Value;
                var idToken = HttpContext.User.Claims.FirstOrDefault(c => c.Type == "ID_Token")?.Value;
                var user = HttpContext.User.Claims
       .FirstOrDefault(c => c.Type == "user")?.Value;

                if (string.IsNullOrWhiteSpace(user))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        message = "User claim missing or invalid."
                    });
                }

                var userDTO = JsonConvert.DeserializeObject<UserDTO>(user);

                if (userDTO == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid user data."
                    });
                }

                if (documentCreateViewModel.checkboxValue != "checked")//self signer
                {
                    var configObject = JObject.Parse(documentCreateViewModel.Config);

                    CoordinatesData signCords = ExtractCoordinatesForNormalSignAndQuick(configObject["Signature"], documentCreateViewModel.Signatory);
                    CoordinatesDataEseal esealCords = ExtractCoordinatesForEsealForNormalSignAndQuick(configObject["Eseal"], documentCreateViewModel.Signatory);
                    CoordinatesData qrCords = ExtractCoordinatesForNormalSignAndQuick(configObject["Qrcode"], documentCreateViewModel.Signatory);

                    var emailList = documentCreateViewModel.Signatory?.Split(',').Select(email => email.Trim()).ToList() ?? new List<string>();
                    if (signCords != null)
                    {
                        if (configObject["Signature"][documentCreateViewModel.Signatory] is JObject emailData)
                        {
                            pageNumber = emailData["PageNumber"]?.ToString();
                            posX = emailData["posX"]?.ToString();
                            posY = emailData["posY"]?.ToString();
                            width = emailData["width"]?.ToString();
                            height = emailData["height"]?.ToString();
                        }
                    }
                    if (esealCords != null)
                    {
                        if (configObject["Eseal"][documentCreateViewModel.Signatory] is JObject esealData)
                        {
                            esealpageNumber = esealData["PageNumber"]?.ToString();
                            esealposX = esealData["posX"]?.ToString();
                            esealposY = esealData["posY"]?.ToString();
                            esealwidth = esealData["width"]?.ToString();
                            esealheight = esealData["height"]?.ToString();
                            organizationId = esealData["organizationID"]?.ToString();

                        }

                    }
                    if (qrCords != null)
                    {
                        if (configObject["Qrcode"][documentCreateViewModel.Signatory] is JObject emailData)
                        {
                            qrcodepageNumber = emailData["PageNumber"]?.ToString();
                            qrcodeposX = emailData["posX"]?.ToString();
                            qrcodeposY = emailData["posY"]?.ToString();
                            qrcodewidth = emailData["width"]?.ToString();
                            qrcodeheight = emailData["height"]?.ToString();
                        }

                    }
                    var list = new List<User>();
                    if (documentCreateViewModel.Recps != null)
                    {
                        List<Receps> recepsList = JsonConvert.DeserializeObject<List<Receps>>(documentCreateViewModel.Recps);
                        var isSignatureMandatory = false;
                        var isinitialapplied = false;
                        var isesealapplied = false;
                        foreach (var recep in recepsList)
                        {
                            if (recep.email.Equals(userDTO.Email, StringComparison.OrdinalIgnoreCase))
                            {
                                isSignatureMandatory = recep.signatureMandatory;
                                isinitialapplied = recep.initial;
                                isesealapplied = recep.eseal;
                                break;
                            }
                        }
                        var receps = new Receps()
                        {
                            index = null,
                            order = 1,
                            email = userDTO.Email,
                            suid = userDTO.Suid,
                            name = userDTO.Name,
                            initial = isinitialapplied,
                            eseal = isesealapplied,
                            orgUID = userDTO.OrganizationId,
                            orgName = userDTO.OrganizationName,
                            alternateSignatoriesList = list,
                            signatureMandatory = isSignatureMandatory,
                            signTemplate = documentCreateViewModel.SignTemplate
                        };

                        var receps1 = new List<Receps> { receps };
                        //int daysToCompleteInt = Convert.ToInt32(documentCreateViewModel.DaysToComplete);

                        var docdetails = new Docdetails()
                        {
                            ownerName = userDTO.Name,
                            receps = receps1,
                            tempname = documentCreateViewModel.DocumentName,
                            daysToComplete = documentCreateViewModel.DaysToComplete.ToString(),
                            annotations = "",
                            orgn_name = userDTO.OrganizationName,
                            watermark = null,
                            signaturesRequiredCount = documentCreateViewModel.RequiredSignatureNo,

                            expiredate = DateTime.Now.AddDays(documentCreateViewModel.DaysToComplete),
                        };

                        var data = new SaveDocumentViewModel()
                        {
                            docdetails = docdetails,
                            docData = "",
                            fileName = documentCreateViewModel.DocumentName,
                            signCords = signCords == null ? "" : new Dictionary<string, CoordinatesData> { { userDTO.Suid, signCords } },
                            qrCords = qrCords == null ? "" : new Dictionary<string, CoordinatesData> { { userDTO.Suid, qrCords } },
                            esealCords = esealCords == null ? "" : new Dictionary<string, CoordinatesDataEseal> { { userDTO.Suid, esealCords } },
                            actoken = idToken,
                            qrCodeRequired = documentCreateViewModel.qrCodeRequired,
                            disableOrder = documentCreateViewModel.DisableOrder,
                            docSerialNo = documentCreateViewModel.docSerialNo,
                            entityName = documentCreateViewModel.entityName,
                            faceRequired = documentCreateViewModel.faceRequired,
                            htmlSchema = documentCreateViewModel.htmlSchema,
                            rotation = documentCreateViewModel.Rotation,


                        };


                        var dataJson = JsonConvert.SerializeObject(data);
                        var saveNewDocumentDTO = new SaveNewDocumentDTO()
                        {
                            file = documentCreateViewModel.File,
                            //originalFile = documentCreateViewModel.File,
                            model = dataJson,
                        };

                        var response = await _documentService.SaveNewDocumentAsync(saveNewDocumentDTO, userDTO);

                        if (response.Success)
                        {
                            var tempid = (SaveNewDocumentResponse)response.Result;
                            var sigRequestData = new SigningRequestModel()
                            {
                                tempid = tempid.tempid,
                                userName = userDTO.Name,
                                userEmail = userDTO.Email,
                                signature = "",
                                actoken = idToken,
                                suid = userDTO.Suid,

                                signVisible = 1,
                                pageNumber = string.IsNullOrEmpty(pageNumber) ? null : Convert.ToInt32(pageNumber),
                                posX = string.IsNullOrEmpty(posX) ? 0 : Convert.ToDouble(posX),
                                posY = string.IsNullOrEmpty(posY) ? 0 : Convert.ToDouble(posY),
                                width = string.IsNullOrEmpty(width) ? 0 : Convert.ToDouble(width),
                                height = string.IsNullOrEmpty(height) ? 0 : Convert.ToDouble(height),
                                EsealPageNumber = string.IsNullOrEmpty(esealpageNumber) ? 0 : Convert.ToInt32(esealpageNumber),
                                EsealPosX = string.IsNullOrEmpty(esealposX) ? 0 : Convert.ToDouble(esealposX),
                                EsealPosY = string.IsNullOrEmpty(esealposY) ? 0 : Convert.ToDouble(esealposY),
                                EsealWidth = string.IsNullOrEmpty(esealwidth) ? 0 : Convert.ToDouble(esealwidth),
                                EsealHeight = string.IsNullOrEmpty(esealheight) ? 0 : Convert.ToDouble(esealheight),
                                QrPageNumber = string.IsNullOrEmpty(qrcodepageNumber) ? 0 : Convert.ToInt32(qrcodepageNumber),
                                QrHeight = string.IsNullOrEmpty(qrcodeheight) ? 0 : Convert.ToDouble(qrcodeheight),
                                QrPosX = string.IsNullOrEmpty(qrcodeposX) ? 0 : Convert.ToDouble(qrcodeposX),
                                QrPosY = string.IsNullOrEmpty(qrcodeposY) ? 0 : Convert.ToDouble(qrcodeposY),
                                QrWidth = string.IsNullOrEmpty(qrcodewidth) ? 0 : Convert.ToDouble(qrcodewidth),
                                SignTemplate = documentCreateViewModel.SignTemplate,

                            };

                            if (documentCreateViewModel.Rotation == 90)
                            {
                                var y = sigRequestData.posY;
                                sigRequestData.posY = sigRequestData.posX;
                                sigRequestData.posX = documentCreateViewModel.pageHeight - y - sigRequestData.height;
                                var yy = sigRequestData.EsealPosY;
                                sigRequestData.EsealPosY = sigRequestData.EsealPosX;
                                sigRequestData.EsealPosX = documentCreateViewModel.pageHeight - yy - sigRequestData.EsealHeight;
                            }

                            if (documentCreateViewModel.Rotation == 180)
                            {
                                var y = sigRequestData.posY;
                                sigRequestData.posY = documentCreateViewModel.pageHeight - sigRequestData.posY - sigRequestData.height;
                                sigRequestData.posX = documentCreateViewModel.pageWidth - sigRequestData.posX - sigRequestData.width;

                                var yy = sigRequestData.EsealPosY;
                                sigRequestData.EsealPosY = documentCreateViewModel.pageHeight - sigRequestData.EsealPosY - sigRequestData.EsealHeight;
                                sigRequestData.EsealPosX = documentCreateViewModel.pageWidth - sigRequestData.EsealPosX - sigRequestData.EsealWidth;
                            }
                            if (documentCreateViewModel.Rotation == 270)
                            {
                                var y = sigRequestData.posY;
                                sigRequestData.posY = documentCreateViewModel.pageWidth - sigRequestData.posX - sigRequestData.width;
                                sigRequestData.posX = y;

                                var yy = sigRequestData.EsealPosY;
                                sigRequestData.EsealPosY = documentCreateViewModel.pageWidth - sigRequestData.EsealPosX - sigRequestData.EsealWidth;
                                sigRequestData.EsealPosX = yy;
                            }
                            if (esealCords == null)
                            {
                                sigRequestData.organizationID = null;
                            }
                            else
                            {
                                sigRequestData.organizationID = userDTO.OrganizationId;
                            }
                            var signData = JsonConvert.SerializeObject(sigRequestData);
                            var signRequestDTO = new SigningRequestDTO()
                            {
                                signfile = documentCreateViewModel.File,
                                model = signData,
                            };

                            var signResponse = await _documentService.SendSigningRequestAsync(signRequestDTO, userDTO);
                            if (signResponse.Success)
                            {
                                return Json(new { Status = "Success", Title = "Sign New Document", Message = signResponse.Message, Result = signRequestDTO });
                            }
                            else
                            {
                                return Json(new { Status = "Failed", Title = "Sign New Document", Message = signResponse.Message, Result = signRequestDTO });
                            }
                        }
                        else
                        {
                            return Json(new { Status = "Failed", Title = "Save New Document", Message = response.Message });
                        }
                    }
                    else
                    {
                        var receps = new Receps()
                        {
                            index = null,
                            order = 1,
                            email = userDTO.Email,
                            suid = userDTO.Suid,
                            name = userDTO.Name,
                            eseal = true,
                            orgUID = userDTO.OrganizationId,
                            orgName = userDTO.OrganizationName,
                            alternateSignatoriesList = list,
                            signatureMandatory = true,
                            signTemplate = documentCreateViewModel.SignTemplate
                        };

                        var receps1 = new List<Receps> { receps };
                        //int daysToCompleteInt = Convert.ToInt32(documentCreateViewModel.DaysToComplete);

                        var docdetails = new Docdetails()
                        {
                            ownerName = userDTO.Name,
                            receps = receps1,
                            tempname = documentCreateViewModel.DocumentName,
                            daysToComplete = documentCreateViewModel.DaysToComplete.ToString(),
                            annotations = "",
                            orgn_name = userDTO.OrganizationName,
                            watermark = null,
                            signaturesRequiredCount = documentCreateViewModel.RequiredSignatureNo,
                            expiredate = DateTime.Now.AddDays(documentCreateViewModel.DaysToComplete),
                        };

                        var data = new SaveDocumentViewModel()
                        {
                            docdetails = docdetails,
                            docData = "",
                            fileName = documentCreateViewModel.DocumentName,
                            signCords = signCords == null ? "" : new Dictionary<string, CoordinatesData> { { userDTO.Suid, signCords } },
                            qrCords = qrCords == null ? "" : new Dictionary<string, CoordinatesData> { { userDTO.Suid, qrCords } },
                            esealCords = esealCords == null ? "" : new Dictionary<string, CoordinatesDataEseal> { { userDTO.Suid, esealCords } },
                            actoken = idToken,
                            qrCodeRequired = documentCreateViewModel.qrCodeRequired,
                            docSerialNo = documentCreateViewModel.docSerialNo,
                            entityName = documentCreateViewModel.entityName,
                            faceRequired = documentCreateViewModel.faceRequired,
                            disableOrder = documentCreateViewModel.DisableOrder,
                            htmlSchema = documentCreateViewModel.htmlSchema,

                        };


                        var dataJson = JsonConvert.SerializeObject(data);
                        var saveNewDocumentDTO = new SaveNewDocumentDTO()
                        {
                            file = documentCreateViewModel.File,
                            //originalFile = documentCreateViewModel.File,
                            model = dataJson,
                        };

                        var response = await _documentService.SaveNewDocumentAsync(saveNewDocumentDTO, userDTO);

                        if (response.Success)
                        {
                            var tempid = (SaveNewDocumentResponse)response.Result;
                            var sigRequestData = new SigningRequestModel()
                            {
                                tempid = tempid.tempid,
                                userName = userDTO.Name,
                                userEmail = userDTO.Email,
                                signature = "",
                                actoken = idToken,
                                suid = userDTO.Suid,

                                //signVisible = 1,
                                pageNumber = string.IsNullOrEmpty(pageNumber) ? null : Convert.ToInt32(pageNumber),
                                posX = string.IsNullOrEmpty(posX) ? 0 : Convert.ToDouble(posX),
                                posY = string.IsNullOrEmpty(posY) ? 0 : Convert.ToDouble(posY),
                                width = string.IsNullOrEmpty(width) ? 0 : Convert.ToDouble(width),
                                height = string.IsNullOrEmpty(height) ? 0 : Convert.ToDouble(height),
                                EsealPageNumber = string.IsNullOrEmpty(esealpageNumber) ? 0 : Convert.ToInt32(esealpageNumber),
                                EsealPosX = string.IsNullOrEmpty(esealposX) ? 0 : Convert.ToDouble(esealposX),
                                EsealPosY = string.IsNullOrEmpty(esealposY) ? 0 : Convert.ToDouble(esealposY),
                                EsealWidth = string.IsNullOrEmpty(esealwidth) ? 0 : Convert.ToDouble(esealwidth),
                                EsealHeight = string.IsNullOrEmpty(esealheight) ? 0 : Convert.ToDouble(esealheight),
                                QrPageNumber = string.IsNullOrEmpty(qrcodepageNumber) ? 0 : Convert.ToInt32(qrcodepageNumber),
                                QrHeight = string.IsNullOrEmpty(qrcodeheight) ? 0 : Convert.ToDouble(qrcodeheight),
                                QrPosX = string.IsNullOrEmpty(qrcodeposX) ? 0 : Convert.ToDouble(qrcodeposX),
                                QrPosY = string.IsNullOrEmpty(qrcodeposY) ? 0 : Convert.ToDouble(qrcodeposY),
                                QrWidth = string.IsNullOrEmpty(qrcodewidth) ? 0 : Convert.ToDouble(qrcodewidth),
                                SignTemplate = documentCreateViewModel.SignTemplate,
                            };

                            //if (documentCreateViewModel.Rotation == 90)
                            //{
                            //	var y = sigRequestData.posY;
                            //	sigRequestData.posY = sigRequestData.posX;
                            //	sigRequestData.posX = documentCreateViewModel.pageHeight - y - sigRequestData.height;
                            //	var yy = sigRequestData.EsealPosY;
                            //	sigRequestData.EsealPosY = sigRequestData.EsealPosX;
                            //	sigRequestData.EsealPosX = documentCreateViewModel.pageHeight - yy - sigRequestData.EsealHeight;
                            //}

                            //if (documentCreateViewModel.Rotation == 180)
                            //{
                            //	var y = sigRequestData.posY;
                            //	sigRequestData.posY = documentCreateViewModel.pageHeight - sigRequestData.posY - sigRequestData.height;
                            //	sigRequestData.posX = documentCreateViewModel.pageWidth - sigRequestData.posX - sigRequestData.width;

                            //	var yy = sigRequestData.EsealPosY;
                            //	sigRequestData.EsealPosY = documentCreateViewModel.pageHeight - sigRequestData.EsealPosY - sigRequestData.EsealHeight;
                            //	sigRequestData.EsealPosX = documentCreateViewModel.pageWidth - sigRequestData.EsealPosX - sigRequestData.EsealWidth;
                            //}
                            //if (documentCreateViewModel.Rotation == 270)
                            //{
                            //	var y = sigRequestData.posY;
                            //	sigRequestData.posY = documentCreateViewModel.pageWidth - sigRequestData.posX - sigRequestData.width;
                            //	sigRequestData.posX = y;

                            //	var yy = sigRequestData.EsealPosY;
                            //	sigRequestData.EsealPosY = documentCreateViewModel.pageWidth - sigRequestData.EsealPosX - sigRequestData.EsealWidth;
                            //	sigRequestData.EsealPosX = yy;
                            //}
                            if (esealCords == null)
                            {
                                sigRequestData.organizationID = null;
                            }
                            else
                            {
                                sigRequestData.organizationID = userDTO.OrganizationId;
                            }
                            if (signCords == null)
                            {
                                sigRequestData.signVisible = 0;

                            }
                            else
                            {
                                sigRequestData.signVisible = 1;
                            }
                            var signData = JsonConvert.SerializeObject(sigRequestData);
                            var signRequestDTO = new SigningRequestDTO()
                            {
                                signfile = documentCreateViewModel.File,
                                model = signData,
                            };

                            var signResponse = await _documentService.SendSigningRequestAsync(signRequestDTO, userDTO);
                            if (signResponse.Success)
                            {
                                return Json(new { Status = "Success", Title = "Sign New Document", Message = signResponse.Message, Result = signRequestDTO });
                            }
                            else
                            {
                                return Json(new { Status = "Failed", Title = "Sign New Document", Message = signResponse.Message, Result = signRequestDTO });
                            }
                        }
                        else
                        {
                            return Json(new { Status = "Failed", Title = "Save New Document", Message = response.Message });
                        }
                    }


                }
                else //multiSign
                {

                    var configObject = JObject.Parse(documentCreateViewModel.Config);

                    var signatureConfig = configObject["Signature"];
                    var esealConfig = configObject["Eseal"];
                    var qrConfig = configObject["Qrcode"];

                    var emailList = documentCreateViewModel.Signatory?.Split(',').Select(email => email.Trim()).ToList() ?? new List<string>();

                    var signatureCoordinates = new Dictionary<string, CoordinatesData>();
                    var esealCoordinates = new Dictionary<string, CoordinatesDataEseal>();
                    var qrCoordinates = new Dictionary<string, CoordinatesData>();
                    foreach (var property in signatureConfig.Children<JProperty>())
                    {
                        var email = property.Name; // Get the email from the property name
                        var signatureData = property.Value;

                        var signatureCoordinatesData = new CoordinatesData
                        {
                            fieldName = signatureData["fieldName"].ToString(),
                            posX = (float)Convert.ToDouble(signatureData["posX"]),
                            posY = (float)Convert.ToDouble(signatureData["posY"]),
                            PageNumber = Convert.ToInt32(signatureData["PageNumber"]),
                            width = (float)Convert.ToDouble(signatureData["width"]),
                            height = (float)Convert.ToDouble(signatureData["height"])
                        };
                        signatureCoordinates.Add(email, signatureCoordinatesData);
                    }

                    foreach (var property in esealConfig.Children<JProperty>())
                    {
                        var email = property.Name; // Get the email from the property name
                        var esealData = property.Value;

                        var esealCoordinatesData = new CoordinatesDataEseal
                        {
                            fieldName = esealData["fieldName"].ToString(),
                            posX = (float)Convert.ToDouble(esealData["posX"]),
                            posY = (float)Convert.ToDouble(esealData["posY"]),
                            PageNumber = Convert.ToInt32(esealData["PageNumber"]),
                            width = (float)Convert.ToDouble(esealData["width"]),
                            height = (float)Convert.ToDouble(esealData["height"]),
                            //organizationID = userDTO.OrganizationId,
                            organizationID = esealData["organizationID"]?.ToString(),
                        };
                        esealCoordinates.Add(email, esealCoordinatesData);
                    }
                    foreach (var property in qrConfig.Children<JProperty>())
                    {
                        var email = property.Name; // Get the email from the property name
                        var qrData = property.Value;

                        var qrCoordinatesData = new CoordinatesData
                        {
                            fieldName = qrData["fieldName"].ToString(),
                            posX = (float)Convert.ToDouble(qrData["posX"]),
                            posY = (float)Convert.ToDouble(qrData["posY"]),
                            PageNumber = Convert.ToInt32(qrData["PageNumber"]),
                            width = (float)Convert.ToDouble(qrData["width"]),
                            height = (float)Convert.ToDouble(qrData["height"]),
                            //organizationID = userDTO.OrganizationId,
                        };
                        qrCoordinates.Add(email, qrCoordinatesData);
                    }


                    List<Receps> recepsList = JsonConvert.DeserializeObject<List<Receps>>(documentCreateViewModel.Recps);
                    //int daysToCompleteInt = Convert.ToInt32(documentCreateViewModel.DaysToComplete);

                    var docdetails = new Docdetails
                    {
                        ownerName = userDTO.Name,
                        receps = recepsList,
                        tempname = documentCreateViewModel.DocumentName,
                        daysToComplete = documentCreateViewModel.DaysToComplete.ToString(),
                        annotations = "",
                        orgn_name = userDTO.OrganizationName,
                        watermark = null,
                        signaturesRequiredCount = documentCreateViewModel.RequiredSignatureNo,
                        expiredate = DateTime.Now.AddDays(documentCreateViewModel.DaysToComplete),
                    };
                    var data = new SaveDocumentViewModel
                    {
                        docdetails = docdetails,
                        docData = "",
                        fileName = documentCreateViewModel.DocumentName,
                        signCords = signatureCoordinates,
                        esealCords = esealCoordinates,
                        qrCords = qrCoordinates,
                        actoken = idToken,
                        qrCodeRequired = documentCreateViewModel.qrCodeRequired,
                        multisign = true,
                        htmlSchema = documentCreateViewModel.htmlSchema,
                        disableOrder = documentCreateViewModel.DisableOrder,
                    };

                    var dataJson = JsonConvert.SerializeObject(data);

                    var saveNewDocumentDTO = new SaveNewDocumentDTO()
                    {
                        file = documentCreateViewModel.File, //initiALS
                        originalFile = documentCreateViewModel.OriginalFile != null ? documentCreateViewModel.OriginalFile : null,
                        model = dataJson,
                    };

                    var response = await _documentService.SaveNewDocumentAsync(saveNewDocumentDTO, userDTO);

                    if (response.Success)
                    {

                        return Json(new { Status = "Success", Title = "Save New Document", Message = response.Message });

                    }
                    else
                    {
                        return Json(new { Status = "Failed", Title = "Save New Document", Message = response.Message });
                    }
                }
            }
            catch (Exception ex)
            {
                // Log the exception
                //return StatusCode(500, "Internal server error");
                return Json(new { Status = "Failed", Title = "Save New Document", Message = ex.Message });
            }

        }


        [HttpPost]
        public async Task<IActionResult> SendSigningRequest([FromForm] DocumentRetryViewModel documentRetryViewModel)
        {
            var userJson = HttpContext.User.Claims
     .FirstOrDefault(c => c.Type == "user")?.Value;

            if (string.IsNullOrWhiteSpace(userJson))
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "User claim missing or invalid."
                });
            }

            var userDTO = JsonConvert.DeserializeObject<UserDTO>(userJson);

            if (userDTO == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid user data."
                });
            }
            //var modelData = JsonConvert.DeserializeObject<SigningRequestDTO>(documentCreateViewModel.Config);
            //var signData = JsonConvert.SerializeObject(modelData);
            var signRequestDTO = new SigningRequestDTO()
            {
                signfile = documentRetryViewModel.File,
                model = documentRetryViewModel.Config,
            };
            var signResponse = await _documentService.SendSigningRequestAsync(signRequestDTO, userDTO);
            if (signResponse.Success)
            {
                return Json(new { Status = "Success", Title = "Sign New Document", Message = signResponse.Message, Result = signRequestDTO });
            }
            else
            {
                return Json(new { Status = "Failed", Title = "Sign New Document", Message = signResponse.Message, Result = signRequestDTO });
            }

        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SignDocument(SignDocumentViewModel signDocumentViewModel)
        {
            string pageNumber = "";
            string posX = "";
            string posY = "";
            string width = "";
            string height = "";
            string esealpageNumber = "";
            string esealposX = "";
            string esealposY = "";
            string esealwidth = "";
            string esealheight = "";
            string organizationId = "";
            string qrcodepageNumber = "";
            string qrcodeposX = "";
            string qrcodeposY = "";
            string qrcodewidth = "";
            string qrcodeheight = "";
            try
            {


                var apiToken = HttpContext.User.Claims.FirstOrDefault(c => c.Type == "apiToken")?.Value;
                var user = HttpContext.User.Claims
           .FirstOrDefault(c => c.Type == "user")?.Value;

                if (string.IsNullOrWhiteSpace(user))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        message = "User claim missing or invalid."
                    });
                }

                var userDTO = JsonConvert.DeserializeObject<UserDTO>(user);

                if (userDTO == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid user data."
                    });
                }

                var idToken = HttpContext.User.Claims.FirstOrDefault(c => c.Type == "ID_Token")?.Value;

                if (string.IsNullOrWhiteSpace(signDocumentViewModel.Config))
                {
                    return Json(new { Status = "Failed", Message = "Invalid configuration data." });
                }

                if (string.IsNullOrWhiteSpace(signDocumentViewModel.Config))
                {
                    return Json(new { Status = "Failed", Message = "Invalid configuration." });
                }

                var configObject = JObject.Parse(signDocumentViewModel.Config);
                var signatureToken = configObject["Signature"];
                var esealToken = configObject["Eseal"];
                var qrToken = configObject["Qrcode"];

                if (signatureToken == null || esealToken == null || qrToken == null)
                {
                    return Json(new { Status = "Failed", Message = "Invalid configuration structure." });
                }
                CoordinatesData signCords = ExtractCoordinatesForNormalSignAndQuick(signatureToken, userDTO.Suid);
                CoordinatesDataEseal esealCords = ExtractCoordinatesForEsealForNormalSignAndQuick(esealToken, userDTO.Suid);
                CoordinatesData qrCords = ExtractCoordinatesForNormalSignAndQuick(qrToken, userDTO.Suid);


                if (configObject["Signature"][userDTO.Suid] is JObject emailData)
                {
                    pageNumber = emailData["PageNumber"]?.ToString();
                    posX = emailData["posX"]?.ToString();
                    posY = emailData["posY"]?.ToString();
                    width = emailData["width"]?.ToString();
                    height = emailData["height"]?.ToString();

                }
                if (esealCords != null)
                {
                    if (configObject["Eseal"][userDTO.Suid] is JObject esealData)
                    {
                        esealpageNumber = esealData["PageNumber"]?.ToString();
                        esealposX = esealData["posX"]?.ToString();
                        esealposY = esealData["posY"]?.ToString();
                        esealwidth = esealData["width"]?.ToString();
                        esealheight = esealData["height"]?.ToString();
                        organizationId = esealData["organizationID"]?.ToString();

                    }
                }
                if (qrCords != null)
                {
                    if (configObject["Qrcode"][userDTO.Suid] is JObject qrData)
                    {
                        qrcodepageNumber = qrData["PageNumber"]?.ToString();
                        qrcodeposX = qrData["posX"]?.ToString();
                        qrcodeposY = qrData["posY"]?.ToString();
                        qrcodewidth = qrData["width"]?.ToString();
                        qrcodeheight = qrData["height"]?.ToString();

                    }
                }
                var sigRequestData = new SigningRequestModel()
                {
                    tempid = signDocumentViewModel.DocId,
                    userName = userDTO.Name,
                    userEmail = userDTO.Email,
                    signature = "",
                    actoken = idToken,
                    suid = userDTO.Suid,
                    //signVisible = 1,
                    pageNumber = string.IsNullOrEmpty(pageNumber) ? 0 : Convert.ToInt32(pageNumber),
                    posX = string.IsNullOrEmpty(posX) ? 0 : Convert.ToDouble(posX),
                    posY = string.IsNullOrEmpty(posY) ? 0 : Convert.ToDouble(posY),
                    width = string.IsNullOrEmpty(width) ? 0 : Convert.ToDouble(width),
                    height = string.IsNullOrEmpty(height) ? 0 : Convert.ToDouble(height),
                    EsealPageNumber = string.IsNullOrEmpty(esealpageNumber) ? 0 : Convert.ToInt32(esealpageNumber),
                    EsealPosX = string.IsNullOrEmpty(esealposX) ? 0 : Convert.ToDouble(esealposX),
                    EsealPosY = string.IsNullOrEmpty(esealposY) ? 0 : Convert.ToDouble(esealposY),
                    EsealWidth = string.IsNullOrEmpty(esealwidth) ? 0 : Convert.ToDouble(esealwidth),
                    EsealHeight = string.IsNullOrEmpty(esealheight) ? 0 : Convert.ToDouble(esealheight),
                    QrPageNumber = string.IsNullOrEmpty(qrcodepageNumber) ? 0 : Convert.ToInt32(qrcodepageNumber),
                    QrHeight = string.IsNullOrEmpty(qrcodeheight) ? 0 : Convert.ToDouble(qrcodeheight),
                    QrPosX = string.IsNullOrEmpty(qrcodeposX) ? 0 : Convert.ToDouble(qrcodeposX),
                    QrPosY = string.IsNullOrEmpty(qrcodeposY) ? 0 : Convert.ToDouble(qrcodeposY),
                    QrWidth = string.IsNullOrEmpty(qrcodewidth) ? 0 : Convert.ToDouble(qrcodewidth),
                    SignTemplate = signDocumentViewModel.SignTemplate,
                    completeSignCount = signDocumentViewModel.CompleteSignCount
                };
                if (sigRequestData.pageNumber == 0)
                {
                    sigRequestData.pageNumber = null;

                }
                if (esealCords == null)
                {
                    sigRequestData.organizationID = null;
                }
                else
                {
                    sigRequestData.organizationID = userDTO.OrganizationId;
                }
                if (signCords == null && esealCords == null)
                {
                    sigRequestData.signVisible = 0;

                }
                else if (signCords == null && esealCords != null)
                {
                    sigRequestData.signVisible = 1;

                }
                else
                {
                    sigRequestData.signVisible = 1;
                }

                var signData = JsonConvert.SerializeObject(sigRequestData);
                var signRequestDTO = new SigningRequestDTO()
                {
                    signfile = signDocumentViewModel.File,
                    model = signData,
                };

                var signResponse = await _documentService.SendSigningRequestAsync(signRequestDTO, userDTO);
                if (signResponse.Success)
                {
                    return Json(new { Status = "Success", Title = "Sign New Document", Message = signResponse.Message, Result = signRequestDTO });
                }
                else if (signResponse.Result != null)
                {
                    return Json(new { Status = "Failed", Title = "Sign New Document", Message = signResponse.Message, Result = signRequestDTO, DocumtStatus = signResponse.Result });
                }
                else
                {
                    return Json(new { Status = "Failed", Title = "Sign New Document", Message = signResponse.Message, Result = signRequestDTO, DocumtStatus = "" });
                }
            }
            catch (Exception)
            {
                return Json(new { Status = "Failed", Title = "Sign New Document", Message = "Signing Failed" });
            }

        }

        public async Task<IActionResult> RejectSigning(RejectSigningViewModel rejectSigningViewModel)
        {
            if (rejectSigningViewModel == null ||
                string.IsNullOrWhiteSpace(rejectSigningViewModel.DocId))
            {
                return BadRequest("Invalid request.");
            }

            var idToken = HttpContext.User.Claims
                .FirstOrDefault(c => c.Type == "ID_Token")?.Value;

            if (string.IsNullOrWhiteSpace(idToken))
            {
                return Unauthorized();
            }

            var rejectData = new DeclineDocumentSigningDTO
            {
                Comment = rejectSigningViewModel.Comment,
                UserEmail = rejectSigningViewModel.UserEmail,
                UserName = rejectSigningViewModel.UserName,
                Suid = rejectSigningViewModel.Suid,
                acToken = idToken
            };

            var signResponse = await _documentService
                .DeclineDocumentSigningAsync(rejectSigningViewModel.DocId, rejectData);

            return Json(new
            {
                Status = signResponse.Success ? "Success" : "Failed",
                Title = "Reject New Document",
                Message = signResponse.Message
            });
        }
        public IActionResult GetFilteredDocumentsList(string status, bool action_required, bool expired_soon)
        {
            ViewBag.DocumntsStatus = status;
            return View();
        }


        public async Task<IActionResult> GetPaginatedFilteredDocumentsList()
        {
            var status = Request.Form["status"].FirstOrDefault();

            bool actionRequired = bool.TryParse(
                Request.Form["action_required"].FirstOrDefault(), out var ar) ? ar : true;

            bool expiredSoon = bool.TryParse(
                Request.Form["expired_soon"].FirstOrDefault(), out var es) ? es : false;

            var start = Convert.ToInt32(Request.Form["start"].FirstOrDefault());
            var length = Convert.ToInt32(Request.Form["length"].FirstOrDefault());
            var searchValue = Request.Form["searchValue"].FirstOrDefault() ?? string.Empty;

            int pageNumber = length > 0 ? (start / length) + 1 : 1;

            var userDetails = UserDetails();

            var model = new FilterDocumentDTO
            {
                Status = status,
                ActionRequired = actionRequired,
                ExpirySoon = expiredSoon
            };

            var serviceResult = await _documentService
                .GetPaginatedDocumentsListByFilter(
                    model, userDetails, pageNumber, length, searchValue);

            if (!serviceResult.Success ||
                serviceResult.Result is not PaginatedList<Document> paginated)
            {
                return Json(new
                {
                    recordsTotal = 0,
                    recordsFiltered = 0,
                    data = new List<object>(),
                    error = serviceResult.Message
                });
            }

            var data = paginated.Select(item => new
            {
                id = item._id,
                documentName = item.DocumentName,
                createdAt = item.CreatedAt,
                expireDate = item.ExpireDate,
                status = item.Status,
                completeSignList = item.CompleteSignList,
                pendingSignList = item.PendingSignList,
                annotations = item.Annotations,
                esealannotations = item.EsealAnnotations,
                qrcodeannotations = item.QrCodeAnnotations,
                recepients = item.Recepients,
                recepientCount = item.RecepientCount,
                disableOrder = item.DisableOrder,
                ownerName = item.OwnerName,
                ownerEmail = item.OwnerEmail,
                multiSign = item.MultiSign
            }).ToList();

            return Json(new
            {
                recordsTotal = paginated.TotalCount,
                recordsFiltered = paginated.TotalCount,
                data
            });
        }
        private CoordinatesData ExtractCoordinatesForNormalSignAndQuick(JToken token, string email)
        {
            CoordinatesData coordinates = null;

            if (token != null && token.Type == JTokenType.Object)
            {
                JObject tokenObject = (JObject)token;

                if (tokenObject[email] != null)
                {
                    coordinates = tokenObject[email].ToObject<CoordinatesData>();
                }
            }

            return coordinates;
        }

        private List<CoordinatesData> ExtractCoordinates(JToken token, string emails)
        {
            List<CoordinatesData> coordinatesList = new List<CoordinatesData>();

            if (token != null && token.Type == JTokenType.Object && !string.IsNullOrEmpty(emails))
            {
                JObject tokenObject = (JObject)token;
                string[] emailArray = emails.Split(',');

                foreach (string email in emailArray)
                {
                    if (tokenObject[email.Trim()] is JToken emailToken)
                    {
                        var coordinates = emailToken.ToObject<CoordinatesData>();

                        if (coordinates is not null)
                        {
                            coordinatesList.Add(coordinates);
                        }
                    }
                }
            }

            return coordinatesList;
        }

        private List<CoordinatesDataEseal> ExtractCoordinatesForEseal(JToken token, string emails)
        {
            List<CoordinatesDataEseal> coordinatesList = new List<CoordinatesDataEseal>();

            if (token != null && token.Type == JTokenType.Object && !string.IsNullOrEmpty(emails))
            {
                JObject tokenObject = (JObject)token;
                string[] emailArray = emails.Split(',');


                foreach (string email in emailArray)
                {
                    var key = email.Trim();

                    if (!string.IsNullOrWhiteSpace(key) &&
                        tokenObject[key] is JToken emailToken &&
                        emailToken.Type == JTokenType.Object)
                    {
                        var CoordinatesDataEseal = emailToken.ToObject<CoordinatesDataEseal>();

                        if (CoordinatesDataEseal != null)
                        {
                            coordinatesList.Add(CoordinatesDataEseal);
                        }
                    }
                }

            }

            return coordinatesList;
        }

        private CoordinatesDataEseal ExtractCoordinatesForEsealForNormalSignAndQuick(JToken token, string email)
        {
            CoordinatesDataEseal coordinates = null;

            if (token != null && token.Type == JTokenType.Object)
            {
                JObject tokenObject = (JObject)token;

                if (tokenObject[email] != null)
                {
                    coordinates = tokenObject[email].ToObject<CoordinatesDataEseal>();
                }
            }

            return coordinates;
        }


        [HttpGet]
        public byte[] GeneratePdf(string htmlContent)
        {
            var globalSettings = new GlobalSettings
            {
                ColorMode = ColorMode.Color,
                Orientation = Orientation.Portrait,
                PaperSize = PaperKind.A4,
                Margins = new MarginSettings { Top = 18, Bottom = 18 },
            };

            var objectSettings = new ObjectSettings
            {
                PagesCount = true,
                HtmlContent = htmlContent,
                WebSettings = { DefaultEncoding = "utf-8" },
                //HeaderSettings = { FontSize = 10, Right = "Page [page] of [toPage]", Line = true },
                //FooterSettings = { FontSize = 8, Center = "PDF demo from JeminPro", Line = true },
            };

            var htmlToPdfDocument = new HtmlToPdfDocument()
            {
                GlobalSettings = globalSettings,
                Objects = { objectSettings },
            };

            return _converter.Convert(htmlToPdfDocument);
        }
    }
}

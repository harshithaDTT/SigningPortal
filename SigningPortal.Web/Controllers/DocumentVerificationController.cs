using Microsoft.AspNetCore.Mvc;
using SigningPortal.Core.DTOs;
using SigningPortal.Web.ViewModels.DocumentVerificationViewModel;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication.Documents;
using Microsoft.AspNetCore.Authorization;

namespace SigningPortal.Web.Controllers
{
    [Authorize]
    public class DocumentVerificationController : BaseController
    {
        private readonly IDocumentService _documentService;
        public DocumentVerificationController(IDocumentService documentService) 
        {
            _documentService = documentService;
        }
        public IActionResult Index()
        {
            return View();
        }
        public IActionResult IndexNew()
        {
            return View();
        }

        //[HttpPost]
        //public async Task<IActionResult> Upload(DocumentVerificationViewModel document)
        //{
        //    if (document.File != null && document.File.Length > 0)
        //    {
        //        // Read the uploaded file as a byte array
        //        byte[] fileBytes;
        //        using (var ms = new MemoryStream())
        //        {
        //            document.File.CopyTo(ms);
        //            fileBytes = ms.ToArray();
        //        }

        //        // Convert the byte array to a Base64 string
        //        string Convertedfile = Convert.ToBase64String(fileBytes);

        //        VerifySignedDocumentDTO dd = new VerifySignedDocumentDTO
        //        {
        //            docData = Convertedfile,
        //            email = "mailto:suneeshasanaboina65@gmail.com",
        //            suid = "6ed5c476-7c4a-4ad6-b1a1-d78ba6f06791"
        //        };

        //        var response = await _documentService.VerifySignedDocumentAsync(dd);
        //        if (!response.Success)
        //        {
        //            TempData["NoSignatureFound"] = true;

        //            return Json(new { success = false, response.Message });
        //        }
        //        else
        //        {
        //            VerifySigningRequestResponse result = (VerifySigningRequestResponse)response.Result;

        //            var obj = new List<VerificationViewModel>();

        //            foreach (var detail in result.recpList)
        //            {
        //                 VerificationViewModel abc = new VerificationViewModel
        //                 {
        //                    signedBy = detail.signedBy,
        //                    signedTime = detail.signedTime,
        //                    validationTime = detail.validationTime,
        //                    signatureValid = detail.signatureValid,
        //                    documentName = document.File.FileName
        //                 };
        //                obj.Add(abc);
        //            }
        //            return PartialView("_Upload",obj);
        //        }
        //    }
        //    return View();
        //}

        [HttpPost]
        [RequestSizeLimit(524288000)] // 500 MB
        [RequestFormLimits(MultipartBodyLengthLimit = 524288000)]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Upload(DocumentVerificationViewModel document)
        {
            if (document.File != null && document.File.Length > 0)
            {
                byte[] fileBytes;
                using (var ms = new MemoryStream())
                {
                    document.File.CopyTo(ms);
                    fileBytes = ms.ToArray();
                }

                string Convertedfile = Convert.ToBase64String(fileBytes);

                VerifySignedDocumentDTO dd = new VerifySignedDocumentDTO
                {
                    docData = Convertedfile,
                    //email = "mailto:suneeshasanaboina65@gmail.com",
                    //suid = "6ed5c476-7c4a-4ad6-b1a1-d78ba6f06791"
                    email = UserDetails().Email,
                    suid = UserDetails().Suid,
                };

                var response = await _documentService.VerifySignedDocumentAsync(dd);
                if (!response.Success)
                {
                    TempData["NoSignatureFound"] = true;
                    TempData["Message"] = response.Message;
                    return RedirectToAction("Index");
                }
                else
                {
                    VerifySigningRequestResponse result = (VerifySigningRequestResponse)response.Result;

                    var obj = new List<VerificationViewModel>();

                    foreach (var detail in result.recpList)
                    {
                        VerificationViewModel abc = new VerificationViewModel
                        {
                            signedBy = detail.signedBy,
                            signedTime = detail.signedTime,
                            validationTime = detail.validationTime,
                            signatureValid = detail.signatureValid,
                            documentName = document.File.FileName
                        };
                        obj.Add(abc);
                    }

                    return View("SignatureDetails", obj);
                    // Pass the result data to the next view
                    //return RedirectToAction("Result", new { data = JsonConvert.SerializeObject(obj) });
                }
            }

            return RedirectToAction("IndexNew");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UploadFile(IFormFile document)
        {
            if (document == null || document.Length == 0)
                return Json(new { success = false, message = "No document uploaded." });

            try
            {
                using var ms = new MemoryStream();
                await document.CopyToAsync(ms);
                var fileBytes = ms.ToArray();

                string base64File = Convert.ToBase64String(fileBytes);

                var dto = new VerifySignedDocumentDTO
                {
                    docData = base64File,
                    email = UserDetails().Email,
                    suid = UserDetails().Suid
                };

                var response = await _documentService.VerifySignedDocumentAsync(dto);

                if (!response.Success)
                    return Json(new { success = false, message = response.Message });

                var result = (VerifySigningRequestResponse)response.Result;

                var obj = result.recpList.Select(detail => new VerificationViewModel
                {
                    signedBy = detail.signedBy,
                    signedTime = detail.signedTime,
                    validationTime = detail.validationTime,
                    signatureValid = detail.signatureValid,
                    documentName = document.FileName
                }).ToList();

                return Json(new { success = true, message = response.Message, result = obj });
            }
            catch (Exception)
            {
                //_logger.LogError(ex, "Error in document verification");
                return Json(new { success = false, message = "Something went wrong during verification." });
            }
        }


    }
}

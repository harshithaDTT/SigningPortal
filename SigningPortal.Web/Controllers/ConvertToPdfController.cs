using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;


namespace SigningPortal.Web.Controllers
{
    [Authorize]
    public class ConvertToPdfController : BaseController
    {
        private readonly IConvertToPdfService _convertToPdfService;
        private readonly ILogger<ConvertToPdfController> _logger;
        public ConvertToPdfController(IConvertToPdfService convertToPdfService, ILogger<ConvertToPdfController> logger)
        {
            _convertToPdfService = convertToPdfService;
            _logger = logger;   
        }


        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ConvertFile([FromForm] IFormFile file)
        {
            if (file == null)
            {
                return BadRequest("No file uploaded.");
            }

            ServiceResult serviceResponse;

            FileContentResult? result = null;

            string extension = Path.GetExtension(file.FileName).ToLower();
            if (extension == ".docx" || extension == ".xlsx")
            {
                serviceResponse = await _convertToPdfService.ConvertToPdf(file);
            }
            else
            {
                return BadRequest("Unsupported file format.");
            }

            result = (FileContentResult)serviceResponse.Result;

            if (result == null)
            {
                return StatusCode(500, "File conversion failed.");
            }

            return File(result.FileContents, result.ContentType, result.FileDownloadName);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddCommentFile([FromForm] CommentrequestDTO request)
        {
            if (request.File == null)
            {
                return BadRequest("No file uploaded.");
            }

            ServiceResult serviceResponse;

            FileContentResult? result = null;

            serviceResponse = await _convertToPdfService.AddCommentsToPdf(request);
            
            result = (FileContentResult)serviceResponse.Result;

            if (result == null)
            {
                return StatusCode(500, "File conversion failed.");
            }

            return File(result.FileContents, result.ContentType, result.FileDownloadName);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddInitial_WatermarkFile([FromForm] InitialWatermarkDTO request)
        {
            if (request.Pdf == null)
            {
                return BadRequest("No PDF file uploaded.");
            }

            // Get dynamic image files (image1, image2, image3, ...)
            var imageFiles = Request.Form.Files
                .Where(f => f.Name.StartsWith("image", StringComparison.OrdinalIgnoreCase))
                .ToDictionary(f => f.Name, f => f);

            // You can pass these image files into the service if needed
            ServiceResult serviceResponse;
            FileContentResult? result = null;

            // Pass all data including dynamic images to service
            serviceResponse = await _convertToPdfService.InitialWatermark(request, imageFiles);

            result = serviceResponse.Result as FileContentResult;

            if (result == null)
            {
                return StatusCode(500, new
                {
                    ok = false,
                    message = serviceResponse.Message
                });
            }

            return File(result.FileContents, result.ContentType, result.FileDownloadName);
        }


    }
}

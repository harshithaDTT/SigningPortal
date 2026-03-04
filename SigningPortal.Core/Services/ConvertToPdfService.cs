using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace SigningPortal.Core.Services
{
	public class ConvertToPdfService : IConvertToPdfService
	{
		private HttpClient _client;

        public ConvertToPdfService(HttpClient client, IConfiguration configuration)
        {
            _client = client ?? throw new ArgumentNullException(nameof(client));

            var baseAddress = configuration.GetValue<string>("Config:PdfConverterBaseAddress");

            if (string.IsNullOrWhiteSpace(baseAddress))
            {
                throw new InvalidOperationException("PdfConverterBaseAddress is not configured properly.");
            }

            _client.BaseAddress = new Uri(baseAddress);

            var timeoutMinutes = configuration.GetValue<int?>("PdfConverterTimeout") ?? 10;

            _client.Timeout = TimeSpan.FromMinutes(timeoutMinutes);
        }

        public async Task<ServiceResult> ConvertToPdf(IFormFile file)
		{
			try
			{
				if (file == null || file.Length == 0)
					throw new ArgumentException("Input file is empty or null.", nameof(file));



				HttpResponseMessage response = null;

				using (var form = new MultipartFormDataContent())
				{
					using MemoryStream memoryStream = new();

					await file.CopyToAsync(memoryStream);

					memoryStream.Position = 0;

					var streamContent = new StreamContent(memoryStream);

					streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream");

					form.Add(streamContent, "file", file.FileName);

					response = await _client.PostAsync("convert", form);
					response.EnsureSuccessStatusCode();

				}

				var contentType = response.Content.Headers.ContentType?.MediaType;
				if (contentType != "application/pdf")
					throw new InvalidOperationException("Expected PDF file in response.");

				var pdfBytes = await response.Content.ReadAsByteArrayAsync();

				var fileContent = new FileContentResult(pdfBytes, "application/pdf")
				{
					FileDownloadName = Path.ChangeExtension(file.FileName, ".pdf")
				};

				//var stream = new MemoryStream(pdfBytes);
				//var formFile = new FormFile(stream, 0, stream.Length, "file", Path.ChangeExtension(file.FileName, ".pdf"))
				//{
				//    Headers = new HeaderDictionary(),
				//    ContentType = "application/pdf"
				//};

				return new ServiceResult(fileContent, "File converted to PDF successfully");
			}
			catch (Exception ex)
			{
				// You may want to return an error message instead of null.
				return new ServiceResult(null, "PDF conversion failed: " + ex.Message, success: false);
			}
		}
		public async Task<ServiceResult> AddCommentsToPdf(CommentrequestDTO request)
		{
			try
			{
				if (request.File == null || request.File.Length == 0)
					throw new ArgumentException("Input file is empty or null.", nameof(request.File));



				HttpResponseMessage response = null;

				using (var form = new MultipartFormDataContent())
				{
					using MemoryStream memoryStream = new();

					await request.File.CopyToAsync(memoryStream);

					memoryStream.Position = 0;

					var streamContent = new StreamContent(memoryStream);

					streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");

					form.Add(streamContent, "file", request.File.FileName);
					form.Add(new StringContent(request.Comments ?? ""), "Comments");


					response = await _client.PostAsync("annotate", form);
					response.EnsureSuccessStatusCode();

				}

				var contentType = response.Content.Headers.ContentType?.MediaType;
				if (contentType != "application/pdf")
					throw new InvalidOperationException("Expected PDF file in response.");

				var pdfBytes = await response.Content.ReadAsByteArrayAsync();

				var fileContent = new FileContentResult(pdfBytes, "application/pdf")
				{
					FileDownloadName = Path.ChangeExtension(request.File.FileName, ".pdf")
				};

				//var stream = new MemoryStream(pdfBytes);
				//var formFile = new FormFile(stream, 0, stream.Length, "file", Path.ChangeExtension(file.FileName, ".pdf"))
				//{
				//    Headers = new HeaderDictionary(),
				//    ContentType = "application/pdf"
				//};

				return new ServiceResult(fileContent, "File converted to PDF successfully");
			}
			catch (Exception ex)
			{
				// You may want to return an error message instead of null.
				return new ServiceResult(null, "PDF conversion failed: " + ex.Message, success: false);
			}
		}
		public async Task<ServiceResult> InitialWatermark(InitialWatermarkDTO request, Dictionary<string, IFormFile> imageFiles)
		{
			try
			{
				if (request.Pdf == null || request.Pdf.Length == 0)
					throw new ArgumentException("Input file is empty or null.", nameof(request.Pdf));

				HttpResponseMessage response;

				using var form = new MultipartFormDataContent();
				var disposableStreams = new List<MemoryStream>();

				try
				{
					// PDF
					var memoryStream = new MemoryStream();
					await request.Pdf.CopyToAsync(memoryStream);
					memoryStream.Position = 0;
					disposableStreams.Add(memoryStream);

					var streamContent = new StreamContent(memoryStream);
					streamContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
					form.Add(streamContent, "pdf", request.Pdf.FileName);

					// Strings
					if (!string.IsNullOrWhiteSpace(request.Params))
						form.Add(new StringContent(request.Params), "params");

					if (!string.IsNullOrWhiteSpace(request.Text))
						form.Add(new StringContent(request.Text), "watermark_text");

					if (!string.IsNullOrWhiteSpace(request.Font_size))
						form.Add(new StringContent(request.Font_size), "font_size");

					// Images
					foreach (var kvp in imageFiles)
					{
						string imageFieldName = kvp.Key;
						IFormFile imageFile = kvp.Value;

						var imgStream = new MemoryStream();
						await imageFile.CopyToAsync(imgStream);
						imgStream.Position = 0;
						disposableStreams.Add(imgStream);

						var imageContent = new StreamContent(imgStream);
						imageContent.Headers.ContentType = new MediaTypeHeaderValue(imageFile.ContentType);
						form.Add(imageContent, imageFieldName, imageFile.FileName);
					}

					// Send
					response = await _client.PostAsync("embed", form);
					response.EnsureSuccessStatusCode();
				}
				finally
				{
					// Dispose all memory streams AFTER sending the request
					foreach (var stream in disposableStreams)
						stream.Dispose();
				}

				var contentType = response.Content.Headers.ContentType?.MediaType;
				if (contentType != "application/pdf")
					throw new InvalidOperationException("Expected PDF file in response.");

				var pdfBytes = await response.Content.ReadAsByteArrayAsync();

				var fileContent = new FileContentResult(pdfBytes, "application/pdf")
				{
					FileDownloadName = Path.ChangeExtension(request.Pdf.FileName, ".pdf")
				};

				return new ServiceResult(fileContent, "File converted to PDF successfully");
			}
			catch (Exception ex)
			{
				return new ServiceResult(null, "PDF conversion failed: " + ex.Message, success: false);
			}
		}

	}
}

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.Utilities;
using System;
using System.Threading.Tasks;

namespace SigningPortal.Core.Services
{
    public class EDMSService : IEDMSService
    {
        private readonly ILogger<EDMSService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IConstantError _constantError;
        private readonly IMinioService _minioService;
        private readonly IStorageService _storageService;
        public EDMSService(ILogger<EDMSService> logger,
            IConfiguration configuration,
            IMinioService minioService,
            IStorageService storageService,
            IConstantError constantError)
        {
            _logger = logger;
            _configuration = configuration;
            _constantError = constantError;
            _minioService = minioService;
            _storageService = storageService;
        }
        //public async Task<ServiceResult> GetDocumentAsync(int id)
        //{
        //	try
        //	{
        //		DateTime startTime = DateTime.UtcNow;
        //		_logger.LogInformation($"GetDocumentAsync started at: {startTime}");

        //		using var client = new HttpClient
        //		{
        //			BaseAddress = new Uri(_configuration["Config:EDMSConfig:EDMS_Url"]),
        //			Timeout = TimeSpan.FromMinutes(10)
        //		};

        //		// Start reading as soon as headers arrive
        //		var response = await client.GetAsync($"download-document?docId={id}", HttpCompletionOption.ResponseHeadersRead);

        //		_logger.LogInformation($"Download document from EDMS total time: {DateTime.UtcNow.Subtract(startTime)}");

        //		if (response.StatusCode == HttpStatusCode.OK)
        //		{
        //			await using var responseStream = await response.Content.ReadAsStreamAsync();
        //			using var ms = new MemoryStream();
        //			await responseStream.CopyToAsync(ms);

        //			var bytes = ms.ToArray();
        //			if (bytes == null || bytes.Length == 0)
        //			{
        //				_logger.LogError($"Document (ID: {id}) returned empty content.");
        //				return new ServiceResult(_constantError.GetMessage("102523"));
        //			}

        //			_logger.LogInformation($"Document (ID: {id}) received successfully. Size: {bytes.Length} bytes");
        //			return new ServiceResult(bytes, "Document received successfully");
        //		}
        //		else if (response.StatusCode == HttpStatusCode.NoContent)
        //		{
        //			_logger.LogInformation($"Document (ID: {id}) no longer exists.");
        //			return new ServiceResult("This Document No Longer Exists");
        //		}
        //		else
        //		{
        //			string uri = response.RequestMessage?.RequestUri?.ToString() ?? "unknown";
        //			string reason = response.ReasonPhrase ?? "Reason unknown";

        //			_logger.LogError($"Request to {uri} failed with status code {response.StatusCode}: {reason}");
        //			Monitor.SendMessage($"The request with URI={uri} failed with status code={response.StatusCode}");
        //			return new ServiceResult($"{_constantError.GetMessage("102546")}: {reason}");
        //		}
        //	}
        //	catch (Exception ex)
        //	{
        //		_logger.LogError(ex, $"GetDocumentAsync Exception: {ex.Message}");
        //		Monitor.SendException(ex);
        //		return new ServiceResult(_constantError.GetMessage("102547"));
        //	}
        //}

        public async Task<ServiceResult> GetDocumentAsync(string id)
        {
            try
            {
                DateTime startTime = DateTime.UtcNow;
                _logger.LogInformation($"GetDocumentAsync started at: {startTime}");

                return await _storageService.GetDocumentAsync(id.ToString());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"GetDocumentAsync Exception: {ex.Message}");
                Monitor.SendException(ex);
                return new ServiceResult(_constantError.GetMessage("102547"));
            }
        }

        //public async Task<ServiceResult> saveDocumentAsync(SaveFileDTO filee)
        //{
        //	FileStream readstream = null;
        //	try
        //	{
        //		//string ImagePath = Path.Combine(_environment.ContentRootPath, "Resource\\sample3.pdf");
        //		//var stream = System.IO.File.Create(ImagePath);
        //		//await filee.file.CopyToAsync(stream);
        //		//stream.Close();

        //		//readstream = File.OpenRead(ImagePath);
        //		//var fileStreamContent = new StreamContent(readstream);




        //		var cc = ReadFileData();
        //		var fileStreamContent = new StreamContent(new MemoryStream(cc));

        //		fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");

        //		var requestContent = new MultipartFormDataContent();


        //		requestContent.Add(fileStreamContent, "signfile", "file.pdf");
        //		HttpResponseMessage response = await _client.PostAsync($"http://localhost:4004/upload", requestContent);
        //		if (response.StatusCode == HttpStatusCode.OK)
        //		{


        //			return new ServiceResult(null, "Document received successfully");
        //		}
        //		else
        //		{
        //			Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
        //			$"with status code={response.StatusCode}");

        //			_logger.LogError($"The request with URI={response.RequestMessage.RequestUri} failed " +
        //					   $"with status code={response.StatusCode}");

        //			return new ServiceResult(_constantError.GetMessage("102546") + ":" + response.ReasonPhrase);
        //			//return new ServiceResult("Failed to receive document : " + response.ReasonPhrase);
        //		}
        //	}
        //	catch (Exception ex)
        //	{
        //		Monitor.SendException(ex);
        //		_logger.LogError(ex, ex.Message);
        //		_logger.LogError("GetDocumentAsync Exception :  {0}", ex.Message);
        //	}
        //	finally
        //	{
        //		readstream.Close();
        //		DeleteFiles(Path.Combine(_environment.ContentRootPath, "Resource"));
        //	}

        //	return new ServiceResult(_constantError.GetMessage("102547"));
        //	//return new ServiceResult("An error occurred while fetching document");
        //}

        //private void DeleteFiles(string path)
        //{
        //	_logger.LogInformation("DeleteExpiredFiles start...");
        //	if (Directory.Exists(path))
        //	{
        //		string[] files = Directory.GetFiles(path);
        //		foreach (string file in files)
        //		{
        //			try
        //			{
        //				File.Delete(file);
        //			}
        //			catch (Exception ex)
        //			{
        //				Monitor.SendException(ex);
        //				_logger.LogError(ex, ex.Message);
        //			}
        //		}
        //	}

        //	_logger.LogInformation("DeleteExpiredFiles end...");
        //}
        //byte[] ReadFileData()
        //{
        //	var html = "<!DOCTYPE html> <html> <head> <meta name='viewport' content='width=device-width, initial-scale=1'> <style> body { font-family: Arial, Helvetica, sans-serif; background-color: black; } * { box-sizing: border-box; } /* Add padding to containers */ .container { padding: 16px; background-color: white; } /* Full-width input fields */ input[type=text], input[type=password] { width: 100%; padding: 15px; margin: 5px 0 22px 0; display: inline-block; border: none; background: #f1f1f1; } input[type=text]:focus, input[type=password]:focus { background-color: #ddd; outline: none; } /* Overwrite default styles of hr */ hr { border: 1px solid #f1f1f1; margin-bottom: 25px; } /* Set a style for the submit button */ .registerbtn { background-color: #04AA6D; color: white; padding: 16px 20px; margin: 8px 0; border: none; cursor: pointer; width: 100%; opacity: 0.9; } .registerbtn:hover { opacity: 1; } /* Add a blue text color to links */ a { color: dodgerblue; } /* Set a grey background color and center the text of the 'sign in' section */ .signin { background-color: #f1f1f1; text-align: center; } </style> </head> <body> <form action='/action_page.php'> <div class='container'> <h1>Register</h1> <p>Please fill in this form to create an account.</p> <hr> <label for='email'><b>Email</b></label> <input type='text' placeholder='Enter Email' name='email' id='email' required> <label for='psw'><b>Password</b></label> <input type='password' placeholder='Enter Password' name='psw' id='psw' required> <label for='psw-repeat'><b>Repeat Password</b></label> <input type='password' placeholder='Repeat Password' name='psw-repeat' id='psw-repeat' required> <hr> <p>By creating an account you agree to our <a href='#'>Terms & Privacy</a>.</p> <button type='submit' class='registerbtn'>Register</button> </div> <div class='container signin'> <p>Already have an account? <a href='#'>Sign in</a>.</p> </div> </form> </body> </html>";
        //	var globalSettings = new GlobalSettings
        //	{
        //		ColorMode = ColorMode.Color,
        //		Orientation = Orientation.Portrait,
        //		PaperSize = PaperKind.A4,
        //		Margins = new MarginSettings { Top = 5, Bottom = 18, Left = 10, Right = 10 },

        //		// Out = optput
        //	};

        //	var objectSettings = new ObjectSettings
        //	{
        //		PagesCount = true,
        //		HtmlContent = html,
        //		WebSettings = { DefaultEncoding = "utf-8", Background = true },
        //		//HeaderSettings = { FontSize = 10, Right = "Page [page] of [toPage]", Line = true },
        //		//FooterSettings = { FontSize = 8, Center = "PDF demo from JeminPro", Line = true },
        //	};

        //	var htmlToPdfDocument = new HtmlToPdfDocument()
        //	{
        //		GlobalSettings = globalSettings,
        //		Objects = { objectSettings },
        //	};
        //	var ByteArry = _converter.Convert(htmlToPdfDocument);
        //	return ByteArry;
        //}
    }
}

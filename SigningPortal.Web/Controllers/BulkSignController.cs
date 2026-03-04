using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication.Bulksign;
using SigningPortal.Core.DTOs;
using SigningPortal.Web.Models;
using SigningPortal.Web.ViewModels.BulkSign;

namespace SigningPortal.Web.Controllers
{
	[Authorize]
	public class BulkSignController : BaseController
	{
		private readonly IBulkSignService _bulkSignService;
		private readonly ITemplateService _templateService;
		private readonly IConfiguration _configuration;

		public BulkSignController(IBulkSignService bulkSignService,
			ITemplateService templateService,
			IConfiguration configuration)
		{
			_bulkSignService = bulkSignService;
			_templateService = templateService;
			_configuration = configuration;
		}
		//public async Task<IActionResult> Index(string id)
		//{

		//    var myList = await _bulkSignService.GetBulkSigDataListAsync(UserDetails());
		//    var model = (List<Core.Domain.Model.BulkSign>)myList.Result;
		//    return View(model);

		//}
		public IActionResult Index(string? viewName)
		{

			TempData["ViewName"] = viewName;
			ViewBag.ViewName = TempData["ViewName"];
			return View();

		}
        public IActionResult BulkSignIndexNew(string? viewName)
        {
            ViewBag.ViewName = viewName;
            return View();
        }

        public async Task<IActionResult> Draftlist()
        {
            var result = await _bulkSignService.GetBulkSigDataListAsync(UserDetails());

            if (result == null || !result.Success)
            {
                return Json(new { success = false, message = result?.Message ?? "Error" });
            }

            var model = new ViewModels.BulkSign.AllBulkSignTemplatesListViewModel()
            {
                draftDocuments = (List<Core.Domain.Model.BulkSign>)result.Result,
            };

            return Json(new { success = true, data = model });
        }
        public async Task<IActionResult> draft()
		{

			//var user = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "user").Value);
			//var userDTO = JsonConvert.DeserializeObject<UserDTO>(user);
			var result = await _bulkSignService.GetBulkSigDataListAsync(UserDetails());

			if (result == null || !result.Success)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = result.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index");
			}
			var model = new ViewModels.BulkSign.AllBulkSignTemplatesListViewModel()
			{
				draftDocuments = (List<Core.Domain.Model.BulkSign>)result.Result,


			};


			return PartialView("_draftBulk", model);
		}
		
		public async Task<IActionResult> Sentlist()
		{
            var result2 = await _bulkSignService.GetSentBulkSignListAsync(UserDetails());
            if (result2 == null || !result2.Success)
            {
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = result2.Message };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return RedirectToAction("Index");
            }

            var model = new ViewModels.BulkSign.AllBulkSignTemplatesListViewModel()
            {

                sentDocuments = (List<Core.Domain.Model.BulkSign>)result2.Result,

            };

            return Json(new { success = true, data = model });
        }
        public async Task<IActionResult> sent()
		{
			//var user = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "user").Value);
			//var userDTO = JsonConvert.DeserializeObject<UserDTO>(user);

			var result2 = await _bulkSignService.GetSentBulkSignListAsync(UserDetails());
			if (result2 == null || !result2.Success)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = result2.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index");
			}

			var model = new ViewModels.BulkSign.AllBulkSignTemplatesListViewModel()
			{

				sentDocuments = (List<Core.Domain.Model.BulkSign>)result2.Result,

			};



			return PartialView("_sendBulk", model);
		}

		public async Task<IActionResult> Receivedlist()
		{
            var result1 = await _bulkSignService.GetReceivedBulkSignListAsync(UserDetails());

            if (result1 == null || !result1.Success)
            {
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = result1.Message };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return RedirectToAction("Index");
            }
            var model = new ViewModels.BulkSign.AllBulkSignTemplatesListViewModel()
            {

                receivedDocuments = (List<Core.Domain.Model.BulkSign>)result1.Result,


            };
            return Json(new { success = true, data = model });
        }
		public async Task<IActionResult> recived()
		{
			//var user = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "user").Value);
			//var userDTO = JsonConvert.DeserializeObject<UserDTO>(user);

			var result1 = await _bulkSignService.GetReceivedBulkSignListAsync(UserDetails());

			if (result1 == null || !result1.Success)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = result1.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index");
			}
			var model = new ViewModels.BulkSign.AllBulkSignTemplatesListViewModel()
			{

				receivedDocuments = (List<Core.Domain.Model.BulkSign>)result1.Result,


			};

			return PartialView("_receivedBulk", model);
		}

		public async Task<IActionResult> GetBulkSignList()
		{
			//var apiToken = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "apiToken").Value);
			//var result = await _bulkSignService.GetBulkSigDataListAsync(apiToken);
			//if (result == null || !result.Success)
			//{
			//    return NotFound();
			//}
			//var user = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "user").Value);

			//var userDTO = JsonConvert.DeserializeObject<UserDTO>(user);

			var myLis = await _bulkSignService.GetBulkSigDataListAsync(UserDetails());
			var model = (List<Core.Domain.Model.BulkSign>)myLis.Result;
			return View(model);
		}



		public async Task<IActionResult> GetReceivedBulkSignList()
		{
			//var apiToken = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "apiToken").Value);
			//var result = await _bulkSignService.GetReceivedBulkSignList(apiToken);
			//if (result == null || !result.Success)
			//{
			//    return NotFound();
			//}
			//var model = (List<BulkSignDTO>)result.Resource;
			//var user = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "user").Value);

			//var userDTO = JsonConvert.DeserializeObject<UserDTO>(user);

			var result = await _bulkSignService.GetReceivedBulkSignListAsync(UserDetails());
			var model = (List<Core.Domain.Model.BulkSign>)result.Result;
			return View(model);
		}
		public async Task<IActionResult> GetSentBulkSignList()
		{
			//var apiToken = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "apiToken").Value);
			//var result = await _bulkSignService.GetSentBulkSignListAsync(apiToken);
			//if (result == null || !result.Success)
			//{
			//    return NotFound();
			//}
			//var model = (List<BulkSignDTO>)result.Resource;
			//var user = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "user").Value);

			//var userDTO = JsonConvert.DeserializeObject<UserDTO>(user);

			var result = await _bulkSignService.GetSentBulkSignListAsync(UserDetails());
			var model = (List<Core.Domain.Model.BulkSign>)result.Result;
			return View(model);
		}
		public async Task<IActionResult> UploadFiles()
		{
			var templatelist = await _templateService.GetTemplateListForBulkSignAsync(UserDetails());

			if (templatelist == null || !templatelist.Success)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = templatelist.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index");
			}
			var list = (List<Template>)templatelist.Result;
			var model = new UploadFilesViewModel()
			{
				TemplateList = list,

			};

			return View(model);
		}
        public async Task<IActionResult> UploadFilesNew(string? templateId)
        {
            var templatelist = await _templateService.GetTemplateListForBulkSignAsync(UserDetails());

            if (templatelist == null || !templatelist.Success)
            {
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = templatelist.Message };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return RedirectToAction("Index");
            }

            var list = (List<Template>)templatelist.Result;

            var model = new UploadFilesViewModel()
            {
                TemplateList = list,
                SelectedTemplateId = templateId // null or value — both allowed
            };

            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> TemplateDetailsMyList(string CorelationId)
		{
			var myList = await _bulkSignService.GetBulkSigDataListAsync(UserDetails());

			if (myList == null || !myList.Success)
			{
				return Json(new { success = false, message = myList.Message });
			}

			var model = (List<Core.Domain.Model.BulkSign>)myList.Result;
			var bulksignitem = model.FirstOrDefault(item => item.CorelationId == CorelationId);
			var paths = new VerifyPathsDTO()

			{
				Inputpath = "",
				Outputpath = "",
			};
			if (bulksignitem != null)
			{
				paths.Inputpath = bulksignitem.SourcePath;
				paths.Outputpath = bulksignitem.SignedPath;
			}
			else
			{
				return Json(new { success = false, message = "Error while receiving files" });
			}
			var agenturl = _configuration.GetValue<string>("Config:Signing_portal:AGENT_URL");
			if (string.IsNullOrEmpty(agenturl))
			{
				return Json(new { success = false, message = "Agent Url not found" });
			}

			var url = (string)agenturl;
			var response = await _bulkSignService.VerifyPathsAsync(paths, url);

			if (response == null || !response.Success)
			{
				return Json(new { success = false, message = response.Message });
			}
			var jsonString = response.Result as string;

			if (string.IsNullOrWhiteSpace(jsonString))
			{
				return Json(new { success = false, message = "Invalid file list response" });
			}
			var list = JsonConvert.DeserializeObject<string[]>(jsonString);

			if (list == null)
			{
				return Json(new { success = false, message = "Failed to parse file list" });
			}
			var fileslist = new FilesListViewModel()
			{
				FileNamesList = list,
				sourcePath = bulksignitem.SourcePath,
			};

			// Return redirect URL to the DisplayFiles action
			return Json(new { success = true, redirectUrl = Url.Action("DisplayFilesNew", fileslist) });
		}

		[HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> TemplateDetailsSentList(string CorelationId)
		{
			var myList = await _bulkSignService.GetSentBulkSignListAsync(UserDetails());
			if (myList == null || !myList.Success)
			{
				return Json(new { success = false, message = myList.Message });
			}
			var model = (List<Core.Domain.Model.BulkSign>)myList.Result;
			var bulksignitem = model.FirstOrDefault(item => item.CorelationId == CorelationId);
			var paths = new VerifyPathsDTO()
			{
				Inputpath = "",
				Outputpath = "",
			};
			if (bulksignitem != null)
			{
				paths = new VerifyPathsDTO()
				{
					Inputpath = bulksignitem.SourcePath,
					Outputpath = bulksignitem.SignedPath,
				};

			}
			else
			{
				return Json(new { success = false, message = "Error while receiving files" });
			}


			var agenturl = _configuration.GetValue<string>("Config:Signing_portal:AGENT_URL");
			if (string.IsNullOrEmpty(agenturl))
			{
				return Json(new { success = false, message = "Agent Url not found" });
			}

			var url = (string)agenturl;
			var response = await _bulkSignService.VerifyPathsAsync(paths, url);
			if (response == null || !response.Success)
			{
				return Json(new { success = false, message = response.Message });
			}
			if (response == null || !response.Success)
			{
				return Json(new { success = false, message = response.Message });
			}
			var jsonString = response.Result as string;

			if (string.IsNullOrWhiteSpace(jsonString))
			{
				return Json(new { success = false, message = "Invalid file list response" });
			}
			var list = JsonConvert.DeserializeObject<string[]>(jsonString);

			if (list == null)
			{
				return Json(new { success = false, message = "Failed to parse file list" });
			}
			var fileslist = new FilesListViewModel()
			{
				FileNamesList = list,
				sourcePath = bulksignitem.SourcePath,
			};

			return Json(new { success = true, redirectUrl = Url.Action("DisplayFilesNew", fileslist) });

		}

		[HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> TemplateDetailsReceivedList(string CorelationId)
		{
			var myList = await _bulkSignService.GetReceivedBulkSignListAsync(UserDetails());
			if (myList == null || !myList.Success)
			{
				return Json(new { success = false, message = myList.Message });
			}
			var model = (List<Core.Domain.Model.BulkSign>)myList.Result;
			var bulksignitem = model.FirstOrDefault(item => item.CorelationId == CorelationId);
			var paths = new VerifyPathsDTO()
			{
				Inputpath = "",
				Outputpath = "",
			};
			if (bulksignitem != null)
			{
				paths = new VerifyPathsDTO()
				{
					Inputpath = bulksignitem.SourcePath,
					Outputpath = bulksignitem.SignedPath,
				};

			}
			else
			{
				return Json(new { success = false, message = "Error while receiving files" });
			}


			//var agenturl = await _bulkSignService.GetAgentUrlAsync(UserDetails().OrganizationId);
			//if (agenturl == null || !agenturl.Success)
			//{
			//    return Json(new { success = false, message = agenturl.Message });
			//}
			var agenturl = _configuration.GetValue<string>("Config:Signing_portal:AGENT_URL");
			if (string.IsNullOrEmpty(agenturl))
			{
				return Json(new { success = false, message = "Agent Url not found" });
			}

			var url = (string)agenturl;
			//var paths = JsonConvert.DeserializeObject<VerifyPathsDTO>(templateData.SettingConfig);

			var response = await _bulkSignService.VerifyPathsAsync(paths, url);
			if (response == null || !response.Success)
			{
				return Json(new { success = false, message = response.Message });
			}
			if (response == null || !response.Success)
			{
				return Json(new { success = false, message = response.Message });
			}
			var jsonString = response.Result as string;

			if (string.IsNullOrWhiteSpace(jsonString))
			{
				return Json(new { success = false, message = "Invalid file list response" });
			}
			var list = JsonConvert.DeserializeObject<string[]>(jsonString);

			if (list == null)
			{
				return Json(new { success = false, message = "Failed to parse file list" });
			}

			var fileslist = new FilesListViewModel()
			{
				FileNamesList = list,
				sourcePath = bulksignitem.SourcePath,
			};

			//return RedirectToAction("DisplayFiles", fileslist);

			return Json(new { success = true, redirectUrl = Url.Action("DisplayFilesNew", fileslist) });

			//return RedirectToPage("DisplayFiles",)
			//return Json(new { success = true, message = response.Message, result = list });
			//return View();

		}
		public IActionResult DisplayFiles(FilesListViewModel fileslist)
		{
			return View(fileslist);
		}
        public IActionResult DisplayFilesNew(FilesListViewModel fileslist)
        {
            return View(fileslist);
        }
        [HttpPost]
		public async Task<IActionResult> GetFileBlob([FromBody] BulkSignFileDataDTO datavale)
		{
			var dataobj = datavale;

			//var agenturl = await _bulkSignService.GetAgentUrlAsync(UserDetails().OrganizationId);
			//if (agenturl == null || !agenturl.Success)
			//{
			//    return Json(new { success = false, message = agenturl.Message });
			//}

			var agenturl = _configuration.GetValue<string>("Config:Signing_portal:AGENT_URL");
			if (string.IsNullOrEmpty(agenturl))
			{
				return Json(new { success = false, message = "Agent Url not found" });
			}

			var url = (string)agenturl;
			var response = await _bulkSignService.BulkSignFileData(dataobj, url);
			if (response == null || !response.Success)
			{
				return Json(new { success = false, message = response.Message });
			}
			return Ok(response);
		}

		[HttpPost]

		public async Task<IActionResult> BulkSigning([FromBody] string selectedTemplateId, string displayName)
		{


			var callBackUrl = "https://2844-183-82-123-27.ngrok-free.app/api/bulksigne/bulksigned-document";
			//var agenturl = await _bulkSignService.GetAgentUrlAsync(UserDetails().OrganizationId);
			//if (agenturl == null || !agenturl.Success)
			//{
			//    return Json(new { success = false, message = agenturl.Message });
			//}
			var agenturl = _configuration.GetValue<string>("Config:Signing_portal:AGENT_URL");
			if (string.IsNullOrEmpty(agenturl))
			{
				return Json(new { success = false, message = "Agent Url not found" });
			}

			var url = (string)agenturl;

			var bulksignRequest = await _bulkSignService.SaveBulkSigningRequestAsync(selectedTemplateId, displayName, UserDetails());
			if (bulksignRequest == null || !bulksignRequest.Success)
			{
				return Json(new { success = false, message = bulksignRequest.Message });
			}

			PrepareBulksignResponse response = (PrepareBulksignResponse)bulksignRequest.Result;

			var signingobj = new SendBulkSignRequestDTO()
			{
				CorrelationId = response.CorelationId,
				OrganizationId = response.OrganizationId,
				SignatureTemplateId = response.SignatureTemplateId,
				EsealSignatureTemplateId = response.EsealSignatureTemplateId,
				Suid = response.Suid,
				CallBackUrl = callBackUrl,
				SourcePath = response.SourcePath,
				DestinationPath = response.DestinationPath,
				PlaceHolderCoordinates = response.PlaceHolderCoordinates,
				EsealPlaceHolderCoordinates = response.EsealPlaceHolderCoordinates,
				QrcodePlaceHolderCoordinates = response.QrCodePlaceHolderCoordinates,
				QrCodeRequired = response.QrCodeRequired,

			};
			var bulksignresponse = await _bulkSignService.SendBulkSignRequestAsync(signingobj, url);
			if (bulksignresponse == null || !bulksignresponse.Success)
			{
				return Json(new { success = false, message = bulksignresponse.Message });
			}
			//var callBackUrl = _configuration.GetValue<string>("Config:Signing_portal:BACKEND_URL") + "/api/bulksigne/bulksigned-document";
			return Json(new { success = true, message = bulksignresponse.Message, result = bulksignresponse.Result });
		}


		[HttpPost]
		public async Task<IActionResult> PerformBulkSign([FromBody] string correlationId)
		{
			var idToken = HttpContext.User.Claims.FirstOrDefault(c => c.Type == "ID_Token")?.Value;
			if (string.IsNullOrWhiteSpace(idToken))
			{
				return Unauthorized(new
				{
					success = false,
					message = "ID Token missing or expired"
				});
			}
			var callBackUrl = string.Empty;
			var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
			var isDevelopment = environment == Environments.Development;
			if (isDevelopment)
			{
				callBackUrl = _configuration.GetValue<string>("CallBackUrl") + "/api/bulksigne/bulksigned-document";
			}
			else
			{
				callBackUrl = _configuration.GetValue<string>("Config:Signing_portal:BACKEND_URL") + "/api/bulksigne/bulksigned-document";
			}
			
			var agenturl = _configuration.GetValue<string>("Config:Signing_portal:AGENT_URL");
			if (string.IsNullOrEmpty(agenturl))
			{
				return Json(new { success = false, message = "Agent Url not found" });
			}

			var url = (string)agenturl;
			var result = await _bulkSignService.GetBulkSigDataAsync(correlationId);

			if (result == null || !result.Success)
			{
				return Json(new { success = false, message = result.Message });
			}
			var model = (BulkSign)result.Result;

			string id = model.TemplateId;


			var response = await _bulkSignService.PrepareBulkSigningRequestAsync(id, UserDetails());

			if (response == null || !response.Success)
			{
				return Json(new { success = false, message = response.Message });
			}

			var bulksignobject = (PrepareBulksignResponse)response.Result;
			var signObject = new SignDTO();
			signObject.correlationId = correlationId;
			signObject.organizationId = bulksignobject.OrganizationId;
			//signObject.callBackUrl = bulksignobject.CallBackUrl;
			signObject.callBackUrl = callBackUrl;
			signObject.sourcePath = model.SourcePath;
			signObject.destinationPath = model.SignedPath;
			signObject.suid = bulksignobject.Suid;
			signObject.qrCodeRequired = bulksignobject.QrCodeRequired;
			signObject.signatureTemplateId = bulksignobject.SignatureTemplateId;
			signObject.esealSignatureTemplateId = bulksignobject.EsealSignatureTemplateId;
			signObject.esealPlaceHolderCoordinates = bulksignobject.EsealPlaceHolderCoordinates;
			signObject.placeHolderCoordinates = bulksignobject.PlaceHolderCoordinates;
			signObject.qrcodePlaceHolderCoordinates = bulksignobject.QrCodePlaceHolderCoordinates;

			var response1 = await _bulkSignService.BulkSignAsync(signObject, url, idToken);
			if (response1 == null || !response1.Success)
			{
				return Json(new { success = false, message = response1.Message });
			}

			//var response2 = await _bulkSignService.UpdateStatus(correlationId, false, apiToken);
			//if (response2 == null || !response2.Success)
			//{
			//    return Json(new { success = false, message = response2.Message });
			//}

			var response2 = await _bulkSignService.UpdateBulkSigningStatusAsync(correlationId, false);
			if (response2 == null || !response2.Success)
			{
				return Json(new { success = false, message = response2.Message });
			}
			return Ok(response1);
		}

		[HttpGet]
		public async Task<IActionResult> DocumentStatusDetails(string correlationId)
		{
			//var apiToken = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "apiToken").Value);
			//var result = await _bulkSignService.GetDocumentDetails(correlationId, apiToken);
			//if (result == null || !result.Success)
			//{
			//    return NotFound();
			//}
			//var model = (DocumentDetailsDTO)result.Resource;
			//var result1 = model.status;
			var result = await _bulkSignService.GetBulkSigDataAsync(correlationId);
			if (result == null || !result.Success)
			{
				//return NotFound();
				return Json(new { success = false, message = result.Message });
			}
			var model = (BulkSign)result.Result;
			var result1 = model.Status;
			return Json(new { success = true, result = result1 });
			//return Ok(result1);
		}


		[HttpGet]
		public async Task<IActionResult> DocumentResultDetails(string correlationId)
		{
			//var apiToken = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "apiToken").Value);
			//var result = await _bulkSignService.GetDocumentDetails(correlationId, apiToken);
			//if (result == null || !result.Success)
			//{
			//    return NotFound();
			//}
			//var model = (DocumentDetailsDTO)result.Resource;
			var result = await _bulkSignService.GetBulkSigDataAsync(correlationId);
			if (result == null || !result.Success)
			{
				// return NotFound();
				return Json(new { success = false, message = result.Message });

			}
			var model = (BulkSign)result.Result;

			//BulkSignCallBackDTO bulkSignCallBackDTO = new BulkSignCallBackDTO();

			//if (model.Result != null)
			//{
			//    bulkSignCallBackDTO = JsonConvert.DeserializeObject<BulkSignCallBackDTO>(model.Result);
			//}
			//var response = bulkSignCallBackDTO.Result;
			//if (response == null)
			//{
			//    response.FileArray = new Filearray[0]; ;
			//}
			return Json(new { success = true, result = model.Result });
			//return Ok(model.Result);
		}


		[HttpGet]
		public async Task<IActionResult> BulkSigningStatus(string correlationId)
		{

			//var result = await _bulkSignService.GetBulkSigDataAsync(correlationId);
			//if (result == null || !result.Success)
			//{
			//    return NotFound();
			//}
			//var model = (BulkSign)result.Result;

			//BulkSignCallBackDTO bulkSignCallBackDTO = new BulkSignCallBackDTO();

			//if (model.Result != null)
			//{
			//    var jsonstrified = JsonConvert.SerializeObject(model.Result);
			//    bulkSignCallBackDTO = JsonConvert.DeserializeObject<BulkSignCallBackDTO>(jsonstrified);
			//}
			//var response = bulkSignCallBackDTO.Result;
			//if (response == null)
			//{
			//    response.FileArray = new Filearray[0]; ;
			//}

			//return Ok(model.Result);


			var response = await _bulkSignService.GetBulkSigDataAsync(correlationId);
			if (response == null || !response.Success)
			{
				AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = response.Message };
				TempData["Alert"] = JsonConvert.SerializeObject(alert);
				return RedirectToAction("Index");
				//return Json(new { success = false, message = response.Message });
			}

			var model = (BulkSign)response.Result;
			var bulksigndetails = new BulkSignDetailsViewModel()
			{
				TemplateId = model.TemplateId,
				TemplateName = model.TemplateName,
				OrganizationId = model.OrganizationId,
				Suid = model.Suid,
				SignatureAnnotations = model.SignatureAnnotations,
				EsealAnnotations = model.EsealAnnotations,
				SourcePath = model.SourcePath,
				SignedPath = model.SignedPath,
				Status = model.Status,
				SignedBy = model.SignedBy,
				CompletedAt = model.CompletedAt,
				CorelationId = model.CorelationId,
				OwnerEmail = model.OwnerEmail,
				OwnerName = model.OwnerName,
				Result = model.Result,
			};

			return View(bulksigndetails);
		}

		[HttpGet]
		public async Task<IActionResult> UpdateBulkSignDocumentDetails(string correlationId)
		{
			//var agenturl = await _bulkSignService.GetAgentUrlAsync(UserDetails().OrganizationId);
			//if (agenturl == null || !agenturl.Success)
			//{
			//    return Json(new { success = false, message = agenturl.Message });
			//}
			var agenturl = _configuration.GetValue<string>("Config:Signing_portal:AGENT_URL");
			if (string.IsNullOrEmpty(agenturl))
			{
				return Json(new { success = false, message = "Agent Url not found" });
			}

			var url = (string)agenturl;


			var response = await _bulkSignService.UpdateBulkSignStatus(correlationId, url);
			if (response == null || !response.Success)
			{
				// return NotFound();
				return Json(new { success = false, message = response.Message });
			}
			var bulksigndto = (BulkSignCallBackDTO)response.Result;
			var result = bulksigndto.Result;
			return Json(new { success = true, result = result });
			//return Ok(result);
		}

		public async Task<IActionResult> Download([FromBody] DownloadBulkSignDocumentDTO documentDownloadDTO)
		{
			try
			{
				//var agenturl = await _bulkSignService.GetAgentUrlAsync(UserDetails().OrganizationId);
				//if (agenturl == null || !agenturl.Success)
				//{
				//	return new JsonResult(new { success = false, message = agenturl.Message });
				//}
				var agenturl = _configuration.GetValue<string>("Config:Signing_portal:AGENT_URL");
				if (string.IsNullOrEmpty(agenturl))
				{
					return Json(new { success = false, message = "Agent Url not found" });
				}

				var url = (string)agenturl;

				byte[] pdfBytes = await _bulkSignService.DownloadBulkSignDocumentAsync(documentDownloadDTO, url);
				var FileToDownLoad = File(pdfBytes, "application/pdf", documentDownloadDTO.fileName);
				return new JsonResult(new { success = true, message = agenturl, result = FileToDownLoad });
			}
			catch (InvalidOperationException ex)
			{
				// Handle the case where the response is not a PDF file
				//return NotFound(ex.Message);
				return new JsonResult(new { success = false, message = ex.Message });
			}
			catch (Exception ex)
			{
				// Handle other exceptions
				//return StatusCode(500, "An error occurred while processing the request.");
				return new JsonResult(new { success = false, message = ex.Message });
			}

		}

		public IActionResult GetFileConfiguration()
		{
			
			int numberOfFiles = _configuration.GetValue<int>("FileConfiguration:NumberOfFiles");
			int eachFileSize = _configuration.GetValue<int>("FileConfiguration:EachFileSize");
			int allFileSize = _configuration.GetValue<int>("FileConfiguration:AllFileSize");
			FileConfigDTO model = new FileConfigDTO()
			{
				EachFileSize = eachFileSize,
				NumberOfFiles = numberOfFiles,
				AllFileSize = allFileSize
			};
			return Ok(model);
		}

		[HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SendFiles([FromForm] List<IFormFile> files, string displayName, string id)
		{
			if (files != null || files.Count > 0)
			{

				//var agenturl = await _bulkSignService.GetAgentUrlAsync(UserDetails().OrganizationId);
				//if (agenturl == null || !agenturl.Success)
				//{
				//    return Json(new { success = false, message = agenturl.Message });
				//}
				var agenturl = _configuration.GetValue<string>("Config:Signing_portal:AGENT_URL");
				if (string.IsNullOrEmpty(agenturl))
				{
					return Json(new { success = false, message = "Agent Url not found" });
				}
				var url = (string)agenturl;

				var templatedetails = await _templateService.GetTemplateDetailsAsync(id);
				var preview = (Template)templatedetails.Result;

				//var email = preview.emailList[0];
				var jsonstrified = JsonConvert.SerializeObject(preview.EmailList);
				var emailList = JsonConvert.DeserializeObject<IList<string>>(jsonstrified);
				var email = emailList[0];

				var preparator = false;
				//var requestdto = new SaveRequestDTO();
				var requestdto = new PrepareBulksignResponse();

				if (email != Email)
				{
					//var request1 = await _bulkSignService.SaveRequestByPreparator(id, displayName, email, apiToken);
					//if (request1 == null || !request1.Success)
					//{
					//    return Json(new { success = false, message = request1.Message });
					//}
					//requestdto = (SaveRequestDTO)request1.Resource;
					var request1 = await _bulkSignService.SaveBulkSigningRequestAsync(id, displayName, UserDetails(), email);
					if (request1 == null || !request1.Success)
					{
						return Json(new { success = false, message = request1.Message });
					}

					requestdto = (PrepareBulksignResponse)request1.Result;
					preparator = true;
				}
				else
				{
					//var request = await _bulkSignService.SaveRequest(id, displayName, apiToken);
					//if (request == null || !request.Success)
					//{
					//    return Json(new { success = false, message = request.Message });
					//}
					//requestdto = (PrepareBulksignResponseDTO)request.Resource;
					var request = await _bulkSignService.SaveBulkSigningRequestAsync(id, displayName, UserDetails());
					if (request == null || !request.Success)
					{
						return Json(new { success = false, message = request.Message });
					}
					requestdto = (PrepareBulksignResponse)request.Result;
					preparator = false;
				}
				//var uploadkey = requestdto.OrganizationId + requestdto.Suid;
				var response = await _bulkSignService.SendFiles(files, requestdto.CorelationId);

				if (response == null || !response.Success)
				{
					return Json(new { success = false, message = response.Message });
				}
				var providedPath = response.Result.ToString();
				PathDTO pathDTO = new PathDTO();
				pathDTO.CorelationId = requestdto.CorelationId;
				pathDTO.Source = providedPath;
				pathDTO.Destination = providedPath + "_Signed";

				//var pathResponse = await _bulkSignService.ChangePath(pathDTO, apiToken);
				//if (pathResponse == null || !pathResponse.Success)
				//{
				//    return Json(new { success = false, message = pathResponse.Message });
				//}
				var pathResponse = await _bulkSignService.UpdateBulkSigningSourceDestinationAsync(pathDTO);
				if (pathResponse == null || !pathResponse.Success)
				{
					return Json(new { success = false, message = pathResponse.Message });
				}

				return Json(new { success = response.Success, message = response.Message, correlationid = requestdto.CorelationId, ispreparator = preparator });
			}
			else
			{
				return Json(new { success = false, message = "No files received." });
			}


		}

		[HttpGet]
        public async Task<IActionResult> UpdateDocumentDetails(string correlationId)
		{
			//         var agenturl = await _bulkSignService.GetAgentUrlAsync(UserDetails().OrganizationId);
			//         if (agenturl == null || !agenturl.Success)
			//         {
			//	AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = agenturl.Message };
			//	TempData["Alert"] = JsonConvert.SerializeObject(alert);
			//	return RedirectToAction("Index");
			//	//return Json(new { success = false, message = agenturl.Message });
			//}

			//var agenturl = _configuration.GetValue<string>("Config:Signing_portal:AGENT_URL");
			//if (string.IsNullOrEmpty(agenturl))
			//{
			//    AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = "Agent Url Not Found" };
			//    TempData["Alert"] = JsonConvert.SerializeObject(alert);
			//    return RedirectToAction("Index");
			//}

			//var url = (string)agenturl;
			////var uploadkey = OrganizationId + Suid;

			var response = await _bulkSignService.UpdateDocumentStatus(correlationId);
            if (response == null || !response.Success)
            {
                return Json(new
                {
                    success = false,
                    message = response?.Message ?? "Unknown error"
                });
            }
            var dto = (BulkSignCallBackDTO)response.Result; // ✅ cast to actual type
            var result = new
            {
                totalFileCount = dto.Result.TotalFileCount,
                successFileCount = dto.Result.SuccessFileCount,
                fileArray = dto.Result.FileArray
            };

            return Ok(result);
        }


		[HttpPost]
		public async Task<IActionResult> SendRequest([FromBody] string correlationId)
		{
			//var apiToken = (HttpContext.User.Claims.FirstOrDefault(c => c.Type == "apiToken").Value);
			//var response = await _bulkSignService.UpdateStatus(correlationId, true, apiToken);
			//if (response == null || !response.Success)
			//{
			//    return NotFound();
			//}
			var response = await _bulkSignService.UpdateBulkSigningStatusAsync(correlationId, true);
			if (response == null || !response.Success)
			{
				//return NotFound();
				return Json(new { success = false, message = response.Message });
			}
			return Ok(response);
		}

		[HttpPost]
		public async Task<IActionResult> FailBulkSignRequest([FromBody] string correlationId)
		{
			var response = await _bulkSignService.FailBulkSigningRequestAsync(correlationId);
			if (response == null || !response.Success)
			{
				//AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = response.Message };
				//TempData["Alert"] = JsonConvert.SerializeObject(alert);
				//return RedirectToAction("Index");
				return Json(new { success = false, message = response.Message });
			}
			return Ok(response);
		}


	}
}


using Azure;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Services;
using SigningPortal.Web.ViewModel;
using SigningPortal.Web.ViewModels.GenericTemplates;
using SigningPortal.Web.ViewModels.Templates;

namespace SigningPortal.Web.Controllers
{
	public class GenericTemplateController : BaseController
	{
		private readonly IGenericTemplateService _genericTemplateService;
        private readonly ITemplateService _templateService;


        public GenericTemplateController(IGenericTemplateService genericTemplateService, ITemplateService templateService)
		{
			_genericTemplateService = genericTemplateService;
            _templateService = templateService;
		}
		public async Task<IActionResult> Index()
		{
			try
			{

				var response = await _genericTemplateService.GetGenericTemplateListAsync(UserDetails());

				if (!response.Success)
				{
					return Json(new { success = false, response.Message });
				}
				else
				{
					IList<GenericTemplate> result = (List<GenericTemplate>)response.Result;
					GenericTemplateListViewModel model = new GenericTemplateListViewModel()
					{
						TemplateList = result
					};

					return View(model);
				}
			}
			catch (Exception)
			{
				return View();
			}
		}

        public async Task<IActionResult> CreateGenericTemplate()
        {
            try
            {
                var response1 = await _templateService.GetSignatureTemplateList();  //Signature Template List in modal
                var signatureTemplates = (IList<SignatureTemplatesDTO>)response1.Result;
                if (!response1.Success)
                {
                    //return Json(new { success = false, response.Message });
                    AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = (response1 == null ? "Internal error please contact to admin" : response1.Message) };
                    TempData["Alert"] = JsonConvert.SerializeObject(alert);
                    //return Json(new { success = false, response.Message });
                    return RedirectToAction("Index");
                }
                else
                {
                    CreateGenericTemplateViewModel model = new CreateGenericTemplateViewModel()
                    {
                        Templates = signatureTemplates,
                        
                    };



                    return View(model);
                }

            }
            catch (Exception ex)
            {
                AlertViewModel alert = new AlertViewModel { IsSuccess = false, Message = ex.Message };
                TempData["Alert"] = JsonConvert.SerializeObject(alert);
                return RedirectToAction("Index");
            }
        }

		[HttpPost]
		public async Task<IActionResult> SaveGenericTemplate(CreateGenericTemplateViewModel viewModel)
		{
			try
			{
				if (string.IsNullOrWhiteSpace(viewModel.Config))
					return BadRequest("Config cannot be empty.");

				if (string.IsNullOrWhiteSpace(viewModel.Roles))
					return BadRequest("Roles configuration cannot be empty.");

				var configObject = JObject.Parse(viewModel.Config);

				var signatureConfig = configObject["Signature"] as JObject ?? new JObject();
				var esealConfig = configObject["Eseal"] as JObject ?? new JObject();
				var qrConfig = configObject["Qrcode"] as JObject ?? new JObject();

				var emailList = viewModel.Signatory?
					.Split(',', StringSplitOptions.RemoveEmptyEntries)
					.Select(e => e.Trim())
					.ToList() ?? new List<string>();

				var signatureCoordinates = new Dictionary<string, CoordinatesData>();
				var esealCoordinates = new Dictionary<string, CoordinatesDataEseal>();
				var qrCodeCoordinates = new Dictionary<string, CoordinatesData>();

				// ================= SIGNATURE =================
				foreach (var property in signatureConfig.Properties())
				{
					var rolename = property.Name;
					var signatureData = property.Value;

					var signatureCoordinatesData = new CoordinatesData
					{
						fieldName = signatureData?["fieldName"]?.Value<string>() ?? string.Empty,
						posX = signatureData?["posX"]?.Value<float>() ?? 0f,
						posY = signatureData?["posY"]?.Value<float>() ?? 0f,
						PageNumber = signatureData?["PageNumber"]?.Value<int>() ?? 0,
						width = signatureData?["width"]?.Value<float>() ?? 0f,
						height = signatureData?["height"]?.Value<float>() ?? 0f
					};

					signatureCoordinates[rolename] = signatureCoordinatesData;
				}

				// ================= ESEAL =================
				foreach (var property in esealConfig.Properties())
				{
					var rolename = property.Name;
					var esealData = property.Value;

					var esealCoordinatesData = new CoordinatesDataEseal
					{
						fieldName = esealData?["fieldName"]?.Value<string>() ?? string.Empty,
						posX = esealData?["posX"]?.Value<float>() ?? 0f,
						posY = esealData?["posY"]?.Value<float>() ?? 0f,
						PageNumber = esealData?["PageNumber"]?.Value<int>() ?? 0,
						width = esealData?["width"]?.Value<float>() ?? 0f,
						height = esealData?["height"]?.Value<float>() ?? 0f,
						organizationID = esealData?["organizationID"]?.Value<string>()
					};

					esealCoordinates[rolename] = esealCoordinatesData;
				}

				// ================= QR CODE =================
				foreach (var property in qrConfig.Properties())
				{
					var rolename = property.Name;
					var qrCodeData = property.Value;

					var qrCodeCoordinatesData = new CoordinatesData
					{
						fieldName = qrCodeData?["fieldName"]?.Value<string>() ?? string.Empty,
						posX = qrCodeData?["posX"]?.Value<float>() ?? 0f,
						posY = qrCodeData?["posY"]?.Value<float>() ?? 0f,
						PageNumber = qrCodeData?["PageNumber"]?.Value<int>() ?? 0,
						width = qrCodeData?["width"]?.Value<float>() ?? 0f,
						height = qrCodeData?["height"]?.Value<float>() ?? 0f
					};

					qrCodeCoordinates[rolename] = qrCodeCoordinatesData;
				}

				// ================= PATH CONFIG =================
				var pathobj = new PathsdataDTO
				{
					inputpath = "",
					outputpath = ""
				};

				var pathobject = JsonConvert.SerializeObject(pathobj);

				// ================= ROLES =================
				var roleList = new List<GenericTemplateRole>();
				var roleObject = JObject.Parse(viewModel.Roles);
				var rolesConfig = roleObject["FinalRoleList"] as JArray;

				if (rolesConfig != null)
				{
					for (int i = 0; i < rolesConfig.Count; i++)
					{
						var matchedRole = rolesConfig
							.FirstOrDefault(role => role?["order"]?.Value<int>() == i + 1);

						if (matchedRole != null)
						{
							var completeRole = new GenericTemplateRole
							{
								Order = matchedRole["order"]?.Value<string>() ?? "0",
								RoleName = matchedRole["roleName"]?.Value<string>() ?? string.Empty,
								Email = matchedRole["email"]?.Value<string>() ?? string.Empty,
								AllowComments = matchedRole["allowComments"]?.Value<bool>() ?? false,
								SignatureMandatory = matchedRole["signatureMandatory"]?.Value<bool>() ?? false,
								ESeal = matchedRole["eseal"]?.Value<bool>() ?? false
							};

							roleList.Add(completeRole);
						}
					}
				}

				// ================= FINAL MODEL =================
				var data = new CreateGenericTemplateViewModel
				{
					TemplateName = viewModel.TemplateName,
					DocumentName = viewModel.DocumentName,
					RoleList = roleList,
					Rotation = viewModel.Rotation,
					emailList = emailList,
					settingConfig = pathobject,
					SignatureTemplate = viewModel.SignatureTemplate,
					EsealSignatureTemplate = viewModel.EsealSignatureTemplate,
					signCords = signatureCoordinates,
					esealRequired = viewModel.esealRequired,
					qrCords = qrCodeCoordinates,
					esealCords = esealCoordinates,
					qrCodeRequired = configObject["QrCodeRequired"]?.Value<bool>() ?? false
				};

				var dataJson = JsonConvert.SerializeObject(data);

				var saveNewGenericTemplateDTO = new SaveNewGenericTemplateDTO
				{
					File = viewModel.File,
					Model = dataJson
				};

				var response = await _genericTemplateService
					.SaveNewGenericTemplateAsync(saveNewGenericTemplateDTO, UserDetails());

				if (!response.Success)
				{
					return Json(new
					{
						Status = "Failed",
						Title = "Save New Template",
						Message = response.Message
					});
				}

				return Json(new
				{
					Status = "Success",
					Title = "Save New Template",
					Message = response.Message
				});
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"An error occurred: {ex.Message}");
			}
		}
		private CoordinatesData ExtractCoordinates(JToken token, string email)
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
	}
}

//using Microsoft.AspNetCore.Mvc;
//using Newtonsoft.Json;
//using SigningPortal.Core;
//using SigningPortal.Core.Constants;
//using SigningPortal.Core.Domain.Model;
//using SigningPortal.Core.Domain.Repositories;
//using SigningPortal.Core.Domain.Services.Communication;
//using SigningPortal.Core.DTOs;
//using SigningPortal.Core.Utilities;
//using SigningPortal.Web.Controllers.APIControllers;

//namespace SigningPortal.Web.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class MailApiController : ApiBaseController
//    {
//        private readonly IConfiguration _configuration;
//        private readonly IConfigurationRepository _configurationRepository;
//        private readonly IUserStorageRepository _userStorageRepository;
//        // private readonly IDriveHelper _driveHelper;
//        private readonly IEmailSender _emailSender;

//        //private IWebHostEnvironment _environment;
//        //private readonly IConstantError _constantError;
//        private const string FOLDER_PATH = "Reports";
//        public MailApiController(IConfiguration configuration,
//            IConfigurationRepository configurationRepository,
//            IUserStorageRepository userStorageRepository,
//            // IDriveHelper driveHelper,
//            IEmailSender emailSender
//            )
//        {
//            _configuration = configuration;
//            //_driveHelper = driveHelper;
//            _configurationRepository = configurationRepository;
//            _userStorageRepository = userStorageRepository;
//            _emailSender = emailSender;
//            //gDriveService = new GdriveService(configuration, userStorageRepository);
//        }

//        //[HttpGet("encryptstring")]
//        //public IActionResult EncryptPKIString(string str)
//        //{
//        //    string encrypt = PKIMethods.Instance.PKICreateSecureWireData(str);
//        //    return Ok(new APIResponse() { Message = "Encrypted successfully", Result = new { originalString = str, encryptedString = encrypt }, Success = true });
//        //}

//        //[HttpGet("decryptstring")]
//        //public IActionResult DecryptPKIString(string str)
//        //{
//        //    string decrypt = PKIMethods.Instance.PKIDecryptSecureWireData(str);
//        //    return Ok(new APIResponse() { Message = "Decrypted successfully", Result = new { encryptedString = str, decryptedString = decrypt }, Success = true });
//        //}

//        [HttpGet]
//        [Route("[action]")]
//        public async Task<IActionResult> GetDetails(string sourcePath)
//        {
//            IList<string> list = new List<string>();

//            DirectoryInfo d = new DirectoryInfo(sourcePath);
//            FileInfo[] Files = d.GetFiles();
//            foreach (FileInfo file in Files)
//            {
//                list.Add(file.Name);
//            }

//            return Ok(new APIResponse
//            {
//                Success = true,
//                Message = "success",
//                Result = list
//            });
//        }

//        [HttpGet]
//        [Route("[action]")]
//        public async Task<IActionResult> CheckBulksignStatus(string corelationId)
//        {
//            string req = "";
//            HttpContext.Request.Cookies.TryGetValue("requestTime", out req);

//            if (req != null && req.Equals("5"))
//            {
//                Random rnd = new Random();
//                int total = rnd.Next(10, 40);
//                CheckStatus checkStatus = new CheckStatus();
//                var status = "";
//                for (int i = 0; i < total; i++)
//                {

//                    if (i % 3 == 0)
//                    {
//                        status = DocumentStatusConstants.Completed;
//                    }
//                    else
//                    {
//                        status = DocumentStatusConstants.Declined;
//                    }
//                    checkStatus.FileArray.Add(new File { FileName = $@"{Guid.NewGuid()}.txt", Status = status });
//                    //    checkStatus.FileArray[i].FileName = $@"{Guid.NewGuid()}.txt";
//                    //    checkStatus.FileArray[i].Status = status;

//                    //checkStatus.FileArray.Add(checkStatus.FileArray[i]);

//                }

//                int fail = 0;
//                int success = 0;
//                foreach (var file in checkStatus.FileArray)
//                {
//                    if (file.Status == DocumentStatusConstants.Declined)
//                    {
//                        fail += 1;
//                    }
//                    if (file.Status == DocumentStatusConstants.Completed)
//                    {
//                        success += 1;
//                    }
//                }

//                checkStatus.TotalFileCount = total;
//                checkStatus.SuccessFileCount = success;
//                checkStatus.FailedFileCount = fail;

//                HttpContext.Response.Cookies.Delete("requestTime");

//                return Ok(new APIResponse
//                {
//                    Success = true,
//                    Message = "success",
//                    Result = checkStatus
//                });
//            }
//            else
//            {
//                Random rnd = new Random();
//                int total = rnd.Next(10, 40);
//                CheckStatus checkStatus = new CheckStatus();
//                var status = "";
//                for (int i = 0; i < total; i++)
//                {

//                    if (i % 3 == 0)
//                    {
//                        status = DocumentStatusConstants.Completed;
//                    }
//                    else if (i % 3 == 1)
//                    {
//                        status = DocumentStatusConstants.InProgress;
//                    }
//                    else
//                    {
//                        status = DocumentStatusConstants.Declined;
//                    }
//                    checkStatus.FileArray.Add(new File { FileName = $@"{Guid.NewGuid()}.txt", Status = status });
//                    //    checkStatus.FileArray[i].FileName = $@"{Guid.NewGuid()}.txt";
//                    //    checkStatus.FileArray[i].Status = status;

//                    //checkStatus.FileArray.Add(checkStatus.FileArray[i]);

//                }

//                int fail = 0;
//                int success = 0;
//                foreach (var file in checkStatus.FileArray)
//                {
//                    if (file.Status == DocumentStatusConstants.Declined)
//                    {
//                        fail += 1;
//                    }
//                    if (file.Status == DocumentStatusConstants.Completed)
//                    {
//                        success += 1;
//                    }
//                }

//                checkStatus.TotalFileCount = total;
//                checkStatus.SuccessFileCount = success;
//                checkStatus.FailedFileCount = fail;

//                if (string.IsNullOrEmpty(req))
//                {
//                    req = "1";
//                }
//                else
//                {
//                    int val = int.Parse(req);
//                    val += 1;
//                    req = val.ToString();
//                }

//                HttpContext.Response.Cookies.Append("requestTime", req);

//                return Ok(new APIResponse
//                {
//                    Success = true,
//                    Message = "success",
//                    Result = checkStatus
//                });
//            }

//        }

//        public class CheckStatus
//        {
//            public int TotalFileCount { get; set; }

//            public int FailedFileCount { get; set; }

//            public int SuccessFileCount { get; set; }

//            public IList<File> FileArray { get; set; } = new List<File>();
//        }

//        public class File
//        {
//            public string FileName { get; set; }

//            public string Status { get; set; }
//        }

//        [Route("[action]")]
//        [HttpPost]
//        public async Task<IActionResult> Google(StorageSecretsDTO config)
//        {


//            try
//            {
//                var encriptedConfig = PKIMethods.Instance.PKICreateSecureWireData(JsonConvert.SerializeObject(config));

//                var model = new StorageConfiguration()
//                {
//                    StorageName = StorageConstant.GOOGLE_DRIVE,
//                    Configuration = encriptedConfig
//                };

//                var result = await _configurationRepository.AddStorageConfigurationAsync(model);
//                if (result == null)
//                {
//                    return Ok(new APIResponse
//                    {
//                        Success = false,
//                        Message = "Fail to add Config",
//                        Result = result
//                    });
//                }
//                else
//                {
//                    return Ok(new APIResponse
//                    {
//                        Success = true,
//                        Message = "success",
//                        Result = result
//                    });
//                }

//            }
//            catch (Exception e)
//            {
//                return Ok(new APIResponse
//                {
//                    Success = false,
//                    Message = e.Message
//                });
//            }
//        }

//        [Route("[action]")]
//        [HttpPost]
//        public async Task<IActionResult> OneDrive(StorageSecretsDTO config)
//        {


//            try
//            {
//                var encriptedConfig = PKIMethods.Instance.PKICreateSecureWireData(JsonConvert.SerializeObject(config));

//                var model = new StorageConfiguration()
//                {
//                    StorageName = StorageConstant.ONE_DRIVE,
//                    Configuration = encriptedConfig
//                };

//                var result = await _configurationRepository.AddStorageConfigurationAsync(model);
//                if (result == null)
//                {
//                    return Ok(new APIResponse
//                    {
//                        Success = false,
//                        Message = "Fail to add Config",
//                        Result = result
//                    });
//                }
//                else
//                {
//                    return Ok(new APIResponse
//                    {
//                        Success = true,
//                        Message = "success",
//                        Result = result
//                    });
//                }
//            }
//            catch (Exception e)
//            {
//                return Ok(new APIResponse
//                {
//                    Success = false,
//                    Message = e.Message
//                });
//            }
//        }

//        //[HttpPost]
//        //[Route("[action]")]
//        //public async Task<IActionResult> UploadFile(IFormFile file)
//        //{
//        //    ServiceResult res = null;
//        //    UserDTO u = new UserDTO()
//        //    {
//        //        Suid = "1e83decd-495b-4154-8b74-98278a002cc4",
//        //        Email = "harshu6966@gmail.com"
//        //    };
//        //    using(MemoryStream ms = new MemoryStream())
//        //    {
//        //        file.CopyTo(ms);
//        //        res = await _driveHelper.UploadFileOnOneDrive(u, ms, "SingedFile.pdf");
//        //    }
//        //    return Ok(res);
//        //}

//        [HttpPost]
//        [Route("[action]")]
//        public async Task<IActionResult> SendEmail()
//        {
//            ServiceResult res = new ServiceResult(null, "skakaaa");
//            var list = new List<string>();
//            list.Add("chavansachinds@gmail.com");
//            var message = new Core.DTOs.Message(list,
//                                  "Document Signed",
//                                   "hello"
//                                 );
//            try
//            {
//                await _emailSender.SendEmail(message);
//            }
//            catch (Exception e)
//            {
//                return BadRequest(e.Message);
//            }
//            return Ok(res);
//        }

//        public class attachmentFile
//        {
//            public IFormFile fileData { get; set; }
//        }
//        [HttpPost]
//        [Route("[action]")]
//        public async Task<IActionResult> SendEmailAttchment([FromForm] attachmentFile fileobj)
//        {

//            byte[] fileBytes;
//            using (var ms = new MemoryStream())
//            {
//                fileobj.fileData.CopyTo(ms);
//                fileBytes = ms.ToArray();
//                //string s = Convert.ToBase64String(fileBytes);
//                // act on the Base64 data
//            }
//;
//            var list = new List<string>();
//            list.Add("chavansachinds@gmail.com");
//            var message = new Core.DTOs.Message(list,
//                                  "Document Signed",
//                                   "hello"
//                                 );

//            message.Attachment = (byte[])fileBytes;
//            message.IsAttachmentPresent = true;
//            try
//            {
//                await _emailSender.SendEmailWithAttachment(message, "signedFile.pdf");
//            }
//            catch (Exception e)
//            {
//                var msg = e.Message;
//                var innerExc = "Exception Message : " + msg + " Inner exception: " + e.InnerException != null ? e.InnerException.Message : "No inner exception";

//                return Ok(new ServiceResult(innerExc));
//            }
//            return Ok(new ServiceResult(null, "Mail send with attachment success "));
//        }

//    }
//}

using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Graph;
using Newtonsoft.Json;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.Domain.Services.Communication.Authentication;
using SigningPortal.Core.DTOs;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using static Google.Apis.Drive.v3.DriveService;

namespace SigningPortal.Core.Utilities
{
	public class DriveHelper : IDriveHelper
	{

		private readonly IUserStorageRepository _userStorageRepository;
		private readonly ILogger<DriveHelper> _logger;
		private readonly IConfiguration _configuration;
		private readonly IEmailSender _emailSender;
		private readonly IGenericEmailService _genericEmailService;
		private readonly StorageSecretsDTO googleSrcrets;
		private readonly StorageSecretsDTO oneDriveSrcrets;
		private readonly HttpClient _client;
		public DriveHelper(ILogger<DriveHelper> logger,
			IUserStorageRepository userStorageRepository,
			IGlobalDriveStorageConfiguration globalDriveStorageConfiguration,
			HttpClient httpClient,
			IConfiguration configuration,
			IEmailSender emailSender,
			IGenericEmailService genericEmailService)
		{
			_logger = logger;
			_client = httpClient;
			_configuration = configuration;
			_emailSender = emailSender;
			_client.Timeout = TimeSpan.FromMinutes(10);
			_userStorageRepository = userStorageRepository;
			googleSrcrets = globalDriveStorageConfiguration.GoogleStorageSecret;
			oneDriveSrcrets = globalDriveStorageConfiguration.OneDriveStorageSecret;
			_genericEmailService = genericEmailService;
		}

        public Task<ServiceResult> GetAuthenticationUrl(string StorageName)
        {
            try
            {
                var Url = string.Empty;

                if (string.IsNullOrEmpty(StorageName))
                {
                    return Task.FromResult(new ServiceResult("Storage name can not be null value"));
                }

                switch (StorageName)
                {
                    case StorageConstant.GOOGLE_DRIVE:
                        var GoogleUrl = googleSrcrets.AuthUrl + "?redirect_uri={0}&" +
                                        "prompt=consent&response_type=code&client_id={1}&" +
                                        "scope={2}&access_type=offline";

                        Url = string.Format(GoogleUrl,
                            googleSrcrets.RedirectUrl,
                            googleSrcrets.ClientId,
                            googleSrcrets.Scope);
                        break;

                    case StorageConstant.ONE_DRIVE:
                        var OneDriveUrl = oneDriveSrcrets.AuthUrl +
                                          "?client_id={0}&response_type=code&redirect_uri={1}&response_mode=query&scope={2}&state=12345";

                        Url = string.Format(OneDriveUrl,
                            oneDriveSrcrets.ClientId,
                            oneDriveSrcrets.RedirectUrl,
                            oneDriveSrcrets.Scope);
                        break;

                    default:
                        return Task.FromResult(new ServiceResult("Invalid Storage name"));
                }

                return Task.FromResult(
                    new ServiceResult(new AuthenticationUrlResponse(Url))
                );
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError("Failed to generate drive authentication url");

                return Task.FromResult(
                    new ServiceResult("Fail to generate drive authentication url")
                );
            }
        }
        public async Task<ServiceResult> GetAccessToken(string code, string StorageName, UserDTO User)
		{
			try
			{
				if (string.IsNullOrEmpty(code))
				{
					return new ServiceResult("Authorization code can not be null value");
				}
				if (string.IsNullOrEmpty(StorageName))
				{
					return new ServiceResult("Storage name can not be null value");
				}

				Dictionary<string, string> data = null;
				var TokenUrl = "";
				//prepare data object which is send with token endpoint url 
				switch (StorageName)
				{
					case StorageConstant.GOOGLE_DRIVE:
						TokenUrl = googleSrcrets.TokenUrl;
						data = new Dictionary<string, string>
															{
															   { "code", code },
															   { "client_id", googleSrcrets.ClientId },
															   { "client_secret", googleSrcrets.ClientSecret },
															   { "redirect_uri", googleSrcrets.RedirectUrl },
															   { "grant_type", "authorization_code" }
															};
						break;

					case StorageConstant.ONE_DRIVE:
						TokenUrl = oneDriveSrcrets.TokenUrl;
						data = new Dictionary<string, string>
															{
															   { "code", code },
															   { "client_id", oneDriveSrcrets.ClientId },
															   { "client_secret", oneDriveSrcrets.ClientSecret },
															   { "scope", oneDriveSrcrets.Scope },
															   { "redirect_uri", oneDriveSrcrets.RedirectUrl },
															   { "grant_type", "authorization_code" }
															};
						break;


					default: return new ServiceResult("Invalid Storage name");


				}



				//convert data object in url encoded form
				var content = new FormUrlEncodedContent(data);


				var response = await _client.PostAsync(TokenUrl, content);
				if (response == null)
				{
					return new ServiceResult("Token responce getting null for Storage : " + StorageName);
				}
				if (!response.IsSuccessStatusCode)
				{
					Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");

					return new ServiceResult("Token responce from Storage : " + StorageName + ", error : " + response.StatusCode + ", error_description : " + response.ReasonPhrase); ;
				}
				else
				{
					var responseString = await response.Content.ReadAsStringAsync();
					_logger.LogInformation("Token responce of :" + StorageName + " : " + responseString);
					long expiryTime;

					switch (StorageName)
					{
						case StorageConstant.GOOGLE_DRIVE:
							{
								var googleResp = JsonConvert.DeserializeObject<TokenResponse>(responseString)
												 ?? throw new InvalidOperationException("Invalid Google token response.");

								expiryTime = googleResp.ExpiresInSeconds
											 ?? throw new InvalidOperationException("Google token missing expiry.");

								break;
							}

						case StorageConstant.ONE_DRIVE:
							{
								var oneDriveResp = JsonConvert.DeserializeObject<TokenResponse>(responseString)
												   ?? throw new InvalidOperationException("Invalid OneDrive token response.");

								expiryTime = oneDriveResp.ExpiresInSeconds
											 ?? throw new InvalidOperationException("OneDrive token missing expiry.");

								break;
							}


						default: return new ServiceResult("Invalid Storage name");


					}

					var encriptedConfig = PKIMethods.Instance.PKICreateSecureWireData(responseString);

					var responce = _userStorageRepository.GetUserStorageDetailsAsync(User.Suid, User.OrganizationId, StorageName).Result;

					int expireIn = StorageName == StorageConstant.GOOGLE_DRIVE ?
						googleSrcrets.AccountExpiry : oneDriveSrcrets.AccountExpiry;

					if (responce != null)
					{
						responce.TokenDetails = encriptedConfig;
						responce.Status = StorageAccountStatus.Active;
						responce.OrganizationName = User.OrganizationName;
						responce.TokenExpiryTime = DateTime.UtcNow.AddSeconds(expiryTime);
						responce.LinkingTime = DateTime.UtcNow;
						responce.ExpiryDate = DateTime.UtcNow.AddDays(expireIn);
						responce.State = StorageAccountStatus.Active;
						var Result = await _userStorageRepository.UpdateUserStorageDetailsAsync(responce);
						if (Result)
						{
							return new ServiceResult(null, $"Account Linked Successfully \nValid Upto: {responce.ExpiryDate.ToLongDateString()}");
						}
						else
						{
							return new ServiceResult("Account Linked fail");
						}

					}
					else
					{
						var userDetails = new UserDriveTokenDetails()
						{
							Suid = User.Suid,
							UserEmail = User.Email,
							OrganizationId = User.OrganizationId,
							AccountType = User.AccountType.ToLower(),
							OrganizationName = User.OrganizationName,
							TokenDetails = encriptedConfig,
							StorageName = StorageName,
							Status = StorageAccountStatus.Active,
							State = StorageAccountStatus.Active,
							ActiveStorage = false,
							TokenExpiryTime = DateTime.UtcNow.AddSeconds(expiryTime),
							CreatedAt = DateTime.UtcNow,
							UpdatedAt = DateTime.UtcNow,
							LinkingTime = DateTime.UtcNow,
							ExpiryDate = DateTime.UtcNow.AddDays(expireIn)
						};

						var Result = _userStorageRepository.SaveUserStorageDetails(userDetails);

						_logger.LogInformation($"User: {User.Suid} successfully linked the storage: {StorageName}");

						return new ServiceResult(null, $"Account Linked Successfully \nValid Upto: {userDetails.ExpiryDate.ToLongDateString()}");
					}
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError("Failed to link account :"+ ex.Message);
			}

			return new ServiceResult("Fail to link account");

		}

		public async Task<ServiceResult> UpdateAccessTokenAsync(string StorageName, UserDTO User)
		{
			try
			{
				TokenResponse token = null;

				if (string.IsNullOrEmpty(StorageName))
				{
					return new ServiceResult("Storage name can not be null value");
				}

				var userTokenDetails = _userStorageRepository.GetUserStorageDetailsAsync(User.Suid, User.OrganizationId, StorageName).Result;
				if (userTokenDetails == null || string.IsNullOrEmpty(userTokenDetails.TokenDetails))
				{
					return new ServiceResult("Drive not linked");

				}

				if (userTokenDetails.TokenExpiryTime.CompareTo(DateTime.UtcNow) > 0)
				{
					return new ServiceResult(null, "access token is not expired");
				}

				token = JsonConvert.DeserializeObject<TokenResponse>(PKIMethods.Instance.PKIDecryptSecureWireData(userTokenDetails.TokenDetails));

				Dictionary<string, string> data = null;
				var TokenUrl = "";
				//prepare data object which is send with token endpoint url 
				switch (StorageName)
				{
					case StorageConstant.GOOGLE_DRIVE:
						TokenUrl = googleSrcrets.TokenUrl;
						data = new Dictionary<string, string>
															{
															   { "refresh_token", token.RefreshToken },
															   { "client_id", googleSrcrets.ClientId },
															   { "client_secret", googleSrcrets.ClientSecret },
															   { "redirect_uri", googleSrcrets.RedirectUrl },
															   { "grant_type", "refresh_token" }
															};
						break;

					case StorageConstant.ONE_DRIVE:
						TokenUrl = oneDriveSrcrets.TokenUrl;
						data = new Dictionary<string, string>
															{
															   { "refresh_token", token.RefreshToken },
															   { "client_id", oneDriveSrcrets.ClientId },
															   { "scope", oneDriveSrcrets.Scope },
															   { "client_secret", oneDriveSrcrets.ClientSecret },
															   { "grant_type", "refresh_token" }
															};
						break;


					default: return new ServiceResult("Invalid Storage name");


				}
				//convert data object in url encoded form
				var content = new FormUrlEncodedContent(data);


				var response = await _client.PostAsync(TokenUrl, content);
				if (response == null)
				{
					return new ServiceResult("Token responce getting null for Storage : " + StorageName);
				}
				if (!response.IsSuccessStatusCode)
				{
					Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
					$"with status code={response.StatusCode}");

					return new ServiceResult("Token responce from Storage : " + StorageName + ", error : " + response.StatusCode + ", error_description : " + response.ReasonPhrase); ;
				}
				else
				{
					var responseString = await response.Content.ReadAsStringAsync();
					_logger.LogInformation("Token responce of :" + StorageName + " : " + responseString);
					long expiryTime;

					switch (StorageName)
					{
						case StorageConstant.GOOGLE_DRIVE:
							{
								var googleResp = JsonConvert.DeserializeObject<TokenResponse>(responseString)
												 ?? throw new InvalidOperationException("Invalid Google token response.");

								expiryTime = googleResp.ExpiresInSeconds
											 ?? throw new InvalidOperationException("Google token missing expiry.");

								break;
							}

						case StorageConstant.ONE_DRIVE:
							{
								var oneDriveResp = JsonConvert.DeserializeObject<TokenResponse>(responseString)
												   ?? throw new InvalidOperationException("Invalid OneDrive token response.");

								expiryTime = oneDriveResp.ExpiresInSeconds
											 ?? throw new InvalidOperationException("OneDrive token missing expiry.");

								break;
							}


						default: return new ServiceResult("Invalid Storage name");


					}

					var encriptedConfig = PKIMethods.Instance.PKICreateSecureWireData(responseString);

					int expireIn = StorageName == StorageConstant.GOOGLE_DRIVE ?
						googleSrcrets.AccountExpiry : oneDriveSrcrets.AccountExpiry;

					userTokenDetails.TokenDetails = encriptedConfig;
					userTokenDetails.OrganizationName = User.OrganizationName;
					userTokenDetails.Status = StorageAccountStatus.Active;
					userTokenDetails.TokenExpiryTime = DateTime.UtcNow.AddSeconds(expiryTime);
					userTokenDetails.LinkingTime = DateTime.UtcNow;
					userTokenDetails.ExpiryDate = DateTime.UtcNow.AddDays(expireIn);
					userTokenDetails.State = StorageAccountStatus.Active;
					var Result = _userStorageRepository.UpdateUserStorageDetailsAsync(userTokenDetails);

					return new ServiceResult(null, "access token updated Successfully");

				}
			}
			catch (Exception e)
			{
				Monitor.SendException(e);
				_logger.LogError("UpdateAccessTokenAsync Exception :"+ e.Message);
			}

			return new ServiceResult("Failed to update access token ");
		}

		//get service object for perticular drive
		private async Task<ServiceResult> GetServiceAsync(string storageName, UserDTO User)
		{
			try
			{
				var updateToken = await UpdateAccessTokenAsync(storageName, User);
				if (updateToken != null && !updateToken.Success)
				{
					await _userStorageRepository.UnlinkUserStorageAsync(User, storageName);
					_logger.LogInformation("Fail to update access token of :" + storageName + " for user : " + User.Email);
					return new ServiceResult("Fail to update access token of :" + storageName + " for user : " + User.Email);
				}

				var userTokenDetails = _userStorageRepository.GetUserStorageDetailsAsync(User.Suid, User.OrganizationId, storageName).Result;
				if (userTokenDetails == null)
				{
					return new ServiceResult("Drive not linked");

				}

				TokenResponse token = JsonConvert.DeserializeObject<TokenResponse>(PKIMethods.Instance.PKIDecryptSecureWireData(userTokenDetails.TokenDetails));

				var userId = User.Suid + "_" + User.Email;// Use your email

				switch (storageName)
				{
					case StorageConstant.GOOGLE_DRIVE:
						var authorizationCodeFlow = new GoogleAuthorizationCodeFlow(
						new GoogleAuthorizationCodeFlow.Initializer
						{
							ClientSecrets = new ClientSecrets
							{
								ClientId = googleSrcrets.ClientId,
								ClientSecret = googleSrcrets.ClientSecret
							},
							Scopes = new[] { Scope.Drive },
							DataStore = null
						});


						var credential = new UserCredential(authorizationCodeFlow, userId, token);
						var service = new DriveService(new BaseClientService.Initializer
						{
							HttpClientInitializer = credential,
							ApplicationName = googleSrcrets.ApplicationName
						});
						return new ServiceResult(service, "success");

					case StorageConstant.ONE_DRIVE:

						GraphServiceClient graphServiceClientApp =
							new GraphServiceClient(
								"https://graph.microsoft.com/v1.0",
								new DelegateAuthenticationProvider(
									(requestMessage) =>
									{
										requestMessage.Headers.Authorization =
											new AuthenticationHeaderValue("Bearer", token.AccessToken);

										return Task.CompletedTask;   // Required
									}));

						return new ServiceResult(graphServiceClientApp, "success");
					default:
						return new ServiceResult("Invalid Storage name");
				}

			}
			catch (Exception e)
			{
				Monitor.SendException(e);
				_logger.LogError("GetServiceAsync Exception :"+ e.Message);
			}

			return new ServiceResult("Failed to get service");
		}

		//google drive upload code for large file
		private async Task<ServiceResult> UploadFileOnGoogleAsync(UserDTO User, MemoryStream file, string fileName,
			string fileDescription)
		{
			try
			{
				var result = await GetServiceAsync(StorageConstant.GOOGLE_DRIVE, User);
				if (!result.Success)
				{
					return result;
				}
				DriveService service = (DriveService)result.Result;

				//GetAllFiles
				FilesResource.ListRequest listRequest = service.Files.List();
				IList<Google.Apis.Drive.v3.Data.File> files = listRequest.Execute().Files;

				//check folder is exist or not
				var FolderId = "";
				var folderlist = files.Where(x => x.MimeType.Equals("application/vnd.google-apps.folder")).Select(x => x).ToList();
				foreach (var folder in folderlist)
				{
					// Console.WriteLine("File Name:" + file.Name + "  ID:" + file.Id + "  ParentID: " + file.Parents);
					if (folder.Name.Equals("SigningPortal"))
					{
						FolderId = folder.Id;
						break;
					}
				}

				//if folder not exist create folder
				if (string.IsNullOrEmpty(FolderId))
				{
					var driveFolder = new Google.Apis.Drive.v3.Data.File();
					driveFolder.Name = "SigningPortal";
					driveFolder.MimeType = "application/vnd.google-apps.folder";
					//driveFolder.Parents = new string[] { parent };
					var command = service.Files.Create(driveFolder);
					var folderResult = command.Execute();
					FolderId = folderResult.Id;
				}


				var driveFile = new Google.Apis.Drive.v3.Data.File();
				driveFile.Name = fileName;
				driveFile.Description = fileDescription;
				driveFile.MimeType = "application/pdf";
				driveFile.Parents = new string[] { FolderId };

				var request = service.Files.Create(driveFile, file, "application/pdf");
				request.Fields = "id";

				var response = request.Upload();
				if (response.Status != Google.Apis.Upload.UploadStatus.Completed)
				{
					return new ServiceResult(response.Exception.Message);
				}

				return new ServiceResult(request.ResponseBody.Id, "file uploaded successfully");
			}
			catch (Exception e)
			{
				Monitor.SendException(e);
				_logger.LogError("UploadFileAsync Exception :"+ e.Message);
			}

			return new ServiceResult("Failed to upload file");
		}

		//onedrive upload code 
		public async Task<ServiceResult> UploadFileOnOneDrive(UserDTO User, MemoryStream stream, string fileName)
		{
			var result = await GetServiceAsync(StorageConstant.ONE_DRIVE, User);
			if (!result.Success)
			{
				return result;
			}

			GraphServiceClient service = (GraphServiceClient)result.Result;


			var itemPath = "SigningPortal/" + Uri.EscapeDataString(fileName);
			var size = stream.Length / 1000;
			_logger.LogInformation($"Stream size: {size} KB");

			// Allows slices of a large file to be uploaded 
			// Optional but supports progress and resume capabilities if needed
			var succes = await UploadLargeFileOnOneDrive(service, itemPath, stream);
			if (succes)
			{
				return new ServiceResult(null, "file upload successfully");
			}
			else
			{
				return new ServiceResult("file upload fail");
			}

		}

		//onedrive upload code for large file
		private async Task<bool> UploadLargeFileOnOneDrive(GraphServiceClient service, string itemPath, Stream stream)
		{
			// Allows "slices" of a file to be uploaded.
			// This technique provides a way to capture the progress of the upload
			// and makes it possible to resume an upload using fileUploadTask.ResumeAsync(progress);
			// Based on https://docs.microsoft.com/en-us/graph/sdks/large-file-upload

			// Use uploadable properties to specify the conflict behavior (replace in this case).
			var uploadProps = new DriveItemUploadableProperties
			{
				ODataType = null,
				AdditionalData = new Dictionary<string, object>
				{
					{ "@microsoft.graph.conflictBehavior", "replace" }
				}
			};

			// Create the upload session
			var uploadSession = await service.Me.Drive.Root
				.ItemWithPath(itemPath)
				.CreateUploadSession(uploadProps)
				.Request()
				.PostAsync();

			// Max slice size must be a multiple of 320 KiB
			int maxSliceSize = 320 * 1024;
			var fileUploadTask =
				new LargeFileUploadTask<DriveItem>(uploadSession, stream, maxSliceSize);

			// Create a callback that is invoked after each slice is uploaded
			IProgress<long> progress = new Progress<long>(prog =>
			{
				_logger.LogInformation($"Uploaded {prog} bytes of {stream.Length} bytes");
			});

			try
			{
				// Upload the file
				var uploadResult = await fileUploadTask.UploadAsync(progress);

				if (uploadResult.UploadSucceeded)
				{
					_logger.LogInformation($"Upload complete, item ID: {uploadResult.ItemResponse.Id}");
					return true;
				}
				else
				{
					_logger.LogInformation("Upload failed");
					return false;
				}
			}
			catch (ServiceException ex)
			{
				Monitor.SendException(ex);
				_logger.LogError($"Error uploading: {ex.ToString()}");
				return false;
			}
		}


		public async Task<ServiceResult> UploadFileToDriveAsync(IList<Recepients> recp, byte[] fileByteArray, string fileName,
		  string fileDescription)
		{
			try
			{
				string baseName = Path.GetFileNameWithoutExtension(fileName);
				string documentName = baseName + ".pdf";

				MemoryStream stream = new MemoryStream(fileByteArray);

				foreach (var recepient in recp)
				{

					var user = new UserDTO() { Email = recepient.Email, Suid = recepient.Suid, OrganizationId = recepient.OrganizationId };

					var responce = _userStorageRepository.GetActiveUserStorageDetailsAsync(user.Suid, user.OrganizationId).Result;
					if (responce != null)
					{
						var isValid = await IsAccessTokenValidAsync(responce.StorageName, user);
						if (!isValid.Success)
						{
							continue;
						}

						switch (responce.StorageName)
						{
							case StorageConstant.GOOGLE_DRIVE:

								var uploadFileOnGoogle = await UploadFileOnGoogleAsync(user, stream, documentName, fileDescription);
								if (uploadFileOnGoogle.Success)
								{
									_logger.LogInformation("successfully uploaded file on drive for: " + recepient.Email);
								}
								else
								{
									_logger.LogInformation("Failed to upload file to drive for: " + recepient.Email);
									_logger.LogInformation(uploadFileOnGoogle.Message);
								}
								break;

							case StorageConstant.ONE_DRIVE:

								var uploadFileOnOneDrive = await UploadFileOnOneDrive(user, stream, documentName);
								if (uploadFileOnOneDrive.Success)
								{
									_logger.LogInformation("successfully uploaded file on drive for: " + recepient.Email);
								}
								else
								{
									_logger.LogInformation("Failed to upload file to drive for: " + recepient.Email);
									_logger.LogInformation(uploadFileOnOneDrive.Message);
								}
								break;

							default:
								_logger.LogInformation("Invalid storage name for: " + recepient.Email);
								break;
						}

					}
					else
					{
						_logger.LogInformation("Active storage details not found for: " + recepient.Email);
					}

				}
				;
				return new ServiceResult(null, "file Uploded success");
			}
			catch (Exception e)
			{
				Monitor.SendException(e);
				_logger.LogError("UploadFileToDriveAsync Exception :"+ e.Message);
			}

			return new ServiceResult("Failed to upload file to drive");
		}


		public async Task UploadFileToDriveAsyncWrapper(IList<Recepients> recp, byte[] fileByteArray, string fileName,
		  string fileDescription)
		{
			await UploadFileToDriveAsync(recp, fileByteArray, fileName, fileDescription);
		}


		public async Task<ServiceResult> IsAccessTokenValidAsync(string StorageName, UserDTO User)
		{
			try
			{
				switch (StorageName)
				{
					case StorageConstant.GOOGLE_DRIVE:
						var result = await GetServiceAsync(StorageConstant.GOOGLE_DRIVE, User); ;
						if (!result.Success)
						{
							return result;
						}
						DriveService service = (DriveService)result.Result;

						// Define parameters of request.
						FilesResource.ListRequest listRequest = service.Files.List();
						IList<Google.Apis.Drive.v3.Data.File> files = listRequest.Execute().Files;

						return new ServiceResult(null, "success");

					case StorageConstant.ONE_DRIVE:

						var result1 = await GetServiceAsync(StorageConstant.ONE_DRIVE, User);
						if (!result1.Success)
						{
							return result1;
						}

						GraphServiceClient service1 = (GraphServiceClient)result1.Result;

						var Onedrivefiles = await service1.Me.Drive.Root.Children
													.Request()
													.Select(file => new
													{
														file.Id,
														file.Name,
														file.Folder,
														file.Package
													})
													.GetAsync();

						return new ServiceResult(null, "success");

					default: return new ServiceResult("Invalid Storage name");
				}

			}
			catch (Exception e)
			{
				Monitor.SendException(e);
				_logger.LogError("IsAccessTokenValidAsync Exception :" + e.Message);
			}

			return new ServiceResult("Failed to get all files");
		}

		public async Task<ServiceResult> SendDriveUnlinkEmail(UserDriveTokenDetails details)
		{
			string accountType = details.AccountType.Equals(AccountTypeConstants.Self, StringComparison.CurrentCultureIgnoreCase) ? "self account" : details.OrganizationName + " account";

			var storageName = details.StorageName == StorageConstant.GOOGLE_DRIVE ? "Google Drive" : "One Drive";

			var mailBody = GenerateEmailForDriveUnlinked(storageName, accountType, details.ExpiryDate.ToLongDateString());

			var message = new DTOs.Message([details.UserEmail],
							 $"{storageName} Storage Unlinked",
							  mailBody
							);

			try
			{
				await _genericEmailService.SendGenericEmail(message);
				return new ServiceResult(null, "Mail send Successfully");
			}
			catch (Exception e)
			{
				Monitor.SendException(e);
				_logger.LogError("SendEmail fail to user email : " + details.UserEmail + ", Exception : " + e.Message);
				//return new ServiceResult(_constantError.GetMessage("102556"));
				return new ServiceResult("Mail sending Fail");
			}
		}

		private string GenerateEmailForDriveUnlinked(string driveName, string accountName, string unlinkDate)
		{
			return string.Format("<html> " +
				"<head></head>" +
				"<body style='font-family: Lato,Helvetica,Arial,sans-serif;'> " +
				"<table border='0' width='480px' cellpadding='5' cellspacing='5' align='center'>" +
				"<center>" +
				"<tr> <td style='text-align: center'><img style='width: 200px' src='{0}/Resource/uploads/justsignlogo.png'></td> </tr>" +
				"<tr> <td style='background: #acc43d;'>" +
				"<h1 style='border: 1px solid #acc43d;border-radius: 2px;" +
				"font-family: Lato,Helvetica,Arial,sans-serif;font-size: 20px;" +
				"color: #ffffff;text-decoration: none;font-weight:bold;" +
				"display: inline-block;'>{1} Storage Unlinked</h1>" +
				"</td> </tr> " +
				"</center> " +
				"</table> " +
				"<table border='0' width='480px' cellpadding='7' cellspacing='7' align='center'>" +
				"<tr> <td>Your {2} account linked to {3} has been unlinked on date {4}</td> </tr>" +
				"</table> " +
				"<table border='0' width='480px' cellpadding='5' cellspacing='5' align='center'>" +
				"<center> <tr> <td>" +
				"<p style='font-size:10px;'>* This is an automated email from Signing Portal." +
				"Please contact the sender for any queries regarding this email.</p>" +
				"</td> </tr> </center> " +
				"</table> " +
				"</body> </html>", _configuration.GetValue<string>("Config:Signing_portal:BACKEND_URL"), driveName, driveName, accountName, unlinkDate);
		}

	}
}

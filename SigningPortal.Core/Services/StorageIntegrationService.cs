using Google.Apis.Auth.OAuth2.Responses;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Services
{
    public class StorageIntegrationService : IStorageIntegrationService
    {
        private readonly ILogger<StorageIntegrationService> _logger;
        private readonly IUserStorageRepository _userStorageRepository;
        //private readonly GoogleDriveService _googleDriveService;
        private readonly IConfigurationRepository _configurationRepository;
        private readonly IDriveHelper _driveHelper;
        public StorageIntegrationService(ILogger<StorageIntegrationService> logger,
            IConfigurationRepository configurationRepository,
            IUserStorageRepository userStorageRepository,
            //GoogleDriveService googleDriveService,
            IDriveHelper driveHelper)

        {
            _logger = logger;
            _driveHelper = driveHelper;
            _configurationRepository = configurationRepository;
            _userStorageRepository = userStorageRepository;
            // _googleDriveService = googleDriveService;
        }

        public async Task<ServiceResult> GetStorageListAsync(UserDTO userDTO)
        {
            try
            {
                IList<StorageListDTO> storageList = new List<StorageListDTO>();


                var configurationList = await _configurationRepository.GetAllConfigurations();
                if (configurationList != null)
                {
                    foreach (var configuration in configurationList)
                    {
                        StorageListDTO storageListDTO = new StorageListDTO()
                        {
                            StorageName = configuration.StorageName
                        };

                        var userStorage = await _userStorageRepository.GetUserStorageDetailsAsync(userDTO.Suid, userDTO.OrganizationId, configuration.StorageName, StorageAccountStatus.Active);
                        if (userStorage != null)
                        {
                            storageListDTO.IsLinked = true;
                            storageListDTO.Active = userStorage.ActiveStorage;
                            storageListDTO.ExpiryDate = userStorage.ExpiryDate;
                        }

                        storageList.Add(storageListDTO);
                    }

                    return new ServiceResult(storageList, "Storage list received successfully");
                }
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("GetStorageListAsync Exception : {0}", e.Message);
            }
            return new ServiceResult("Failed to get storage list");
        }

        public async Task<ServiceResult> SetStorageActiveAsync(string storageName, UserDTO userDTO)
        {
            try
            {
                if (string.IsNullOrEmpty(storageName))
                {
                    return new ServiceResult("Storage name can not be null value");
                }

                var userStorage = await _userStorageRepository.SetStorageActiveAsync(storageName, userDTO);
                if (userStorage)
                {
                    return new ServiceResult(null, "Set storage active successfully");
                }
                else
                {
                    return new ServiceResult("Set storage active fail");
                }

            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("SetStorageActiveAsync Exception : {0}", e.Message);
            }
            return new ServiceResult("Failed to set storage active");
        }

        public async Task<ServiceResult> UnsetStorageActiveAsync(string storageName, UserDTO userDTO)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(storageName))
                {
                    return new ServiceResult("Storage name can not be null value");
                }

                if (storageName != StorageConstant.GOOGLE_DRIVE && storageName != StorageConstant.ONE_DRIVE)
                {
                    return new ServiceResult("Invalid storage provider");
                }

                var activeStorage = await _userStorageRepository.GetActiveUserStorageDetailsAsync(userDTO.Suid, userDTO.OrganizationId);
                if (activeStorage == null)
                {
                    return new ServiceResult(null, "No active storage drive is currently set");
                }

                if (activeStorage.StorageName != storageName)
                {
                    return new ServiceResult($"{storageName} is not currently set as active storage drive");
                }

                var unsetResult = await _userStorageRepository.UnsetStorageActiveAsync(storageName, userDTO);
                if (unsetResult)
                {
                    return new ServiceResult(null, "Storage drive unset successfully");
                }

                var concurrentActiveStorage = await _userStorageRepository.GetActiveUserStorageDetailsAsync(userDTO.Suid, userDTO.OrganizationId);
                if (concurrentActiveStorage == null)
                {
                    return new ServiceResult(null, "No active storage drive is currently set");
                }

                return new ServiceResult("Failed to unset storage drive due to concurrent update");
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("UnsetStorageActiveAsync Exception : {0}", e.Message);
            }

            return new ServiceResult("Failed to unset storage drive");
        }

        public async Task<ServiceResult> GetAuthenticationUrlAsync(string storageName)
        {
            try
            {
                return await _driveHelper.GetAuthenticationUrl(storageName);
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("GetAuthenticationUrlAsync Exception : {0}", e.Message);
            }
            return new ServiceResult("Failed to get authentication url");
        }

        public async Task<ServiceResult> UnlinkStorageAsync(string storageName, UserDTO userDTO)
        {
            try
            {
                if (string.IsNullOrEmpty(storageName))
                {
                    return new ServiceResult("Storage name can not be null value");
                }

                var userTokenDetails = await _userStorageRepository.GetUserStorageDetailsAsync(userDTO.Suid, userDTO.OrganizationId, storageName, StorageAccountStatus.Active);
                if (userTokenDetails == null)
                {
                    _logger.LogInformation($"User: {userDTO.Suid} successfully unlinked the storage: {storageName}");

                    return new ServiceResult(null, "Unlink successfull");
                }

                var unlinkStorage = await _userStorageRepository.UnlinkUserStorageAsync(userDTO, storageName);
                if (unlinkStorage)
                {
                    _logger.LogInformation($"User: {userDTO.Suid} successfully unlinked the storage: {storageName}");

                    return new ServiceResult(null, "Unlink successfull");
                }
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("UnlinkStorageAsync Exception : {0}", e.Message);
            }
            return new ServiceResult("Failed to unlink storage");
        }

        public async Task<ServiceResult> LinkUserStorageAsync(string storageName, string code, UserDTO userDTO)
        {
            try
            {
                return await _driveHelper.GetAccessToken(code, storageName, userDTO);
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("LinkUserStorageAsync Exception : {0}", e.Message);
            }
            return new ServiceResult("Failed to unlink storage");
        }

        public async Task<ServiceResult> GetDriveConfigurationAsync(string storageName, UserDTO userDTO)
        {
            try
            {
                if (string.IsNullOrEmpty(storageName))
                {
                    return new ServiceResult("Storage name can not be null value");
                }

                var storageConfiguration = await _configurationRepository.GetStorageConfigurationByNameAsync(storageName);
                if (storageConfiguration != null)
                {
                    var config = JsonConvert.DeserializeObject<StorageSecretsDTO>(PKIMethods.Instance.PKIDecryptSecureWireData(storageConfiguration.Configuration));
                    if (config != null)
                    {

                        DriveConfigurationDTO driveConfigurationDTO = new DriveConfigurationDTO()
                        {
                            ClientId = config.ClientId
                        };

                        var result = await _driveHelper.UpdateAccessTokenAsync(storageName, userDTO);
                        if (result != null && !result.Success)
                        {
                            await _userStorageRepository.UnlinkUserStorageAsync(userDTO, storageName);
                            var urlResp = await _driveHelper.GetAuthenticationUrl(storageName);
                            if (urlResp.Success)
                            {
                                return new ServiceResult(urlResp.Result, "Link storage drive again");

                            }
                            else
                            {
                                return urlResp;
                            }

                        }
                        var userTokenDetails = await _userStorageRepository.GetUserStorageDetailsAsync(userDTO.Suid, userDTO.OrganizationId, storageName, StorageAccountStatus.Active);
                        if (userTokenDetails != null)
                        {
                            var token = JsonConvert.DeserializeObject<TokenResponse>(PKIMethods.Instance.PKIDecryptSecureWireData(userTokenDetails.TokenDetails));
                            driveConfigurationDTO.AccessToken = token.AccessToken;

                            var IsAccessTokenValid = await _driveHelper.IsAccessTokenValidAsync(storageName, userDTO);
                            if (!IsAccessTokenValid.Success)
                            {
                                var unlinkResp = await UnlinkStorageAsync(storageName, userDTO);

                                var urlResp = await _driveHelper.GetAuthenticationUrl(storageName);
                                if (urlResp.Success)
                                {
                                    return new ServiceResult(urlResp.Result, "Link storage drive again");

                                }
                                else
                                {
                                    return urlResp;
                                }
                            }

                            return new ServiceResult(driveConfigurationDTO, "Drive configurations received successfully");
                        }
                        else
                        {
                            var urlResp = await _driveHelper.GetAuthenticationUrl(storageName);
                            if (urlResp.Success)
                            {
                                return new ServiceResult(urlResp.Result, "Link storage drive again");

                            }
                            else
                            {
                                return urlResp;
                            }
                        }
                    }
                }
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("GetDriveConfigurationAsync Exception : {0}", e.Message);
            }
            return new ServiceResult("Failed to get drive configuration");
        }

        public async Task ScheduledUnlinking()
        {
            var list = await _userStorageRepository.GetAllActiveStateUserStorageDetailsListAsync();
            if (list == null || list.Count == 0)
            {
                _logger.LogInformation("No active state user storage details found");
                return;
            }

            foreach (var item in list)
            {
                if (DateOnly.FromDateTime(DateTime.UtcNow) > DateOnly.FromDateTime(item.ExpiryDate))
                {
                    var user = new UserDTO() { Suid = item.Suid, OrganizationId = item.OrganizationId };

                    await _userStorageRepository.UnlinkUserStorageAsync(user, item.StorageName);

                    await _driveHelper.SendDriveUnlinkEmail(item);
                }
            }
            return;
        }
    }
}

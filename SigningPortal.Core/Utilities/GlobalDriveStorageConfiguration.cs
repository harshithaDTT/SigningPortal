using Microsoft.Extensions.Logging;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using System;

namespace SigningPortal.Core.Utilities
{
	public class GlobalDriveStorageConfiguration : IGlobalDriveStorageConfiguration
	{
		private static bool _isInitialized = false;
		private static StorageSecretsDTO googleStorageSecret;
		private static StorageSecretsDTO oneDriveStorageSecret;
		public GlobalDriveStorageConfiguration(ILogger<GlobalDriveStorageConfiguration> logger, IConfigurationService configuration)
		{
			try
			{
				if (!_isInitialized)
				{
					logger.LogInformation("GlobalDriveStorageConfiguration Start ---->");

					googleStorageSecret = configuration.GetConfiguration(StorageConstant.GOOGLE_DRIVE);
					oneDriveStorageSecret = configuration.GetConfiguration(StorageConstant.ONE_DRIVE);

					_isInitialized = true;

					logger.LogInformation("GlobalDriveStorageConfiguration End <----");
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				logger.LogError("GlobalDriveStorageConfiguration Exception :: " + ex.Message);
			}
		}

		public StorageSecretsDTO GoogleStorageSecret { get { return googleStorageSecret; } }

		public StorageSecretsDTO OneDriveStorageSecret { get { return oneDriveStorageSecret; } }

	}
}

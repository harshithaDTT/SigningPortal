using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;

namespace SigningPortal.Core.Services
{
	public class ConfigurationService : IConfigurationService
	{

		private readonly ILogger<ConfigurationService> _logger;
		private readonly IConfigurationRepository _configurationRepository;

		public ConfigurationService(ILogger<ConfigurationService> logger,
			IConfigurationRepository configurationRepository)
		{
			_logger = logger;
			_configurationRepository = configurationRepository;
		}

		public StorageSecretsDTO GetConfiguration(string configName)
		{
			_logger.LogDebug("-->GetConfiguration");

			// Get Storage Configuration Record
			var configRecord = _configurationRepository.GetStorageConfigurationByName(configName);
			if (null == configRecord || null == configRecord.Configuration)
			{
				//_logger.LogError("Get Configuration Record Failed");
				return default;
			}

			// Get Plain data from secured data
			var plainData = PKIMethods.Instance.
				PKIDecryptSecureWireData(configRecord.Configuration);
			if (null == plainData)
			{
				_logger.LogError("PKIDecryptSecureWireData Failed");
				return default;
			}

			// Convert Plain data string to object
			StorageSecretsDTO config = JsonConvert.DeserializeObject<StorageSecretsDTO>(plainData);
			if (null == config)
			{
				_logger.LogError("Convert Plain data string to object Failed");
				return default;
			}

			config.AccountExpiry = configRecord.AccountExpiry;

			_logger.LogDebug("<--GetConfiguration");
			return config;
		}
	}
}

using SigningPortal.Core.DTOs;

namespace SigningPortal.Core.Domain.Services
{
	public interface IConfigurationService
	{
		StorageSecretsDTO GetConfiguration(string configName);
	}
}

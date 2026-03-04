using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface IConfigurationRepository
	{
		StorageConfiguration GetStorageConfigurationByName(string storageName);

		Task<StorageConfiguration> GetStorageConfigurationByNameAsync(string storageName);

		Task<IEnumerable<StorageConfiguration>> GetAllConfigurations();

		Task<StorageConfiguration> AddStorageConfigurationAsync(StorageConfiguration storageConfiguration);
	}
}

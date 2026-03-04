using MongoDB.Driver;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class ConfigurationRepository : GenericRepository<StorageConfiguration>, IConfigurationRepository
	{
		public ConfigurationRepository(IMongoDbSettings settings) : base(settings)
		{

		}

		public StorageConfiguration GetStorageConfigurationByName(string storageName)
		{
			return Collection.Aggregate()
				.Match(x => x.StorageName == storageName)
				.As<StorageConfiguration>().FirstOrDefault();
		}

		public async Task<StorageConfiguration> GetStorageConfigurationByNameAsync(string storageName)
		{
			return await Collection.Aggregate()
				.Match(x => x.StorageName == storageName)
				.As<StorageConfiguration>().FirstOrDefaultAsync();
		}

		public async Task<IEnumerable<StorageConfiguration>> GetAllConfigurations()
		{
			var list = await Collection.Aggregate().ToListAsync();

			return list;
		}

		public async Task<StorageConfiguration> AddStorageConfigurationAsync(StorageConfiguration storageConfiguration)
		{
			var configInDb = await Collection.Aggregate()
				.Match(x => x.StorageName == storageConfiguration.StorageName)
				.As<StorageConfiguration>().FirstOrDefaultAsync();

			if (configInDb == null)
			{
				await Collection.InsertOneAsync(storageConfiguration);
				return storageConfiguration;
			}
			else
			{
				var delete = await Collection.DeleteOneAsync(x => x.StorageName == storageConfiguration.StorageName);
				if (delete.DeletedCount == 0)
				{
					var filter = Builders<StorageConfiguration>.Filter.Eq(x => x.StorageName, storageConfiguration.StorageName);
					var updateFilter = Builders<StorageConfiguration>.Update
						.Set(x => x.Configuration, storageConfiguration.Configuration);
					var updatedConfig = await Collection.UpdateOneAsync(filter, updateFilter, options: new UpdateOptions { IsUpsert = false });
					if (updatedConfig != null)
					{
						if (updatedConfig.ModifiedCount > 0)
						{
							return storageConfiguration;
						}
						else
						{
							return null;
						}
					}
					else
					{
						return null;
					}
				}
				else
				{
					await Collection.InsertOneAsync(storageConfiguration);
					return storageConfiguration;
				}

			}

		}
	}
}

using MongoDB.Driver;
using SigningPortal.Core.Domain.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public abstract class GenericRepository<TEntity> : IGenericRepository<TEntity>
	{
		protected readonly IMongoCollection<TEntity> Collection;
		protected readonly IMongoDatabase database;

		public GenericRepository(IMongoDbSettings settings)
		{
			database = new MongoClient(settings.ConnectionString).GetDatabase(settings.DatabaseName);
			Collection = database.GetCollection<TEntity>(GetCollectionName(typeof(TEntity)));

			if (!database.ListCollectionNames().ToList().Contains(GetCollectionName(typeof(TEntity))))
				database.CreateCollection(GetCollectionName(typeof(TEntity)));
		}

		private protected IMongoCollection<T> GetCollection<T>(string collectionName)
		{
			return database.GetCollection<T>(collectionName);
		}

		private protected string GetCollectionName(Type documentType)
		{
			string collectionName = ((BsonCollectionAttribute)documentType.GetCustomAttributes(
					typeof(BsonCollectionAttribute),
					true)
				.FirstOrDefault())?.CollectionName;

			return collectionName;
		}

		public async Task<long> GetCountAsync(FilterDefinition<TEntity> filter)
		{

			var crsr = Collection.Find(filter);
			var count = await crsr.CountDocumentsAsync();
			return count;
		}

		public async Task<IList<TEntity>> FindAllAsync(FilterDefinition<TEntity> filter)
		{
			return await Collection.Find(filter).ToListAsync();
		}

	}
}

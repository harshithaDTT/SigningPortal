using MongoDB.Driver;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Utilities;
using System;
using System.Collections.Generic;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class ErrorMessageRepository : GenericRepository<ErrorMessage>, IErrorMessageRepository
	{
		public ErrorMessageRepository(IMongoDbSettings settings) : base(settings)
		{

		}

		public List<ErrorMessage> GetAllErrorMessages()
		{
			try
			{
				return Collection.Find(_ => true).ToList();
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				return null;
			}
		}

		public async void DeleteAllErrorMessages()
		{
			FilterDefinition<ErrorMessage> filter = Builders<ErrorMessage>.Filter.Empty;
			await Collection.DeleteManyAsync(filter);
		}
	}
}

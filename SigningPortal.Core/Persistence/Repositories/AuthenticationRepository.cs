using MongoDB.Driver;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class AuthenticationRepository : IAuthenticationRepository
	{
		protected readonly IMongoCollection<Auditlogs> Collection;

		public AuthenticationRepository(IMongoDbSettings settings)
		{
			var database = new MongoClient(settings.AuthenticationLogDbConnectionString)
				.GetDatabase(settings.AuthenticationLogDatabaseName);
			Collection = database.GetCollection<Auditlogs>("auditlogs");
		}

		public async Task<IList<Auditlogs>> GetUserLastLoginAsyc(string suid, string clientId)
		{
			return await Collection.Aggregate()
									.Match(x => x.identifier == suid)
									.Match(x => x.serviceProviderName == clientId)
									.Match(x => x.serviceName == "SUBSCRIBER_AUTHENTICATED")
									.Sort(Builders<Auditlogs>.Sort.Descending(x => x.timestamp))
									.Limit(2)
									.ToListAsync();
		}
	}
}

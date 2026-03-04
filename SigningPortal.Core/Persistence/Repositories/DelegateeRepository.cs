using MongoDB.Driver;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class DelegateeRepository : GenericRepository<Delegatee>, IDelegateeRepository
	{
		public DelegateeRepository(IMongoDbSettings settings) : base(settings)
		{

		}

		public async Task<IList<Delegatee>> SaveDelegatee(IList<Delegatee> delegateRecep)
		{
			await Collection.InsertManyAsync(delegateRecep);
			return delegateRecep;
		}

		public async Task<IList<Delegatee>> GetDelegateeListBySuidAsync(string suid)
		{
			var filter = Builders<Delegatee>.Filter;
			var delegateeFilter = filter.Eq(x => x.DelegateeSuid, suid);
			return await Collection.Aggregate().Match(delegateeFilter).ToListAsync();
		}

		public async Task<IList<Delegatee>> GetDelegateeListBySuidAndOrgIdAsync(string suid, string orgId)
		{
			var filter = Builders<Delegatee>.Filter;
			var delegateeFilter = filter.Eq(x => x.DelegateeSuid, suid) & filter.Eq(x => x.OrganizationId, orgId);
			return await Collection.Aggregate().Match(delegateeFilter).ToListAsync();
		}

		public async Task<bool> UpdateDelegateeById(Delegatee delegatee)
		{
			var filter = Builders<Delegatee>.Filter.Eq(x => x._id, delegatee._id);
			var updateFilter = Builders<Delegatee>.Update;
			var update = updateFilter.Set(x => x.ConsentStatus, delegatee.ConsentStatus)
				.Set(x => x.DelegateConsentDataSignature, delegatee.DelegateConsentDataSignature)
				.Set(x => x.ConsentDateTime, DateTime.UtcNow)
				.Set(x => x.UpdatedAt, DateTime.UtcNow);
			var updatedDoc = await Collection.UpdateOneAsync(filter, update, options: new UpdateOptions { IsUpsert = false });
			if (updatedDoc != null)
			{
				if (updatedDoc.ModifiedCount > 0)
				{
					return true;
				}
				else
				{
					return false;
				}
			}
			else
			{
				return false;
			}
		}

		//public async Task<IList<Delegatee>> GetDelegateeListBySuidListAsync(IList<string> list)
		//{
		//    var filter = Builders<Delegatee>.Filter;
		//    var delegateeFilter = filter.In(x => x.DelegateeSuid, list);

		//    return await Collection.Aggregate()
		//        .Match(delegateeFilter).ToListAsync();
		//}
	}
}

using MongoDB.Driver;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class DelegationRepository : GenericRepository<Delegation>, IDelegationRepository
	{
		public DelegationRepository(IMongoDbSettings settings) : base(settings)
		{

		}

		public async Task<Delegation> SaveDelegate(Delegation delegates)
		{
			await Collection.InsertOneAsync(delegates);
			return delegates;
		}

		public async Task<Delegation> GetDelegateById(string id)
		{

			var delegateeCollection = GetCollection<Delegatee>("Delegatee");
			var filter = Builders<Delegation>.Filter;
			var delegateFilter = filter.Eq(x => x._id, id);
			return await Collection.Aggregate()
				.Match(delegateFilter)
				.Sort(Builders<Delegation>.Sort.Descending(x => x.CreatedAt))
				.Lookup<Delegation, Delegatee, Delegation>(delegateeCollection, x => x._id, y => y.DelegationId, @del => @del.Delegatees)
				.As<Delegation>().FirstOrDefaultAsync();
		}

		public async Task<Delegation> GetDelegateByOrgIdAndSuid(string orgId, string suid)
		{

			var delegateeCollection = GetCollection<Delegatee>("Delegatee");
			var filter = Builders<Delegation>.Filter;
			var delegateFilter = filter.Eq(x => x.DelegatorSuid, suid)
				& filter.Eq(x => x.OrganizationId, orgId)
				& filter.Eq(x => x.DelegationStatus, DelegateConstants.Active);
			return await Collection.Aggregate()
				.Match(delegateFilter)
				.Sort(Builders<Delegation>.Sort.Descending(x => x.CreatedAt))
				.Lookup<Delegation, Delegatee, Delegation>(delegateeCollection, x => x._id, y => y.DelegationId, @del => @del.Delegatees)
				.As<Delegation>().FirstOrDefaultAsync();
		}

		public async Task<IList<Delegation>> GetDelegateByIdList(List<string> list)
		{
			var delegateeCollection = GetCollection<Delegatee>("Delegatee");
			var filter = Builders<Delegation>.Filter;
			var delegateFilter = filter.In(x => x._id, list);

			return await Collection.Aggregate()
				.Match(delegateFilter)
				.Sort(Builders<Delegation>.Sort.Descending(x => x.CreatedAt))
				.Lookup<Delegation, Delegatee, Delegation>(delegateeCollection, x => x._id, y => y.DelegationId, @del => @del.Delegatees)
				.As<Delegation>().ToListAsync();
		}

		public async Task<IList<Delegation>> GetDelegatesListByOrgIdAndSuid(string orgId, string suid)
		{
			var delegateeCollection = GetCollection<Delegatee>("Delegatee");
			var filter = Builders<Delegation>.Filter;
			var delegatorFilter = filter.Eq(x => x.OrganizationId, orgId) & filter.Eq(x => x.DelegatorSuid, suid);
			return await Collection.Aggregate()
				.Match(delegatorFilter)
				.Sort(Builders<Delegation>.Sort.Descending(x => x.CreatedAt))
				.Lookup<Delegation, Delegatee, Delegation>(delegateeCollection, x => x._id, y => y.DelegationId, @del => @del.Delegatees)
				.As<Delegation>().ToListAsync();
		}

		public async Task<IList<Delegation>> GetScheduledDelegationList()
		{
			var filter = Builders<Delegation>.Filter.Eq(x => x.DelegationStatus, DelegateConstants.Scheduled);

			return await Collection.Aggregate()
				.Match(filter)
				.Sort(Builders<Delegation>.Sort.Descending(x => x.CreatedAt))
				.As<Delegation>().ToListAsync();
		}

		public async Task<IList<Delegation>> GetNewDelegationListBySuidAndOrgIdAsync(string suid, string orgId)
		{
			var delegateeCollection = GetCollection<Delegatee>("Delegatee");

			//var statusFilter = Builders<Delegation>.Filter.Eq(x => x.DelegationStatus, DelegateConstants.New);
			var suidFilter = Builders<Delegation>.Filter.Eq(x => x.DelegatorSuid, suid);
			var orgFilter = Builders<Delegation>.Filter.Eq(x => x.OrganizationId, orgId);

			//var combinedFilter = Builders<Delegation>.Filter.And(suidFilter, statusFilter);

			return await Collection.Aggregate()
				.Match(suidFilter)
				.Match(orgFilter)
				.Sort(Builders<Delegation>.Sort.Descending(x => x.CreatedAt))
				.Lookup<Delegation, Delegatee, Delegation>(delegateeCollection, x => x._id, y => y.DelegationId, @del => @del.Delegatees)
				.As<Delegation>().ToListAsync();
		}


		public async Task<bool> UpdateDelegateById(Delegation delegator)
		{
			var filter = Builders<Delegation>.Filter.Eq(x => x._id, delegator._id);
			var updateFilter = Builders<Delegation>.Update;
			var update = updateFilter.Set(x => x.DelegationStatus, delegator.DelegationStatus)
				.Set(x => x.UpdatedAt, delegator.UpdatedAt);
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

		public async Task<bool> UpdateDelegateConsentDataById(Delegation delegator)
		{
			var filter = Builders<Delegation>.Filter.Eq(x => x._id, delegator._id);
			var updateFilter = Builders<Delegation>.Update;
			var update = updateFilter.Set(x => x.ConsentData, delegator.ConsentData)
				.Set(x => x.UpdatedAt, delegator.UpdatedAt);
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

		public async Task<bool> UpdateDelegatorConsentDataById(Delegation delegator)
		{
			var filter = Builders<Delegation>.Filter.Eq(x => x._id, delegator._id);
			var updateFilter = Builders<Delegation>.Update;
			var update = updateFilter
				.Set(x => x.DelegatorConsentData, delegator.DelegatorConsentData)
				.Set(x => x.DelegationStatus, delegator.DelegationStatus)
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
	}
}

using DocumentFormat.OpenXml.Office2010.Excel;
using MongoDB.Driver;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class GroupSigningRepository : GenericRepository<GroupSigning>, IGroupSigningRepository
	{
		public GroupSigningRepository(IMongoDbSettings settings) : base(settings)
		{
		}

        public async Task<IList<GroupSigning>> GetGroupSigningListBySuidAndOrgIdAsync(string suid, string orgId)
        {
			var filter = Builders<GroupSigning>.Filter;
			var listFilter = filter.Eq(x => x.SignerSuid, suid) & filter.Eq(x => x.SignerOrganizationId, orgId);
            return await Collection.Aggregate()
                .Match(listFilter)
				.Sort(Builders<GroupSigning>.Sort.Descending(x => x.CreatedAt))
				.As<GroupSigning>().ToListAsync();
        }
        public async Task<GroupSigning> SaveRequestAsync(GroupSigning document)
		{
			await Collection.InsertOneAsync(document);
			return document;
		}
		public async Task<GroupSigning> GetGroupSigningRequestByIdAsync(string id)
		{
			return await Collection.Aggregate()
				.Match(x => x._id == id)
				.As<GroupSigning>().FirstOrDefaultAsync();
		}

		public async Task<IEnumerable<GroupSigning>> GetAllAsync()
		{
			return await Collection.Find(_ => true).ToListAsync();
		}

		public async Task<bool> UpdateGroupSigningAsync(GroupSigning document)
		{
			var filter = Builders<GroupSigning>.Filter.Eq(x => x._id, document._id);
			var updateBuilder = Builders<GroupSigning>.Update;

			var update = updateBuilder
				.Set(x => x.SigningGroups, document.SigningGroups)
				.Set(x => x.Status, document.Status)
				.Set(x => x.SuccessFileCount, document.SuccessFileCount)
				.Set(x => x.FailedFileCount, document.FailedFileCount)
				.Set(x => x.UpdatedAt, DateTime.UtcNow);

			var updatedResult = await Collection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = false });

			return updatedResult != null && updatedResult.ModifiedCount > 0;
		}

		public async Task<bool> UpdateGroupSigningStatusAsync(string id, string status)
		{
			var filter = Builders<GroupSigning>.Filter.Eq(x => x._id, id);
			var updateBuilder = Builders<GroupSigning>.Update;

			var update = updateBuilder
				.Set(x => x.Status, status)
				.Set(x => x.UpdatedAt, DateTime.UtcNow);

			var updatedResult = await Collection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = false });

			return updatedResult != null && updatedResult.ModifiedCount > 0;
		}

		public async Task<bool> DeleteAsync(string id)
		{
			var result = await Collection.DeleteOneAsync(x => x._id == id);
			return result.IsAcknowledged && result.DeletedCount > 0;
		}

	}
}

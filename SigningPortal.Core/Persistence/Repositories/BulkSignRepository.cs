using MongoDB.Driver;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class BulkSignRepository : GenericRepository<BulkSign>, IBulkSignRepository
	{
		public BulkSignRepository(IMongoDbSettings settings) : base(settings)
		{

		}

		public async Task<bool> IsBulkSigningTransactionNameExists(string transactionName, string orgId)
		{
			FilterDefinition<BulkSign> filter;
			filter = Builders<BulkSign>.Filter.Eq(x => x.Transaction, transactionName)
												&
					 Builders<BulkSign>.Filter.Eq(x => x.OrganizationId, orgId);

			var count = await Collection.CountDocumentsAsync(filter);

			return count > 0;
		}

		public async Task<BulkSign> SaveBulkSignData(BulkSign bulkSign)
		{
			await Collection.InsertOneAsync(bulkSign);
			return bulkSign;
		}

		public async Task<IList<BulkSign>> GetBulkSigDataList(string orgId, string suid)
		{
			var filter = Builders<BulkSign>.Filter;
			var autoFilter = filter.Eq(x => x.Suid, suid) &
				filter.Eq(x => x.OrganizationId, orgId)
				& filter.Eq(x => x.SignerEmail, null);  // signer email will be null when preparator and signer are same 
			return await Collection.Aggregate()
				.Match(autoFilter)
				.Sort(Builders<BulkSign>.Sort.Descending(x => x.CreatedAt))
				.As<BulkSign>().ToListAsync();
		}

		public async Task<IList<BulkSign>> GetSentBulkSignDataList(string orgId, string suid)
		{
			var filter = Builders<BulkSign>.Filter;
			var autoFilter = filter.Eq(x => x.Suid, suid) &
				filter.Eq(x => x.OrganizationId, orgId)
				& filter.Ne(x => x.SignerEmail, null);  // signer email will exist when preparator and signer are different 

			return await Collection.Aggregate()
				.Match(autoFilter)
				.Sort(Builders<BulkSign>.Sort.Descending(x => x.CreatedAt))
				.As<BulkSign>().ToListAsync();
		}

		public async Task<IList<BulkSign>> GetReceivedBulkSignDataList(string orgId, string signerEmail)
		{
			var filter = Builders<BulkSign>.Filter;
			var autoFilter = filter.Eq(x => x.SignerEmail, signerEmail) &
							filter.Eq(x => x.OrganizationId, orgId) &
							filter.Ne(x => x.Status, DocumentStatusConstants.Draft);

			return await Collection.Aggregate()
				.Match(autoFilter)
				.Sort(Builders<BulkSign>.Sort.Descending(x => x.CreatedAt))
				.As<BulkSign>().ToListAsync();
		}

		public async Task<IList<BulkSign>> GetBulkSigDataListByTemplateId(string templateID)
		{
			return await Collection.Aggregate()
						.Match(x => x.TemplateId == templateID && x.Status != DocumentStatusConstants.Draft)
						.Sort(Builders<BulkSign>.Sort.Descending(x => x.CreatedAt))
						.As<BulkSign>().ToListAsync();
		}

		public async Task<BulkSign> GetBulkSignDataByCorelationId(string corelationId)
		{
			return await Collection.Aggregate()
				.Match(x => x.CorelationId == corelationId)
				.FirstOrDefaultAsync();
		}

		public async Task<BulkSign> GetBulkSignData(string id)
		{
			return await Collection.Aggregate()
				.Match(x => x._id == id)
				.FirstOrDefaultAsync();
		}

		public async Task<bool> UpdateBulkSignData(BulkSign bulkSign)
		{
			var filter = Builders<BulkSign>.Filter.Eq(x => x.CorelationId, bulkSign.CorelationId);
			var updateFilter = Builders<BulkSign>.Update;
			var update = updateFilter.Set(x => x.Result, bulkSign.Result)
				.Set(x => x.Status, bulkSign.Status)
				.Set(x => x.CompletedAt, bulkSign.CompletedAt);

			var updatedTemplate = await Collection.UpdateOneAsync(filter, update, options: new UpdateOptions { IsUpsert = false });
			if (updatedTemplate != null)
			{
				if (updatedTemplate.ModifiedCount > 0)
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

		public async Task<bool> UpdateBulkSignSrcDestData(BulkSign bulkSign)
		{
			var filter = Builders<BulkSign>.Filter.Eq(x => x.CorelationId, bulkSign.CorelationId);
			var updateFilter = Builders<BulkSign>.Update;
			var update = updateFilter.Set(x => x.SourcePath, bulkSign.SourcePath)
				.Set(x => x.SignedPath, bulkSign.SignedPath);

			var updatedTemplate = await Collection.UpdateOneAsync(filter, update, options: new UpdateOptions { IsUpsert = false });
			if (updatedTemplate != null)
			{
				if (updatedTemplate.ModifiedCount > 0)
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

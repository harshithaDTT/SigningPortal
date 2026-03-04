using MongoDB.Driver;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class DigitalFormResponseRepository : GenericRepository<DigitalFormResponse>, IDigitalFormResponseRepository
	{
		public DigitalFormResponseRepository(IMongoDbSettings settings) : base(settings)
		{

		}

		public async Task<bool> IsDigitalFormResponseExistAsync(string formId, string userSuid)
		{
			return await Collection
				.Find(x => x.FormId == formId && x.SignerSuid == userSuid)
				.AnyAsync();
		}
		public async Task<DigitalFormResponse> SaveDigitalFormResponseAsync(DigitalFormResponse template)
		{
			await Collection.InsertOneAsync(template);
			return template;
		}
		public async Task<DigitalFormResponse> GetDigitalFormResponseAsync(string id)
		{
			return await Collection.Aggregate()
				.Match(x => x._id == id)
				.FirstOrDefaultAsync();
		}
		public async Task<DigitalFormResponse> GetDigitalFormResponseByIdAsync(string formId, string userSuid)
		{
			return await Collection.Aggregate()
				.Match(x => x.FormId == formId)
				.Match(x => x.SignerSuid == userSuid)
				.FirstOrDefaultAsync();
		}
		public async Task<DigitalFormResponse> GetDigitalFormResponseByFormIdAsync(string id)
		{
			return await Collection.Aggregate()
				.Match(x => x.FormId == id)
				.FirstOrDefaultAsync();
		}
		public async Task<DigitalFormResponse> GetDigitalFormResponseByCorelationIdAsync(string corelationId)
		{
			return await Collection.Aggregate()
				.Match(x => x.CorelationId == corelationId)
				.FirstOrDefaultAsync();
		}
		public async Task<List<DigitalFormResponse>> GetDigitalFormResponseListAsync(string tempId)
		{
			var options = new AggregateOptions { AllowDiskUse = true, MaxTime = TimeSpan.FromMinutes(10) };

			return await Collection.Aggregate(options)
				.Match(x => x.FormId == tempId)
				.SortByDescending(x => x.CreatedAt)
				.ToListAsync();
		}
		public async Task<List<DigitalFormResponse>> GetDigitalFormResponseListByTemplateIdAndRequestIdAsync(string tempId, string reqId)
		{
			var options = new AggregateOptions { AllowDiskUse = true, MaxTime = TimeSpan.FromMinutes(10) };

			return await Collection.Aggregate(options)
				.Match(x => x.FormId == tempId && x.DigitalFormRequestId == reqId)
				.SortByDescending(x => x.CreatedAt)
				.ToListAsync();
		}
		public async Task<DigitalFormResponse> GetDigitalFormResponseByTemplateIdRequestIdAndSuidAsync(string tempId, string reqId, string suid)
		{
			var options = new AggregateOptions { AllowDiskUse = true, MaxTime = TimeSpan.FromMinutes(10) };

			return await Collection.Aggregate(options)
				.Match(x => x.FormId == tempId && x.DigitalFormRequestId == reqId && x.SignerSuid == suid)
				.SortByDescending(x => x.CreatedAt)
				.FirstOrDefaultAsync();
		}
		public async Task<List<DigitalFormResponse>> GetSelfDigitalFormResponseListAsync(string suid)
		{
			var options = new AggregateOptions { AllowDiskUse = true, MaxTime = TimeSpan.FromMinutes(10) };

			return await Collection.Aggregate(options)
				.Match(x => x.SignerSuid == suid)
				.SortByDescending(x => x.CreatedAt)
				.ToListAsync();
		}
		public async Task<bool> UpdateDigitalFormResponseById(DigitalFormResponse template)
		{

			var filter = Builders<DigitalFormResponse>.Filter.Eq(x => x.CorelationId, template.CorelationId);
			var updateFilter = Builders<DigitalFormResponse>.Update;
			var update = updateFilter
				.Set(x => x.Status, template.Status)
				.Set(x => x.EdmsId, template.EdmsId);

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

		public async Task<bool> DeleteDigitalFormResponseByCorelationId(string corelationId)
		{
			var filter = Builders<DigitalFormResponse>.Filter.Eq(x => x.CorelationId, corelationId);

			var result = await Collection.DeleteOneAsync(filter);
			if (result.DeletedCount == 0)
			{
				return false;
			}
			else
			{
				return true;
			}
		}

		public async Task<bool> DeleteDigitalFormResponseByTempIdAndSuid(string suid, string tempId)
		{
			var filter = Builders<DigitalFormResponse>.Filter.Where(x => x.SignerSuid == suid && x.FormId == tempId);

			var result = await Collection.DeleteOneAsync(filter);
			if (result.DeletedCount == 0)
			{
				return false;
			}
			else
			{
				return true;
			}
		}
	}
}

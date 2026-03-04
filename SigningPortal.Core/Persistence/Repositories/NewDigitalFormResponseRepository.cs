using MongoDB.Driver;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class NewDigitalFormResponseRepository : GenericRepository<NewDigitalFormResponse>, INewDigitalFormResponseRepository
	{
		public NewDigitalFormResponseRepository(IMongoDbSettings settings) : base(settings)
		{

		}

		public async Task<NewDigitalFormResponse> SaveNewDigitalFormResponseAsync(NewDigitalFormResponse template)
		{
			await Collection.InsertOneAsync(template);
			return template;
		}

		public async Task<NewDigitalFormResponse> GetNewDigitalFormResponseAsync(string id)
		{
			return await Collection.Aggregate()
				.Match(x => x._id == id)
				.FirstOrDefaultAsync();
		}

		public async Task<NewDigitalFormResponse> GetNewDigitalFormResponseByDocIdFormIdAsync(string id, string formID)
		{
			return await Collection.Aggregate()
				.Match(x => x.TemplateDocumentID == id && x.FormId == formID)
				.FirstOrDefaultAsync();
		}

		public async Task<NewDigitalFormResponse> GetNewDigitalFormResponseByDocIdAsync(string tempDocId)
		{
			return await Collection.Aggregate()
				.Match(x => x.TemplateDocumentID == tempDocId)
				.FirstOrDefaultAsync();
		}

		public async Task<NewDigitalFormResponse> GetNewDigitalFormResponseByIdAsync(string formId, string userSuid)
		{
			//return await Collection.Aggregate()
			//	.Match(x => x.FormId == formId)
			//	//.Match(x => x.Status == DocumentStatusConstants.Completed)
			//	.Match(x => x.SignerResponses.Any(y => y.SignerDetails.SignerSuid == userSuid))
			//	.ToListAsync();
			var filter = Builders<NewDigitalFormResponse>.Filter.And(
					Builders<NewDigitalFormResponse>.Filter.Eq(x => x.FormId, formId),
					Builders<NewDigitalFormResponse>.Filter.Eq(x => x.RequestType, TemplateConstants.Publish),
					Builders<NewDigitalFormResponse>.Filter.Eq(x => x.Status, DocumentStatusConstants.Completed),
					Builders<NewDigitalFormResponse>.Filter.ElemMatch(
						x => x.SignerResponses,
						y => y.SignerDetails.SignerSuid == userSuid
					)
				);

			var list = await Collection.Aggregate()
				.Match(filter).FirstOrDefaultAsync();

			if (list == null)
			{
				var filter1 = Builders<NewDigitalFormResponse>.Filter.And(
					Builders<NewDigitalFormResponse>.Filter.Eq(x => x.FormId, formId),
					Builders<NewDigitalFormResponse>.Filter.Eq(x => x.RequestType, TemplateConstants.Publish),
					Builders<NewDigitalFormResponse>.Filter.Eq(x => x.Status, DocumentStatusConstants.InProgress),
					Builders<NewDigitalFormResponse>.Filter.ElemMatch(
						x => x.SignerResponses,
						y => y.SignerDetails.SignerSuid == userSuid
					)
				);

				list = await Collection.Aggregate()
				.Match(filter1).FirstOrDefaultAsync();
			}
			return list;
		}
		public async Task<NewDigitalFormResponse> GetNewDigitalFormResponseByFormIdAsync(string id)
		{
			return await Collection.Aggregate()
				.Match(x => x.FormId == id)
				.FirstOrDefaultAsync();
		}
		public async Task<NewDigitalFormResponse> GetNewDigitalFormResponseByCorelationIdAsync(string corelationId)
		{
			return await Collection.Aggregate()
				.Match(x => x.SignerResponses.Any(y => y.CorrelationId == corelationId))
				.FirstOrDefaultAsync();
		}
		public async Task<List<NewDigitalFormResponse>> GetNewDigitalFormResponseListAsync(string tempId)
		{
			var options = new AggregateOptions { AllowDiskUse = true, MaxTime = TimeSpan.FromMinutes(10) };

			return await Collection.Aggregate(options)
				.Match(x => x.FormId == tempId)
				.Match(x => x.Status == DocumentStatusConstants.Completed)
				.Match(x => x.RequestType == TemplateDocumentRequestTypeConstants.Publish)
				.SortByDescending(x => x.CreatedAt)
				.ToListAsync();
		}

		public async Task<List<NewDigitalFormResponse>> GetNewDigitalFormResponseListByTemplateDocumentIdListAsync(IList<string> tempDocIdList)
		{
			if (tempDocIdList == null || tempDocIdList.Count == 0)
				return [];

			var filter = Builders<NewDigitalFormResponse>.Filter.In(x => x.TemplateDocumentID, tempDocIdList);

			var options = new AggregateOptions { AllowDiskUse = true, MaxTime = TimeSpan.FromMinutes(10) };

			return await Collection.Aggregate(options)
				.Match(filter)
				.SortByDescending(x => x.CreatedAt)
				.ToListAsync();
		}

		public async Task<List<NewDigitalFormResponse>> GetSelfNewDigitalFormResponseListAsync(string suid)
		{
			var options = new AggregateOptions { AllowDiskUse = true, MaxTime = TimeSpan.FromMinutes(10) };

			return await Collection.Aggregate(options)
				.Match(x => x.SignerResponses.Any(y => y.SignerDetails.SignerSuid == suid))
				.SortByDescending(x => x.CreatedAt)
				.ToListAsync();
		}
		public async Task<bool> UpdateNewDigitalFormResponseById(NewDigitalFormResponse template, string correlationId)
		{

			//var filter = Builders<NewDigitalFormResponse>.Filter.Eq(x => x.SignerResponses.Any(y => y.CorrelationId ==  template.SignerResponses.Where(z => z.CorrelationId)));
			var filter = Builders<NewDigitalFormResponse>.Filter.ElemMatch(
							x => x.SignerResponses,
							response => response.CorrelationId == correlationId
						);
			var updateFilter = Builders<NewDigitalFormResponse>.Update;
			var update = updateFilter
				.Set(x => x.Status, template.Status)
				.Set(x => x.EdmsId, template.EdmsId)
				.Set(x => x.UpdatedAt, DateTime.UtcNow);

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

		public async Task<bool> UpdateNewDigitalFormResponseStatusById(NewDigitalFormResponse template, string correlationId)
		{

			//var filter = Builders<NewDigitalFormResponse>.Filter.Eq(x => x.SignerResponses.Any(y => y.CorrelationId ==  template.SignerResponses.Where(z => z.CorrelationId)));
			var filter = Builders<NewDigitalFormResponse>.Filter.ElemMatch(
							x => x.SignerResponses,
							response => response.CorrelationId == correlationId
						);
			var updateFilter = Builders<NewDigitalFormResponse>.Update;
			var update = updateFilter
				.Set(x => x.Status, template.Status)
				.Set(x => x.UpdatedAt, DateTime.UtcNow);

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

		public async Task<bool> UpdateNewDigitalFormResponseStatusByTempDocId(string templateDocId, string status)
		{
			var filter = Builders<NewDigitalFormResponse>.Filter.Eq(x => x.TemplateDocumentID, templateDocId);
			var update = Builders<NewDigitalFormResponse>.Update.Set(x => x.Status, status)
																.Set(x => x.UpdatedAt, DateTime.UtcNow);

			var result = await Collection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = false });

			return result?.ModifiedCount > 0;
		}


		public async Task<bool> UpdateNewDigitalFormSignersResponseById(NewDigitalFormResponse template, string id)
		{

			var filter = Builders<NewDigitalFormResponse>.Filter.Eq(x => x._id, id);
			//var filter = Builders<NewDigitalFormResponse>.Filter.ElemMatch(
			//                x => x.SignerResponses,
			//                response => response.CorrelationId == correlationId
			//            );
			var updateFilter = Builders<NewDigitalFormResponse>.Update;
			var update = updateFilter
				.Set(x => x.SignerResponses, template.SignerResponses)
				.Set(x => x.UpdatedAt, DateTime.UtcNow);

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

		//public async Task<bool> UpdateNewDigitalFormResponseStatusById(NewDigitalFormResponse template, string id)
		//{

		//    var filter = Builders<NewDigitalFormResponse>.Filter.Eq(x => x._id, id);
		//    //var filter = Builders<NewDigitalFormResponse>.Filter.ElemMatch(
		//    //                x => x.SignerResponses,
		//    //                response => response.CorrelationId == correlationId
		//    //            );
		//    var updateFilter = Builders<NewDigitalFormResponse>.Update;
		//    var update = updateFilter
		//        .Set(x => x.SignerResponses, template.SignerResponses);

		//    var updatedTemplate = await Collection.UpdateOneAsync(filter, update, options: new UpdateOptions { IsUpsert = false });
		//    if (updatedTemplate != null)
		//    {
		//        if (updatedTemplate.ModifiedCount > 0)
		//        {
		//            return true;
		//        }
		//        else
		//        {
		//            return false;
		//        }
		//    }
		//    else
		//    {
		//        return false;
		//    }
		//}

		public async Task<bool> DeleteNewDigitalFormResponseByCorelationId(string correlationId)
		{
			var filter = Builders<NewDigitalFormResponse>.Filter.ElemMatch(
							x => x.SignerResponses,
							response => response.CorrelationId == correlationId
						);

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

		public async Task<bool> DeleteNewDigitalFormResponseByTempIdAndSuid(string suid, string tempId)
		{
			var filter = Builders<NewDigitalFormResponse>.Filter.Where(
								x => x.SignerResponses.Any(y => y.SignerDetails.SignerSuid == suid)
								&& x.FormId == tempId);

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

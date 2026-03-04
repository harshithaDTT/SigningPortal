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
	public class TemplateDocumentRepository(IMongoDbSettings settings) : GenericRepository<TemplateDocument>(settings), ITemplateDocumentRepository
	{
		public async Task<long> GetOwnTemplateDocumentStatusCountAsync(string suid, string accontType, string currentOrgId, string status)
		{
			var filter = Builders<TemplateDocument>.Filter;
			var ownTemplateDocumentCountFilter = filter.Eq(x => x.Owner.suid, suid) & filter.Eq(x => x.Status, status)
				& filter.Eq(x => x.AccountType, accontType);
			if (accontType == AccountTypeConstants.Organization && !string.IsNullOrEmpty(currentOrgId))
			{
				ownTemplateDocumentCountFilter &= filter.Eq(x => x.OrganizationId, currentOrgId);
			}

			return await GetCountAsync(ownTemplateDocumentCountFilter);


		}

		public async Task<IList<TemplateDocument>> OtherTemplateDocumentStatusAsync(List<string> list)
		{
			var filter = Builders<TemplateDocument>.Filter;
			var TemplateDocumentFilter = filter.In(x => x._id, list) & filter.Eq(x => x.Status, DocumentStatusConstants.InProgress);
			//var TemplateDocumentFilter = filter.AnyIn(x=>x.RecepientsIds , list) & filter.Eq(x=>x.Status , TemplateDocumentStatusConstants.InProgress);
			return await Collection.Find(TemplateDocumentFilter).ToListAsync();
		}

		public async Task<TemplateDocument> GetTemplateDocumentByRecepientsTempIdAsync(string tempid)
		{
			var filter = Builders<TemplateDocument>.Filter;
			var docFilter = filter.Eq(x => x._id, tempid) & filter.Eq(x => x.Status, DocumentStatusConstants.InProgress);
			return await Collection.Find(docFilter).FirstOrDefaultAsync();
		}

		public async Task<TemplateDocument> SaveTemplateDocument(TemplateDocument TemplateDocument)
		{
			await Collection.InsertOneAsync(TemplateDocument);
			return TemplateDocument;
		}

		public async Task<List<TemplateDocument>> SaveTemplateDocumentList(List<TemplateDocument> TemplateDocumentList)
		{
			await Collection.InsertManyAsync(TemplateDocumentList);
			return TemplateDocumentList;
		}

		public async Task<TemplateDocument> GetTemplateDocumentById(string id)
		{
			var RecepientCollection = GetCollection<TemplateRecepient>("TemplateRecepient");
			return await Collection.Aggregate()
				.Match(x => x._id == id)
				.Sort(Builders<TemplateDocument>.Sort.Descending(x => x.CreatedAt))
				.Lookup<TemplateDocument, TemplateRecepient, TemplateDocument>(RecepientCollection, doc => doc._id, rec => rec.TemplateDocumentId, @docX => docX.TemplateRecepients)
				.As<TemplateDocument>().FirstOrDefaultAsync();
		}

		public async Task<long> UpdateExpiredTemplateDocumentStatus()
		{
			var filter = Builders<TemplateDocument>.Filter;
			var expFilter = filter.Eq(x => x.Status, DocumentStatusConstants.InProgress) & filter.Lte(x => x.ExpieryDate, DateTime.UtcNow);
			var updateFilter = Builders<TemplateDocument>.Update.Set(x => x.Status, DocumentStatusConstants.Expired);
			var result = await Collection.UpdateManyAsync(expFilter, updateFilter, options: new UpdateOptions { IsUpsert = false });
			return result.ModifiedCount;
		}

		public async Task<bool> UpdateTemplateDocumentById(TemplateDocument TemplateDocument)
		{

			var filter = Builders<TemplateDocument>.Filter.Eq(x => x._id, TemplateDocument._id);
			var updateFilter = Builders<TemplateDocument>.Update;
			var update = updateFilter.Set(x => x.CompleteTime, TemplateDocument.CompleteTime)
				.Set(x => x.Status, TemplateDocument.Status)
				.Set(x => x.UpdatedAt, DateTime.UtcNow);
			//.Set(x => x.CompletedDoc, TemplateDocument.CompletedDoc);
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

		public async Task<bool> UpdateTemplateDocumentEdmsIdById(TemplateDocument TemplateDocument)
		{

			var filter = Builders<TemplateDocument>.Filter.Eq(x => x._id, TemplateDocument._id);
			var updateFilter = Builders<TemplateDocument>.Update;
			var update = updateFilter.Set(x => x.EdmsId, TemplateDocument.EdmsId)
				.Set(x => x.UpdatedAt, DateTime.UtcNow);
			//.Set(x => x.CompletedDoc, TemplateDocument.CompletedDoc);
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


		//public async Task UpdateRecepientsListInTemplateDocumentById(TemplateDocument TemplateDocument)
		//{
		//    var filter = Builders<TemplateDocument>.Filter.Eq(x => x._id, TemplateDocument._id);
		//    var updateFilter = Builders<TemplateDocument>.Update.Set(x => x.RecepientsIds, TemplateDocument.RecepientsIds);
		//    await Collection.UpdateOneAsync(filter, updateFilter, options: new UpdateOptions { IsUpsert = false });
		//}

		//removed lookup

		public async Task<IList<TemplateDocument>> GetAllTemplateDocumentsBySuid(string suid)
		{
			var RecepientCollection = GetCollection<TemplateRecepient>("TemplateRecepient");
			var filter = Builders<TemplateDocument>.Filter.Eq(x => x.Owner.suid, suid);
			return await Collection.Aggregate()
				.Match(filter)
				.Sort(Builders<TemplateDocument>.Sort.Descending(x => x.CreatedAt))
				.Lookup<TemplateDocument, TemplateRecepient, TemplateDocument>(RecepientCollection, doc => doc._id, rec => rec.TemplateDocumentId, @docX => docX.TemplateRecepients)
				.As<TemplateDocument>()
				.ToListAsync();
		}

		public async Task<IList<TemplateDocument>> GetAllTemplateDocumentsBySuidAndOrganizationId(string suid, string orgId)
		{
			var RecepientCollection = GetCollection<TemplateRecepient>("TemplateRecepient");
			var filter = Builders<TemplateDocument>.Filter.And
						(
							Builders<TemplateDocument>.Filter.Eq(x => x.Owner.suid, suid),
							Builders<TemplateDocument>.Filter.Eq(x => x.OrganizationId, orgId),
							Builders<TemplateDocument>.Filter.Ne(x => x.RequestType, TemplateDocumentRequestTypeConstants.Publish) //NotEqual To Publish
						);
			return await Collection.Aggregate()
				.Match(filter)
				.Sort(Builders<TemplateDocument>.Sort.Descending(x => x.CreatedAt))
				.Lookup<TemplateDocument, TemplateRecepient, TemplateDocument>(RecepientCollection, doc => doc._id, rec => rec.TemplateDocumentId, @docX => docX.TemplateRecepients)
				.As<TemplateDocument>()
				.ToListAsync();
		}

		public async Task<bool> TemplateDocumentsBySuidAndOrganizationIdExists(string suid, string orgId)
		{
			var RecepientCollection = GetCollection<TemplateRecepient>("TemplateRecepient");
			var filter = Builders<TemplateDocument>.Filter.And(
				Builders<TemplateDocument>.Filter.Eq(x => x.Owner.suid, suid),
				Builders<TemplateDocument>.Filter.Eq(x => x.OrganizationId, orgId),
				Builders<TemplateDocument>.Filter.Ne(x => x.RequestType, TemplateDocumentRequestTypeConstants.Publish) //NotEqual To Publish
			);

			var result = await Collection.Aggregate()
				.Match(filter)
				.Sort(Builders<TemplateDocument>.Sort.Descending(x => x.CreatedAt))
				.Lookup<TemplateDocument, TemplateRecepient, TemplateDocument>(
					RecepientCollection,
					doc => doc._id,
					rec => rec.TemplateDocumentId,
					@docX => docX.TemplateRecepients
				)
				.Limit(1) // Fetch at most one document
				.ToListAsync();

			return result.Count != 0; // Return true if there's at least one document, otherwise false
		}

		public async Task<IList<TemplateDocument>> GetTemplateDocumentListByRequestGroupId(string groupId)
		{
			var RecepientCollection = GetCollection<TemplateRecepient>("TemplateRecepient");
			var filter = Builders<TemplateDocument>.Filter.Eq(x => x.RequestGroupId, groupId);

			for (int retry = 0; retry < 3; retry++)
			{
				var results = await Collection.Aggregate()
					.Match(filter)
					.Sort(Builders<TemplateDocument>.Sort.Descending(x => x.CreatedAt))
					.Lookup<TemplateDocument, TemplateRecepient, TemplateDocument>(
						RecepientCollection,
						doc => doc._id,
						rec => rec.TemplateDocumentId,
						@docX => docX.TemplateRecepients)
					.As<TemplateDocument>()
					.ToListAsync();

				if (results?.Count > 0)
					return results;

				await Task.Delay(100); // wait before retrying
			}

			return []; // fallback
		}


		public async Task DeleteTemplateDocumentsByIdsAsync(IList<string> idList)
		{
			var filter = Builders<TemplateDocument>.Filter.In(x => x._id, idList);

			await Collection.DeleteManyAsync(filter);
		}

		public async Task<bool> UpdateTemplateDocumentStatusAsync(string tempId, string updatedStatus)
		{
			var filter = Builders<TemplateDocument>.Filter.Eq(x => x._id, tempId);
			var updateFilter = Builders<TemplateDocument>.Update.Set(x => x.Status, updatedStatus).Set(x => x.UpdatedAt, DateTime.UtcNow);
			var update = await Collection.UpdateOneAsync(filter, updateFilter, options: new UpdateOptions { IsUpsert = false });
			if (update != null)
			{
				if (update.ModifiedCount > 0)
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

		public async Task<IList<TemplateDocument>> GetPendingTemplateDocumentListAsync(IList<string> recepientsId, IList<string> statusList)
		{
			var RecepientCollection = GetCollection<TemplateRecepient>("TemplateRecepient");
			var filter = Builders<TemplateDocument>.Filter;
			var dataFilter = filter.In(x => x._id, recepientsId) & filter.In(x => x.Status, statusList);


			var TemplateDocumentData = await Collection.Aggregate()
				.Match(dataFilter)
				.Sort(Builders<TemplateDocument>.Sort.Descending(x => x.CreatedAt))
				.Lookup<TemplateDocument, TemplateRecepient, TemplateDocument>(RecepientCollection, doc => doc._id, rec => rec.TemplateDocumentId, @docX => docX.TemplateRecepients)
				.As<TemplateDocument>()
				.ToListAsync();
			return TemplateDocumentData;
		}

		//public async Task<long> UpdateExpiredTemplateDocumentStatus()
		//{
		//	var filter = Builders<TemplateDocument>.Filter;
		//	var expFilter = filter.Eq(x => x.Status, DocumentStatusConstants.InProgress) & filter.Lte(x => x.ExpireDate, DateTime.UtcNow);
		//	var updateFilter = Builders<TemplateDocument>.Update.Set(x => x.Status, DocumentStatusConstants.Expired);
		//	var result = await Collection.UpdateManyAsync(expFilter, updateFilter, options: new UpdateOptions { IsUpsert = false });
		//	return result.ModifiedCount;
		//}

		//public async Task<long> UpdateExpiredTemplateDocumentStatusByTempIdList(IList<string> idList)
		//{
		//	var filter = Builders<TemplateDocument>.Filter;
		//	var expFilter =
		//		filter.Eq(x => x.Status, DocumentStatusConstants.InProgress)
		//		& filter.In(x => x._id, idList)
		//		& filter.Lte(x => x.ExpireDate, DateTime.UtcNow);
		//	var updateFilter = Builders<TemplateDocument>.Update.Set(x => x.Status, DocumentStatusConstants.Expired);
		//	var result = await Collection.UpdateManyAsync(expFilter, updateFilter, options: new UpdateOptions { IsUpsert = false });

		//	return result.ModifiedCount;
		//}

		//public async Task<IList<TemplateDocument>> GetTemplateDocumentByAutoReminder(string reminder)
		//{
		//	var filter = Builders<TemplateDocument>.Filter;
		//	var autoFilter = filter.Eq(x => x.AutoReminders, reminder) & filter.Eq(x => x.Status, TemplateDocumentStatusConstants.InProgress);
		//	return await Collection.Find(autoFilter).ToListAsync();
		//}

		//public async Task<bool> UpdateTemplateDocumentBlockedStatusAsync(string id, bool blockedStatus)
		//{
		//	var filter = Builders<TemplateDocument>.Filter.Eq(x => x._id, id);
		//	var updateFilter = Builders<TemplateDocument>.Update
		//		.Set(x => x.IsTemplateDocumentBlocked, blockedStatus)
		//		.Set(x => x.TemplateDocumentBlockedTime, DateTime.UtcNow);
		//	var update = await Collection.UpdateOneAsync(filter, updateFilter, options: new UpdateOptions { IsUpsert = false });
		//	if (update != null)
		//	{
		//		if (update.ModifiedCount > 0)
		//		{
		//			return true;
		//		}
		//		else
		//		{
		//			return false;
		//		}
		//	}
		//	else
		//	{
		//		return false;
		//	}
		//}

		public async Task<IList<TemplateDocument>> GetTemplateDocumentListAsync(string suid, string organizationId, bool isMultisign = false)
		{
			var RecepientCollection = GetCollection<TemplateRecepient>("TemplateRecepient");
			var filter = Builders<TemplateDocument>.Filter;
			var autoFilter = filter.Eq(x => x.Owner.suid, suid) & filter.Eq(x => x.MultiSign, isMultisign);

			if (string.IsNullOrEmpty(organizationId))
			{
				autoFilter &= filter.Eq(x => x.OrganizationId, organizationId);
			}

			return await Collection.Aggregate()
				.Match(autoFilter)
				.Sort(Builders<TemplateDocument>.Sort.Descending(x => x.CreatedAt))
				.Lookup<TemplateDocument, TemplateRecepient, TemplateDocument>(RecepientCollection, doc => doc._id, rec => rec.TemplateDocumentId, @docX => docX.TemplateRecepients)
				.As<TemplateDocument>().ToListAsync();
		}
		//RequestType :: Publish
		public async Task<IList<TemplateDocument>> GetTemplateDocumentListByFormIdAsync(string formId)
		{
			var RecepientCollection = GetCollection<TemplateRecepient>("TemplateRecepient");
			var filter = Builders<TemplateDocument>.Filter;
			var autoFilter = filter.Eq(x => x.FormId, formId) &
				filter.Eq(x => x.RequestType, TemplateDocumentRequestTypeConstants.Publish) &
				filter.Eq(x => x.Status, DocumentStatusConstants.Completed);

			return await Collection.Aggregate()
				.Match(autoFilter)
				.Sort(Builders<TemplateDocument>.Sort.Descending(x => x.CreatedAt))
				.Lookup<TemplateDocument, TemplateRecepient, TemplateDocument>(RecepientCollection, doc => doc._id, rec => rec.TemplateDocumentId, @docX => docX.TemplateRecepients)
				.As<TemplateDocument>().ToListAsync();
		}

		public async Task<IList<TemplateDocument>> GetSentTemplateDocumentListAsync(string suid, string accountType, string organizationId, bool isMultisign)
		{
			var RecepientCollection = GetCollection<TemplateRecepient>("TemplateRecepient");
			var filter = Builders<TemplateDocument>.Filter;
			var autoFilter = filter.Eq(x => x.Owner.suid, suid) & filter.Eq(x => x.MultiSign, isMultisign) & filter.Eq(x => x.AccountType, accountType);

			if (accountType == AccountTypeConstants.Organization)
			{
				autoFilter &= filter.Eq(x => x.OrganizationId, organizationId);
			}

			return await Collection.Aggregate()
				.Match(autoFilter)
				.Sort(Builders<TemplateDocument>.Sort.Descending(x => x.CreatedAt))
				.Lookup<TemplateDocument, TemplateRecepient, TemplateDocument>(RecepientCollection, doc => doc._id, rec => rec.TemplateDocumentId, @docX => docX.TemplateRecepients)
				.As<TemplateDocument>().ToListAsync();
		}

		public async Task<TemplateDocument> GetTemplateDocumentByTempIdAsync(string tempid)
		{
			var RecepientCollection = GetCollection<TemplateRecepient>("TemplateRecepient");
			var filter = Builders<TemplateDocument>.Filter.Eq(x => x._id, tempid);
			return await Collection.Aggregate()
				.Match(filter)
				.Sort(Builders<TemplateDocument>.Sort.Descending(x => x.CreatedAt))
				.Lookup<TemplateDocument, TemplateRecepient, TemplateDocument>(RecepientCollection, doc => doc._id, rec => rec.TemplateDocumentId, @docX => docX.TemplateRecepients)
				.As<TemplateDocument>().FirstOrDefaultAsync();
		}

		public async Task<TemplateDocument> GetTemplateResponseDocument(string formId, string suid, string orgId)
		{
			var RecepientCollection = GetCollection<TemplateRecepient>("TemplateRecepient");
			var filter = Builders<TemplateDocument>.Filter.And
						(
							Builders<TemplateDocument>.Filter.Eq(x => x.FormId, formId),
							Builders<TemplateDocument>.Filter.Eq(x => x.Owner.suid, suid),
							Builders<TemplateDocument>.Filter.Eq(x => x.OrganizationId, orgId),
							Builders<TemplateDocument>.Filter.Eq(x => x.Status, DocumentStatusConstants.Completed),
							Builders<TemplateDocument>.Filter.Eq(x => x.RequestType, TemplateDocumentRequestTypeConstants.Publish)
						);
			return await Collection.Aggregate()
				.Match(filter)
				.Lookup<TemplateDocument, TemplateRecepient, TemplateDocument>(RecepientCollection, doc => doc._id, rec => rec.TemplateDocumentId, @docX => docX.TemplateRecepients)
				.As<TemplateDocument>()
				.FirstOrDefaultAsync();
		}

		public async Task<TemplateDocument> GetTemplateeDocument(string formId, string suid, string orgId)
		{
			var RecepientCollection = GetCollection<TemplateRecepient>("TemplateRecepient");
			var filter = Builders<TemplateDocument>.Filter.And
						(
							Builders<TemplateDocument>.Filter.Eq(x => x.FormId, formId),
							Builders<TemplateDocument>.Filter.Eq(x => x.Owner.suid, suid),
							Builders<TemplateDocument>.Filter.Eq(x => x.OrganizationId, orgId),
							Builders<TemplateDocument>.Filter.Eq(x => x.Status, DocumentStatusConstants.Completed),
							Builders<TemplateDocument>.Filter.Eq(x => x.RequestType, TemplateDocumentRequestTypeConstants.Publish)
						);
			return await Collection.Aggregate()
				.Match(filter)
				.Lookup<TemplateDocument, TemplateRecepient, TemplateDocument>(RecepientCollection, doc => doc._id, rec => rec.TemplateDocumentId, @docX => docX.TemplateRecepients)
				.As<TemplateDocument>()
				.FirstOrDefaultAsync();
		}

		public async Task<TemplateDocument> GetGlobalTemplateResponseDocument(string formId, string suid)
		{
			var RecepientCollection = GetCollection<TemplateRecepient>("TemplateRecepient");
			var filter = Builders<TemplateDocument>.Filter.And
						(
							Builders<TemplateDocument>.Filter.Eq(x => x.FormId, formId),
							Builders<TemplateDocument>.Filter.Eq(x => x.Owner.suid, suid),
							Builders<TemplateDocument>.Filter.Eq(x => x.RequestType, TemplateDocumentRequestTypeConstants.Publish)
						);
			return await Collection.Aggregate()
				.Match(filter)
				.Lookup<TemplateDocument, TemplateRecepient, TemplateDocument>(RecepientCollection, doc => doc._id, rec => rec.TemplateDocumentId, @docX => docX.TemplateRecepients)
				.As<TemplateDocument>()
				.FirstOrDefaultAsync();
		}

		public async Task<IList<TemplateDocument>> GetTemplateDocumentListByTempIdList(IList<string> tempIdList)
		{
			var RecepientCollection = GetCollection<TemplateRecepient>("TemplateRecepient");
			var filter = Builders<TemplateDocument>.Filter;
			//var docFilter = filter.And(
			//	filter.In(x => x._id, tempIdList),
			//	filter.Ne(x => x.RequestType, TemplateDocumentRequestTypeConstants.Publish)
			//	);
			var docFilter = filter.In(x => x._id, tempIdList);
			return await Collection.Aggregate()
				.Match(docFilter)
				.Sort(Builders<TemplateDocument>.Sort.Descending(x => x.CreatedAt))
				.Lookup<TemplateDocument, TemplateRecepient, TemplateDocument>(RecepientCollection, doc => doc._id, rec => rec.TemplateDocumentId, @docX => docX.TemplateRecepients)
				.As<TemplateDocument>().ToListAsync();

		}

		public async Task<bool> UpdateArrayInTemplateDocumentById(TemplateDocument TemplateDocument)
		{

			var filter = Builders<TemplateDocument>.Filter.Eq(x => x._id, TemplateDocument._id);
			var updateFilter = Builders<TemplateDocument>.Update;
			var update = updateFilter
				.Set(x => x.PendingSignList, TemplateDocument.PendingSignList)
				.Set(x => x.CompleteSignList, TemplateDocument.CompleteSignList)
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

		public async Task<IList<TemplateDocument>> GetDocumentByTempIdList(IList<string> tempIdList, bool isMultisign)
		{
			var RecepientCollection = GetCollection<TemplateRecepient>("TemplateRecepient");
			var filter = Builders<TemplateDocument>.Filter;
			var docFilter = filter.In(x => x._id, tempIdList) & filter.Eq(x => x.MultiSign, isMultisign);
			return await Collection.Aggregate()
				.Match(docFilter)
				.Sort(Builders<TemplateDocument>.Sort.Descending(x => x.CreatedAt))
				.Lookup<TemplateDocument, TemplateRecepient, TemplateDocument>(RecepientCollection, doc => doc._id, rec => rec.TemplateDocumentId, @docX => docX.TemplateRecepients)
				.As<TemplateDocument>().ToListAsync();

		}
		public async Task<TemplateDocument> GetTemplateDocumentDetailsByTemplateRecepientsTempIdAsync(string tempid)
		{
			var RecepientCollection = GetCollection<TemplateRecepient>("TemplateRecepient");
			var filter = Builders<TemplateDocument>.Filter;
			var docFilter = filter.Eq(x => x._id, tempid);
			return await Collection.Aggregate()
				.Match(docFilter)
				.Sort(Builders<TemplateDocument>.Sort.Descending(x => x.CreatedAt))
				.Lookup<TemplateDocument, TemplateRecepient, TemplateDocument>(RecepientCollection, doc => doc._id, rec => rec.TemplateDocumentId, @docX => docX.TemplateRecepients)
				.As<TemplateDocument>().FirstOrDefaultAsync();
		}

		public async Task<TemplateDocument> GetTemplateDocumentDetailsByRecepientsTempIdAsync(string tempid)
		{
			var RecepientCollection = GetCollection<TemplateRecepient>("TemplateRecepient");
			var filter = Builders<TemplateDocument>.Filter;
			var docFilter = filter.Eq(x => x._id, tempid);
			return await Collection.Aggregate()
				.Match(docFilter)
				.Sort(Builders<TemplateDocument>.Sort.Descending(x => x.CreatedAt))
				.Lookup<TemplateDocument, TemplateRecepient, TemplateDocument>(RecepientCollection, doc => doc._id, rec => rec.TemplateDocumentId, @docX => docX.TemplateRecepients)
				.As<TemplateDocument>().FirstOrDefaultAsync();
		}


		//public async Task<bool> UpdateAssignSomeoneDetailsInTemplateDocumentById(TemplateDocument TemplateDocument)
		//{

		//	var filter = Builders<TemplateDocument>.Filter.Eq(x => x._id, TemplateDocument._id);
		//	var updateFilter = Builders<TemplateDocument>.Update;
		//	var update = updateFilter
		//		.Set(x => x.Annotations, TemplateDocument.Annotations)
		//		.Set(x => x.PendingSignList, TemplateDocument.PendingSignList)
		//		.Set(x => x.CompleteSignList, TemplateDocument.CompleteSignList);
		//	var updatedDoc = await Collection.UpdateOneAsync(filter, update, options: new UpdateOptions { IsUpsert = false });
		//	if (updatedDoc != null)
		//	{
		//		if (updatedDoc.ModifiedCount > 0)
		//		{
		//			return true;
		//		}
		//		else
		//		{
		//			return false;
		//		}
		//	}
		//	else
		//	{
		//		return false;
		//	}
		//}
	}
}

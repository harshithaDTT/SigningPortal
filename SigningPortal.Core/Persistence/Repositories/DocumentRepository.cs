using Microsoft.Graph;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using Org.BouncyCastle.Ocsp;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class DocumentRepository : GenericRepository<Document>, IDocumentRepository
	{
		public DocumentRepository(IMongoDbSettings settings) : base(settings)
		{
		}

		public async Task<long> GetOwnDocumentStatusCountAsync(string suid, string accontType, string currentOrgId, string status)
		{
			var filter = Builders<Document>.Filter;
			var ownDocumentCountFilter = filter.Eq(x => x.OwnerID, suid) & filter.Eq(x => x.Status, status)
				& filter.Eq(x => x.AccountType, accontType);
			if (accontType == AccountTypeConstants.Organization && !string.IsNullOrEmpty(currentOrgId))
			{
				ownDocumentCountFilter = ownDocumentCountFilter & filter.Eq(x => x.OrganizationId, currentOrgId);
			}

			return await GetCountAsync(ownDocumentCountFilter);


		}

		public async Task<IList<Document>> OtherDocumentStatusAsync(List<string> list)
		{
			var filter = Builders<Document>.Filter;
			var documentFilter = filter.In(x => x._id, list) & filter.Eq(x => x.Status, DocumentStatusConstants.InProgress);
			//var documentFilter = filter.AnyIn(x=>x.RecepientsIds , list) & filter.Eq(x=>x.Status , DocumentStatusConstants.InProgress);
			return await Collection.Find(documentFilter).ToListAsync();
		}


		public async Task<Document> GetDocumentByRecepientsTempIdAsync(string tempid)
		{
			var filter = Builders<Document>.Filter;
			var docFilter = filter.Eq(x => x._id, tempid) & filter.Eq(x => x.Status, DocumentStatusConstants.InProgress);
			return await Collection.Find(docFilter).FirstOrDefaultAsync();
		}

		public async Task<Document> SaveDocument(Document document)
		{
			await Collection.InsertOneAsync(document);
			return document;
		}

		//removed lookup
		public async Task<Document> GetDocumentById(string id)
		{
			var RecepientCollection = GetCollection<Recepients>("Recepient");
			var filter = Builders<Document>.Filter.Eq(x => x._id, id);

			for (int retry = 0; retry < 3; retry++)
			{
				var result = await Collection.Aggregate()
					.Match(filter)
					.Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt))
					.Lookup<Document, Recepients, Document>(
						RecepientCollection,
						doc => doc._id,
						rec => rec.Tempid,
						@docX => docX.Recepients)
					.As<Document>()
					.FirstOrDefaultAsync();

				if (result != null)
					return result;

				await Task.Delay(100); // wait before retrying
			}

			return null; // fallback if all retries fail
		}

		public async Task<bool> UpdateDocumentById(Document document)
		{

			var filter = Builders<Document>.Filter.Eq(x => x._id, document._id);
			var updateFilter = Builders<Document>.Update;
			var update = updateFilter.Set(x => x.CompleteTime, document.CompleteTime)
				.Set(x => x.Status, document.Status)
				.Set(x => x.UpdatedAt, document.UpdatedAt);
			//.Set(x => x.CompletedDoc, document.CompletedDoc);
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

		//public async Task UpdateRecepientsListInDocumentById(Document document)
		//{
		//    var filter = Builders<Document>.Filter.Eq(x => x._id, document._id);
		//    var updateFilter = Builders<Document>.Update.Set(x => x.RecepientsIds, document.RecepientsIds);
		//    await Collection.UpdateOneAsync(filter, updateFilter, options: new UpdateOptions { IsUpsert = false });
		//}

		//removed lookup
		public async Task<IList<Document>> GetAllDocumentsBySuid(string suid)
		{
			var RecepientCollection = GetCollection<Recepients>("Recepient");
			var filter = Builders<Document>.Filter.Eq(x => x.OwnerID, suid);
			return await Collection.Aggregate()
				.Match(filter)
				.Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt))
				.Lookup<Document, Recepients, Document>(RecepientCollection, doc => doc._id, rec => rec.Tempid, @docX => docX.Recepients)
				.As<Document>()
				.ToListAsync();


		}

		public async Task DeleteDocumentsByIdsAsync(IList<string> idList)
		{
			var filter = Builders<Document>.Filter.In(x => x._id, idList);

			await Collection.DeleteManyAsync(filter);
		}

		public async Task<bool> UpdateDocumentStatusAsync(string tempId, string updatedStatus)
		{
			var filter = Builders<Document>.Filter.Eq(x => x._id, tempId);
			var updateFilter = Builders<Document>.Update.Set(x => x.Status, updatedStatus);

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


		public async Task<IList<Document>> GetPendingDocumentListAsync(IList<string> recepientsId, IList<string> statusList)
		{
			var RecepientCollection = GetCollection<Recepients>("Recepient");
			var filter = Builders<Document>.Filter;
			var dataFilter = filter.In(x => x._id, recepientsId) & filter.In(x => x.Status, statusList);


			var documentData = await Collection.Aggregate()
				.Match(dataFilter)
				.Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt))
				.Lookup<Document, Recepients, Document>(RecepientCollection, doc => doc._id, rec => rec.Tempid, @docX => docX.Recepients)
				.As<Document>()
				.ToListAsync();
			return documentData;
		}

		public async Task<long> UpdateExpiredDocumentStatus()
		{
			var filter = Builders<Document>.Filter;
			var expFilter = filter.Eq(x => x.Status, DocumentStatusConstants.InProgress) & filter.Lte(x => x.ExpireDate, DateTime.UtcNow);
			var updateFilter = Builders<Document>.Update.Set(x => x.Status, DocumentStatusConstants.Expired);
			var result = await Collection.UpdateManyAsync(expFilter, updateFilter, options: new UpdateOptions { IsUpsert = false });
			return result.ModifiedCount;
		}

		public async Task<long> UpdateExpiredDocumentStatusByTempIdList(IList<string> idList)
		{
			var filter = Builders<Document>.Filter;
			var expFilter =
				filter.Eq(x => x.Status, DocumentStatusConstants.InProgress)
				& filter.In(x => x._id, idList)
				& filter.Lte(x => x.ExpireDate, DateTime.UtcNow);
			var updateFilter = Builders<Document>.Update.Set(x => x.Status, DocumentStatusConstants.Expired);
			var result = await Collection.UpdateManyAsync(expFilter, updateFilter, options: new UpdateOptions { IsUpsert = false });

			return result.ModifiedCount;
		}

		public async Task<IList<Document>> GetDocumentByAutoReminder(string reminder)
		{
			var filter = Builders<Document>.Filter;
			var autoFilter = filter.Eq(x => x.AutoReminders, reminder) & filter.Eq(x => x.Status, DocumentStatusConstants.InProgress);
			return await Collection.Find(autoFilter).ToListAsync();
		}

		public async Task<bool> UpdateDocumentBlockedStatusAsync(string id, bool blockedStatus)
		{
			var filter = Builders<Document>.Filter.Eq(x => x._id, id);
			var updateFilter = Builders<Document>.Update
				.Set(x => x.IsDocumentBlocked, blockedStatus)
				.Set(x => x.DocumentBlockedTime, DateTime.UtcNow);
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

		public async Task<bool> UpdateDocumentListBlockedStatusAsync(List<string> ids, bool blockedStatus)
		{
			if (ids == null || ids.Count == 0)
				return false;

			var filter = Builders<Document>.Filter.In(x => x._id, ids);
			var updateFilter = Builders<Document>.Update
				.Set(x => x.IsDocumentBlocked, blockedStatus)
				.Set(x => x.DocumentBlockedTime, DateTime.UtcNow);

			var update = await Collection.UpdateManyAsync(filter, updateFilter, new UpdateOptions { IsUpsert = false });

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


		public async Task<IList<Document>> GetDocumnetListAsync(string suid, string accountType, string organizationId, bool isMultisign)
		{
			var RecepientCollection = GetCollection<Recepients>("Recepient");
			var filter = Builders<Document>.Filter;
			var autoFilter = filter.Eq(x => x.OwnerID, suid) & filter.Eq(x => x.MultiSign, isMultisign) & filter.Eq(x => x.AccountType, accountType);

			if (accountType == AccountTypeConstants.Organization)
			{
				autoFilter = autoFilter & filter.Eq(x => x.OrganizationId, organizationId);
			}

			return await Collection.Aggregate()
				.Match(autoFilter)
				.Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt))
				.Lookup<Document, Recepients, Document>(RecepientCollection, doc => doc._id, rec => rec.Tempid, @docX => docX.Recepients)
				.As<Document>().ToListAsync();
		}

		public async Task<IList<Document>> GetSentDocumnetListAsync(string suid, string accountType, string organizationId, bool isMultisign)
		{
			var RecepientCollection = GetCollection<Recepients>("Recepient");
			var filter = Builders<Document>.Filter;
			var autoFilter = filter.Eq(x => x.OwnerID, suid) & filter.Eq(x => x.MultiSign, isMultisign) & filter.Eq(x => x.AccountType, accountType);

			if (accountType == AccountTypeConstants.Organization)
			{
				autoFilter = autoFilter & filter.Eq(x => x.OrganizationId, organizationId);
			}

			return await Collection.Aggregate()
				.Match(autoFilter)
				.Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt))
				.Lookup<Document, Recepients, Document>(RecepientCollection, doc => doc._id, rec => rec.Tempid, @docX => docX.Recepients)
				.As<Document>().ToListAsync();
		}

		public async Task<Document> GetDocumentByTempIdAsync(string tempid)
		{
			var RecepientCollection = GetCollection<Recepients>("Recepient");
			var filter = Builders<Document>.Filter.Eq(x => x._id, tempid);

			for (int retry = 0; retry < 3; retry++)
			{
				var result = await Collection.Aggregate()
					.Match(filter)
					.Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt))
					.Lookup<Document, Recepients, Document>(
						RecepientCollection,
						doc => doc._id,
						rec => rec.Tempid,
						@docX => docX.Recepients)
					.As<Document>()
					.FirstOrDefaultAsync();

				if (result != null)
					return result;

				await Task.Delay(100); // wait before retrying
			}

			return null; // fallback if all retries fail
		}


		public async Task<IList<Document>> GetDocumentByTempIdList(IList<string> tempIdList, bool isMultisign)
		{
			var RecepientCollection = GetCollection<Recepients>("Recepient");
			var filter = Builders<Document>.Filter;
			var docFilter = filter.In(x => x._id, tempIdList) & filter.Eq(x => x.MultiSign, isMultisign);
			return await Collection.Aggregate()
				.Match(docFilter)
				.Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt))
				.Lookup<Document, Recepients, Document>(RecepientCollection, doc => doc._id, rec => rec.Tempid, @docX => docX.Recepients)
				.As<Document>().ToListAsync();

		}

		public async Task<IList<Document>> GetDocumentByTempIdList(IList<string> tempIdList)
		{
			var RecepientCollection = GetCollection<Recepients>("Recepient");
			var filter = Builders<Document>.Filter;
			var docFilter = filter.In(x => x._id, tempIdList);
			return await Collection.Aggregate()
				.Match(docFilter)
				.Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt))
				.Lookup<Document, Recepients, Document>(RecepientCollection, doc => doc._id, rec => rec.Tempid, @docX => docX.Recepients)
				.As<Document>().ToListAsync();

		}

		public async Task<bool> UpdateArrayInDocumentById(Document document)
		{

			var filter = Builders<Document>.Filter.Eq(x => x._id, document._id);
			var updateFilter = Builders<Document>.Update;
			var update = updateFilter
				.Set(x => x.PendingSignList, document.PendingSignList)
				.Set(x => x.CompleteSignList, document.CompleteSignList)
				.Set(x => x.UpdatedAt, document.UpdatedAt);
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

		public async Task<Document> GetDocumentDetailsByRecepientsTempIdAsync(string tempid)
		{
			var RecepientCollection = GetCollection<Recepients>("Recepient");
			var filter = Builders<Document>.Filter.Eq(x => x._id, tempid);

			for (int retry = 0; retry < 3; retry++)
			{
				var result = await Collection.Aggregate()
					.Match(filter)
					.Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt))
					.Lookup<Document, Recepients, Document>(
						RecepientCollection,
						doc => doc._id,
						rec => rec.Tempid,
						@docX => docX.Recepients)
					.As<Document>()
					.FirstOrDefaultAsync();

				if (result != null)
					return result;

				await Task.Delay(100); // wait before retrying
			}

			return null; // fallback if all retries fail
		}


		public async Task<bool> UpdateAssignSomeoneDetailsInDocumentById(Document document)
		{

			var filter = Builders<Document>.Filter.Eq(x => x._id, document._id);
			var updateFilter = Builders<Document>.Update;
			var update = updateFilter
				.Set(x => x.Annotations, document.Annotations)
				.Set(x => x.PendingSignList, document.PendingSignList)
				.Set(x => x.CompleteSignList, document.CompleteSignList);
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

		public async Task<(IList<Document> Documents, long TotalCount)> GetPaginatedDocumentListAsync(
			string suid, string accountType, string organizationId, bool isMultisign, int pageNumber, int pageSize)
		{
			var RecepientCollection = GetCollection<Recepients>("Recepient");
			var filter = Builders<Document>.Filter;

			var autoFilter = filter.Eq(x => x.OwnerID, suid) &
							 filter.Eq(x => x.MultiSign, isMultisign) &
							 filter.Eq(x => x.AccountType, accountType);

			if (accountType == AccountTypeConstants.Organization)
			{
				autoFilter &= filter.Eq(x => x.OrganizationId, organizationId);
			}

			// Total count without pagination
			var totalCount = await Collection.CountDocumentsAsync(autoFilter);

			// Paginated result
			var documents = await Collection.Aggregate()
				.Match(autoFilter)
				.Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt))
				.Lookup<Document, Recepients, Document>(RecepientCollection, doc => doc._id, rec => rec.Tempid, docX => docX.Recepients)
				.Skip((pageNumber - 1) * pageSize)
				.Limit(pageSize)
				.As<Document>()
				.ToListAsync();

			return (documents, totalCount);
		}

		public async Task<(IList<Document> Documents, long TotalCount)> GetPaginatedSentDocumentListAsync(
			string suid, string accountType, string organizationId, bool isMultisign, int pageNumber, int pageSize)
		{
			var RecepientCollection = GetCollection<Recepients>("Recepient");

			var filter = Builders<Document>.Filter;
			var autoFilter = filter.Eq(x => x.OwnerID, suid) &
							 filter.Eq(x => x.MultiSign, isMultisign) &
							 filter.Eq(x => x.AccountType, accountType);

			if (accountType == AccountTypeConstants.Organization)
			{
				autoFilter &= filter.Eq(x => x.OrganizationId, organizationId);
			}

			// Total document count before applying pagination
			var totalCount = await Collection.CountDocumentsAsync(autoFilter);

			// Paginated documents
			var documents = await Collection.Aggregate()
				.Match(autoFilter)
				.Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt))
				.Skip((pageNumber - 1) * pageSize)
				.Limit(pageSize)
				.Lookup<Document, Recepients, Document>(RecepientCollection, doc => doc._id, rec => rec.Tempid, docX => docX.Recepients)
				.As<Document>()
				.ToListAsync();

			return (documents, totalCount);
		}

		public async Task<IList<Document>> GetDocumnetListByFilterAsync(string suid, string accountType, string organizationId,
			bool isMultisign, DocumentListFilterDTO documentListFilter)
		{
			var RecepientCollection = GetCollection<Recepients>("Recepient");

			var filter = Builders<Document>.Filter;
			var autoFilter = filter.Eq(x => x.OwnerID, suid)
				& filter.Eq(x => x.MultiSign, isMultisign)
				& filter.Eq(x => x.AccountType, accountType);

			if (accountType == AccountTypeConstants.Organization)
			{
				autoFilter &= filter.Eq(x => x.OrganizationId, organizationId);
			}

			// 📌 Filter by DocumentStatus (Order Type)
			if (!string.IsNullOrEmpty(documentListFilter.DocumentStatus))
			{
				switch (documentListFilter.DocumentStatus)
				{
					case "All":
						break;

					default:
						autoFilter &= filter.Eq(x => x.Status, documentListFilter.DocumentStatus);
						break;
				}
			}

            bool applyLatest50 = false;

            // 📌 Filter by DocumentFilter (Order Date)
            if (!string.IsNullOrEmpty(documentListFilter.DocumentFilter))
			{
				var now = DateTime.UtcNow;

				switch (documentListFilter.DocumentFilter.ToLower())
				{
					case "last30days":
						autoFilter &= filter.Gte(x => x.CreatedAt, now.AddDays(-30));
						break;

					case "last90days":
						autoFilter &= filter.Gte(x => x.CreatedAt, now.AddDays(-90));
						break;

                    case "latest50":
                        applyLatest50 = true; // we'll apply Limit later
                        break;

                    case "All":
						break;

					default:
						if (int.TryParse(documentListFilter.DocumentFilter, out int year))
						{
							var from = new DateTime(year, 1, 1);
							var to = from.AddYears(1).AddTicks(-1);
							autoFilter &= filter.Gte(x => x.CreatedAt, from) & filter.Lte(x => x.CreatedAt, to);
						}
						break;
				}
			}

			var pipeline = Collection.Aggregate()
				.Match(autoFilter)
				.Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt))
				.Lookup<Document, Recepients, Document>(
					RecepientCollection,
					doc => doc._id,
					rec => rec.Tempid,
					docX => docX.Recepients
				);

			// 📌 Filter by SigningStatus inside Lookup results if provided
			if (!string.IsNullOrEmpty(documentListFilter.SigningStatus))
			{
				switch (documentListFilter.SigningStatus)
				{
					case "Signed":
						pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
							x => x.Recepients,
							r => r.Status == RecepientStatus.Signed && r.Suid == suid
						));

						break;

					case "Need to sign":
						pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
							   x => x.Recepients,
							   r => r.Status == RecepientStatus.NeedToSign && r.Suid == suid
						 ));
						break;
					case "Rejected":
						pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => r.Status == RecepientStatus.Rejected && r.Suid == suid
						));
						break;
					case "Failed":
						pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => (r.Status == RecepientStatus.PinFailed || r.Status == RecepientStatus.Failed)
								&& r.Suid == suid
						));
						break;
					case "In Progress":
						pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => (r.Status == RecepientStatus.Signing || r.Status == RecepientStatus.SigningInProgress)
								&& r.Suid == suid
						));
						break;
					case "Signatures_Pending":
						pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => (r.Status == RecepientStatus.Signing || r.Status == RecepientStatus.SigningInProgress)
								&& r.Suid == suid
						));
						break;
					case "All":
						break;
				}

			}

            if (applyLatest50)
            {
                pipeline = pipeline.Limit(50);
            }

            return await pipeline
				.As<Document>()
				.ToListAsync();
		}

		public async Task<IList<Document>> GetSentDocumnetListByFilterAsync(string suid, string accountType, string organizationId,
			bool isMultisign, DocumentListFilterDTO documentListFilter)
		{
			var RecepientCollection = GetCollection<Recepients>("Recepient");
			var filter = Builders<Document>.Filter;
			var autoFilter = filter.Eq(x => x.OwnerID, suid) & filter.Eq(x => x.MultiSign, isMultisign) & filter.Eq(x => x.AccountType, accountType);

			if (accountType == AccountTypeConstants.Organization)
			{
				autoFilter = autoFilter & filter.Eq(x => x.OrganizationId, organizationId);
			}

			// 📌 Filter by DocumentStatus (Order Type)
			if (!string.IsNullOrEmpty(documentListFilter.DocumentStatus))
			{
				switch (documentListFilter.DocumentStatus)
				{

					case "All":
						break;

					default:
						autoFilter &= filter.Eq(x => x.Status, documentListFilter.DocumentStatus);
						break;
				}
			}

            bool applyLatest50 = false;

            // 📌 Filter by DocumentFilter (Order Date)
            if (!string.IsNullOrEmpty(documentListFilter.DocumentFilter))
			{
				var now = DateTime.UtcNow;

				switch (documentListFilter.DocumentFilter.ToLower())
				{
					case "last30days":
						autoFilter &= filter.Gte(x => x.CreatedAt, now.AddDays(-30));
						break;

					case "last90days":
						autoFilter &= filter.Gte(x => x.CreatedAt, now.AddDays(-90));
						break;

                    case "latest50":
                        applyLatest50 = true; // we'll apply Limit later
                        break;

                    case "All":
                        break;

                    default:
						if (int.TryParse(documentListFilter.DocumentFilter, out int year))
						{
							var from = new DateTime(year, 1, 1);
							var to = from.AddYears(1).AddTicks(-1);
							autoFilter &= filter.Gte(x => x.CreatedAt, from) & filter.Lte(x => x.CreatedAt, to);
						}
						break;
				}
			}

			var pipeline = Collection.Aggregate()
				.Match(autoFilter)
				.Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt))
				.Lookup<Document, Recepients, Document>(
					RecepientCollection,
					doc => doc._id,
					rec => rec.Tempid,
					docX => docX.Recepients
				);

			// 📌 Filter by SigningStatus inside Lookup results if provided
			if (!string.IsNullOrEmpty(documentListFilter.SigningStatus))
			{
				switch (documentListFilter.SigningStatus)
				{
					case "Signed":
						pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => r.Status == RecepientStatus.Signed && r.Suid == suid
						));
						break;

					case "Need to sign":
						pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => r.Status == RecepientStatus.NeedToSign && r.Suid == suid
						));
						break;
					case "Rejected":
						pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => r.Status == RecepientStatus.Rejected && r.Suid == suid
						));
						break;
					case "Failed":
						pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => (r.Status == RecepientStatus.PinFailed || r.Status == RecepientStatus.Failed)
								&& r.Suid == suid
						));
						break;
					case "In Progress":
						pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => (r.Status == RecepientStatus.Signing || r.Status == RecepientStatus.SigningInProgress)
								&& r.Suid == suid
						));
						break;
					case "Signatures_Pending":
						pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => (r.Status == RecepientStatus.Signing || r.Status == RecepientStatus.SigningInProgress)
								&& r.Suid == suid
						));
						break;
					case "All":
						break;
				}
			}

            if (applyLatest50)
            {
                pipeline = pipeline.Limit(50);
            }

            return await pipeline
				.As<Document>()
				.ToListAsync();
		}

		public async Task<IList<Document>> GetDocumentByTempIdListByFilter(string suid, IList<string> tempIdList, bool isMultisign,
			DocumentListFilterDTO documentListFilter)
		{
			var RecepientCollection = GetCollection<Recepients>("Recepient");
			var filter = Builders<Document>.Filter;
			var autoFilter = filter.In(x => x._id, tempIdList) & filter.Eq(x => x.MultiSign, isMultisign);

			// 📌 Filter by DocumentStatus (Order Type)
			if (!string.IsNullOrEmpty(documentListFilter.DocumentStatus))
			{
				switch (documentListFilter.DocumentStatus)
				{
					case "All":
						break;

					default:
						autoFilter &= filter.Eq(x => x.Status, documentListFilter.DocumentStatus);
						break;
				}
			}

			// 📌 Filter by DocumentFilter (Order Date)
			if (!string.IsNullOrEmpty(documentListFilter.DocumentFilter))
			{
				var now = DateTime.UtcNow;

				switch (documentListFilter.DocumentFilter.ToLower())
				{
					case "last30days":
						autoFilter &= filter.Gte(x => x.CreatedAt, now.AddDays(-30));
						break;

					case "last90days":
						autoFilter &= filter.Gte(x => x.CreatedAt, now.AddDays(-90));
						break;

                    case "All":
                        break;

                    default:
						if (int.TryParse(documentListFilter.DocumentFilter, out int year))
						{
							var from = new DateTime(year, 1, 1);
							var to = from.AddYears(1).AddTicks(-1);
							autoFilter &= filter.Gte(x => x.CreatedAt, from) & filter.Lte(x => x.CreatedAt, to);
						}
						break;
				}
			}

			var pipeline = Collection.Aggregate()
				.Match(autoFilter)
				.Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt))
				.Lookup<Document, Recepients, Document>(
					RecepientCollection,
					doc => doc._id,
					rec => rec.Tempid,
					docX => docX.Recepients
				);

			// 📌 Filter by SigningStatus inside Lookup results if provided
			if (!string.IsNullOrEmpty(documentListFilter.SigningStatus))
			{
				switch (documentListFilter.SigningStatus)
				{
					case "Signed":
						if (documentListFilter.IsReceivedDocumentList)
						{
							pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => r.Status == RecepientStatus.Signed && r.Suid == suid
							));
						}
						else
						{
							pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => r.Status == RecepientStatus.Signed &&
								r.AlternateSignatories.Any(a => a.suid == suid)
							));
						}
						break;

					case "Need to sign":
						if (documentListFilter.IsReceivedDocumentList)
						{
							pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => r.Status == RecepientStatus.NeedToSign && r.Suid == suid
							));
						}
						else
						{
							pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => r.Status == RecepientStatus.NeedToSign &&
								r.AlternateSignatories.Any(a => a.suid == suid)
							));
						}
						break;
					case "Rejected":
						if (documentListFilter.IsReceivedDocumentList)
						{
							pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => r.Status == RecepientStatus.Rejected && r.Suid == suid
							));
						}
						else
						{
							pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => r.Status == RecepientStatus.Rejected &&
								r.AlternateSignatories.Any(a => a.suid == suid)
							));
						}
						break;
                    case "Waiting_for_Others":
                        if (documentListFilter.IsReceivedDocumentList)
                        {
                            pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
                                x => x.Recepients,
                                r => r.Status == RecepientStatus.WaitingForOthers && r.Suid == suid
                            ));
                        }
                        else
                        {
                            pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
                                x => x.Recepients,
                                r => r.Status == RecepientStatus.WaitingForOthers &&
                                r.AlternateSignatories.Any(a => a.suid == suid)
                            ));
                        }
                        break;
                    case "Failed":
						if (documentListFilter.IsReceivedDocumentList)
						{
							pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => (r.Status == RecepientStatus.PinFailed || r.Status == RecepientStatus.Failed)
								&& r.Suid == suid
							));
						}
						else
						{
							pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => (r.Status == RecepientStatus.PinFailed || r.Status == RecepientStatus.Failed)
								&& r.AlternateSignatories.Any(a => a.suid == suid)
							));
						}
						break;
					case "Signing_in_Progress":
						if (documentListFilter.IsReceivedDocumentList)
						{
							pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => (r.Status == RecepientStatus.Signing || r.Status == RecepientStatus.SigningInProgress)
								&& r.Suid == suid
							));
						}
						else
						{
							pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => (r.Status == RecepientStatus.Signing || r.Status == RecepientStatus.SigningInProgress)
								&& r.AlternateSignatories.Any(a => a.suid == suid)
							));
						}
						break;
					case "Signatures_Pending":
						if (documentListFilter.IsReceivedDocumentList)
						{
							pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => (r.Status == RecepientStatus.Signing || r.Status == RecepientStatus.SigningInProgress)
								&& r.Suid == suid
							));
						}
						else
						{
							pipeline = pipeline.Match(Builders<Document>.Filter.ElemMatch(
								x => x.Recepients,
								r => (r.Status == RecepientStatus.Signing || r.Status == RecepientStatus.SigningInProgress)
								&& r.AlternateSignatories.Any(a => a.suid == suid)
							));
						}
						break;
					case "All":
						break;
				}

			}

			return await pipeline
				.As<Document>()
				.ToListAsync();

		}

        //     public async Task<(IList<Document> Documents, long TotalCount)> GetPaginatedDocumnetListByFilterAsync(string suid, 
        //string accountType, string organizationId, bool isMultisign, DocumentListFilterDTO documentListFilter,
        //int pageNumber, int pageSize, bool isPagination)
        //     {
        //         var RecepientCollection = GetCollection<Recepients>("Recepient");

        //         var filter = Builders<Document>.Filter;
        //         var autoFilter = filter.Eq(x => x.OwnerID, suid)
        //             & filter.Eq(x => x.MultiSign, isMultisign)
        //             & filter.Eq(x => x.AccountType, accountType);

        //         if (accountType == AccountTypeConstants.Organization)
        //         {
        //             autoFilter &= filter.Eq(x => x.OrganizationId, organizationId);
        //         }

        //         // 📌 Filter by DocumentStatus
        //         if (!string.IsNullOrEmpty(documentListFilter.DocumentStatus) && documentListFilter.DocumentStatus != "All")
        //         {
        //             autoFilter &= filter.Eq(x => x.Status, documentListFilter.DocumentStatus);
        //         }

        //         bool applyLatest50 = false;
        //         bool applyLatest30 = false;

        //         // 📌 Filter by DocumentFilter
        //         if (!string.IsNullOrEmpty(documentListFilter.DocumentFilter))
        //         {
        //             var now = DateTime.UtcNow;

        //             switch (documentListFilter.DocumentFilter.ToLower())
        //             {
        //                 case "last30days":
        //                     autoFilter &= filter.Gte(x => x.CreatedAt, now.AddDays(-30));
        //                     break;

        //                 case "last90days":
        //                     autoFilter &= filter.Gte(x => x.CreatedAt, now.AddDays(-90));
        //                     break;

        //                 case "latest50":
        //                     applyLatest50 = true;
        //                     break;

        //                 case "latest30":
        //                     applyLatest30 = true;
        //                     break;

        //                 default:
        //                     if (int.TryParse(documentListFilter.DocumentFilter, out int year))
        //                     {
        //                         var from = new DateTime(year, 1, 1);
        //                         var to = from.AddYears(1).AddTicks(-1);
        //                         autoFilter &= filter.Gte(x => x.CreatedAt, from) & filter.Lte(x => x.CreatedAt, to);
        //                     }
        //                     break;
        //             }
        //         }

        //         // Signing status filter
        //         FilterDefinition<Document> signingStatusFilter = null;
        //         if (!string.IsNullOrEmpty(documentListFilter.SigningStatus) && documentListFilter.SigningStatus != "All")
        //         {
        //             signingStatusFilter = documentListFilter.SigningStatus switch
        //             {
        //                 "Signed" => Builders<Document>.Filter.ElemMatch(x => x.Recepients, r => r.Status == RecepientStatus.Signed && r.Suid == suid),
        //                 "Need to sign" => Builders<Document>.Filter.ElemMatch(x => x.Recepients, r => r.Status == RecepientStatus.NeedToSign && r.Suid == suid),
        //                 "Rejected" => Builders<Document>.Filter.ElemMatch(x => x.Recepients, r => r.Status == RecepientStatus.Rejected && r.Suid == suid),
        //                 "Failed" => Builders<Document>.Filter.ElemMatch(x => x.Recepients, r => (r.Status == RecepientStatus.PinFailed || r.Status == RecepientStatus.Failed) && r.Suid == suid),
        //                 "In Progress" => Builders<Document>.Filter.ElemMatch(x => x.Recepients, r => (r.Status == RecepientStatus.Signing || r.Status == RecepientStatus.SigningInProgress) && r.Suid == suid),
        //                 _ => null
        //             };
        //         }

        //         var skip = (pageNumber - 1) * pageSize;

        //         if (applyLatest50 || applyLatest30)
        //         {
        //             // Limit first, then paginate
        //             int limitCount = applyLatest50 ? 50 : 30;

        //             var limitedQuery = Collection
        //                 .Find(autoFilter)
        //                 .SortByDescending(x => x.CreatedAt)
        //                 .Limit(limitCount);

        //             var limitedDocs = await limitedQuery.ToListAsync();

        //             if (signingStatusFilter != null)
        //             {
        //                 limitedDocs = limitedDocs.Where(doc =>
        //                     doc.Recepients != null && doc.Recepients.Any(rec =>
        //                         rec.Suid == suid && (
        //                             (documentListFilter.SigningStatus == "Signed" && rec.Status == RecepientStatus.Signed) ||
        //                             (documentListFilter.SigningStatus == "Need to sign" && rec.Status == RecepientStatus.NeedToSign) ||
        //                             (documentListFilter.SigningStatus == "Rejected" && rec.Status == RecepientStatus.Rejected) ||
        //                             (documentListFilter.SigningStatus == "Failed" && (rec.Status == RecepientStatus.Failed || rec.Status == RecepientStatus.PinFailed)) ||
        //                             (documentListFilter.SigningStatus == "In Progress" && (rec.Status == RecepientStatus.Signing || rec.Status == RecepientStatus.SigningInProgress))
        //                         )
        //                     )
        //                 ).ToList();
        //             }

        //             var paged = limitedDocs.Skip(skip).Take(pageSize).ToList();
        //             return (paged, limitedDocs.Count);
        //         }
        //         else
        //         {
        //             var pipeline = Collection.Aggregate()
        //                 .Match(autoFilter)
        //                 .Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt))
        //                 .Lookup<Document, Recepients, Document>(
        //                     RecepientCollection,
        //                     doc => doc._id,
        //                     rec => rec.Tempid,
        //                     docX => docX.Recepients
        //                 );

        //             if (signingStatusFilter != null)
        //             {
        //                 pipeline = pipeline.Match(signingStatusFilter);
        //             }

        //             var totalCount = await Collection.CountDocumentsAsync(autoFilter & 
        //		(signingStatusFilter ?? FilterDefinition<Document>.Empty));

        //             if (isPagination)
        //                 pipeline = pipeline.Skip(skip).Limit(pageSize);

        //             var documents = await pipeline.As<Document>().ToListAsync();
        //             return (documents, totalCount);
        //         }
        //     }

        /// <summary>

        /// </summary>
        /// <param name="suid"></param>
        /// <param name="accountType"></param>
        /// <param name="organizationId"></param>
        /// <param name="isMultisign"></param>
        /// <param name="documentListFilter"></param>
        /// <param name="pageNumber"></param>
        /// <param name="pageSize"></param>
        /// <param name="isPagination"></param>
        /// <returns></returns>


        //public async Task<(IList<Document> Documents, long TotalCount)> GetPaginatedDocumnetListByFilterAsync(string suid, string accountType, string organizationId,
        //	bool isMultisign, DocumentListFilterDTO documentListFilter, int pageNumber, int pageSize, bool isPagination)
        //{
        //	var RecepientCollection = GetCollection<Recepients>("Recepient");

        //	var filter = Builders<Document>.Filter;
        //	var autoFilter = filter.Eq(x => x.OwnerID, suid)
        //		& filter.Eq(x => x.MultiSign, isMultisign)
        //		& filter.Eq(x => x.AccountType, accountType);

        //	if (accountType == AccountTypeConstants.Organization)
        //	{
        //		autoFilter &= filter.Eq(x => x.OrganizationId, organizationId);
        //	}

        //	// 📌 Filter by DocumentStatus (Order Type)
        //	if (!string.IsNullOrEmpty(documentListFilter.DocumentStatus))
        //	{
        //		switch (documentListFilter.DocumentStatus)
        //		{
        //			case "All":
        //				break;

        //			default:
        //				autoFilter &= filter.Eq(x => x.Status, documentListFilter.DocumentStatus);
        //				break;
        //		}
        //	}

        //	bool applyLatest50 = false;
        //	bool applyLatest30 = false;

        //	// 📌 Filter by DocumentFilter (Order Date)
        //	if (!string.IsNullOrEmpty(documentListFilter.DocumentFilter))
        //	{
        //		var now = DateTime.UtcNow;

        //		switch (documentListFilter.DocumentFilter.ToLower())
        //		{
        //			case "last30days":
        //				autoFilter &= filter.Gte(x => x.CreatedAt, now.AddDays(-30));
        //				break;

        //			case "last90days":
        //				autoFilter &= filter.Gte(x => x.CreatedAt, now.AddDays(-90));
        //				break;

        //			case "latest50":
        //				applyLatest50 = true; // we'll apply Limit later
        //				break;

        //			case "latest30":
        //				applyLatest30 = true; // we'll apply Limit later
        //				break;

        //			case "All":
        //				break;

        //			default:
        //				if (int.TryParse(documentListFilter.DocumentFilter, out int year))
        //				{
        //					var from = new DateTime(year, 1, 1);
        //					var to = from.AddYears(1).AddTicks(-1);
        //					autoFilter &= filter.Gte(x => x.CreatedAt, from) & filter.Lte(x => x.CreatedAt, to);
        //				}
        //				break;
        //		}
        //	}

        //	var skip = (pageNumber - 1) * pageSize;

        //	var pipeline = Collection.Aggregate()
        //		.Match(autoFilter)
        //		.Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt))
        //		.Lookup<Document, Recepients, Document>(
        //			RecepientCollection,
        //			doc => doc._id,
        //			rec => rec.Tempid,
        //			docX => docX.Recepients
        //		);

        //	// Signing status filter
        //	if (!string.IsNullOrEmpty(documentListFilter.SigningStatus) && documentListFilter.SigningStatus != "All")
        //	{
        //		FilterDefinition<Document> signingStatusFilter = null;

        //		switch (documentListFilter.SigningStatus)
        //		{
        //			case "Signed":
        //				signingStatusFilter = Builders<Document>.Filter.ElemMatch(
        //					x => x.Recepients,
        //					r => r.Status == RecepientStatus.Signed && r.Suid == suid
        //				);
        //				break;

        //			case "Need to sign":
        //				signingStatusFilter = Builders<Document>.Filter.ElemMatch(
        //					x => x.Recepients,
        //					r => r.Status == RecepientStatus.NeedToSign && r.Suid == suid
        //				);
        //				break;

        //			case "Rejected":
        //				signingStatusFilter = Builders<Document>.Filter.ElemMatch(
        //					x => x.Recepients,
        //					r => r.Status == RecepientStatus.Rejected && r.Suid == suid
        //				);
        //				break;

        //			case "Failed":
        //				signingStatusFilter = Builders<Document>.Filter.ElemMatch(
        //					x => x.Recepients,
        //					r => (r.Status == RecepientStatus.PinFailed || r.Status == RecepientStatus.Failed) && r.Suid == suid
        //				);
        //				break;

        //			case "In Progress":
        //				signingStatusFilter = Builders<Document>.Filter.ElemMatch(
        //					x => x.Recepients,
        //					r => (r.Status == RecepientStatus.Signing || r.Status == RecepientStatus.SigningInProgress) && r.Suid == suid
        //				);
        //				break;
        //		}

        //		if (signingStatusFilter != null)
        //		{
        //			pipeline = pipeline.Match(signingStatusFilter);
        //		}
        //	}

        //          //var countPipeline = pipeline; // Or clone appropriately if pipeline is a mutable definition
        //          var totalCount = (await pipeline.ToListAsync()).Count;

        //          // Apply limits
        //          if (applyLatest50)
        //          {
        //              pipeline = pipeline.Limit(50);
        //              totalCount = Math.Min(totalCount, 50);
        //          }
        //          else if (applyLatest30)
        //          {
        //              pipeline = pipeline.Limit(30);
        //              totalCount = Math.Min(totalCount, 30);
        //          }

        //          if (isPagination)
        //          {
        //              pipeline = pipeline.Skip(skip).Limit(pageSize);
        //          }

        //          // Fetch final documents
        //          var documents = await pipeline.As<Document>().ToListAsync();

        //          return (documents, totalCount);
        //      }

        public async Task<(IList<Document> Documents, long TotalCount)> GetPaginatedDocumnetListByFilterAsync(
			string suid,
			string accountType,
			string organizationId,
			bool isMultisign,
			DocumentListFilterDTO documentListFilter,
			int pageNumber,
			int pageSize,
			bool isPagination,
			string searchTerm = null) 
        {
            var RecepientCollection = GetCollection<Recepients>("Recepient");

            var filter = Builders<Document>.Filter;
            var autoFilter = filter.Eq(x => x.OwnerID, suid)
                & filter.Eq(x => x.MultiSign, isMultisign)
                & filter.Eq(x => x.AccountType, accountType);

            if (accountType == AccountTypeConstants.Organization)
            {
                autoFilter &= filter.Eq(x => x.OrganizationId, organizationId);
            }

            // 📌 Filter by DocumentStatus (Order Type)
            if (!string.IsNullOrEmpty(documentListFilter.DocumentStatus) && documentListFilter.DocumentStatus != "All")
            {
                autoFilter &= filter.Eq(x => x.Status, documentListFilter.DocumentStatus);
            }

            FilterDefinition<Document> searchFilter = null;
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var lowerSearchTerm = searchTerm.ToLower();
                var regex = new BsonRegularExpression(new Regex(Regex.Escape(lowerSearchTerm), RegexOptions.IgnoreCase));

                searchFilter = filter.Regex(x => x.DocumentName, regex) |
                               filter.Regex(x => x.CreatedAt, regex) |
                               filter.Regex(x => x.ExpireDate, regex);
            }

            var pipeline = Collection.Aggregate();

            var countPipeline = Collection.Aggregate();

            if (searchFilter != null)
            {
                pipeline = pipeline.Match(searchFilter);
                countPipeline = countPipeline.Match(searchFilter);
            }

            pipeline = pipeline.Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt));

            pipeline = pipeline.Lookup<Document, Recepients, Document>(
                RecepientCollection,
                doc => doc._id,
                rec => rec.Tempid,
                docX => docX.Recepients
            );
            countPipeline = countPipeline.Lookup<Document, Recepients, Document>(
               RecepientCollection,
               doc => doc._id,
               rec => rec.Tempid,
               docX => docX.Recepients
            );

            if (!string.IsNullOrEmpty(documentListFilter.SigningStatus) && documentListFilter.SigningStatus != "All")
            {
                FilterDefinition<Document> signingStatusFilter = null;
                switch (documentListFilter.SigningStatus)
                {
                    case "Signed":
                        signingStatusFilter = Builders<Document>.Filter.ElemMatch(x => x.Recepients, 
							r => r.Status == RecepientStatus.Signed && r.Suid == suid);
                        break;
                    case "Need to sign":
                        signingStatusFilter = Builders<Document>.Filter.ElemMatch(x => x.Recepients, 
							r => r.Status == RecepientStatus.NeedToSign && r.Suid == suid);
                        break;
                    case "Rejected":
                        signingStatusFilter = Builders<Document>.Filter.ElemMatch(x => x.Recepients, 
							r => r.Status == RecepientStatus.Rejected && r.Suid == suid);
                        break;
					case "Waiting_for_Others":
                        signingStatusFilter = Builders<Document>.Filter.ElemMatch(x => x.Recepients, 
							r => r.Status == RecepientStatus.WaitingForOthers && r.Suid == suid);
                        break;
                    case "Failed":
                        signingStatusFilter = Builders<Document>.Filter.ElemMatch(x => x.Recepients, 
							r => (r.Status == RecepientStatus.PinFailed || r.Status == RecepientStatus.Failed) && r.Suid == suid);
                        break;
                    case "Signing_in_Progress":
                        signingStatusFilter = Builders<Document>.Filter.ElemMatch(x => x.Recepients,
							r => (r.Status == RecepientStatus.Signing || r.Status == RecepientStatus.SigningInProgress) && r.Suid == suid);
                        break;
                    case "Signatures_Pending":
                        signingStatusFilter = Builders<Document>.Filter.ElemMatch(x => x.Recepients,
							r => (r.Status == RecepientStatus.Signing || r.Status == RecepientStatus.SigningInProgress) && r.Suid == suid);
                        break;
                }

                if (signingStatusFilter != null)
                {
                    pipeline = pipeline.Match(signingStatusFilter);
                    countPipeline = countPipeline.Match(signingStatusFilter);
                }
            }

            int? limitValue = null;
            if (documentListFilter.DocumentFilter?.ToLower() == "latest50")
            {
                limitValue = 50;
            }
            else if (documentListFilter.DocumentFilter?.ToLower() == "latest30")
            {
                limitValue = 30;
            }


            if (!string.IsNullOrEmpty(documentListFilter.DocumentFilter))
            {
                var now = DateTime.UtcNow;

                switch (documentListFilter.DocumentFilter.ToLower())
                {
                    case "last30days":
                        autoFilter &= filter.Gte(x => x.CreatedAt, now.AddDays(-30));
                        break;

                    case "last90days":
                        autoFilter &= filter.Gte(x => x.CreatedAt, now.AddDays(-90));
                        break;

                    case "All":
                        break;

                    default:
                        if (int.TryParse(documentListFilter.DocumentFilter, out int year))
                        {
                            var from = new DateTime(year, 1, 1);
                            var to = from.AddYears(1).AddTicks(-1);
                            autoFilter &= filter.Gte(x => x.CreatedAt, from) & filter.Lte(x => x.CreatedAt, to);
                        }
                        break;
                }
            }

            pipeline = pipeline.Match(autoFilter);
            countPipeline = countPipeline.Match(autoFilter);

            long totalCount = 0;

            var countResult = await countPipeline
                .Count()
                .FirstOrDefaultAsync();

            if (countResult != null)
            {
                totalCount = countResult.Count;
            }


            if (limitValue.HasValue)
            {
                pipeline = pipeline.Limit(limitValue.Value);
                totalCount = Math.Min(totalCount, limitValue.Value);
            }

            if (isPagination)
            {
                var skip = (pageNumber - 1) * pageSize;
                pipeline = pipeline.Skip(skip).Limit(pageSize);
            }

            var documents = await pipeline.As<Document>().ToListAsync();

            return (documents, totalCount);
        }

        //public async Task<(IList<Document> Documents, long TotalCount)> GetPaginatedSentDocumnetListByFilterAsync(string suid, string accountType, string organizationId,
        //          bool isMultisign, DocumentListFilterDTO documentListFilter, int pageNumber, int pageSize, bool isPagination)
        //      {
        //          var RecepientCollection = GetCollection<Recepients>("Recepient");
        //          var filter = Builders<Document>.Filter;
        //          var autoFilter = filter.Eq(x => x.OwnerID, suid) & filter.Eq(x => x.MultiSign, isMultisign) & filter.Eq(x => x.AccountType, accountType);

        //          if (accountType == AccountTypeConstants.Organization)
        //          {
        //              autoFilter = autoFilter & filter.Eq(x => x.OrganizationId, organizationId);
        //          }

        //          // 📌 Filter by DocumentStatus (Order Type)
        //          if (!string.IsNullOrEmpty(documentListFilter.DocumentStatus))
        //          {
        //              switch (documentListFilter.DocumentStatus)
        //              {

        //                  case "All":
        //                      break;

        //                  default:
        //                      autoFilter &= filter.Eq(x => x.Status, documentListFilter.DocumentStatus);
        //                      break;
        //              }
        //          }

        //          bool applyLatest50 = false;
        //          bool applyLatest30 = false;

        //          // 📌 Filter by DocumentFilter (Order Date)
        //          if (!string.IsNullOrEmpty(documentListFilter.DocumentFilter))
        //          {
        //              var now = DateTime.UtcNow;

        //              switch (documentListFilter.DocumentFilter.ToLower())
        //              {
        //                  case "last30days":
        //                      autoFilter &= filter.Gte(x => x.CreatedAt, now.AddDays(-30));
        //                      break;

        //                  case "last90days":
        //                      autoFilter &= filter.Gte(x => x.CreatedAt, now.AddDays(-90));
        //                      break;

        //                  case "latest50":
        //                      applyLatest50 = true; // we'll apply Limit later
        //                      break;

        //                  case "latest30":
        //                      applyLatest30 = true; // we'll apply Limit later
        //                      break;

        //                  case "All":
        //                      break;

        //                  default:
        //                      if (int.TryParse(documentListFilter.DocumentFilter, out int year))
        //                      {
        //                          var from = new DateTime(year, 1, 1);
        //                          var to = from.AddYears(1).AddTicks(-1);
        //                          autoFilter &= filter.Gte(x => x.CreatedAt, from) & filter.Lte(x => x.CreatedAt, to);
        //                      }
        //                      break;
        //              }
        //          }

        //          var skip = (pageNumber - 1) * pageSize;

        //          var pipeline = Collection.Aggregate()
        //              .Match(autoFilter)
        //              .Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt))
        //              .Lookup<Document, Recepients, Document>(
        //                  RecepientCollection,
        //                  doc => doc._id,
        //                  rec => rec.Tempid,
        //                  docX => docX.Recepients
        //              );

        //          // Signing status filter
        //          if (!string.IsNullOrEmpty(documentListFilter.SigningStatus) && documentListFilter.SigningStatus != "All")
        //          {
        //              FilterDefinition<Document> signingStatusFilter = null;

        //              switch (documentListFilter.SigningStatus)
        //              {
        //                  case "Signed":
        //                      signingStatusFilter = Builders<Document>.Filter.ElemMatch(
        //                          x => x.Recepients,
        //                          r => r.Status == RecepientStatus.Signed && r.Suid == suid
        //                      );
        //                      break;

        //                  case "Need to sign":
        //                      signingStatusFilter = Builders<Document>.Filter.ElemMatch(
        //                          x => x.Recepients,
        //                          r => r.Status == RecepientStatus.NeedToSign && r.Suid == suid
        //                      );
        //                      break;

        //                  case "Rejected":
        //                      signingStatusFilter = Builders<Document>.Filter.ElemMatch(
        //                          x => x.Recepients,
        //                          r => r.Status == RecepientStatus.Rejected && r.Suid == suid
        //                      );
        //                      break;

        //                  case "Failed":
        //                      signingStatusFilter = Builders<Document>.Filter.ElemMatch(
        //                          x => x.Recepients,
        //                          r => (r.Status == RecepientStatus.PinFailed || r.Status == RecepientStatus.Failed) && r.Suid == suid
        //                      );
        //                      break;

        //                  case "In Progress":
        //                      signingStatusFilter = Builders<Document>.Filter.ElemMatch(
        //                          x => x.Recepients,
        //                          r => (r.Status == RecepientStatus.Signing || r.Status == RecepientStatus.SigningInProgress) && r.Suid == suid
        //                      );
        //                      break;
        //              }

        //              if (signingStatusFilter != null)
        //              {
        //                  pipeline = pipeline.Match(signingStatusFilter);
        //              }
        //          }

        //          // Total count without pagination
        //          var totalCount = (await pipeline.ToListAsync()).Count;

        //          // Apply limits
        //          if (applyLatest50)
        //          {
        //              pipeline = pipeline.Limit(50);
        //              totalCount = Math.Min(totalCount, 50);
        //          }
        //          else if (applyLatest30)
        //          {
        //              pipeline = pipeline.Limit(30);
        //              totalCount = Math.Min(totalCount, 30);
        //          }

        //          if (isPagination)
        //          {
        //              pipeline = pipeline.Skip(skip).Limit(pageSize);
        //          }

        //          // Fetch final documents
        //          var documents = await pipeline.As<Document>().ToListAsync();

        //          return (documents, totalCount);
        //      }

        public async Task<(IList<Document> Documents, long TotalCount)> GetPaginatedSentDocumnetListByFilterAsync(
			string suid,
			string accountType,
			string organizationId,
			bool isMultisign,
			DocumentListFilterDTO documentListFilter,
			int pageNumber,
			int pageSize,
			bool isPagination,
			string searchTerm) 
        {
            var RecepientCollection = GetCollection<Recepients>("Recepient");
            var filter = Builders<Document>.Filter;

            var autoFilter = filter.Eq(x => x.OwnerID, suid) & filter.Eq(x => x.MultiSign, isMultisign) & filter.Eq(x => x.AccountType, accountType);

            if (accountType == AccountTypeConstants.Organization)
            {
                autoFilter &= filter.Eq(x => x.OrganizationId, organizationId);
            }

            if (!string.IsNullOrEmpty(documentListFilter.DocumentStatus) && documentListFilter.DocumentStatus != "All")
            {
                autoFilter &= filter.Eq(x => x.Status, documentListFilter.DocumentStatus);
            }

            FilterDefinition<Document> searchFilter = null;
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var lowerSearchTerm = searchTerm.ToLower();
                var regex = new BsonRegularExpression(new Regex(Regex.Escape(lowerSearchTerm), RegexOptions.IgnoreCase));

				searchFilter = filter.Regex(x => x.DocumentName, regex) |
							   filter.Regex(x => x.CreatedAt, regex) |
							   filter.Regex(x => x.ExpireDate, regex) |
                               filter.ElemMatch(x => x.Recepients, Builders<Recepients>.Filter.Regex(r => r.Name, regex));
            }

            var pipeline = Collection.Aggregate();

            var countPipeline = Collection.Aggregate();

            if (searchFilter != null)
            {
                pipeline = pipeline.Match(searchFilter);
                countPipeline = countPipeline.Match(searchFilter);
            }

            pipeline = pipeline.Sort(Builders<Document>.Sort.Descending(x => x.CreatedAt));

            pipeline = pipeline.Lookup<Document, Recepients, Document>(
                RecepientCollection,
                doc => doc._id,
                rec => rec.Tempid,
                docX => docX.Recepients
            );
            countPipeline = countPipeline.Lookup<Document, Recepients, Document>(
               RecepientCollection,
               doc => doc._id,
               rec => rec.Tempid,
               docX => docX.Recepients
            );

            if (!string.IsNullOrEmpty(documentListFilter.SigningStatus) && documentListFilter.SigningStatus != "All")
            {
                FilterDefinition<Document> signingStatusFilter = null;
                switch (documentListFilter.SigningStatus)
                {
                    case "Signed":
                        signingStatusFilter = Builders<Document>.Filter.ElemMatch(x => x.Recepients, 
							r => r.Status == RecepientStatus.Signed && r.Suid == suid);
                        break;
                    case "Need to sign":
                        signingStatusFilter = Builders<Document>.Filter.ElemMatch(x => x.Recepients, 
							r => r.Status == RecepientStatus.NeedToSign && r.Suid == suid);
                        break;
                    case "Rejected":
                        signingStatusFilter = Builders<Document>.Filter.ElemMatch(x => x.Recepients, 
							r => r.Status == RecepientStatus.Rejected && r.Suid == suid);
                        break;
                    case "Waiting_for_Others":
                        signingStatusFilter = Builders<Document>.Filter.ElemMatch(x => x.Recepients,
                            r => r.Status == RecepientStatus.WaitingForOthers && r.Suid == suid);
                        break;
                    case "Failed":
                        signingStatusFilter = Builders<Document>.Filter.ElemMatch(x => x.Recepients, 
							r => (r.Status == RecepientStatus.PinFailed || r.Status == RecepientStatus.Failed) && r.Suid == suid);
                        break;
                    case "Signing_in_Progress":
                        signingStatusFilter = Builders<Document>.Filter.ElemMatch(x => x.Recepients, 
							r => (r.Status == RecepientStatus.Signing || r.Status == RecepientStatus.SigningInProgress) && r.Suid == suid);
                        break;
                    case "Signatures_Pending":
                        signingStatusFilter = Builders<Document>.Filter.ElemMatch(x => x.Recepients, 
							r => (r.Status == RecepientStatus.Signing || r.Status == RecepientStatus.SigningInProgress) && r.Suid == suid);
                        break;
                }

                if (signingStatusFilter != null)
                {
                    pipeline = pipeline.Match(signingStatusFilter);
                    countPipeline = countPipeline.Match(signingStatusFilter);
                }
            }

            int? limitValue = null;
            if (documentListFilter.DocumentFilter?.ToLower() == "latest50")
            {
                limitValue = 50;
            }
            else if (documentListFilter.DocumentFilter?.ToLower() == "latest30")
            {
                limitValue = 30;
            }


            if (!string.IsNullOrEmpty(documentListFilter.DocumentFilter))
			{
				var now = DateTime.UtcNow;

				switch (documentListFilter.DocumentFilter.ToLower())
				{
					case "last30days":
						autoFilter &= filter.Gte(x => x.CreatedAt, now.AddDays(-30));
						break;

					case "last90days":
						autoFilter &= filter.Gte(x => x.CreatedAt, now.AddDays(-90));
						break;

					case "All":
						break;

					default:
						if (int.TryParse(documentListFilter.DocumentFilter, out int year))
						{
							var from = new DateTime(year, 1, 1);
							var to = from.AddYears(1).AddTicks(-1);
							autoFilter &= filter.Gte(x => x.CreatedAt, from) & filter.Lte(x => x.CreatedAt, to);
						}
						break;
				}
            }

            pipeline = pipeline.Match(autoFilter);
            countPipeline = countPipeline.Match(autoFilter);

            long totalCount = 0;

            var countResult = await countPipeline
                .Count() 
                .FirstOrDefaultAsync(); 

            if (countResult != null)
            {
                totalCount = countResult.Count;
            }


            if (limitValue.HasValue)
            {
                pipeline = pipeline.Limit(limitValue.Value);
                totalCount = Math.Min(totalCount, limitValue.Value);
            }

            if (isPagination)
            {
                var skip = (pageNumber - 1) * pageSize;
                pipeline = pipeline.Skip(skip).Limit(pageSize);
            }

            var documents = await pipeline.As<Document>().ToListAsync();

            return (documents, totalCount); 
        }

    }
}

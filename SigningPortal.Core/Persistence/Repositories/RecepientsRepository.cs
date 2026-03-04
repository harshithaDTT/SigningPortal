using MongoDB.Driver;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class RecepientsRepository : GenericRepository<Recepients>, IRecepientsRepository
	{
		public RecepientsRepository(IMongoDbSettings settings) : base(settings)
		{

		}

		public async Task<IList<Recepients>> GetRecepientsListByTakenActionAsync(string suid, bool action)
		{
			return await Collection.Aggregate().Match(x => x.Suid == suid).Match(x => x.TakenAction == action).ToListAsync();
		}

		public async Task<IList<Recepients>> GetRecepientsBySuidAsync(string suid)
		{
			return await Collection.Aggregate().Match(x => x.Suid == suid).ToListAsync();
		}

		public async Task<IList<Recepients>> GetRecepientsByAlternateEmailSuidAsync(string suid)
		{
			return await Collection.Aggregate().Match(x => x.AlternateSignatories.Any(x => x.suid == suid)).ToListAsync();
		}

		public async Task<IList<Recepients>> GetRecepientsListByDocIdAsync(string id)
		{
			var filter = Builders<Recepients>.Filter.Eq(x => x.Tempid, id);
			return await FindAllAsync(filter);
		}

		public async Task<IList<Recepients>> GetRecepientsListByTempIdAsync(Recepients recepients)
		{
			var order = Convert.ToInt32(recepients.Order) - 1;
			var filter = Builders<Recepients>.Filter.Eq(x => x.Tempid, recepients.Tempid);
			var orderFilter = Builders<Recepients>.Filter.And(Builders<Recepients>.Filter.Eq(x => x.Order, order), filter);

			return await FindAllAsync(orderFilter);
		}

		public async Task<Recepients> SaveReceipt(Recepients recepients)
		{
			await Collection.InsertOneAsync(recepients);
			return recepients;
		}

		public async Task<IList<Recepients>> SaveRecepientsAsync(IList<Recepients> recepients)
		{
			await Collection.InsertManyAsync(recepients);
			return recepients;
		}

		public async Task<bool> UpdateRecepientsById(Recepients recepients)
		{
			var filter = Builders<Recepients>.Filter.Eq(x => x._id, recepients._id);
			var updateFilter = Builders<Recepients>.Update;
			var update = updateFilter.Set(x => x.Suid, recepients.Suid)
				.Set(x => x.Name, recepients.Name)
				.Set(x => x.CorrelationId, recepients.CorrelationId)
				.Set(x => x.UpdatedAt, recepients.UpdatedAt)
				.Set(x => x.AccessToken, recepients.AccessToken)
				.Set(x => x.AccountType, recepients.AccountType)
				.Set(x => x.SignedBy, recepients.SignedBy)
				.Set(x => x.SigningCompleteTime, recepients.SigningCompleteTime)
				.Set(x => x.OrganizationName, recepients.OrganizationName)
				.Set(x => x.OrganizationId, recepients.OrganizationId)
				.Set(x => x.TakenAction, recepients.TakenAction)
				.Set(x => x.ReferredTo, recepients.ReferredTo)
				.Set(x => x.Status, recepients.Status);

			var updateRecepient = await Collection.UpdateOneAsync(filter, update, options: new UpdateOptions { IsUpsert = false });
			if (updateRecepient != null)
			{
				if (updateRecepient.ModifiedCount > 0)
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

		public async Task<bool> UpdateTakenActionOfRecepientById(string id, string signaturePreviewObject = "")
		{

			var filter = Builders<Recepients>.Filter.Eq(x => x._id, id);
			var updateFilter = Builders<Recepients>.Update
				.Set(x => x.TakenAction, true)
				.Set(x => x.SigningCompleteTime, DateTime.UtcNow)  //  Updated Signing Complete Time
				.Set(x => x.Status, RecepientStatus.Signed)
				.Set(x => x.SignaturePreviewObject, signaturePreviewObject);


			var updateRecepient = await Collection.UpdateOneAsync(filter, updateFilter, options: new UpdateOptions { IsUpsert = false });
			if (updateRecepient != null)
			{
				if (updateRecepient.ModifiedCount > 0)
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

		public async Task<bool> UpdateRecepientStatusById(string id, string status)
		{

			var filter = Builders<Recepients>.Filter.Eq(x => x._id, id);
			var updateFilter = Builders<Recepients>.Update
				.Set(x => x.UpdatedAt, DateTime.UtcNow)
				.Set(x => x.Status, status);

			var updateRecepient = await Collection.UpdateOneAsync(filter, updateFilter, options: new UpdateOptions { IsUpsert = false });
			if (updateRecepient != null)
			{
				if (updateRecepient.ModifiedCount > 0)
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


		public async Task DeleteRecepientsByTempId(IList<string> idList)
		{
			var filter = Builders<Recepients>.Filter.In(x => x.Tempid, idList);

			await Collection.DeleteManyAsync(filter);
		}

		public async Task<IList<Recepients>> GetRecepientsLeft(string tempId)
		{
			return await Collection.Aggregate()
						.Match(x => x.Tempid == tempId)
						.Match(x => x.TakenAction == false)
						.Sort(Builders<Recepients>.Sort.Ascending(x => x.Order))
						.ToListAsync();
		}

		public async Task<IList<Recepients>> GetCurrentRecepientsList(string tempId)
		{
			var lastActionTakenList = await Collection.Aggregate()
					.Match(x => x.Tempid == tempId)
					.Match(x => x.TakenAction == true)
					.Sort(Builders<Recepients>.Sort.Descending(x => x.Order))
					.ToListAsync();

			if (lastActionTakenList.Count != 0)
			{
				var lastOrder = lastActionTakenList[0].Order;
				var nextOrder = lastOrder + 1;
				return await Collection.Aggregate()
						.Match(x => x.Tempid == tempId)
						.Match(x => x.TakenAction == false)
						.Match(x => x.Order == nextOrder)
						.Sort(Builders<Recepients>.Sort.Ascending(x => x.Order))
						.ToListAsync();

			}

			return await Collection.Aggregate()
						.Match(x => x.Tempid == tempId)
						.Match(x => x.TakenAction == false)
						//.Match(x => x.Order == 1)
						.Sort(Builders<Recepients>.Sort.Ascending(x => x.Order))
						.ToListAsync();

		}

		public async Task<Recepients> FindRecepientsByCorelationId(string corelationId)
		{
			return await Collection.Find(x => x.CorrelationId == corelationId).FirstOrDefaultAsync();
		}

		public async Task<Recepients> GetRecepientByIdAsync(string id)
		{
			return await Collection.Find(x => x._id == id).FirstOrDefaultAsync();
		}

		public async Task<Recepients> DeclinedCommentDetailsAsync(string tempId)
		{
			return await Collection.Aggregate()
							 .Match(x => x.Tempid == tempId)
							 .Match(x => x.Decline == true)
							 .FirstOrDefaultAsync();
		}

		public async Task<bool> DeclineSigningAsync(string tempId, User user, string comment)
		{
			var emailFilter = Builders<Recepients>.Filter.Or(
				Builders<Recepients>.Filter.Eq(x => x.Suid, user.suid),
				Builders<Recepients>.Filter.ElemMatch(x => x.AlternateSignatories, y => y.suid == user.suid));
			var filter = Builders<Recepients>.Filter;
			var declineSigningFilter = emailFilter & filter.Eq(x => x.Tempid, tempId);
			var update = Builders<Recepients>.Update
								.Set(x => x.DeclineRemark, comment)
								.Set(x => x.Decline, true)
								.Set(x => x.TakenAction, true)
								.Set(x => x.DeclinedBy, user)
								.Set(x => x.Status, RecepientStatus.Rejected);

			var updateRecepient = await Collection.UpdateOneAsync(declineSigningFilter, update, options: new UpdateOptions { IsUpsert = false });
			if (updateRecepient != null)
			{
				if (updateRecepient.ModifiedCount > 0)
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

		public async Task<Recepients> GetRecepientsBySuidAndTempId(string suid, string tempId)
		{
			var filter = Builders<Recepients>.Filter;
			var recFilter = filter.Eq(x => x.Tempid, tempId) & filter.Eq(x => x.Suid, suid);
			var recepient = await Collection.Find(recFilter).FirstOrDefaultAsync();
			if (recepient == null)
			{
				recFilter = filter.Eq(x => x.Tempid, tempId) & filter.Where(x => x.AlternateSignatories.Any(x => x.suid == suid));
				recepient = await Collection.Find(recFilter).FirstOrDefaultAsync();
			}

			return recepient;
		}
	}
}

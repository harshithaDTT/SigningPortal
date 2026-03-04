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
	public class TemplateRecepientRepository(IMongoDbSettings settings) : GenericRepository<TemplateRecepient>(settings), ITemplateRecepientRepository
	{
		public async Task<IList<TemplateRecepient>> GetTemplateRecepientListByTakenActionAsync(string suid, bool action)
		{
			return await Collection.Aggregate().Match(x => x.Signer.suid == suid).Match(x => x.TakenAction == action).ToListAsync();
		}

		public async Task<IList<TemplateRecepient>> GetTemplateRecepientBySuidAsync(string suid)
		{
			return await Collection.Aggregate().Match(x => x.Signer.suid == suid).ToListAsync();
		}

		public async Task<IList<TemplateRecepient>> GetTemplateRecepientBySuidAndOrganizationIdAsync(string suid, string orgId)
		{
			return await Collection.Aggregate().Match(x => x.Signer.suid == suid && x.OrganizationId == orgId).ToListAsync();
		}

		public async Task<IList<TemplateRecepient>> GetTemplateRecepientByAlternateEmailSuidAsync(string suid)
		{
			return await Collection.Aggregate().Match(x => x.AlternateSignatories.Any(x => x.suid == suid)).ToListAsync();
		}

		public async Task<IList<TemplateRecepient>> GetTemplateRecepientListByDocIdAsync(string id)
		{
			var filter = Builders<TemplateRecepient>.Filter.Eq(x => x.TemplateDocumentId, id);
			return await FindAllAsync(filter);
		}

		public async Task<IList<TemplateRecepient>> GetTemplateRecepientListByTempIdAsync(TemplateRecepient TemplateRecepient)
		{
			var order = Convert.ToInt32(TemplateRecepient.Order) - 1;
			var filter = Builders<TemplateRecepient>.Filter.Eq(x => x.TemplateDocumentId, TemplateRecepient.TemplateDocumentId);
			var orderFilter = Builders<TemplateRecepient>.Filter.And(Builders<TemplateRecepient>.Filter.Eq(x => x.Order, order), filter);

			return await FindAllAsync(orderFilter);
		}

		public async Task<TemplateRecepient> SaveTemplateRecepient(TemplateRecepient TemplateRecepient)
		{
			await Collection.InsertOneAsync(TemplateRecepient);
			return TemplateRecepient;
		}

		public async Task<IList<TemplateRecepient>> SaveTemplateRecepientListAsync(IList<TemplateRecepient> TemplateRecepient)
		{
			await Collection.InsertManyAsync(TemplateRecepient);
			return TemplateRecepient;
		}

		public async Task<bool> UpdateTemplateRecepientById(TemplateRecepient TemplateRecepient)
		{
			var filter = Builders<TemplateRecepient>.Filter.Eq(x => x._id, TemplateRecepient._id);
			var updateFilter = Builders<TemplateRecepient>.Update;
			var update = updateFilter
						.Set(x => x.Signer, TemplateRecepient.Signer)
						.Set(x => x.SignerName, TemplateRecepient.SignerName)
						.Set(x => x.CorrelationId, TemplateRecepient.CorrelationId)
						.Set(x => x.UpdatedAt, DateTime.UtcNow)
						.Set(x => x.SigningCompleteTime, TemplateRecepient.SigningCompleteTime)
						.Set(x => x.TakenAction, TemplateRecepient.TakenAction)
						.Set(x => x.Status, TemplateRecepient.Status)
						.Set(x => x.Decline, TemplateRecepient.Decline)
						.Set(x => x.DeclineRemark, TemplateRecepient.DeclineRemark)
						.Set(x => x.SignatureMandatory, TemplateRecepient.SignatureMandatory)
						.Set(x => x.Order, TemplateRecepient.Order)
						.Set(x => x.AnnotationList, TemplateRecepient.AnnotationList)
						.Set(x => x.SignatureAnnotations, TemplateRecepient.SignatureAnnotations)
						.Set(x => x.EsealAnnotations, TemplateRecepient.EsealAnnotations)
						.Set(x => x.QrAnnotations, TemplateRecepient.QrAnnotations)
						.Set(x => x.SigningReqTime, TemplateRecepient.SigningReqTime);

			var updateTemplateRecepient = await Collection.UpdateOneAsync(filter, update, options: new UpdateOptions { IsUpsert = false });
			if (updateTemplateRecepient != null)
			{
				if (updateTemplateRecepient.ModifiedCount > 0)
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

		public async Task<bool> UpdateTakenActionOfTemplateRecepientById(string id)
		{

			var filter = Builders<TemplateRecepient>.Filter.Eq(x => x._id, id);
			var updateFilter = Builders<TemplateRecepient>.Update
				.Set(x => x.TakenAction, true)
				.Set(x => x.UpdatedAt, DateTime.UtcNow)
				.Set(x => x.SigningCompleteTime, DateTime.UtcNow)  //  Updated Signing Complete Time
				.Set(x => x.Status, RecepientStatus.Signed);

			var updateTemplateRecepient = await Collection.UpdateOneAsync(filter, updateFilter, options: new UpdateOptions { IsUpsert = false });
			if (updateTemplateRecepient != null)
			{
				if (updateTemplateRecepient.ModifiedCount > 0)
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

		public async Task<bool> UpdateCorrelationIdOfTemplateRecepientById(string id, string corelationId, string signerName,
			string accessToken, string idpToken, string email)
		{

			var filter = Builders<TemplateRecepient>.Filter.Eq(x => x._id, id);
			var updateFilter = Builders<TemplateRecepient>.Update
				.Set(x => x.CorrelationId, corelationId)
				.Set(x => x.SignerName, signerName)
				//.Set (x => x.AccessToken, accessToken)
				.Set(x => x.IdpToken, idpToken)
				.Set(x => x.SignedBy, email)
				.Set(x => x.UpdatedAt, DateTime.UtcNow);

			var updateTemplateRecepient = await Collection.UpdateOneAsync(filter, updateFilter, options: new UpdateOptions { IsUpsert = false });
			if (updateTemplateRecepient != null)
			{
				if (updateTemplateRecepient.ModifiedCount > 0)
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

		public async Task DeleteTemplateRecepientByTempId(IList<string> idList)
		{
			var filter = Builders<TemplateRecepient>.Filter.In(x => x.TemplateDocumentId, idList);

			await Collection.DeleteManyAsync(filter);
		}

		public async Task<IList<TemplateRecepient>> GetTemplateRecepientLeft(string tempId)
		{
			return await Collection.Aggregate()
						.Match(x => x.TemplateDocumentId == tempId)
						.Match(x => x.TakenAction == false)
						.Sort(Builders<TemplateRecepient>.Sort.Ascending(x => x.Order))
						.ToListAsync();
		}

		public async Task<IList<TemplateRecepient>> GetCurrentTemplateRecepientList(string tempId)
		{
			var lastActionTakenList = await Collection.Aggregate()
					.Match(x => x.TemplateDocumentId == tempId)
					.Match(x => x.TakenAction == true)
					.Sort(Builders<TemplateRecepient>.Sort.Descending(x => x.Order))
					.ToListAsync();

			if (lastActionTakenList.Count != 0)
			{
				var lastOrder = lastActionTakenList[0].Order;
				var nextOrder = lastOrder + 1;
				return await Collection.Aggregate()
						.Match(x => x.TemplateDocumentId == tempId)
						.Match(x => x.TakenAction == false)
						.Match(x => x.Order == nextOrder)
						.Sort(Builders<TemplateRecepient>.Sort.Ascending(x => x.Order))
						.ToListAsync();

			}

			return await Collection.Aggregate()
						.Match(x => x.TemplateDocumentId == tempId)
						.Match(x => x.TakenAction == false)
						//.Match(x => x.Order == 1)
						.Sort(Builders<TemplateRecepient>.Sort.Ascending(x => x.Order))
						.ToListAsync();

		}

		public async Task<TemplateRecepient> FindTemplateRecepientByCorelationId(string corelationId)
		{
			return await Collection.Find(x => x.CorrelationId == corelationId).FirstOrDefaultAsync();
		}

		public async Task<TemplateRecepient> DeclinedCommentDetailsAsync(string tempId)
		{
			return await Collection.Aggregate()
							 .Match(x => x.TemplateDocumentId == tempId)
							 .Match(x => x.Decline == true)
							 .FirstOrDefaultAsync();
		}

		public async Task<bool> DeclineSigningAsync(string tempId, User user, string comment)
		{
			var emailFilter = Builders<TemplateRecepient>.Filter.Or(
				Builders<TemplateRecepient>.Filter.Eq(x => x.Signer.suid, user.suid),
				Builders<TemplateRecepient>.Filter.ElemMatch(x => x.AlternateSignatories, y => y.suid == user.suid));
			var filter = Builders<TemplateRecepient>.Filter;
			var declineSigningFilter = emailFilter & filter.Eq(x => x.TemplateDocumentId, tempId);
			var update = Builders<TemplateRecepient>.Update
								.Set(x => x.DeclineRemark, comment)
								.Set(x => x.Decline, true)
								.Set(x => x.DeclinedBy, user)
								.Set(x => x.UpdatedAt, DateTime.UtcNow)
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

		public async Task<TemplateRecepient> GetTemplateRecepientBySuidAndTempId(string suid, string tempId)
		{
			var filter = Builders<TemplateRecepient>.Filter;
			var recFilter = filter.Eq(x => x.TemplateDocumentId, tempId) & filter.Eq(x => x.Signer.suid, suid);
			var TemplateRecepient = await Collection.Find(recFilter).FirstOrDefaultAsync();
			if (TemplateRecepient == null)
			{
				recFilter = filter.Eq(x => x.TemplateDocumentId, tempId);
				TemplateRecepient = await Collection.Find(recFilter).FirstOrDefaultAsync();
			}

			return TemplateRecepient;
		}
	}
}

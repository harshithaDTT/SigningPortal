using MongoDB.Driver;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class NotificationRepository : GenericRepository<Notification>, INotificationRepository
	{
		public NotificationRepository(IMongoDbSettings settings) : base(settings)
		{
		}

		public async Task DeleteManyAsync(string receiver, string orgId = "")
		{
			await Collection.DeleteManyAsync(x => x.Receiver == receiver && (x.OrganizationId == orgId || x.AccountType == AccountTypeConstants.All));
		}

		public async Task UpdateByIdAsync(string id, Notification notification)
		{
			await Collection.ReplaceOneAsync(x => x._id == id, notification);
		}

		public async Task<Notification> CreateAsync(Notification notification)
		{
			if (!string.IsNullOrEmpty(notification.OrganizationId))
				notification.AccountType = AccountTypeConstants.Organization;
			else
				notification.AccountType = AccountTypeConstants.Self;

			await Collection.InsertOneAsync(notification);
			return notification;
		}

		public async Task<List<Notification>> GetNotificationAsync(string email, string orgId = "")
		{
			var filter = Builders<Notification>.Filter;

			var listFilter = filter.And(
					filter.Eq(x => x.Receiver, email),
					filter.Or(
						filter.Eq(x => x.OrganizationId, orgId),
						filter.Eq(x => x.AccountType, AccountTypeConstants.All)
					)
			);

			var list = await Collection.Find(listFilter).Limit(15).SortByDescending(x => x.CreatedAt).ToListAsync();

			if (list.Count != 0)
			{
				var date = DateTime.UtcNow.AddMinutes(-30);
				var updateNewStausfilter = listFilter & filter.Eq(x => x.Status, "New") & filter.Lte(x => x.CreatedAt, DateTime.UtcNow.AddMinutes(-2));
				var updateFilter = Builders<Notification>.Update.Set(x => x.Status, "Old");
				await Collection.UpdateOneAsync(updateNewStausfilter, updateFilter, options: new UpdateOptions { IsUpsert = false });

			}
			return list;
		}

		public async Task<Notification> GetNotificationByIdAsync(string id)
		{
			return await Collection.Aggregate().Match(x => x._id == id).FirstOrDefaultAsync();
		}

		public async Task DeleteOlderNotification(DateTime date)
		{
			var filter = Builders<Notification>.Filter.Lte(x => x.CreatedAt, date);
			await Collection.DeleteManyAsync(filter);
		}
	}
}

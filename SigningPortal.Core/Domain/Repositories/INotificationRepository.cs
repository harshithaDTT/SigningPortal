using SigningPortal.Core.Domain.Model;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface INotificationRepository
	{
		Task<Notification> CreateAsync(Notification notification);

		Task UpdateByIdAsync(string id, Notification notification);

		Task DeleteManyAsync(string receiver, string orgId = "");

		Task<List<Notification>> GetNotificationAsync(string email, string orgId = "");

		Task<Notification> GetNotificationByIdAsync(string id);

		Task DeleteOlderNotification(DateTime date);
	}
}

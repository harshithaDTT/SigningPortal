using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
	public interface INotificationService
	{
		Task CreateNotificationAsync(NotificationDTO notification, string orgId = "", NotificationMetaData metaData = null);

		Task<ServiceResult> GetNotificationByEmailAsync(string email, string orgId = "");

		Task<ServiceResult> ClearAllNotificationsByReceiver(string receiver, string orgId = "");

		Task<ServiceResult> UpdateNotificationById(string id);
	}
}

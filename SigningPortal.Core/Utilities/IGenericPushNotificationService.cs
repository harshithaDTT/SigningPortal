using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Threading.Tasks;

namespace SigningPortal.Core.Utilities
{
	public interface IGenericPushNotificationService
	{
		Task<ServiceResult> SendGenericPushNotification(string accessToken, string suid, string message);
		Task<ServiceResult> SendNotificationDelegationRequest(DelegationPushNotificationDTO request);
	}
}
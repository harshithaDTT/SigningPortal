using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Services.Communication.Notifications
{
	public class NotificationListResponse
	{
		public IList<Notification> data { get; set; }
	}
}

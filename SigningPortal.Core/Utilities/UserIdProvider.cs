using Microsoft.AspNetCore.SignalR;

namespace SigningPortal.Core.Utilities
{
	// Renamed to be more accurate
	public class UserIdProvider : IUserIdProvider
	{
		public virtual string GetUserId(HubConnectionContext connection)
		{
			// Find the "suid_orgid" claim you added during login
			return connection.User?.FindFirst("suid_orgid")?.Value;

		}
	}
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace SigningPortal.Core.Utilities
{
	public class NotificationHub : Hub
	{
		private readonly ICacheClient _cacheClient;
		private readonly ILogger<NotificationHub> _logger;
		public NotificationHub(ICacheClient cacheClient, ILogger<NotificationHub> logger)
		{
			_cacheClient = cacheClient;
			_logger = logger;
		}

		//public async Task<bool> SetEmailWithConnectionId(string email, string connectionId)
		//{
		//	try
		//	{
		//		_logger.LogInformation("Set email : {0} with socket id : {1} ", email, connectionId);
		//		var isExists = _cacheClient.KeyExists("SingingPortalNotificationSockrtIDs", email);
		//		if (CacheCodes.KeyExist == isExists.retValue)
		//		{
		//			var isdelete = await _cacheClient.Remove("SingingPortalNotificationSockrtIDs", email);
		//		}

		//		var res = await _cacheClient.Add("SingingPortalNotificationSockrtIDs", email, connectionId);

		//		await Clients.Client(connectionId).SendAsync("WelcomeMessage", $"Updated userid {email}");
		//		_logger.LogInformation("Set email : {0} with socket id : {1} successfull", email, connectionId);

		//		return true;
		//	}
		//	catch (Exception ex)
		//	{
		//		Monitor.SendException(ex);
		//		_logger.LogInformation("Set email : {0} with socket id : {1} failed", email, connectionId);
		//	}
		//	return false;
		//}



		public override Task OnConnectedAsync()
		{
			//var connectionId = Context.ConnectionId;
			//Clients.Client(connectionId).SendAsync("ReciveNewConnectionId", connectionId);
			return base.OnConnectedAsync();
		}

		public override Task OnDisconnectedAsync(Exception? exception)
		{
			var connectionId = Context.ConnectionId;

			return base.OnDisconnectedAsync(exception);
		}


	}
}

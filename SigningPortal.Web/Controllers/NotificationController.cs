using Microsoft.AspNetCore.Mvc;
using SigningPortal.Core.Domain.Services;

namespace SigningPortal.Web.Controllers
{
	public class NotificationController : BaseController
	{
		private readonly INotificationService _notificationService;

		public NotificationController(INotificationService notificationService)
		{
			_notificationService = notificationService;
		}

		[HttpGet]
		public async Task<IActionResult> ClearAllNotifications()
		{
			var result = await _notificationService.ClearAllNotificationsByReceiver(Suid, OrganizationId);

			return Json(new { success = result.Success, result.Message, result.Result });

		}

		[HttpGet]
		public async Task<IActionResult> GetNotificationByEmail()
		{
			var result = await _notificationService.GetNotificationByEmailAsync(Suid, OrganizationId);


			return Json(new { success = result.Success, result.Message, result.Result });

		}


		//[HttpPut]
		//public async Task<IActionResult> Update(string id)
		//{
		//	var result = await _notificationService.UpdateNotificationById(id);

		//	return Json(new { success = result.Success, result.Message, result.Result });

		//}


	}
}

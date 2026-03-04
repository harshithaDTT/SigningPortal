using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.Domain.Services.Communication.Notifications;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using System;
using System.Threading.Tasks;

namespace SigningPortal.Core.Services
{
	public class NotificationService : INotificationService
	{
		private readonly INotificationRepository _notificationRepository;
		private readonly ILogger<NotificationService> _logger;
		private readonly IDocumentHelper _documentHelper;
		private readonly IConstantError _constantError;
		private readonly IBackgroundService _backgroundService;
		public NotificationService(INotificationRepository notificationRepository,
			ILogger<NotificationService> logger,
			IDocumentHelper documentHelper,
			IConstantError constantError,
			IBackgroundService backgroundService)
		{
			_notificationRepository = notificationRepository;
			_logger = logger;
			_documentHelper = documentHelper;
			_constantError = constantError;
			_backgroundService = backgroundService;
		}

		public async Task<ServiceResult> ClearAllNotificationsByReceiver(string receiver, string orgId = "")
		{
			if (String.IsNullOrEmpty(receiver))
			{
				return new ServiceResult(_constantError.GetMessage("102523"));
				//return new ServiceResult("Email cannot be null");
			}

			try
			{
				await _notificationRepository.DeleteManyAsync(receiver, orgId);

				return new ServiceResult(null, "Successfully cleared all the notifications");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("ClearAllNotificationsByReceiver Exception :  {0}", ex.Message);
			}

			return new ServiceResult(_constantError.GetMessage("102548"));
			//return new ServiceResult("Failed to clear notifications");
		}

		public async Task<ServiceResult> GetNotificationByEmailAsync(string email, string orgId = "")
		{
			if (String.IsNullOrEmpty(email))
			{
				return new ServiceResult(_constantError.GetMessage("102523"));
				//return new ServiceResult("Email cannot be null");
			}
			try
			{
				var response = await _notificationRepository.GetNotificationAsync(email, orgId);
				NotificationListResponse notifications = new NotificationListResponse
				{
					data = response
				};

				return new ServiceResult(notifications, "Successfully received notification");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetNotificationByEmailAsync Exception :  {0}", ex.Message);

			}

			return new ServiceResult(_constantError.GetMessage("102549"));
			//return new ServiceResult("Failed to get notification");
		}

		public async Task<ServiceResult> UpdateNotificationById(string id)
		{
			if (String.IsNullOrEmpty(id))
			{
				return new ServiceResult(_constantError.GetMessage("102528"));
				//return new ServiceResult("Id cannot be null");
			}
			try
			{
				var notification = await _notificationRepository.GetNotificationByIdAsync(id);
				notification.Read = true;
				notification.UpdatedAt = DateTime.UtcNow;
				await _notificationRepository.UpdateByIdAsync(id, notification);
				return new ServiceResult("Successfully updated notification");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("UpdateNotificationById Exception :  {0}", ex.Message);
			}

			return new ServiceResult(_constantError.GetMessage("102550"));
			//return new ServiceResult("Failed to update notification");
		}

		public async Task CreateNotificationAsync(NotificationDTO notification, string orgId = "", NotificationMetaData metaData = null)
		{
			try
			{
				Notification notificationData = new(notification.Sender, notification.Receiver,
					notification.Link, notification.Text, orgId, metaData);

				await _notificationRepository.CreateAsync(notificationData);

				string org = string.IsNullOrEmpty(orgId) ? AccountTypeConstants.Self : orgId;

				_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotification($"{notification.Receiver}_{org}", JsonConvert.SerializeObject(notificationData)));

				_logger.LogInformation("Successfully created notification");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("CreateNotificationAsync Exception :  {0}", ex.Message);
			}

			//return new ServiceResult("Failed to create notification");
		}
	}
}

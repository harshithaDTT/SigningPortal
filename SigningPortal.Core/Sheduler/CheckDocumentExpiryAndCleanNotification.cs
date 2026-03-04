using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Quartz;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Utilities;
using System;
using System.Threading.Tasks;

namespace SigningPortal.Core.Sheduler
{
	public class CheckDocumentExpiryAndCleanNotification : IJob
	{
		private readonly IDocumentRepository _documentRepository;
		private readonly ITemplateDocumentRepository _templateDocumentRepository;
		private readonly INotificationRepository _notificationRepository;
		private readonly IStorageIntegrationService _storageIntegrationService;
		private readonly ILogger<CheckDocumentExpiryAndCleanNotification> _logger;
		private readonly IConfiguration _configuration;
        private readonly IMinioService _minioService;
        public CheckDocumentExpiryAndCleanNotification(IDocumentRepository documentRepository,
			ITemplateDocumentRepository templateDocumentRepository,
			INotificationRepository notificationRepository,
			IStorageIntegrationService storageIntegrationService,
			IConfiguration configuration,
            IMinioService minioService,
            ILogger<CheckDocumentExpiryAndCleanNotification> logger)
		{
			_logger = logger;
			_configuration = configuration;
			_documentRepository = documentRepository;
			_templateDocumentRepository = templateDocumentRepository;
			_storageIntegrationService = storageIntegrationService;
			_notificationRepository = notificationRepository;
            _minioService = minioService;
        }


		public async Task Execute(IJobExecutionContext context)
		{
			_logger.LogInformation("'Check Expiry Date Cron Start'  :: " + DateTime.UtcNow);
			await CheckExpiredDocuments();
			_logger.LogInformation("'Check Expiry Date Cron End'  :: " + DateTime.UtcNow);

			_logger.LogInformation("'Check Expiry Date TempDoc Cron Start'  :: " + DateTime.UtcNow);
			await CheckExpiredTemplateDocuments();
			_logger.LogInformation("'Check Expiry Date TempDoc Cron End'  :: " + DateTime.UtcNow);

			_logger.LogInformation("Clean notification Cron Start'  :: " + DateTime.UtcNow);
			await CleanNotification();
			_logger.LogInformation("Clean notification Cron End'  :: " + DateTime.UtcNow);

			_logger.LogInformation("'Unlink Drive Storage Cron Start'  :: " + DateTime.UtcNow);
			await UnlinkDriveStorage();
			_logger.LogInformation("'Unlink Drive Storage Cron End'  :: " + DateTime.UtcNow);

            _logger.LogInformation("'Delete Stored Documents Cron Start'  :: " + DateTime.UtcNow);
            await DeleteStoredDocuments();
            _logger.LogInformation("'Delete Stored Documents Cron End'  :: " + DateTime.UtcNow);
        }

		private async Task CheckExpiredDocuments()
		{
			try
			{
				var result = await _documentRepository.UpdateExpiredDocumentStatus();
				_logger.LogInformation("Documents expired updated count :: " + result);
			}
			catch (Exception e)
			{
				Monitor.SendException(e);
				_logger.LogError("Check Expired Documents Excp'  :: " + e.Message);
			}
		}

		private async Task CheckExpiredTemplateDocuments()
		{
			try
			{
				var result = await _templateDocumentRepository.UpdateExpiredTemplateDocumentStatus();
				_logger.LogInformation("Template documents expired updated count :: " + result);
			}
			catch (Exception e)
			{
				Monitor.SendException(e);
				_logger.LogError("Check Expired Template Documents Excp'  :: " + e.Message);
			}
		}

		private async Task CleanNotification()
		{
			try
			{
				var date = DateTime.Today.AddDays(-_configuration.GetValue<double>("NotificationAge"));
				await _notificationRepository.DeleteOlderNotification(date);
			}
			catch (Exception e)
			{
				Monitor.SendException(e);
				_logger.LogError("Clean notification Excp'  :: " + e.Message);
			}
		}

		private async Task UnlinkDriveStorage()
		{
			try
			{
				await _storageIntegrationService.ScheduledUnlinking();
			}
			catch (Exception e)
			{
				Monitor.SendException(e);
				_logger.LogError($"UnlinkDriveStorage Excp'  :: {e.Message}");
			}
		}

        private async Task DeleteStoredDocuments()
        {
            try
            {
                await _minioService.DeleteDocumentsAsync();
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("Delete Stored Documents Excp'  :: " + e.Message);
            }
        }
    }
}

using Microsoft.Extensions.Logging;
using Quartz;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using System;
using System.Threading.Tasks;

namespace SigningPortal.Core.Sheduler
{
	public class SigningReminder : IJob
	{
		private readonly IDocumentRepository _documentRepository;
		private readonly ILogger<SigningReminder> _logger;
		private readonly IBackgroundService _backgroundService;
		public SigningReminder(IDocumentRepository documentRepository,
		   ILogger<SigningReminder> logger,
		   IBackgroundService backgroundService)
		{
			_logger = logger;
			_documentRepository = documentRepository;
			_backgroundService = backgroundService;
		}


		public async Task Execute(IJobExecutionContext context)
		{
			_logger.LogInformation("Send Reminder Cron Start'  :: " + DateTime.UtcNow);
			await SendReminder();
			_logger.LogInformation("Send Reminder Cron End'  :: " + DateTime.UtcNow);
		}

		private async Task SendReminder()
		{
			try
			{
				var docs = await _documentRepository.GetDocumentByAutoReminder("true");

				if (docs != null)
				{
					foreach (var doc in docs)
					{
						var data = new SendEmailObj()
						{
							Id = doc._id,
							UserEmail = doc.OwnerEmail,
							UserName = doc.OwnerName
						};
						_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendAnEmailToRecipient(data, null, null));
						//_logger.LogInformation("Send Reminder for Email ::' " + doc.OwnerEmail);

					}
				}
			}
			catch (Exception e)
			{
				Monitor.SendException(e);
				_logger.LogError("Send Reminder Excp :: " + e.Message);
			}
		}
	}
}

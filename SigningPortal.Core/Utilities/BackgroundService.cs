using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace SigningPortal.Core.Utilities
{
	public class BackgroundService : IBackgroundService
	{
		private readonly IServiceScopeFactory _scopeFactory;
		private readonly ILogger<BackgroundService> _logger;
		//private readonly IBackgroundJobClient _backgroundJobClient;		// Hangfire
		private static bool _fnf = false;

		public BackgroundService(
			IServiceScopeFactory scopeFactory,
			//IBackgroundJobClient backgroundJobClient,						//Hangfire
			IConfiguration configuration,
			ILogger<BackgroundService> logger)
		{
			_scopeFactory = scopeFactory;
			//_backgroundJobClient = backgroundJobClient;					//Hangfire
			_logger = logger;

			_fnf = configuration.GetValue<bool>("FireAndForget");
		}

        public void FireAndForget<T>(Action<T> action)
        {
            _logger.LogInformation($"FireAndForget start: {DateTime.UtcNow}");

            Task.Run(() =>
            {
                using var scope = _scopeFactory.CreateScope();

                var dependency = (T)scope.ServiceProvider.GetRequiredService(typeof(T));

                try
                {
                    action(dependency);
                }
                catch (Exception ex)
                {
                    Monitor.SendException(ex);
                    _logger.LogError(ex, "FireAndForget failed: {Message}", ex.Message);
                }

                _logger.LogInformation($"FireAndForget end: {DateTime.UtcNow}");
            });
        }

        public void FireAndForgetAsync<T>(Func<T, Task> action)
		{
			_logger.LogInformation($"FireAndForgetAsync start: {DateTime.UtcNow}");
			Task.Run(async () =>
			{
				using var scope = _scopeFactory.CreateScope();
				var dependency = (T)scope.ServiceProvider.GetRequiredService(typeof(T));
				try
				{
					await action(dependency);
				}
				catch (Exception ex)
				{
					Monitor.SendException(ex);
					_logger.LogError(ex, "FireAndForgetAsync failed: {Message}", ex.Message);
				}
				_logger.LogInformation($"FireAndForgetAsync end: {DateTime.UtcNow}");
			});
		}

		public void RunBackgroundTask<T>(Expression<Func<T, Task>> action)
		{
			_logger.LogInformation($"RunBackgroundTask start (fnf = {_fnf}): {DateTime.UtcNow}");

			try
			{
				if (_fnf)
				{
					_logger.LogInformation($"FireAndForget start: {DateTime.UtcNow}");
					Task.Run(async () =>
					{
						using var scope = _scopeFactory.CreateScope();
						var dependency = (T)scope.ServiceProvider.GetRequiredService(typeof(T));
						try
						{
							await action.Compile()(dependency);
						}
						catch (Exception ex)
						{
							Monitor.SendException(ex);
							_logger.LogError(ex, "FireAndForget failed: {Message}", ex.Message);
						}
						_logger.LogInformation($"FireAndForget end: {DateTime.UtcNow}");
					});
				}
				//else
				//{

				//	_logger.LogInformation($"Enqueue start: {DateTime.UtcNow}");
				//	try
				//	{
				//		_backgroundJobClient.Enqueue(action);
				//	}
				//	catch (Exception ex)
				//	{
				//		Monitor.SendException(ex);
				//		_logger.LogError(ex, "Enqueue failed: {Message}", ex.Message);
				//	}
				//	_logger.LogInformation($"Enqueue end: {DateTime.UtcNow}");
				//}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, "RunBackgroundTask failed: {Message}", ex.Message);
			}

			_logger.LogInformation($"RunBackgroundTask end: {DateTime.UtcNow}");
		}
	}
}

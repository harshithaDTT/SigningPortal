using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using System;
using System.Collections.Generic;

namespace SigningPortal.Core.Utilities
{
	public class ConstantError : IConstantError
	{
		private readonly ILogger<ConstantError> _logger;
		private readonly IConfiguration _configuration;
		private readonly IErrorMessageRepository _errorMessageRepository;
		private static List<ErrorMessage> ErrorConstant;
		public ConstantError(ILogger<ConstantError> logger,
			IConfiguration configuration,
			IErrorMessageRepository errorMessageRepository)
		{

			_configuration = configuration;
			_logger = logger;
			_errorMessageRepository = errorMessageRepository;

			_logger.LogDebug("-->ConstantError");

			ErrorConstant = _errorMessageRepository.GetAllErrorMessages();
			if (ErrorConstant == null)
			{
				_logger.LogError("ConstantError Initialization Failed");
				throw new NullReferenceException();
			}

			_logger.LogInformation("Error Message Configuration Initialized");

			_logger.LogDebug("<--ConstantError");

		}


		public string GetMessage(string Code)
		{
			// Validate Input Parameters
			if (string.IsNullOrEmpty(Code))
			{
				_logger.LogError("Invalid Error Code");
				return "Invalid Error Code";
			}

			if (ErrorConstant != null)
			{
				return ErrorConstant.Find(x => x.code == Code).message;
			}
			else
			{
				_logger.LogError("ConstantError Object null");
				return "InternalError";
			}

		}

		public void DeleteAllErrorMessagesAsync()
		{
			try
			{
				_errorMessageRepository.DeleteAllErrorMessages();
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError("DeleteAllErrorAsync Exception");
				_logger.LogError(ex.Message);
			}
		}


	}
}

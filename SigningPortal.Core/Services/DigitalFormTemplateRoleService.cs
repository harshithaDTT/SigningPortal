using Microsoft.Extensions.Logging;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.Utilities;
using System;
using System.Threading.Tasks;

namespace SigningPortal.Core.Services
{
	public class DigitalFormTemplateRoleService : IDigitalFormTemplateRoleService
	{
		private readonly ILogger<DigitalFormTemplateRole> _logger;
		private readonly IDigitalFormTemplateRoleRepository _docroleRepository;
		public DigitalFormTemplateRoleService
			(
				ILogger<DigitalFormTemplateRole> logger,
				IDigitalFormTemplateRoleRepository docroleRepository
			)
		{
			_logger = logger;
			_docroleRepository = docroleRepository;
		}

		public async Task<ServiceResult> GetDigitalFormTemplateRoleByIdAsync(string roleId)
		{
			try
			{
				var docTemplateRole = await _docroleRepository.GetDigitalFormTemplateRoleAsync(roleId);
				if (docTemplateRole == null)
				{
					return new ServiceResult("An error occurred while getting document template role");
				}

				return new ServiceResult(docTemplateRole, "Successfully recieved document template role");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetDigitalFormTemplateRoleByIdAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while getting document template role");
		}

		public async Task<ServiceResult> GetDigitalFormTemplateRoleListByTemplateIdAsync(string templateId)
		{
			try
			{
				var docTemplateRole = await _docroleRepository.GetDigitalFormTemplateRoleListByTemplateIdAsync(templateId);
				if (docTemplateRole == null)
				{
					return new ServiceResult("An error occurred while getting document template role");
				}

				return new ServiceResult(docTemplateRole, "Successfully recieved document template role list");
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError(ex, ex.Message);
				_logger.LogError("GetDigitalFormTemplateRoleListByTemplateIdAsync Exception :  {0}", ex.Message);
			}

			return new ServiceResult("An error occurred while getting document template role list");
		}
	}
}

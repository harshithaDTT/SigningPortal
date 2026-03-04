using Microsoft.AspNetCore.Mvc;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using SigningPortal.Web.Attributes;

namespace SigningPortal.Web.Controllers.APIControllers
{
	[Route("api")]
	[ApiController]
	[ServiceFilter(typeof(AuthorizeAttribute))]
	public class DelegateApiController : ApiBaseController
	{
		private readonly IDelegationService _delegatorService;

		public DelegateApiController(IDelegationService delegatorService)
		{
			_delegatorService = delegatorService;
		}

		[HttpGet]
		[Route("delegate/getdelegatedetails")]
		public async Task<IActionResult> GetDelegateDetails(string id)
		{
			var result = await _delegatorService.GetDelegateDetailsByIdAsync(id);

			if (result.Success && result.Result is Delegation delegation)
			{
				var newDelegationList = new DelegationDTO
				{
					_id = delegation._id,
					CreatedAt = delegation.CreatedAt,
					UpdatedAt = delegation.UpdatedAt,
					DelegatorName = delegation.DelegatorName,
					DelegatorSuid = delegation.DelegatorSuid,
					OrganizationId = delegation.OrganizationId,
					StartDateTime = delegation.StartDateTime,
					EndDateTime = delegation.EndDateTime,
					ConsentData = delegation.ConsentData,
					DelegationStatus = delegation.DelegationStatus,
					Delegatees = delegation.Delegatees?.Select(delegatee => new DelegateeDTO
					{
						_id = delegatee._id,
						CreatedAt = delegatee.CreatedAt,
						UpdatedAt = delegatee.UpdatedAt,
						DelegateeEmail = delegatee.DelegateeEmail,
						DelegateeSuid = delegatee.DelegateeSuid,
						DelegationId = delegatee.DelegationId,
						ConsentStatus = delegatee.ConsentStatus,
						FullName = delegatee.FullName,
						OrganizationId = delegatee.OrganizationId
					}).ToList() ?? new List<DelegateeDTO>()
				};

				return Ok(new APIResponse { Success = true, Message = result.Message, Result = newDelegationList });
			}

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpGet]
		[Route("delegate/getdelegatedetailsbyorgidandsuid")]
		public async Task<IActionResult> GetDelegateDetailsByOrgIdAndSuid(string organizationId, string suid)
		{
			var result = await _delegatorService.GetDelegateDetailsByOrgIdAndSuidAsync(organizationId, suid);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpGet]
		[Route("delegate/getdelegatelist")]
		public async Task<IActionResult> GetDelegatorList()
		{
			var result = await _delegatorService.GetDelegatesListByOrgIdAndSuidAsync(UserDetails());

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpGet]
		[Route("delegate/getnewdelegatelist")]
		public async Task<IActionResult> GetNewDelegatorList()
		{
			if (string.IsNullOrEmpty(UserDetails().OrganizationId))
			{
				return Ok(new APIResponse { Success = false, Message = "OrganizationId cannot be null or empty", Result = null });
			}
			if (string.IsNullOrEmpty(UserDetails().Suid))
			{
				return Ok(new APIResponse { Success = false, Message = "Suid cannot be null or empty", Result = null });
			}

			var result = await _delegatorService.GetNewDelegationListBySuidAndOrgIdAsync(UserDetails().Suid, UserDetails().OrganizationId);

			if (result.Success && result.Result is IList<Delegation> list)
			{
				var newDelegationList = list.Select(delegation => new DelegationDTO
				{
					_id = delegation._id,
					CreatedAt = delegation.CreatedAt,
					UpdatedAt = delegation.UpdatedAt,
					DelegatorName = delegation.DelegatorName,
					DelegatorSuid = delegation.DelegatorSuid,
					OrganizationId = delegation.OrganizationId,
					StartDateTime = delegation.StartDateTime,
					EndDateTime = delegation.EndDateTime,
					ConsentData = delegation.ConsentData,
					DelegationStatus = delegation.DelegationStatus,
					Delegatees = delegation.Delegatees?.Select(delegatee => new DelegateeDTO
					{
						_id = delegatee._id,
						CreatedAt = delegatee.CreatedAt,
						UpdatedAt = delegatee.UpdatedAt,
						DelegateeEmail = delegatee.DelegateeEmail,
						DelegateeSuid = delegatee.DelegateeSuid,
						DelegationId = delegatee.DelegationId,
						ConsentStatus = delegatee.ConsentStatus,
						FullName = delegatee.FullName,
						OrganizationId = delegatee.OrganizationId
					}).ToList() ?? new List<DelegateeDTO>()
				}).ToList() ?? new List<DelegationDTO>();

				return Ok(new APIResponse { Success = true, Message = result.Message, Result = newDelegationList });
			}

			return Ok(new APIResponse { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpGet]
		[Route("delegate/getbusinessuserslist")]
		public async Task<IActionResult> GetBusinessUsersList()
		{
			var result = await _delegatorService.GetBusinessUsersListByOrgAsync(UserDetails());

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpGet]
		[Route("delegate/getreceiveddelegatelist")]
		public async Task<IActionResult> GetReceivedDelegateList()
		{
			if (string.IsNullOrEmpty(UserDetails().OrganizationId))
			{
				return Ok(new APIResponse { Success = false, Message = "OrganizationId cannot be null or empty", Result = null });
			}
			if (string.IsNullOrEmpty(UserDetails().Suid))
			{
				return Ok(new APIResponse { Success = false, Message = "Suid cannot be null or empty", Result = null });
			}
			var result = await _delegatorService.GetReceivedDelegatesBySuidAndOrgIdAsync(UserDetails().Suid, UserDetails().OrganizationId);

			if (result.Success && result.Result is IList<Delegation> list)
			{
				var newDelegationList = list.Select(delegation => new DelegationDTO
				{
					_id = delegation._id,
					CreatedAt = delegation.CreatedAt,
					UpdatedAt = delegation.UpdatedAt,
					DelegatorName = delegation.DelegatorName,
					DelegatorSuid = delegation.DelegatorSuid,
					OrganizationId = delegation.OrganizationId,
					StartDateTime = delegation.StartDateTime,
					EndDateTime = delegation.EndDateTime,
					ConsentData = delegation.ConsentData,
					DelegationStatus = delegation.DelegationStatus,
					Delegatees = delegation.Delegatees?.Select(delegatee => new DelegateeDTO
					{
						_id = delegatee._id,
						CreatedAt = delegatee.CreatedAt,
						UpdatedAt = delegatee.UpdatedAt,
						DelegateeEmail = delegatee.DelegateeEmail,
						DelegateeSuid = delegatee.DelegateeSuid,
						DelegationId = delegatee.DelegationId,
						ConsentStatus = delegatee.ConsentStatus,
						FullName = delegatee.FullName,
						OrganizationId = delegatee.OrganizationId
					}).ToList() ?? new List<DelegateeDTO>()
				}).ToList() ?? new List<DelegationDTO>();

				return Ok(new APIResponse { Success = true, Message = result.Message, Result = newDelegationList });
			}

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpPost]
		[Route("delegate/revokedelegate")]
		public async Task<IActionResult> RevokeDelegate(string id)
		{
			var result = await _delegatorService.RevokeDelegateAsync(id);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpPost]
		[Route("delegate/savedelegate")]
		[IgnoreAntiforgeryToken]
		public async Task<IActionResult> SaveNewDocument([FromForm] SaveDelegatorDTO newDelegate)
		{
			var result = await _delegatorService.SaveDelegatorAsync(newDelegate, UserDetails());

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpPost]
		[Route("delegate/savenewdelegate")]
		[IgnoreAntiforgeryToken]
		public async Task<IActionResult> SaveNewDelegate([FromForm] SaveDelegatorDTO newDelegate)
		{
			var result = await _delegatorService.SaveNewDelegatorAsync(newDelegate, UserDetails());

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpPost]
		[Route("delegate/delegateeaction")]
		public async Task<IActionResult> DelegateeAction(DelegateeActionDTO delegateeAction)
		{
			var result = await _delegatorService.DelegateeActionAsync(delegateeAction);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpPost]
		[Route("delegate/delegatoraction")]
		public async Task<IActionResult> DelegatorAction(DelegatorActionDTO delegateeAction)
		{
			var result = await _delegatorService.DelegatorActionAsync(delegateeAction);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}
	}
}

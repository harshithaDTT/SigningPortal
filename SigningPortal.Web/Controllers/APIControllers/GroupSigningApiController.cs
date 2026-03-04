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
	public class GroupSigningApiController : ApiBaseController
	{
		private readonly IGroupSigningService _groupSigningService;
		public GroupSigningApiController(IGroupSigningService groupSigningService)
		{
			_groupSigningService = groupSigningService;
		}

		[HttpPost]
		[Route("group-signing/saveandsign")]
		public async Task<IActionResult> SaveAndSignGroupRequestAsync(GroupSigningRequestDTO request)
		{
			if (request == null)
			{
				return Ok(new APIResponse() { Success = false, Message = "Request cannot be null" });
			}
			if (request.DocumentIds == null || request.DocumentIds.Count == 0)
			{
				return Ok(new APIResponse() { Success = false, Message = "Document Id cannot be null or empty" });
			}
			if (string.IsNullOrEmpty(request.AcToken))
			{
				return Ok(new APIResponse() { Success = false, Message = "AccessToken cannot be null or empty" });
			}

			var result = await _groupSigningService.SaveAndSignGroupRequestAsync
				(request.DocumentIds, request.Transaction, UserDetails(), request.AcToken, request.Auth);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpPost]
		[Route("group-signing/retrygroupsign")]
		public async Task<IActionResult> RetryGroupSigningRequestAsync(RetryGroupSigningRequestDTO request)
		{
			if (request == null)
			{
				return Ok(new APIResponse() { Success = false, Message = "Request cannot be null" });
			}
			if (request.GroupSigning == null)
			{
				return Ok(new APIResponse() { Success = false, Message = "GroupSigning cannot be null" });
			}
			if (request.DocumentIds == null || request.DocumentIds.Count == 0)
			{
				return Ok(new APIResponse() { Success = false, Message = "Document Id cannot be null or empty" });
			}
			if (string.IsNullOrEmpty(request.AcToken))
			{
				return Ok(new APIResponse() { Success = false, Message = "AccessToken cannot be null or empty" });
			}

			var result = await _groupSigningService.RetryGroupSigningRequestAsync
				(request.GroupSigning, request.DocumentIds, UserDetails(), request.AcToken, request.Auth);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpGet]
		[Route("group-signing/signingrequest/{requestId}")]
		public async Task<IActionResult> GetGroupSigningRequestByIdAsync(string requestId)
		{
			if (string.IsNullOrEmpty(requestId))
			{
				return Ok(new APIResponse() { Success = false, Message = "Group Signing request id cannot be null or empty" });
			}

			var result = await _groupSigningService.GetGroupSigningRequestByIdAsync(requestId);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpGet]
		[Route("group-signing/groupsignlist")]
		public async Task<IActionResult> GetGroupSigningListAsync()
		{
			var result = await _groupSigningService.GetGroupSigningListAsync(UserDetails());

			if (result.Success && result.Result is List<GroupSigning> groupSignings)
			{
				var list = groupSignings.Select(group => new GroupSigningListDTO
				{
					_id = group._id,
					CreatedAt = group.CreatedAt,
					UpdatedAt = group.UpdatedAt,
					SignerSuid = group.SignerSuid,
					SignerOrganizationId = group.SignerOrganizationId,
					Transaction = group.Transaction,
					Status = group.Status,
					SuccessFileCount = group.SuccessFileCount,
					FailedFileCount = group.FailedFileCount,
					TotalFileCount = group.TotalFileCount,
				}).ToList();

				return Ok(new APIResponse
				{
					Success = true,
					Message = result.Message,
					Result = list
				});
			}

			return Ok(new APIResponse
			{
				Success = result.Success,
				Message = result.Message,
				Result = result.Result
			});
		}

		[HttpGet]
		[Route("group-signing/groupsignstatus/{requestId}")]
		public async Task<IActionResult> GroupSigningStatusAsync(string requestId)
		{
			if (string.IsNullOrEmpty(requestId))
			{
				return Ok(new APIResponse() { Success = false, Message = "Group Signing request id cannot be null or empty" });
			}

			var result = await _groupSigningService.GroupSigningStatusAsync(requestId);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpGet]
		[Route("group-signing/updategroupsignstatus/{requestId}")]
		public async Task<IActionResult> UpdateGroupSigningStatusAsync(string requestId)
		{
			if (string.IsNullOrEmpty(requestId))
			{
				return Ok(new APIResponse() { Success = false, Message = "Group Signing request id cannot be null or empty" });
			}

			var result = await _groupSigningService.UpdateGroupSigningStatusAsync(requestId);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}
	}
}

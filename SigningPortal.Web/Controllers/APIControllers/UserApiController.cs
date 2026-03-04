using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using SigningPortal.Web.Attributes;

namespace SigningPortal.Web.Controllers.APIControllers
{
	[Route("api")]
	[ApiController]
	[ServiceFilter(typeof(AuthorizeAttribute))]
	public class UserApiController : ApiBaseController
	{
		private readonly IUserService _userService;
		public UserApiController(IUserService userService)
		{
			_userService = userService;
		}

		[HttpGet]
		[Route("getorganizationemaillist")]
		public async Task<IActionResult> GetOrganizationEmailList(string orgID)
		{
			var result = await _userService.GetOrganizationEmailListAsync(orgID);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpGet]
		[Route("getalluseremaillist")]
		public async Task<IActionResult> GetAllUserEmailList(string value)
		{
			var result = await _userService.SearchUserEmailListAsync(value);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}


		[HttpGet]
		[Route("getSubscriberOrgDetailsByEmail")]
		public async Task<IActionResult> GetSubscriberOrgnizationListByEmail(string email)
		{
			var result = await _userService.GetSubscriberOrgnizationListByEmailAsync(email);

			if (result.Success && result.Result is string json && !string.IsNullOrEmpty(json))
			{
				var signs = JsonConvert.DeserializeObject<SignatoriesDTO>(json);

				if (signs != null)
				{
					var mappedResult = new SignatoriesNewDTO
					{
						userProfile = new UserProfileNewDTO
						{
							ugpassEmail = signs.userProfile.ugpassEmail,
							suid = signs.userProfile.suid,
							name = signs.userProfile.name,
							emailList = signs.userProfile.emailList,
							status = signs.userProfile.status
						},
						orgDtos = signs.orgDtos.Select(org => new OrgDetailsNewDTO
						{
							orgUid = org.orgUid,
							orgName = org.orgName,
							employee_list = org.employee_list ?? new List<string>(),
							eseal_employee_list = org.eseal_employee_list ?? new List<string>(),
							has_eseal_permission = org.has_eseal_permission
						}).ToList()
					};

					return Ok(new APIResponse
					{
						Success = true,
						Message = result.Message,
						Result = mappedResult
					});
				}
			}

			return Ok(new APIResponse
			{
				Success = result.Success,
				Message = result.Message,
				Result = result.Result
			});
		}


		[HttpGet]
		[Route("getblockeduseremaillist")]
		public async Task<IActionResult> GetBlockedUserEmailList()
		{
			var result = await _userService.BlockedUserEmailListAsync(Email);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpPost]
		[Route("checkusersidp")]
		public async Task<IActionResult> CheckIDPUsers(CheckIdpUserDTO emailList)
		{
			var result = await _userService.CheckIDPUsersAsync(emailList, Email);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}

		[HttpPost]
		[Route("blockunblockuser")]
		public async Task<IActionResult> BlockUnblockUser(BlockUnblockUserDTO blockUnblockUser)
		{
			var result = await _userService.UpdateUserBlockListAsync(Email, blockUnblockUser);

			return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
		}
	}
}

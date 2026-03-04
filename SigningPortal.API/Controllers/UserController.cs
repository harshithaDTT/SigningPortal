using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

using SigningPortal.API.Attributes;

using SigningPortal.Core;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Domain.Services;

namespace SigningPortal.API.Controllers
{
    [Route("api")]
    [ApiController] 
    [ServiceFilter(typeof(AuthorizeAttribute))]
    public class UserController : BaseController
    {
        private readonly IUserService _userService;
        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        [Route("getorganizationemaillist")]
        public async Task<IActionResult> GetOrganizationEmailList(string orgID)
        {
            APIResponse response = null;

            var result = await _userService.GetOrganizationEmailListAsync(orgID);
            if (!result.Success)
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }
            else
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }

            return Ok(response);
        }

        [HttpGet]
        [Route("getalluseremaillist")]
        public async Task<IActionResult> GetAllUserEmailList(string value)
        {
            APIResponse response = null;

            var result = await _userService.SearchUserEmailListAsync(value);
            if (!result.Success)
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }
            else
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result.ToString()
                };
            }

            return Ok(response);
        }


        [HttpGet]
        [Route("getSubscriberOrgDetailsByEmail")]
        public async Task<IActionResult> GetSubscriberOrgnizationListByEmail(string email)
        {
            APIResponse response = null;

            var result = await _userService.GetSubscriberOrgnizationListByEmailAsync(email);
            if (!result.Success)
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }
            else
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result.ToString()
                };
            }

            return Ok(response);
        }


        [HttpGet]
        [Route("getblockeduseremaillist")]
        public async Task<IActionResult> GetBlockedUserEmailList()
        {
            APIResponse response = null;

            var result = await _userService.BlockedUserEmailListAsync(Email);
            if (!result.Success)
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }
            else
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }

            return Ok(response);
        }

        [HttpPost]
        [Route("checkusersidp")]
        public async Task<IActionResult> CheckIDPUsers(CheckIdpUserDTO emailList)
        {
            APIResponse response = null;

            var result = await _userService.CheckIDPUsersAsync(emailList, Email);
            if (!result.Success)
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }
            else
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result.ToString()
                };
            }

            return Ok(response);
        }

        [HttpPost]
        [Route("blockunblockuser")]
        public async Task<IActionResult> BlockUnblockUser(BlockUnblockUserDTO blockUnblockUser)
        {
            APIResponse response = null;

            var result = await _userService.UpdateUserBlockListAsync(Email, blockUnblockUser);
            if (!result.Success)
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }
            else
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    Result = result.Result
                };
            }

            return Ok(response);
        }
    }
}

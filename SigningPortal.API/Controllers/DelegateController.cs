
using Microsoft.AspNetCore.Mvc;
using SigningPortal.API.Attributes;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.DTOs;
using System.Threading.Tasks;

namespace SigningPortal.API.Controllers
{
    [Route("api")]
    [ApiController]
    [ServiceFilter(typeof(AuthorizeAttribute))]
    public class DelegateController : BaseController
    {
        private readonly IDelegationService _delegatorService;

        public DelegateController(IDelegationService delegatorService)
        {
            _delegatorService = delegatorService;
        }

        [HttpGet]
        [Route("delegate/getdelegatedetails")]
        public async Task<IActionResult> GetDelegateDetails(string id)
        {
            APIResponse response;

            var result = await _delegatorService.GetDelegateDetailsByIdAsync(id);
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
        [Route("delegate/getdelegatedetailsbyorgidandsuid")]
        public async Task<IActionResult> GetDelegateDetailsByOrgIdAndSuid(string organizationId, string suid)
        {
            APIResponse response;

            var result = await _delegatorService.GetDelegateDetailsByOrgIdAndSuidAsync(organizationId, suid);
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
        [Route("delegate/getdelegatelist")]
        public async Task<IActionResult> GetDelegatorList()
        {
            APIResponse response;

            var result = await _delegatorService.GetDelegatesListByOrgIdAndSuidAsync(UserDetails());
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
        [Route("delegate/getbusinessuserslist")]
        public async Task<IActionResult> GetBusinessUsersList()
        {
            APIResponse response;

            var result = await _delegatorService.GetBusinessUsersListByOrgAsync(UserDetails());
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

        //[HttpGet]
        //[Route("delegate/getreceiveddelegatelist")]
        //public async Task<IActionResult> GetReceivedDelegateList(string suid)
        //{
        //    APIResponse response;

        //    var result = await _delegatorService.GetReceivedDelegatesBySuid(suid);
        //    if (!result.Success)
        //    {
        //        response = new APIResponse
        //        {
        //            Success = result.Success,
        //            Message = result.Message,
        //            Result = result.Result
        //        };
        //    }
        //    else
        //    {
        //        response = new APIResponse
        //        {
        //            Success = result.Success,
        //            Message = result.Message,
        //            Result = result.Result
        //        };
        //    }

        //    return Ok(response);
        //}

        [HttpPost]
        [Route("delegate/revokedelegate")]
        public async Task<IActionResult> RevokeDelegate(string id)
        {
            APIResponse response;

            var result = await _delegatorService.RevokeDelegateAsync(id);
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
        [Route("delegate/savedelegate")]
        public async Task<IActionResult> SaveNewDocument([FromForm] SaveDelegatorDTO newDelegate)
        {
            APIResponse response;

            var result = await _delegatorService.SaveDelegatorAsync(newDelegate, UserDetails());
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
        [Route("delegate/delegateeaction")]
        public async Task<IActionResult> DelegateeAction(DelegateeActionDTO delegateeAction)
        {
            APIResponse response;

            var result = await _delegatorService.DelegateeActionAsync(delegateeAction);
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

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
    public class NotificationController : BaseController
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        [Route("notifications/ClearAll")]
        public async Task<IActionResult> ClearAllNotifications()
        {
            APIResponse response = null;

            var result = await _notificationService.ClearAllNotificationsByReceiver(Suid, OrganizationId);
            if (!result.Success)
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message
                };
            }
            else
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message
                };
            }

            return Ok(response);
        }

        [HttpGet]
        [Route("notifications")]
        public async Task<IActionResult> GetNotificationByEmail()
        {
            APIResponse response = null;

            var result = await _notificationService.GetNotificationByEmailAsync(Suid, OrganizationId);
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

        [HttpPut]
        [Route("update-notifications/{id}")]
        public async Task<IActionResult> Update(string id)
        {
            APIResponse response = null;

            var result = await _notificationService.UpdateNotificationById(id);
            if (!result.Success)
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message
                };
            }
            else
            {
                response = new APIResponse
                {
                    Success = result.Success,
                    Message = result.Message
                };
            }

            return Ok(response);
        }

        //[HttpPost]
        //[Route("create-notifications")]
        //public async Task<IActionResult> Create(NotificationDTO notification)
        //{
        //    APIResponse response;
        //    var result = await _notificationService.CreateNotificationAsync(notification, OrganizationId);

        //    if (!result.Success)
        //    {
        //        response = new APIResponse
        //        {
        //            Success = result.Success,
        //            Message = result.Message
        //        };
        //    }
        //    else
        //    {
        //        response = new APIResponse
        //        {
        //            Success = result.Success,
        //            Message = result.Message
        //        };
        //    }

        //    return Ok(response);
        //}
    }
}

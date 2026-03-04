using Microsoft.AspNetCore.Mvc;
using SigningPortal.API.Attributes;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Services;
using System.Threading.Tasks;

namespace SigningPortal.API.Controllers
{
    [Route("api")]
    [ApiController]
    [ServiceFilter(typeof(AuthorizeAttribute))]
    public class PaymentController : BaseController
    {

        public readonly IPaymentService _paymentService;
        public PaymentController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpGet]
        [Route("GetCreditDetails")]
        public async Task<IActionResult> GetPaymentDetails()
        {
            APIResponse response;

            var result = await _paymentService.GetCreditDeatails(UserDetails());
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
        [Route("GetCreditAvailable")]
        public async Task<IActionResult> GetPayment()
        {
            APIResponse response;

            var result = await _paymentService.IsCreditAvailable(UserDetails(),false);
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

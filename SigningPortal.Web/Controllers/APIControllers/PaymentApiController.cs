using Microsoft.AspNetCore.Mvc;
using SigningPortal.Core;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Web.Attributes;
using SigningPortal.Web.Controllers.APIControllers;

namespace SigningPortal.Web.Controllers
{
    [Route("api")]
    [ApiController]
    [ServiceFilter(typeof(AuthorizeAttribute))]
    public class PaymentApiController : ApiBaseController
    {

        public readonly IPaymentService _paymentService;
        public PaymentApiController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpGet]
        [Route("GetCreditDetails")]
        public async Task<IActionResult> GetPaymentDetails()
        {
            var result = await _paymentService.GetCreditDeatails(UserDetails());

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }

        [HttpGet]
        [Route("GetCreditAvailable")]
        public async Task<IActionResult> GetPayment()
        {
            var result = await _paymentService.IsCreditAvailable(UserDetails(), false);

            return Ok(new APIResponse() { Success = result.Success, Message = result.Message, Result = result.Result });
        }
    }
}

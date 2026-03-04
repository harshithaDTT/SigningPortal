using Microsoft.AspNetCore.Mvc;
using SigningPortal.Web.Controllers.APIControllers;

namespace SigningPortal.Web.Controllers
{
    [Route("api/status")]
    [ApiController]
    public class StatusApiController : ApiBaseController
    {
        [HttpGet]
        public IActionResult Index()
        {
            return Ok();
        }
    }
}

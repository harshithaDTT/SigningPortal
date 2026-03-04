using Microsoft.AspNetCore.Mvc;

namespace SigningPortal.API.Controllers
{
    [Route("api/status")]
    [ApiController]
    public class StatusController : Controller
    {
        [HttpGet]
        public IActionResult Index()
        {
            return Ok();
        }
    }
}

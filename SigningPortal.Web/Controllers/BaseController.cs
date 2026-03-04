using Microsoft.AspNetCore.Mvc;
using Microsoft.Graph;
using Newtonsoft.Json;
using SigningPortal.Core.DTOs;
using System.Security.Claims;

namespace SigningPortal.Web.Controllers
{
    public class BaseController : Controller
    {
        protected UserDTO UserDetails()
        {
            //var nameClaim = HttpContext.User.Claims.FirstOrDefault(c => c.Type == "user").Value;
            return JsonConvert.DeserializeObject<UserDTO>(HttpContext.User.Claims.FirstOrDefault(c => c.Type == "user").Value);
        }
        public string Name
        {
            get { return UserDetails().Name; }
        }

        public string Suid
        {
            get { return UserDetails().Suid; }
        }

        public string Email
        {
            get { return UserDetails().Email.ToLower(); }
        }
        public string OrganizationId
        {
            get { return UserDetails().OrganizationId.ToLower(); }
        }

        public string AccessToken
        {
            get { return HttpContext.User.Claims.FirstOrDefault(c => c.Type == "apiToken").Value; }
        }

        public string IdpToken
        {
            get { return HttpContext.User.Claims.FirstOrDefault(c => c.Type == "ID_Token").Value; }
        }
    }
}

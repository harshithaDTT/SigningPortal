using Newtonsoft.Json;
using Microsoft.AspNetCore.Mvc;

using SigningPortal.Core.DTOs;
using System.Linq;

namespace SigningPortal.API.Controllers
{
    public class BaseController : ControllerBase
    {
        protected UserDTO UserDetails()
        {
            return JsonConvert.DeserializeObject<UserDTO>(HttpContext.Items["User"].ToString().ToLower());
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
    }
}

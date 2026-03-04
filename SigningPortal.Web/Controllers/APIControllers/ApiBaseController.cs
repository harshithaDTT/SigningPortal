using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using SigningPortal.Core.DTOs;

namespace SigningPortal.Web.Controllers.APIControllers
{
    public class ApiBaseController : ControllerBase
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

        public string AccessToken
        {
            get { return HttpContext.Items["apiToken"].ToString(); }
        }

    }
}

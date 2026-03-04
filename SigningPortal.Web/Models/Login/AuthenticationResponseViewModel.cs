using SigningPortal.Core.Domain.Services.Communication.Authentication;

namespace SigningPortal.Web.Models.Login
{
    public class AuthenticationResponseViewModel
    {
        public string Name { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string AccessToken { get; set; }
        public string IdpToken { get; set; }
        public string Suid { get; set; }
        public string LastLogin { get; set; }
        public string AllowAccountSelection { get; set; }
        public string AllowSelfAccountSelection { get; set; }
        public string OrganizationId { get; set; }
        public string OrganizationName { get; set; }

        public IList<OrganizationDetails> OrgDetailsList { get; set; } = new List<OrganizationDetails>();
        public IList<string> SelfEmails { get; set; }
        public int expires_in { get; set; }
    }
}

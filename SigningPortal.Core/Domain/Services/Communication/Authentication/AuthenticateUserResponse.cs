using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Services.Communication.Authentication
{
	public class AuthenticateUserResponse
	{
		public string name { get; set; } = null;

		public string firstName { get; set; } = null;

		public string lastName { get; set; } = null;

		public string email { get; set; } = null;

		public string documentNumber { get; set; } = null;

		public string accessToken { get; set; } = null;

		public string idp_token { get; set; } = null;

		public string suid { get; set; } = null;

		public string last_login { get; set; } = null;

		public bool allowAccountSelection { get; set; } = true;

		public bool allowSelfAccountSelection { get; set; } = true;

		public string orgnizationId { get; set; } = null;

		public string orgnizationName { get; set; } = null;


		public IList<OrganizationDetails> OrgDetailsList { get; set; } = new List<OrganizationDetails>();

		public IList<string> SelfEmails { get; set; }
		public int expires_in { get; set; }

	}
}

using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Services.Communication.Authentication
{
	public class GetApiAccessResponse
	{
		public string accessToken { get; set; }
		public string apiToken { get; set; }
		public int expires_in { get; set; }

		public IList<OrganizationDetails> OrgDetailsList { get; set; } = new List<OrganizationDetails>();
	}
}

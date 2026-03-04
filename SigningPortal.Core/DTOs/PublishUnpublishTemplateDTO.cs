using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class PublishUnpublishTemplateDTO
	{
		public string TemplateId { get; set; }
		public string Action { get; set; }

		public Dictionary<string, RoleUserDetails> RoleData { get; set; }
	}

	public class RoleUserDetails
	{
		public string Suid { get; set; }
		public string OrganizationId { get; set; }
		public string OrganizationName { get; set; }
		public string Email { get; set; }
		public string DelegationId { get; set; }
	}
}

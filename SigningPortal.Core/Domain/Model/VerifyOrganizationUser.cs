namespace SigningPortal.Core.Domain.Model
{
	public class VerifyOrganizationUser
	{
		public string Email { get; set; }

		public string OrgId { get; set; }

		public int TemplateId { get; set; }
	}
}

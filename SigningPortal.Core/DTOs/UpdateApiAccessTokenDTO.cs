namespace SigningPortal.Core.DTOs
{
	public class UpdateApiAccessTokenDTO
	{
		public string Email { get; set; }

		public string OrganizationName { get; set; }

		public string OrganizationId { get; set; }

		public string AccountType { get; set; }
	}
}

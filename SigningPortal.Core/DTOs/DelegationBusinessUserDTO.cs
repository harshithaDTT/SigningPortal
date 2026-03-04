namespace SigningPortal.Core.DTOs
{
	public class DelegationBusinessUserDTO
	{
		public string FullName { get; set; }
		public string Suid { get; set; }
		public string Email { get; set; }
		public string ThumbNailUri { get; set; }
		public string OrganizationEmail { get; set; }
		public bool HasEseal { get; set; }
	}
}

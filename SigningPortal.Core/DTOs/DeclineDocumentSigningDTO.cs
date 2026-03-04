namespace SigningPortal.Core.DTOs
{
	public class DeclineDocumentSigningDTO
	{
		public string Comment { get; set; }

		public string UserEmail { get; set; }

		public string Suid { get; set; }

		public string UserName { get; set; }

		public string acToken { get; set; } = null;

	}
}

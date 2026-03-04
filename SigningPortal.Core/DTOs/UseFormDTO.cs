namespace SigningPortal.Core.DTOs
{
	public class UseFormDTO
	{
		public string type { get; set; }
		public string idpToken { get; set; }
		public string suid { get; set; }
		public string id { get; set; }
	}

	public class RequestFormDTO
	{

		public string type { get; set; }

		public string tempId { get; set; }

		public string edmsId { get; set; }

		public string Suid { get; set; }

		public string docuid { get; set; }

		public string OrganizationId { get; set; }

		public string Status { get; set; }

		public bool isfillable { get; set; }

	}

}

using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class IDPUserDTO
	{
		public string suid { get; set; }
		public string name { get; set; }
		public string gender { get; set; }
		public string birthdate { get; set; }
		public string email { get; set; }
		public string sub { get; set; }
		public string phone { get; set; }
		public string id_document_type { get; set; }
		public string id_document_number { get; set; }
		public string loa { get; set; }
		public string country { get; set; }
		public string login_type { get; set; }
		public string profile_image { get; set; } = string.Empty;

		public IList<LoginProfile> login_profile { get; set; }
	}

	public class LoginProfile
	{
		public string Email { get; set; }
		public string OrgnizationId { get; set; }

	}
}

using SigningPortal.Core.Domain.Services.Communication.Documents;

namespace SigningPortal.Core.DTOs
{
	public class DocDisplayDTO
	{
		public string DocumentName { get; set; }

		public string OwnerEmail { get; set; }

		public string OwnerName { get; set; }

		public string Status { get; set; }

		public int SignatoryCount { get; set; }

		public VerifySigningRequestResponse VerificationDetails { get; set; }

		public string Document { get; set; }

		//public IList<UserDetails> SignerDetails { get; set; } = new List<UserDetails>();
	}
	public class UserDetails
	{
		public string Name { get; set; }
		public string Email { get; set; }
	}
}

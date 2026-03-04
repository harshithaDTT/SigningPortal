using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class GroupSigningRequestDTO
	{
		public List<string> DocumentIds { get; set; } = [];
		public string Transaction { get; set; }
		public string AcToken { get; set; }
		public GroupSigningAuthDTO Auth { get; set; } = null;
	}

	public class RetryGroupSigningRequestDTO
	{
		public GroupSigning GroupSigning { get; set; }
		public List<string> DocumentIds { get; set; } = [];
		public string AcToken { get; set; }
		public GroupSigningAuthDTO Auth { get; set; } = null;
	}
}

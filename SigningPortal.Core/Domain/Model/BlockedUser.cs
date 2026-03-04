using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Model
{
	[BsonCollection("BlockedUser")]
	public class BlockedUser : BaseEntity
	{
		public string Email { get; set; }

		public IList<string> BlockedEmailList { get; set; } = new List<string>();

		public IList<string> BlockedDomainList { get; set; } = new List<string>();
	}
}

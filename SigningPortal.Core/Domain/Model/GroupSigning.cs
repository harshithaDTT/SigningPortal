using System;
using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Model
{
	[Serializable]
	[BsonCollection("GroupSigning")]
	public class GroupSigning : BaseEntity
	{
		public string SignerSuid { get; set; }

		public string SignerOrganizationId { get; set; } = string.Empty;

		public string Transaction { get; set; }

		public bool IsMobile { get; set; } = false;

		public IList<SigningGroup> SigningGroups { get; set; } = new List<SigningGroup>();

		public string Status { get; set; }

		public int TotalFileCount { get; set; }

		public int FailedFileCount { get; set; }

		public int SuccessFileCount { get; set; }

	}

	public class SigningGroup
	{
		public string DocumentId { get; set; }

		public string DocumentStatus { get; set; }

		public string DocumentName { get; set; }

		public string RecepientId { get; set; }

		public string RecepientStatus { get; set; }

		public string CorelationId { get; set; }

		public string FailureReason { get; set; } = string.Empty;
	}
}

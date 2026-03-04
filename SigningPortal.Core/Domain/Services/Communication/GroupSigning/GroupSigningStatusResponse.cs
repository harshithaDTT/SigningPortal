using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Services.Communication.GroupSigning
{
	public class GroupSigningStatusResponse
	{
		public string GroupId { get; set; }
		public int TotalFileCount { get; set; }
		public int FailedFileCount { get; set; }
		public int SuccessFileCount { get; set; }
		public IList<GroupSigningDocumentStatus> GroupSignStatus { get; set; } = new List<GroupSigningDocumentStatus>();
	}

	public class GroupSigningDocumentStatus
	{
		public string DocumentId { get; set; }
		public string DocumentName { get; set; }
		public string Status { get; set; }
		public string FailureReason { get; set; } = string.Empty;
	}
}

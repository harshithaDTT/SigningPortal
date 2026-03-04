using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Services.Communication.Documents
{
	public class PendingActionListResponse
	{
		public PendingActionList Docs_data { get; set; }

	}

	public class PendingActionList

	{
		public IList<Document> ActionRequiredDocs { get; set; }

		public IList<Document> CompletedDocs { get; set; }
	}
}

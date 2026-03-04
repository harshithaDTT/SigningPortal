using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Services.Communication.Documents
{
	public class AllDocumentsResponse
	{
		public IList<Document> data { get; set; }

		public int allowed_no_of_files { get; set; }
	}
}

using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class ExpiringSoonDocumentListDTO
	{
		public IList<Document> ExpiringSoonDocs { get; set; }
	}
}

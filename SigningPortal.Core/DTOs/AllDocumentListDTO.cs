using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class AllDocumentListDTO
	{
		public List<Document> DraftList { get; set; } = new List<Document>();
		public List<Document> SendList { get; set; } = new List<Document>();
		public List<Document> ReceivedList { get; set; } = new List<Document>();
		public List<Document> ReferredList { get; set; } = new List<Document>();
	}
}

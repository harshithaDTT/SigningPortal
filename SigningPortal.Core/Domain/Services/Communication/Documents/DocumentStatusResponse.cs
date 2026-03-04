using System.Collections.Generic;
using DocumentFormat.OpenXml.Office2010.ExcelAc;
using SigningPortal.Core.Domain.Model;

namespace SigningPortal.Core.Domain.Services.Communication.Documents
{
	public class DocumentStatusResponse
	{
		public DashboardDocumentStatusResponse ownDocumentStatus { get; set; }
		public OtherDocumentStatusResponse otherDocumentStatus { get; set; }
        public List<Document>? actionRequiredList { get; set; }
    }
}

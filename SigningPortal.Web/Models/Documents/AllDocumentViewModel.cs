using SigningPortal.Core.Domain.Model;

namespace SigningPortal.Web.Models.Documents
{
    public class AllDocumentViewModel
    {
        public IList<Document> draftDocuments { get; set; }
        public IList<Document> sentDocuments { get; set; }
        public IList<Document> receivedDocuments { get; set; }
        public IList<Document> refferedDocuments { get; set; }
    }
}

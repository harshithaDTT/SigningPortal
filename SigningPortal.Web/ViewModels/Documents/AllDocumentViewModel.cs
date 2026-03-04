using SigningPortal.Core.Domain.Model;
using SigningPortal.Web.ViewModels.Documents;

namespace SigningPortal.Web.ViewModels.Documents
{
    public class AllDocumentViewModel
    {
        public IList<Document> draftDocuments { get; set; }
        public IList<Document> sentDocuments { get; set; }
        public IList<Document> receivedDocuments { get; set; }
        public IList<Document> refferedDocuments { get; set; }
    }
}

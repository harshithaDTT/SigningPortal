namespace SigningPortal.Web.ViewModels.BulkSign;
    using SigningPortal.Core.Domain.Model;

    public class AllBulkSignTemplatesListViewModel
    {
        
            public IList<BulkSign> draftDocuments { get; set; }
            public IList<BulkSign> sentDocuments { get; set; }
            public IList<BulkSign> receivedDocuments { get; set; }
            public IList<BulkSign> refferedDocuments { get; set; }
        
    }


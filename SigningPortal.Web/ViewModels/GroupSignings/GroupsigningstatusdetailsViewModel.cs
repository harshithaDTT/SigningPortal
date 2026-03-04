

namespace SigningPortal.Web.ViewModels.GroupSignings
{
    public class GroupsigningstatusdetailsViewModel
    {
        public string GroupId { get; set; }
        public int TotalFileCount { get; set; }
        public int FailedFileCount { get; set; }
        public int SuccessFileCount { get; set; }
        public IList<DocumentStatus> GroupSignStatus { get; set; } = new List<DocumentStatus>();
    }
    public class DocumentStatus
    {
        public string DocumentId { get; set; }
        public string DocumentName { get; set; }
        public string Status { get; set; }
    }

}

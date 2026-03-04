
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.DTOs;

namespace SigningPortal.Web.ViewModels.Documents
{
    public class DocumentDetailsViewModel
    {
        public string DocumentName { get; set; }
        public DateTime CreatedAt { get; set; }

        public DateTime ExpiredAt { get; set; }

        public DateTime CompleteTime { get; set; }

        public IList<User> PendingSignList { get; set; } = new List<User>();

        public IList<User> CompleteSignList { get; set; } = new List<User>();

        public int SignaturesRequiredCount { get; set; }

        public string Status { get; set; }
        public IList<Recepients> Recepients { get; set; }
        public int RecepientCount { get; set; }

        public string edmsId { get; set; }

        public string OwnerEmail { get; set;}

        public string docId { get; set;}

        public string DeclineRemark {  get; set; }

        public string AccountType { get; set; }

        public string OrganizationName { get; set; }

        public DocumentDetails DocumentDetails { get; set; }
        public List<SignatoryDetails> SignatoryDetails { get; set; }

        public string ViewName { get; set; }

        public bool DisableOrder { get; set; }

    }
}

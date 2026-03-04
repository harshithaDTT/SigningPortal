
using User = SigningPortal.Core.DTOs.User;
using DocumentReportResponse = SigningPortal.Core.Domain.Services.Communication.Documents.DocumentReportResponse;
namespace SigningPortal.Web.ViewModels.Documents
{
    public class DocumentStatusDetailsViewModel
    {

        public DocumentDetails DocumentDetails { get; set; }
        public List<SignatoryDetails> SignatoryDetails { get; set; }

        public string PdfLogo { get; set; }
    }
        public class DocumentDetails
        {
            public string DocumentName { get; set; }

            public string OwnerId { get; set; }

            public string OwnerName { get; set; }

            public string OwnerEmail { get; set; }

            public DateTime CreatedAt { get; set; }

            public DateTime CompletedAt { get; set; }

            public DateTime ExpireAt { get; set; }

            public string SignatureAnnotations { get; set; }

            public string EsealAnnotations { get; set; }

            public string QrCodeAnnotations { get; set; }

            public string SigningStatus { get; set; }

            public bool MultiSign { get; set; }

            public int RecepientCount { get; set; }

            public int MandatorySigns { get; set; }

            public bool DisableOrder { get; set; }

            public IList<User> PendingSignList { get; set; } = new List<User>();

            public IList<User> CompleteSignList { get; set; } = new List<User>();

            public Organization Organization { get; set; }
        }

        public class SignatoryDetails
        {
            public string RecepientSuid { get; set; }

            public string RecepientName { get; set; }

            public string RecepientEmail { get; set; }

            public int Order { get; set; }

            public bool Decline { get; set; }

            public string DeclineRemark { get; set; }

            public string SignStatus { get; set; }

            public DateTime SigningReqTime { get; set; }

            public DateTime SigningCompleteTime { get; set; }

            public bool SignatureMandatory { get; set; }

            public bool HasDelegation { get; set; }

            public List<DelegateeDetails> DelgationDetails { get; set; } = new List<DelegateeDetails>();

            public string SignedBy { get; set; }

            public string ReferredBy { get; set; } = string.Empty;

            public string ReferredTo { get; set; } = string.Empty;

            public bool AllowComments { get; set; }

            public Organization Organization { get; set; }
        }

        public class DelegateeDetails
        {
            public string DelegationId { get; set; }

            public DateTime StartDateTime { get; set; }

            public DateTime EndDateTime { get; set; }

            public string DelegateeSuid { get; set; }

            public string DelegateeEmail { get; set; }

            public string DelegateeName { get; set; }

            public string DelegationStatus { get; set; }

        }

        public class Organization
        {
            public string OrganizationName { get; set; }

            public string OrganizationId { get; set; }

            public string AccountType { get; set; }
        }
       
    }







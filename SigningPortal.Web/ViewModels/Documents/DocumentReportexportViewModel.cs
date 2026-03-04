

using System;
using System.Collections.Generic;
using User = SigningPortal.Core.DTOs.User;
namespace SigningPortal.Web.ViewModels.Documents
{
    public class DocumentReportexportViewModel
    {
        public DocumentDetail DocumentDetails { get; set; }
      
        public List<SignatoryDetail> SignatoryDetails { get; set; }

        public string ReportGeneration {  get; set; }

        public string pdflogoimage { get; set; }

    }

  
    public class DocumentDetail
    {
        public string DocumentName { get; set; }

        public string OwnerId { get; set; }

        public string OwnerName { get; set; }

        public string OwnerEmail { get; set; }

        public string? CreatedAt { get; set; }

        public string? CompletedAt { get; set; }

        public string? ExpireAt { get; set; }

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

    public class SignatoryDetail
    {
        public string RecepientSuid { get; set; }

        public string RecepientName { get; set; }

        public string RecepientEmail { get; set; }

        public IList<User> AlternateSignatories { get; set; } = new List<User>();


        public int Order { get; set; }

        public bool Decline { get; set; }

        public string DeclineRemark { get; set; }

        public User DeclinedBy { get; set; } = new User();

        public string SignStatus { get; set; }

        public string? SigningReqTime { get; set; }

        public string? SigningCompleteTime { get; set; }

        public bool Initial { get; set; }

        public bool SignatureMandatory { get; set; }

        public bool HasDelegation { get; set; }

        public List<DelegateeDetail> DelgationDetails { get; set; } = new List<DelegateeDetail>();

        public string SignedBy { get; set; }

        public string ReferredBy { get; set; } = string.Empty;

        public string ReferredTo { get; set; } = string.Empty;

        public bool AllowComments { get; set; }

        public Organization Organization { get; set; }
    }

    public class DelegateeDetail
    {
        public string DelegationId { get; set; }

        public DateTime StartDateTime { get; set; }

        public DateTime EndDateTime { get; set; }

        public string DelegateeSuid { get; set; }

        public string DelegateeEmail { get; set; }

        public string DelegateeName { get; set; }

        public string DelegationStatus { get; set; }

    }

   
}

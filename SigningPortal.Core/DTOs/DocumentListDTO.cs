using SigningPortal.Core.Domain.Model;
using System;
using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class DocumentListDTO : BaseEntity
	{
		public string DocumentName { get; set; }
		public string OwnerName { get; set; }
		public IList<string> RecepientName { get; set; } = new List<string>();
		public string Status { get; set; }
		public string SigningStatus { get; set; }
		public DateTime? ExpireDate { get; set; }
	}

    public class ActionRequiredDocumentListDTO : BaseEntity
    {
        public string DocumentName { get; set; }
        public string OwnerName { get; set; }
        public string OwnerEmail { get; set; }
        public bool MultiSign { get; set; }
        public bool DisableOrder { get; set; }
        public IList<ActionRequiredRecepientDTO> Recepients { get; set; }
        public IList<string> RecepientName { get; set; } = new List<string>();
        public IList<User> PendingSignList { get; set; } = new List<User>();
        public IList<User> CompleteSignList { get; set; } = new List<User>();
        public string Status { get; set; }
        public string SigningStatus { get; set; }
        public DateTime? ExpireDate { get; set; }
    }

	public class ActionRequiredRecepientDTO
	{
        public string Name { get; set; }
        public string Suid { get; set; }
        public string Email { get; set; }
        public string Status { get; set; }
        public int Order { get; set; }
        public bool TakenAction { get; set; }
        public string OrganizationName { get; set; }
        public string OrganizationId { get; set; }
        public IList<User> AlternateSignatories { get; set; } = new List<User>();
    }

    public class DocumentDTO : BaseEntity
	{
		public string DocumentName { get; set; }
		public string OwnerName { get; set; }
		public string OwnerEmail { get; set; }
		public string Status { get; set; }
		public string Annotations { get; set; }
		public int SignatureRequiredCount { get; set; }
		public string EsealAnnotations { get; set; }
		public string QrCodeAnnotations { get; set; }
		public DateTime? ExpireDate { get; set; }
		public bool DisableOrder { get; set; }
		public string EdmsId { get; set; }
		public IList<RecepientsDTO> Recepients { get; set; }
		public IList<User> PendingSignList { get; set; } = new List<User>();
		public IList<User> CompleteSignList { get; set; } = new List<User>();

	}

	public class RecepientsDTO : BaseEntity
	{
		public string Name { get; set; }
		public string Email { get; set; }
		public string Suid { get; set; }
		public string Status { get; set; }
		public int Order { get; set; }
        public string DeclineRemark { get; set; }
        public DateTime SigningCompleteTime { get; set; }
		public bool TakenAction { get; set; }
		public bool SignatureMandatory { get; set; }
		public bool HasDelegation { get; set; } = false;
		public bool AllowComments { get; set; }
		public string SignedBy { get; set; } = string.Empty;
		public int SignTemplate { get; set; } = 0;
		public int EsealTemplate { get; set; } = 0;
		public IList<User> AlternateSignatories { get; set; } = new List<User>();
	}
}

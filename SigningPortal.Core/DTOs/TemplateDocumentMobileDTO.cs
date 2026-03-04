using SigningPortal.Core.Domain.Model;
using System;
using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class TemplateDocumentMobileDTO : BaseEntity
	{
		public string Status { get; set; }

		public string FormTemplateName { get; set; }

		public string DocumentName { get; set; }

		public DateTime ExpieryDate { get; set; }

		public DateTime CompleteTime { get; set; }

		public string EdmsId { get; set; }

		public IList<User> PendingSignList { get; set; } = new List<User>();
	}

	public class TemplateDocumentMobileListDTO : BaseEntity
	{
		public User Owner { get; set; } = new();

		public string FormId { get; set; }

		public string TemplateType { get; set; }

		public string Status { get; set; }

		public string FormTemplateName { get; set; }

		public string DocumentName { get; set; }

		public string EdmsId { get; set; }

		public DateTime ExpieryDate { get; set; }

		public DateTime CompleteTime { get; set; }

		public IList<User> PendingSignList { get; set; } = new List<User>();

		public IList<TemplateRecepientMobileDTO> TemplateRecepients { get; set; }
	}

	public class TemplateRecepientMobileDTO : BaseEntity
	{
		public User Signer { get; set; } = new();
		public bool Decline { get; set; }
		public bool TakenAction { get; set; } = false;
		public bool SignatureMandatory { get; set; }
		public int Order { get; set; }
		public IList<User> AlternateSignatories { get; set; } = new List<User>();
	}
}

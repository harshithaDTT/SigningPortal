using System;
using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Model
{
	[Serializable]
	[BsonCollection("DigitalFormTemplate")]
	public class DigitalFormTemplate : BaseEntity
	{
		public string TemplateName { get; set; }

		public string OrganizationUid { get; set; }

		public string Email { get; set; }

		public string Suid { get; set; }

		public string ApplicableSubscriberType { get; set; }

		//public string FormGroupId { get; set; }

		public string FormType { get; set; }

		public int Order { get; set; }

		public string Status { get; set; }

		public string EdmsId { get; set; }

		public string DocumentName { get; set; }

		public string AdvancedSettings { get; set; }

		public string DaysToComplete { get; set; }

		public string NumberOfSignatures { get; set; }

		public bool AllSigRequired { get; set; }

		public bool PublishGlobally { get; set; }

		public bool SequentialSigning { get; set; }

		public List<string> SubmissionEmails { get; set; } = [];

		public string SubmissionUrl { get; set; } = string.Empty;

		public bool DataStorage { get; set; } = true;

		public string CreatedBy { get; set; }

		public string UpdatedBy { get; set; }

		public IList<DigitalFormTemplateRole> Roles { get; set; }

		public string Type { get; set; }

		public string HtmlSchema { get; set; }

		public string PdfSchema { get; set; }

		//public string Model { get; set; }
	}
}

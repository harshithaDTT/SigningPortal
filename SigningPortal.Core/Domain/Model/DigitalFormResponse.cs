using System;

namespace SigningPortal.Core.Domain.Model
{
	[Serializable]
	[BsonCollection("DigitalFormResponse")]
	public class DigitalFormResponse : BaseEntity
	{
		public string FormId { get; set; }

		public string FormTemplateName { get; set; }

		public string CorelationId { get; set; }

		public string Status { get; set; }

		public string SignerName { get; set; }

		public string SignerEmail { get; set; }

		public string SignerSuid { get; set; }

		public string DigitalFormRequestId { get; set; }

		public string FormFieldData { get; set; }

		public string AcToken { get; set; }

		public string EdmsId { get; set; }

		public string CreatedBy { get; set; }

		public string UpdatedBy { get; set; }
	}
}

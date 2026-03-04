using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Model
{
	[Serializable]
	[BsonCollection("NewDigitalFormResponse")]
	public class NewDigitalFormResponse : BaseEntity
	{
		public string FormId { get; set; }

		public string FormTemplateName { get; set; }

		public string RequestType { get; set; }

		public string Status { get; set; }

		public string EdmsId { get; set; }

		public string TemplateDocumentID { get; set; }

		public string CreatedBy { get; set; }

		public string UpdatedBy { get; set; }

		public IList<SignerResponse> SignerResponses { get; set; } = new List<SignerResponse>();
	}

	public class SignerResponse
	{
		private DateTime _completeTime;

		public string CorrelationId { get; set; }

		public SignerDetails SignerDetails { get; set; }

		public string Actoken { get; set; }

		public string FormFieldData { get; set; }
		public string Status { get; set; }

		[BsonElement]
		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime CompleteTime
		{
			get => _completeTime;
			set => _completeTime = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}

		public int SignerOrder { get; set; }
	}

	public class SignerDetails
	{
		public string SignerName { get; set; }

		public string RoleName { get; set; }

		public string SignerSuid { get; set; }

		public string SignerEmail { get; set; }

		public string DelegationId { get; set; } = string.Empty;
	}
}

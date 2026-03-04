using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace SigningPortal.Core.Domain.Model
{
	[Serializable]
	[BsonCollection("Delegatee")]
	public class Delegatee : BaseEntity
	{
		private DateTime _consentDateTime;

		[BsonRepresentation(BsonType.ObjectId)]
		public string DelegationId { get; set; }

		public string DelegateeSuid { get; set; }

		public string OrganizationId { get; set; }

		public string DelegateeEmail { get; set; }

		public string FullName { get; set; }

		public string Thumbnail { get; set; }

		public string ConsentStatus { get; set; }

		[BsonElement]
		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime ConsentDateTime
		{
			get => _consentDateTime;
			set => _consentDateTime = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}

		public string DelegateConsentDataSignature { get; set; }

		public string CreatedBy { get; set; }

		public string UpdatedBy { get; set; }
	}
}

using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Model
{
	[Serializable]
	[BsonCollection("Delegation")]
	public class Delegation : BaseEntity
	{
		private DateTime _startDateTime;
		private DateTime _endDateTime;


		public string DelegatorSuid { get; set; }

		public string DelegatorName { get; set; }

		public string DelegatorEmail { get; set; }

		public string OrganizationId { get; set; }

		[BsonElement]
		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime StartDateTime
		{
			get => _startDateTime;
			set => _startDateTime = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}

		[BsonElement]
		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime EndDateTime
		{
			get => _endDateTime;
			set => _endDateTime = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}

		public string DocumentType { get; set; }

		public string DelegationStatus { get; set; }

		public string DelegatorConsentData { get; set; }

		public string ConsentData { get; set; }

		public string DelegatorConsentDataSignature { get; set; }

		public IList<Delegatee> Delegatees { get; set; }

		public string CreatedBy { get; set; }

		public string UpdatedBy { get; set; }
	}
}

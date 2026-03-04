using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using SigningPortal.Core.DTOs;
using System;
using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Model
{
	[Serializable]
	[BsonCollection("Recepient")]
	public class Recepients : BaseEntity
	{
		private DateTime _signReqTime;
		private DateTime _signCompleteTime;

		public string Suid { get; set; }

		public string Email { get; set; }

		public string Name { get; set; }

		public int Order { get; set; }

		public bool Decline { get; set; }

		public string DeclineRemark { get; set; }

		public User DeclinedBy { get; set; } = new User();

		public string Status { get; set; }

		[BsonRepresentation(BsonType.ObjectId)]
		public string Tempid { get; set; }

		[BsonElement]
		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime SigningReqTime
		{
			get => _signReqTime;
			set => _signReqTime = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}

		[BsonElement]
		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime SigningCompleteTime
		{
			get => _signCompleteTime;
			set => _signCompleteTime = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}

		public bool TakenAction { get; set; } = false;

		public bool Initial { get; set; } = false;

		public bool HasDelegation { get; set; } = false;

		public string DelegationId { get; set; }

		public string CorrelationId { get; set; }

		public string AccessToken { get; set; }

		public string OrganizationName { get; set; }

		public string OrganizationId { get; set; }

		public string AccountType { get; set; }

		public string EsealOrgId { get; set; } = string.Empty;

		//new added
		public IList<User> AlternateSignatories { get; set; } = new List<User>();

		public string SignedBy { get; set; } = string.Empty;

		public string ReferredBy { get; set; } = string.Empty;

		public string ReferredTo { get; set; } = string.Empty;

		public string SignaturePreviewObject { get; set; } = string.Empty;

        public bool AllowComments { get; set; }

		public bool SignatureMandatory { get; set; }

		public int SignTemplate { get; set; } = 0;

		public int EsealTemplate { get; set; } = 0;

	}
}

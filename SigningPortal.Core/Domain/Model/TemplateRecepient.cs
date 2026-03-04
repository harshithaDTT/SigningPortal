using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using SigningPortal.Core.DTOs;
using System;
using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Model
{
	[Serializable]
	[BsonCollection("TemplateRecepient")]
	public class TemplateRecepient : BaseEntity
	{
		private DateTime _signCompleteTime;
		private DateTime _signReqTime;

		[BsonRepresentation(BsonType.ObjectId)]
		public string TemplateDocumentId { get; set; }

		[BsonRepresentation(BsonType.ObjectId)]
		public string RoleId { get; set; }

		public string RoleName { get; set; }

		public User Signer { get; set; } = new();

		public string SignerName { get; set; }

		public string OrganizationId { get; set; }

		public string OrganizationName { get; set; }

		public string AccountType { get; set; }

		public string Status { get; set; }
		//public string AccessToken { get; set; }
		public string IdpToken { get; set; }
		public string SignedBy { get; set; }

		public bool Decline { get; set; }

		public User DeclinedBy { get; set; }

		public string DeclineRemark { get; set; }

		public string CorrelationId { get; set; }

		public bool TakenAction { get; set; } = false;

		public bool SignatureMandatory { get; set; }

		public bool HasDelegation { get; set; } = false;

		public string DelegationId { get; set; }

		public int Order { get; set; }

		public string AnnotationList { get; set; }

		public IList<User> AlternateSignatories { get; set; } = new List<User>();

		public placeHolderCoordinates SignatureAnnotations { get; set; }

		public esealplaceHolderCoordinates EsealAnnotations { get; set; }

		public qrPlaceHolderCoordinates QrAnnotations { get; set; }

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
	}
}

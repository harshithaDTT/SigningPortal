using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Services.Communication.SigningService
{
	public class VerifySignedDocumentApiResponse
	{
		public IList<signatureDeatils> signatureVerificationDetails { get; set; }
	}

	public class signatureDeatils
	{
		private DateTime _signedTime;
		private DateTime _validationTime;

		public string signedBy { get; set; }

		[BsonElement]
		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime signedTime
		{
			get => _signedTime;
			set => _signedTime = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}

		[BsonElement]
		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime validationTime
		{
			get => _validationTime;
			set => _validationTime = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}

		public bool signatureValid { get; set; }
	}
}

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace SigningPortal.Core.Domain.Model
{
	[BsonCollection("auditlogs")]
	public class Auditlogs
	{
		private DateTime _timeStamp;

		[BsonId]
		[BsonRepresentation(BsonType.ObjectId)]
		public string _id { get; set; }
		public string identifier { get; set; }
		public string checksum { get; set; }
		public string transactionID { get; set; }

		public string serviceName { get; set; }
		public string startTime { get; set; }
		public string endTime { get; set; }
		public string logMessage { get; set; }
		public string logMessageType { get; set; }
		public string transactionType { get; set; }

		public string correlationID { get; set; }
		public string serviceProviderName { get; set; }
		public string serviceProviderAppName { get; set; }

		public bool eSealUsed { get; set; }
		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime timestamp
		{
			get => _timeStamp;
			set => _timeStamp = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}


		public string _class { get; set; }
		//=======================

		public string signatureType { get; set; }
		public int __v { get; set; }
		public string transactionSubType { get; set; }
		public string subTransactionID { get; set; }
		public string geoLocation { get; set; }
		public string callStack { get; set; }
	}
}

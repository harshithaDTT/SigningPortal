using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using SigningPortal.Core.DTOs;
using System;
using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Model
{
	[Serializable]
	[BsonCollection("Document")]
	public class Document : BaseEntity
	{
		private DateTime _createTime;
		private DateTime _completeTime;
		private DateTime _expireDate;
		private DateTime _docBlockTime;


		public string DocumentName { get; set; }

		public string OwnerID { get; set; }

		public string OwnerEmail { get; set; }

		public string OwnerName { get; set; }

		public string DaysToComplete { get; set; }

		public string AutoReminders { get; set; }

		public string RemindEvery { get; set; }

		public string Status { get; set; }

		[BsonElement]
		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime CreateTime
		{
			get => _createTime;
			set => _createTime = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}

		[BsonElement]
		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime CompleteTime
		{
			get => _completeTime;
			set => _completeTime = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}

		public string Annotations { get; set; }

		public string EsealAnnotations { get; set; }

		public string QrCodeAnnotations { get; set; }

		[BsonElement]
		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime ExpireDate
		{
			get => _expireDate;
			set => _expireDate = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}

		public string EdmsId { get; set; }

		public string OriginalEdmsId { get; set; }

		public IList<Recepients> Recepients { get; set; }

		public string Watermark { get; set; }

		public bool IsDocumentBlocked { get; set; } = false;

		[BsonElement]
		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime DocumentBlockedTime
		{
			get => _docBlockTime;
			set => _docBlockTime = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}

		public bool DisableOrder { get; set; }

		public bool AllowToAssignSomeone { get; set; }

		public bool IsMobile { get; set; }

		public bool MultiSign { get; set; }

		public IList<User> PendingSignList { get; set; } = new List<User>();

		public IList<User> CompleteSignList { get; set; } = new List<User>();

		public int RecepientCount { get; set; }

		public int SignaturesRequiredCount { get; set; }

		public string HtmlSchema { get; set; }

		public string PdfSchema { get; set; }

		public string OrganizationName { get; set; }

		public string OrganizationId { get; set; }

		public string AccountType { get; set; }

		public string QrCriticalData { get; set; }
	}

}

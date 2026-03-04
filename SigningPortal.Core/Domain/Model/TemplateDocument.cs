using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using SigningPortal.Core.DTOs;
using System;
using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Model
{
	[Serializable]
	[BsonCollection("TemplateDocument")]
	public class TemplateDocument : BaseEntity
	{
		private DateTime _createTime;
		private DateTime _expireDate;
		private DateTime _completeTime;

		[BsonRepresentation(BsonType.ObjectId)]
		public string FormId { get; set; }

		public string FormTemplateName { get; set; }

		public string DocumentName { get; set; }

		public string OrganizationId { get; set; }

		public string OrganizationName { get; set; }

		public string AccountType { get; set; }

		public User Owner { get; set; } = new();

		public List<TemplateRecepient> TemplateRecepients { get; set; }

		public int TemplateRecepientCount { get; set; }

		public string DaysToComplete { get; set; }

		public string RequestGroupId { get; set; }

		public string RequestName { get; set; }

		public string RequestType { get; set; }

		public string TemplateType { get; set; }

		public string EdmsId { get; set; }

		public IList<User> PendingSignList { get; set; } = new List<User>();

		public IList<User> CompleteSignList { get; set; } = new List<User>();

		public string Status { get; set; }

		public string CommonFields { get; set; }

		public string RoleSchema { get; set; }

		public string HtmlSchema { get; set; }

		public string PdfSchema { get; set; }

		public bool MultiSign { get; set; }

		public bool DisableOrder { get; set; }

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

		[BsonElement]
		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime ExpieryDate
		{
			get => _expireDate;
			set => _expireDate = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}
	}
}

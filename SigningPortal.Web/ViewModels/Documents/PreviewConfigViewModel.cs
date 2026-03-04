using MongoDB.Bson.Serialization.Attributes;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.DTOs;

namespace SigningPortal.Web.ViewModels.Documents
{
    public class PreviewConfigViewModel
    {
        public string DocumentName { get; set; }

        public string OwnerID { get; set; }

        public string OwnerEmail { get; set; }

        public string OwnerName { get; set; }

        public string DaysToComplete { get; set; }

        public string AutoReminders { get; set; }

        public string RemindEvery { get; set; }

        public string Status { get; set; }

        [BsonElement]
        [BsonDateTimeOptions(Kind = DateTimeKind.Local)]
        public DateTime CreateTime { get; set; }

        [BsonElement]
        [BsonDateTimeOptions(Kind = DateTimeKind.Local)]
        public DateTime CompleteTime { get; set; }

        public string Annotations { get; set; }

        public string EsealAnnotations { get; set; }

        public string QrCodeAnnotations { get; set; }

        [BsonElement]
        [BsonDateTimeOptions(Kind = DateTimeKind.Local)]
        public DateTime ExpireDate { get; set; }

        public string EdmsId { get; set; }

        public string OriginalEdmsId { get; set; }

        public IList<Recepients> Recepients { get; set; }

        public string Watermark { get; set; }

        public bool IsDocumentBlocked { get; set; } = false;

        [BsonElement]
        [BsonDateTimeOptions(Kind = DateTimeKind.Local)]
        public DateTime DocumentBlockedTime { get; set; }

        public bool DisableOrder { get; set; }

        public bool AllowToAssignSomeone { get; set; }

        public bool MultiSign { get; set; }

        public IList<User> PendingSignList { get; set; } = new List<User>();

        public IList<User> CompleteSignList { get; set; } = new List<User>();

        public int RecepientCount { get; set; }

        public int SignaturesRequiredCount { get; set; }

        public string OrganizationName { get; set; }

        public string OrganizationId { get; set; }

        public string AccountType { get; set; }

        public string? DocId { get; set; }

        public string? ViewName { get; set; }

		public string htmlSchema { get; set; }
	}
}


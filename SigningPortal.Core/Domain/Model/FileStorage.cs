using System;

namespace SigningPortal.Core.Domain.Model
{
    [Serializable]
    [BsonCollection("FileStorage")]
    public class FileStorage : BaseEntity
    {
        public string Label { get; set; }

        public string DocumentId { get; set; }
        public string FilePath { get; set; }
        public string MimeType { get; set; }
        public string Status { get; set; }
        public DateTime? ExpireDate { get; set; }
        public DateTime? ModifiedDate { get; set; }
    }
}

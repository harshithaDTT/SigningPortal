namespace SigningPortal.Core.DTOs
{
    public class DocumentListFilterDTO
    {
        public string DocumentStatus { get; set; }
        public string SigningStatus { get; set; }
        public string DocumentFilter { get; set; }
        public bool IsReceivedDocumentList{ get; set; } = false;
    }
}

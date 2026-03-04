namespace SigningPortal.Web.ViewModels.BulkSign
{
    public class AllBulkSignListViewModel
    {

        public string TemplateId { get; set; }

        public string TemplateName { get; set; }

        public string OrganizationId { get; set; }

        public string Suid { get; set; }

        public string SignatureAnnotations { get; set; }

        public string EsealAnnotations { get; set; }

        public string SourcePath { get; set; }

        public string SignedPath { get; set; }

        public string Status { get; set; }

        public string CorelationId { get; set; }

        public string SignedBy { get; set; }

        public string CompletedAt { get; set; }

        public string OwnerName { get; set; }

        public string OwnerEmail { get; set; }

        public string SignerEmail { get; set; }

        public Result Result { get; set; }
    }
}

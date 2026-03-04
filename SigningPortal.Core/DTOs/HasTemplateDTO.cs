namespace SigningPortal.Core.DTOs
{
    public class HasTemplateDTO
    {
        public string email { get; set; }
        public string Suid { get; set; }
        public string OrganizationId { get; set; }
        public int SignatureTemplateId { get; set; } = 1;
        public int EsealTemplateId { get; set; } = 5;
        public bool HasSignatureTemplate { get; set; } = false;
        public bool HasEsealTemplate { get; set; } = false;

    }
}

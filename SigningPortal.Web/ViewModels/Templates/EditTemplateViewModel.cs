using SigningPortal.Core.DTOs;
using System.ComponentModel.DataAnnotations;

namespace SigningPortal.Web.ViewModels.Templates
{
    public class EditTemplateViewModel
    {
        [Required]
        [Display(Name = "Template Name")]
        public string? TemplateName { get; set; }

        [Required]
        [Display(Name = "Document Name")]
        public string? DocumentName { get; set; }

        [Required]
        public string? Config { get; set; }

        public string? Signatory { get; set; }

        public int SignatureTemplate { get; set; }

        public int EsealSignatureTemplate { get; set; }

        [Required]
        [Display(Name = "Upload Document")]
        public IFormFile File { get; set; }

        public int Rotation { get; set; }

        public bool QrCodeRequired {  get; set; }

        public string? SettingConfig { get; set; }

        public string annotations { get; set; }

        public string esealAnnotations { get; set; }

        public string qrCodeAnnotations { get; set; }

        public bool qrCodeRequired { get; set; }

        public bool esealRequired { get; set; }

        public string settingConfig { get; set; }

        public BulkSignerListDTO bulkSignerEmails { get; set; }

        public IList<SignatureTemplatesDTO> Templates { get; set; }

        public string _id { get; set; }

        public IList<Roles> RoleList { get; set; }
        public IList<string> emailList { get; set; }
        public string status { get; set; }
        public string edmsId { get; set; }
        public string createdBy { get; set; }

        public string updatedBy { get; set; }

        public string selfieThumbnail { get; set; }

        public string htmlSchema { get; set; }
    }
}

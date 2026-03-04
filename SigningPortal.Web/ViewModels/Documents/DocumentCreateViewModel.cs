using SigningPortal.Core.DTOs;
using System.ComponentModel.DataAnnotations;

namespace SigningPortal.Web.ViewModels.Documents
{
    public class DocumentCreateViewModel
    {

        [Required]
        [Display(Name = "Document Name")]
        public string DocumentName { get; set; }

        [Required]
        public string? Config { get; set; }

        [Required]
        public string? Recps { get; set; }
        public string? Signatory { get; set; }

        public string? checkboxValue { get; set; }

        public int Rotation { get; set; }
        public string? SettingConfig { get; set; }

        public IList<Roles> RoleList { get; set; }

        [Required]
        [Display(Name = "Upload Document")]


        public IFormFile File { get; set; }
        public IFormFile OriginalFile { get; set; }

        public IList<RescpList> RecpientList { get; set; }



        public string annotations { get; set; }

        public string esealAnnotations { get; set; }

        public string qrCodeAnnotations { get; set; }

        public bool qrCodeRequired { get; set; }
        public bool initial { get; set; }

        public string settingConfig { get; set; }

        public IList<Roles> roleList { get; set; }

        public IList<string> emailList { get; set; }

        public string? signatoriesEmailId { get; set; }
        public int rotation { get; set; }

        public string status { get; set; }

        public string edmsId { get; set; }

        public string _id { get; set; }

        public string createdBy { get; set; }

        public string updatedBy { get; set; }

        public int DaysToComplete { get; set; }

        public bool DisableOrder { get; set; }

        public int RequiredSignatureNo { get; set; }

        public string? esealImageData { get; set; }

        public string? signatureImageData { get; set; }

        public string? InitialBaseString { get; set; }
        public string docSerialNo { get; set; } = string.Empty;
        public string entityName { get; set; } = string.Empty;

        public string pdfSchema { get; set; }

        public string htmlSchema { get; set; }

        public bool faceRequired { get; set; } = false;
        public int pageHeight { get; set; }
        public int pageWidth { get; set; }

        public IList<SignatureTemplatesDTO> Templates { get; set; }

        public int SignTemplate { get; set; }

    }

    public class RescpList
    {
        public int Order { get; set; }
        public string? Email { get; set; }

        public bool Eseal { get; set; }
    }

    public class Roles
    {
        public int Order { get; set; }

        public string Role { get; set; }

        public bool Eseal { get; set; }
    }
}


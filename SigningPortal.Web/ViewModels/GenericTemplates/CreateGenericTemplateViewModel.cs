using SigningPortal.Core.DTOs;
using SigningPortal.Web.ViewModels.Templates;
using System.ComponentModel.DataAnnotations;

namespace SigningPortal.Web.ViewModels.GenericTemplates
{
	public class CreateGenericTemplateViewModel
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

		public string? SettingConfig { get; set; }

        public object signCords { get; set; }

       
        public object esealCords { get; set; }

       
        public object qrCords { get; set; }

        public bool qrCodeRequired { get; set; }

		public bool esealRequired { get; set; }
		public int DaysToComplete { get; set; }

		public string settingConfig { get; set; }

        public string? signatoriesEmailId { get; set; }

        public BulkSignerListDTO bulkSignerEmails { get; set; }

		public IList<SignatureTemplatesDTO> Templates { get; set; }

		public BulkSignerListViewModel BulkSignerEmails { get; set; }
		public string _id { get; set; }

        public string? Roles { get; set; }
        public IList<GenericTemplateRole> RoleList { get; set; }
		public IList<string> emailList { get; set; }
		public string status { get; set; }
		public string edmsId { get; set; }
		public string createdBy { get; set; }

		public string updatedBy { get; set; }

		public string selfieThumbnail { get; set; }
        public int RequiredSignatureNo { get; set; }

        

    }
		
}



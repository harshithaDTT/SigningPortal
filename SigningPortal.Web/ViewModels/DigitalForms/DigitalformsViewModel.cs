using Newtonsoft.Json.Linq;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.DTOs;

namespace SigningPortal.Web.ViewModels.DigitalForms
{
    public class DigitalformsViewModel
    {
        public string TemplateName { get; set; }

        public string OrganizationUid { get; set; }

        public string Email { get; set; }

        public string Suid { get; set; }

        public string ApplicableSubscriberType { get; set; }

        //public string FormGroupId { get; set; }

        public string FormType { get; set; }

        public int Order { get; set; }

        public string Status { get; set; }

        public string EdmsId { get; set; }

        public string DocumentName { get; set; }

        public string AdvancedSettings { get; set; }

        public string DaysToComplete { get; set; }

        public string NumberOfSignatures { get; set; }

        public bool AllSigRequired { get; set; }

        public bool PublishGlobally { get; set; }

        public bool SequentialSigning { get; set; }

        public string CreatedBy { get; set; }

        public string UpdatedBy { get; set; }

        public string Type { get; set; }

        public string HtmlSchema { get; set; }

        public string PdfSchema { get; set; }

        public string Model { get; set; }

        public DateTime CreatedAt { get; set; }

        public string _id { get; set; }

        public int ResponseCount { get; set; }

        public IList<DigitalFormTemplateRole> Roles { get; set; } = new List<DigitalFormTemplateRole>();


    }

    public class DocumentConfiguration
    {
        public string Name { get; set; }
        public string DocumentName { get; set; }
        public string AdvancedSettings { get; set; }
        public string DaysToComplete { get; set; }
        public int? NumberOfSignatures { get; set; }
        public bool AllSigRequired { get; set; }
        public bool PublishGlobally { get; set; }
        public bool SequentialSigning { get; set; }
    }

    public class FormResponse
    {
        public string FormId { get; set; }

        public string FormTemplateName { get; set; }

        public string CorelationId { get; set; }

        public string Status { get; set; }

        public string SignerName { get; set; }

        public string SignerEmail { get; set; }

        public string SignerSuid { get; set; }

        public JObject FormFieldData { get; set; }

        public string AcToken { get; set; }

        public string EdmsId { get; set; }

        public string CreatedBy { get; set; }

        public string UpdatedBy { get; set; }

        public DateTime  CreatedAt { get; set; }

        public IList<User> PendingSignList { get; set; } = new List<User>();

        public IList<User> CompleteSignList { get; set; } = new List<User>();

        public List<TemplateRecepient> TemplateRecepients { get; set; }

        public IList<SignerResponse> SignerResponses { get; set; } = new List<SignerResponse>();
    }

    

    public class FormTemplateResponse
    {
        public DigitalformsViewModel Template { get; set; }

        public FormResponse FormResponse { get; set; }
    }
    public class NewFormTemplateResponseDTO
    {
        public DigitalFormTemplate Template { get; set; }

        public TemplateDocument FormResponse { get; set; }
    }


    public class Rolesconfig
    {
		public string roleId { get; set; }

		public string email { get; set; }

		public Role role { get; set; }

		public string annotationsList { get; set; }

		public int SigningOrder { get; set; }

		public placeHolderCoordinates placeHolderCoordinates { get; set; }

		public esealplaceHolderCoordinates esealplaceHolderCoordinates { get; set; }

	
	}

}

using MongoDB.Bson.Serialization.Attributes;
using Newtonsoft.Json.Linq;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.DTOs;

namespace SigningPortal.Web.ViewModels.DigitalForms
{
    public class DocumentTypeViewModel
    {
        public bool ExistingDoc { get; set; }

        public bool BlankDoc { get; set; }

        public string? FileBase64 { get; set; }

        public string? FileName { get; set; }
        public IList<SignatureTemplatesDTO> Templates { get; set; }
    }
    public class SignatureTemplateViewModel
    {
        public string documentName { get; set; }
        public string name { get; set; }
        public string daysToComplete { get; set; }
        public string numberOfSignatures { get; set; }
        public bool allSigRequired { get; set; }
        public bool publishGlobally { get; set; }
        public bool sequentialSigning { get; set; }
        public string advancedSettings { get; set; }
        public IFormFile File { get; set; }
        public string rolesConfig { get; set; }
        public string roles { get; set; }

        public string docType { get; set; }

        public string htmlSchema { get; set; }

        public string pdfSchema { get; set; }

    }
    public class EditTemplateViewModel
    {
        public string documentName { get; set; }
        public string name { get; set; }
        public string daysToComplete { get; set; }
        public string numberOfSignatures { get; set; }
        public bool allSigRequired { get; set; }
        public bool publishGlobally { get; set; }
        public bool sequentialSigning { get; set; }
        public string advancedSettings { get; set; }
        public IFormFile File { get; set; }
        public string rolesConfig { get; set; }
        public string roles { get; set; }

        public string docType { get; set; }

        public string htmlSchema { get; set; }

        public string pdfSchema { get; set; }

        public string TemplateId { get; set; }

    }

    public class EditCreateViewModel
    {
        public string documentName { get; set; }
        public string name { get; set; }
        public string daysToComplete { get; set; }
        public string numberOfSignatures { get; set; }
        public bool allSigRequired { get; set; }
        public bool publishGlobally { get; set; }
        public bool sequentialSigning { get; set; }
        public string advancedSettings { get; set; }
        public string File { get; set; }
        public string rolesConfig { get; set; }
        public List<Role> roles { get; set; }

        public string docType { get; set; }

        public string htmlSchema { get; set; }

        public string pdfSchema { get; set; }

        public string TemplateId { get; set; }

        public IList<SignatureTemplatesDTO> Templates { get; set; }

        public List<DigitalFormTemplateRole> roleidlist { get; set; }

        public string flag { get; set; }


    }

    public class FillFormData
    {
        public string filename { get; set; }

        public string pdfblob { get; set; }

        public string tempid { get; set; }

        public string autofilldata { get; set; }

        public string htmlschma { get; set; }

        public string pdfschema { get; set; }   

        public string flag { get; set; }

        public string UserRole { get; set; }

        public IList<DigitalFormTemplateRole> Roles { get; set; } = new List<DigitalFormTemplateRole>();

        public string Model { get; set; } = null;

        public string DocumentId { get; set; }

        public string Status { get; set; }

        public string Daystocomplete { get; set; }

        public string pdfschma { get; set; }

        

    }

    public class SaveDigitalFormResponse
    {
        public IFormFile File { get; set; }

        public string FormId { get; set; }

        public string FormFieldData { get; set; }

        public bool isEsealPresent { get; set; }

        public string DocumentId { get; set; }

    }

    public class SendRequestDTO
    {

        public string documentName { get; set; }

        public string formId { get; set; }

        public string RequestType { get; set; }
        public string TemplateType { get; set; }
        public string htmlSchema { get; set; }
        public string pdfSchema { get; set; }
        public string roleMappings { get; set; }
        public string preFilledData { get; set; }
        public string daysToComplete { get; set; }

        public bool sequentialSigning { get; set; }

        public string RoleAnnotations { get; set; }
        public string roleSigningOrder { get; set; }

    }

    public class orgUser
    {
        public string FullName { get; set; }
        public string Suid { get; set; }
        public string Email { get; set; }
        public string thumbNailUri { get; set; }
        public string OrganizationEmail { get; set; }
        public bool HasEseal { get; set; }
    }


    public class StatusDoc
    {
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
        [BsonDateTimeOptions(Kind = DateTimeKind.Local)]

        public DateTime CreateTime { get; set; }

        [BsonElement]
        [BsonDateTimeOptions(Kind = DateTimeKind.Local)]
        public DateTime CompleteTime { get; set; }

        [BsonElement]
        [BsonDateTimeOptions(Kind = DateTimeKind.Local)]
        public DateTime ExpieryDate { get; set; }
    }
}

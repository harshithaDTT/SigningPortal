using SigningPortal.Core.Domain.Model;

namespace SigningPortal.Web.ViewModels.BulkSign
{
    public class UploadFilesViewModel
    {
        public IList<Template> TemplateList { get; set; } = new List<Template>();
        public string? SelectedTemplateId { get; set; }
    }
}

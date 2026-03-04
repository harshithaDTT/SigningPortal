using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Model;

namespace SigningPortal.Web.ViewModels.Templates
{
    public class TemplateListViewModel
    {
        public IList<Template> TemplateList { get; set; } = new List<Template>();
    }
}

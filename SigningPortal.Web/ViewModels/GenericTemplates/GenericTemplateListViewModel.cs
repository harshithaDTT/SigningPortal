using SigningPortal.Core.Domain.Model;

namespace SigningPortal.Web.ViewModels.GenericTemplates
{
	public class GenericTemplateListViewModel
	{
		public IList<GenericTemplate> TemplateList { get; set; } = new List<GenericTemplate>();
	}
}

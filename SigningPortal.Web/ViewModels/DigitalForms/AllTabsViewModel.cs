using SigningPortal.Core.Domain.Model;

namespace SigningPortal.Web.ViewModels.DigitalForms
{
    public class AllTabsViewModel
    {
        public IList<DigitalFormTemplate> myforms { get; set; }=new List<DigitalFormTemplate>();
        public IList<DigitalFormTemplate> organisationforms { get; set; }
        public IList<DigitalFormTemplate> gobalforms { get; set; }
       
    }
}

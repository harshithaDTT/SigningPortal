using SigningPortal.Core.Domain.Model;

namespace SigningPortal.Web.ViewModels.GroupSignings
{
    public class GroupSigningDetailsViewModel
    {

        public string SignerSuid { get; set; }

        public string SignerOrganizationId { get; set; } = string.Empty;

        public string Transaction { get; set; }

         

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public IList<SigningGroup> SigningGroups { get; set; } = new List<SigningGroup>();

        public string Status { get; set; }

        public GroupsigningstatusdetailsViewModel GroupsigningstatusdetailsViewModel { get; set; }

 
    }
   
}

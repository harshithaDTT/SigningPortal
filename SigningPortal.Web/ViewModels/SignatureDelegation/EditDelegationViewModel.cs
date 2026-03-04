namespace SigningPortal.Web.ViewModels.SignatureDelegation
{
    public class EditDelegationViewModel
    {
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        public string DelegationStatus { get; set; }
        public string DelegationID { get; set; }
        public List<DelegateRecep> Delegatees { get; set; }
   
    }
    public class DelegateRecep
    {
        public string Email { get; set; }

        public string Suid { get; set; }

        public string FullName { get; set; }

        public string Thumbnail { get; set; }
    }

}


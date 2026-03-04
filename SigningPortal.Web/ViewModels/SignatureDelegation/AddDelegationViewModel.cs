namespace SigningPortal.Web.ViewModels.SignatureDelegation
{
    public class AddDelegationViewModel
    {
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        public List<string> Emails { get; set; }
        public string? Reason { get; set; } = string.Empty;
    }
}

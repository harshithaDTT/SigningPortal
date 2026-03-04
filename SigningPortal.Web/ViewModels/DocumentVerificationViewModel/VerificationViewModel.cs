namespace SigningPortal.Web.ViewModels.DocumentVerificationViewModel
{
    public class VerificationViewModel
    {
        public string documentName { get; set; }
        public string signedBy { get; set; }
        public DateTime signedTime { get; set; }
        public DateTime validationTime { get; set; }
        public bool signatureValid { get; set; }
        
    }
}

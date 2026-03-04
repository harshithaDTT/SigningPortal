using SigningPortal.Web.ViewModels.DocumentVerificationViewModel;

namespace SigningPortal.Web.ViewModels.DocumentVerification
{
    public class DocumentVerificationViewModel
    {

        public IFormFile File { get; set; }

        public IList<VerificationViewModel> obj { get; set; }
    }
}

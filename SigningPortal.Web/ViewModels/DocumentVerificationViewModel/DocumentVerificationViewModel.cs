using SigningPortal.Core.Domain.Services.Communication.SigningService;

namespace SigningPortal.Web.ViewModels.DocumentVerificationViewModel
{
    public class DocumentVerificationViewModel
    {
        public IFormFile File { get; set; }

        public IList<VerificationViewModel> obj { get; set; }

    }
}

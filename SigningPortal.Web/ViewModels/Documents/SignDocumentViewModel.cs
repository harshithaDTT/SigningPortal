using System.ComponentModel.DataAnnotations;

namespace SigningPortal.Web.ViewModels.Documents
{
	public class SignDocumentViewModel
	{
		[Required]
		public string? Config { get; set; }

		public IFormFile File { get; set; }

		public string? DocId { get; set; }

        public int SignTemplate { get; set; }

        public int CompleteSignCount { get; set; } = 0;

    }
}

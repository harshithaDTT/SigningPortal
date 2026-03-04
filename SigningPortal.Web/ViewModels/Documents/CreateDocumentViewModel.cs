using System.ComponentModel.DataAnnotations;

namespace SigningPortal.Web.ViewModels.Documents
{
	public class CreateDocumentViewModel
	{
		[Display(Name = "Document Name")]
		public string documentName  { get; set; }

		public string signatoriesEmailId { get; set; }

		public int DaysToComplete {  get; set; }

        public int RequiredSignatureNo { get; set; }



    }
}

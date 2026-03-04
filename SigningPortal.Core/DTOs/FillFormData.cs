using Microsoft.AspNetCore.Http;
using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class FillFormData
	{
		public string filename { get; set; }

		public string pdfblob { get; set; }

		public string tempid { get; set; }

		public string autofilldata { get; set; }

		public string htmlschma { get; set; }

		public string pdfschema { get; set; }

		public string UserRole { get; set; }

		public IList<DigitalFormTemplateRole> Roles { get; set; }

		public string flag { get; set; }

		public string AccessToken { get; set; } = string.Empty;

		public string IdpToken { get; set; } = string.Empty;

		public string Status { get; set; }
	}





	public class NewSaveDigitalFormResponse
	{
		public IFormFile File { get; set; }
		public string FormId { get; set; }
		public string FormFieldData { get; set; }
		public bool isEsealPresent { get; set; }
		public string IdpToken { get; set; }
	}
}

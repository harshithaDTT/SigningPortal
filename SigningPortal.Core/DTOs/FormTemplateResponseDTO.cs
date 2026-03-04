using SigningPortal.Core.Domain.Model;

namespace SigningPortal.Core.DTOs
{
	public class FormTemplateResponseDTO
	{
		public DigitalFormTemplate Template { get; set; }

		public DigitalFormResponse FormResponse { get; set; }
	}
	public class NewFormTemplateResponseDTO
	{
		public DigitalFormTemplate Template { get; set; }

		public TemplateDocument FormResponse { get; set; }
		public NewDigitalFormResponse Response { get; set; }
	}
	public class NewFormTemplateResonseMobileDTO
	{
		public DigitalFormTemplateMobileDTO Template { get; set; }
		public TemplateDocumentMobileDTO FormResponse { get; set; }
	}
}

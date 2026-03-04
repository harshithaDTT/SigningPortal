using Microsoft.AspNetCore.Http;

namespace SigningPortal.Core.DTOs
{
	public class DigitalFormResponseDTO
	{
		public IFormFile File { get; set; }

		public string FormId { get; set; }

		public string OrganizationId { get; set; }

		public string FormFieldData { get; set; }

		public string IdpToken { get; set; }

		public string AcToken { get; set; }

		public string DigitalFormRequestId { get; set; } = string.Empty;

		public bool IsMobile { get; set; } = false;

		public string AuthPin { get; set; } = null;

		public string SignPin { get; set; } = null;

		public string UserPhoto { get; set; } = null;

		public string CapturedVoice { get; set; } = null;
	}
}

using Microsoft.AspNetCore.Http;

namespace SigningPortal.Core.DTOs
{
	public class UpdateDigitalFormTemplateDTO
	{
		public IFormFile File { get; set; } = null;

		public string Model { get; set; }

		public string TemplateId { get; set; }
	}
}

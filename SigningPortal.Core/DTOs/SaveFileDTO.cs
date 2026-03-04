using Microsoft.AspNetCore.Http;

namespace SigningPortal.Core.DTOs
{
	public class SaveFileDTO
	{
		public IFormFile file { get; set; }
	}
}

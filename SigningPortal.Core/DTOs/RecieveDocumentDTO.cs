using Microsoft.AspNetCore.Http;

namespace SigningPortal.Core.DTOs
{
	public class RecieveDocumentDTO
	{
		public string correlationID { get; set; }


		public bool success { get; set; }

		public int errorCode { get; set; }

		public string errorMessage { get; set; }

		public IFormFile signfile { get; set; }
	}

	public class RecieveGroupSigningDocumentDTO
	{
		public string correlationID { get; set; }

		public string requestId { get; set; }

		public string DocType { get; set; }

		public bool success { get; set; }

		public int errorCode { get; set; }

		public string errorMessage { get; set; }

		public IFormFile signfile { get; set; }
	}
}

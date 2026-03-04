using Microsoft.AspNetCore.Http;

namespace SigningPortal.Core.DTOs
{
	public class SigningRequestNewDTO
	{
		public IFormFile signfile { get; set; }

		public string model { get; set; }
	}

	public class SigningRequestModelNew
	{
		public string tempid { get; set; }

		public string userName { get; set; }

		public string userEmail { get; set; }

		public string signature { get; set; }

		public string actoken { get; set; }

		public string suid { get; set; }

		public bool qrCodeRequired { get; set; }

		public string organizationID { get; set; }

		public int signVisible { get; set; }

		public int? pageNumber { get; set; }

		public double? posX { get; set; }

		public double? posY { get; set; }

		public double? width { get; set; }

		public double? height { get; set; }

		public int? EsealPageNumber { get; set; }

		public double? EsealPosX { get; set; }

		public double? EsealPosY { get; set; }

		public double? EsealWidth { get; set; }

		public double? EsealHeight { get; set; }

		public int? QrPageNumber { get; set; }

		public double? QrPosX { get; set; }

		public double? QrPosY { get; set; }

		public double? QrWidth { get; set; }

		public double? QrHeight { get; set; }

		public string SerialNumber { get; set; }

		public string EntityName { get; set; }
		public int signatureTemplateId { get; set; } = 0;
		public int esealSignatureTemplateId { get; set; } = 0;
	}
}

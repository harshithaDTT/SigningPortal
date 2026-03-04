using SigningPortal.Core.Domain.Services.Communication.Bulksign;

namespace SigningPortal.Core.DTOs
{
	public class SignDTO
	{
		public string correlationId { get; set; }
		public string organizationId { get; set; }
		public string callBackUrl { get; set; }
		public string sourcePath { get; set; }
		public string destinationPath { get; set; }
		public string suid { get; set; }
		public bool qrCodeRequired { get; set; }
		public int signatureTemplateId { get; set; }
		public int esealSignatureTemplateId { get; set; }
		public esealplaceHolderCoordinates esealPlaceHolderCoordinates { get; set; }
		public placeHolderCoordinates placeHolderCoordinates { get; set; }
		public QrCodePlaceHolderCoordinates qrcodePlaceHolderCoordinates { get; set; }
	}

}

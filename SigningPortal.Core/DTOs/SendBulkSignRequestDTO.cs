using SigningPortal.Core.Domain.Services.Communication.Bulksign;

namespace SigningPortal.Core.DTOs
{
	public class SendBulkSignRequestDTO
	{

		public string CorrelationId { get; set; }
		public string OrganizationId { get; set; }
		public string Suid { get; set; }

		public int SignatureTemplateId { get; set; }
		public int EsealSignatureTemplateId { get; set; }
		public string CallBackUrl { get; set; }
		public string SourcePath { get; set; }
		public string DestinationPath { get; set; }
		public bool QrCodeRequired { get; set; }
		public placeHolderCoordinates PlaceHolderCoordinates { get; set; }
		public QrCodePlaceHolderCoordinates QrcodePlaceHolderCoordinates { get; set; }
		public esealplaceHolderCoordinates EsealPlaceHolderCoordinates { get; set; }

	}

	//public class qrplaceHolderCoordinates
	//{
	//    public string pageNumber { get; set; }

	//    public string signatureXaxis { get; set; }

	//    public string signatureYaxis { get; set; }
	//}
}

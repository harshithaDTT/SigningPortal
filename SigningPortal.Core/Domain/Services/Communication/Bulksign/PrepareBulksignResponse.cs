using SigningPortal.Core.DTOs;

namespace SigningPortal.Core.Domain.Services.Communication.Bulksign
{
	public class PrepareBulksignResponse
	{
		public string CorelationId { get; set; }

		public string Suid { get; set; }

		public string Email { get; set; }

		public string OrganizationId { get; set; }

		public string CallBackUrl { get; set; }

		public string SourcePath { get; set; }

		public string DestinationPath { get; set; }

		public placeHolderCoordinates PlaceHolderCoordinates { get; set; }

		public esealplaceHolderCoordinates EsealPlaceHolderCoordinates { get; set; }

		public QrCodePlaceHolderCoordinates QrCodePlaceHolderCoordinates { get; set; }

		public bool QrCodeRequired { get; set; }

		public string AgentUrl { get; set; }

		public int SignatureTemplateId { get; set; }

		public int EsealSignatureTemplateId { get; set; }
	}

	public class QrCodePlaceHolderCoordinates
	{
		public string pageNumber { get; set; }

		public string signatureXaxis { get; set; }

		public string signatureYaxis { get; set; }

		public string imgWidth { get; set; }

		public string imgHeight { get; set; }
	}
}

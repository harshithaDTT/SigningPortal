using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class GroupSigningRequestBody
	{
		public string DocumentType { get; set; } = "pades";
		public string Id { get; set; }
		public string OrganizationId { get; set; }
		public placeHolderCoordinates PlaceHolderCoordinates { get; set; }
		public esealplaceHolderCoordinates EsealPlaceHolderCoordinates { get; set; }
		public qrPlaceHolderCoordinates QrcodePlaceHolderCoordinates { get; set; }
		public List<string> PublicData { get; set; }
		public List<string> PrivateData { get; set; }
		public string Portrait { get; set; }
		public string CredentialId { get; set; }
		public int signatureTemplateId { get; set; } = 0;
		public int esealSignatureTemplateId { get; set; } = 0;
	}
}

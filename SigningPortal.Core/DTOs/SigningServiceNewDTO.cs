namespace SigningPortal.Core.DTOs
{
	public class SigningServiceNewDTO
	{
		public string accountType { get; set; }

		public string accountId { get; set; }

		public string documentType { get; set; }

		public string subscriberUniqueId { get; set; }

		// public string subscriberFullName { get; set; }

		public string organizationUid { get; set; } = null;

		public string callbackURL { get; set; }
		public string serialNumber { get; set; }
		public string entityName { get; set; }
		public bool qrCodeRequired { get; set; }

		public int esealSignatureTemplateId { get; set; }
		public int signatureTemplateId { get; set; }

		public placeHolderCoordinates placeHolderCoordinates { get; set; }

		public placeHolderCoordinates qrPlaceHolderCoordinates { get; set; }

		public esealplaceHolderCoordinates esealPlaceHolderCoordinates { get; set; }
	}
}

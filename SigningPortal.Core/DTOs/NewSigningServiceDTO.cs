namespace SigningPortal.Core.DTOs
{
	public class NewSigningServiceDTO
	{
		public string accountType { get; set; }

		public string accountId { get; set; }

		public string documentType { get; set; }

		public string subscriberUniqueId { get; set; }

		// public string subscriberFullName { get; set; }

		public string organizationUid { get; set; } = null;

		public string callbackURL { get; set; }

		public bool qrCodeRequired { get; set; } = false;

		public string qrCodeData { get; set; }

		public placeHolderCoordinates placeHolderCoordinates { get; set; }

		public esealplaceHolderCoordinates esealPlaceHolderCoordinates { get; set; }

		public qrPlaceHolderCoordinates qrPlaceHolderCoordinates { get; set; }

		public bool deligationSign { get; set; }
		public string recipientName { get; set; }
		public string recipientEncryptedString { get; set; }
		public string authPin { get; set; } = null;
		public string signPin { get; set; } = null;
		public string capturedFace { get; set; } = null;
		public string voiceCapture { get; set; } = null;
		public bool assistive { get; set; } = false;
	}
}

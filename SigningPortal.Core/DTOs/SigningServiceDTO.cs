namespace SigningPortal.Core.DTOs
{
	public class SigningServiceDTO
	{
		public string accountType { get; set; }

		public string accountId { get; set; }

		public string documentType { get; set; }

		public string subscriberUniqueId { get; set; }

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
		public bool mobile { get; set; } = false;
		public string userPhoto { get; set; } = null;
		public int signatureTemplateId { get; set; } = 0;
		public int esealTemplateId { get; set; } = 0;
	}

	public class placeHolderCoordinates
	{
		public string pageNumber { get; set; }

		public string signatureXaxis { get; set; }

		public string signatureYaxis { get; set; }

		public string imgWidth { get; set; }

		public string imgHeight { get; set; }
	}

	public class esealplaceHolderCoordinates
	{
		public string pageNumber { get; set; }

		public string signatureXaxis { get; set; }

		public string signatureYaxis { get; set; }

		public string imgWidth { get; set; }

		public string imgHeight { get; set; }
	}
	public class qrPlaceHolderCoordinates
	{
		public string pageNumber { get; set; }

		public string signatureXaxis { get; set; }

		public string signatureYaxis { get; set; }

		public string imgWidth { get; set; }

		public string imgHeight { get; set; }
	}
}

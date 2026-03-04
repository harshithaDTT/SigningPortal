namespace SigningPortal.Core.DTOs
{
	public class ConsentDataSignatureDTO
	{
		public string documentType { get; set; }

		public string subscriberUniqueId { get; set; }

		public string signingPin { get; set; }

		public string userPhoto { get; set; }

		public placeHolderCoordinates placeHolderCoordinates { get; set; }
	}
}

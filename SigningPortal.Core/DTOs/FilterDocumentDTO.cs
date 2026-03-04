namespace SigningPortal.Core.DTOs
{
	public class FilterDocumentDTO
	{
		public string Status { get; set; }

		public bool ActionRequired { get; set; }

		public bool ExpirySoon { get; set; }
	}
}

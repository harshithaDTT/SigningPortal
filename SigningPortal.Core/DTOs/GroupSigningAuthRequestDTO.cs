namespace SigningPortal.Core.DTOs
{
	public class GroupSigningAuthRequestDTO
	{
		public string subscriberUid { get; set; }
		public bool sign { get; set; }
		public bool auth { get; set; }
		public bool isMobile { get; set; }
		public string signPin { get; set; }
		public string authPin { get; set; }
		public string faceData { get; set; }
	}

	public class GroupSigningAuthDTO
	{
		public string signPin { get; set; }
		public string authPin { get; set; }
		public string faceData { get; set; }
	}
}

namespace SigningPortal.Core.DTOs
{
	public class VerifySigningDTO
	{
		public string documentType { get; set; }
		public string docData { get; set; }
		public string signature { get; set; }
		public string subscriberUid { get; set; }
		public Digitalsignatureparams digitalSignatureParams { get; set; }
	}

	public class Digitalsignatureparams
	{
		public Verificationcontext verificationContext { get; set; }
	}

	public class Verificationcontext
	{
		public int reportType { get; set; }
	}
}

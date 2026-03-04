namespace SigningPortal.Core.Domain.Model
{
	public class JWTConfig
	{
		public string SecretKey { get; set; }
		public string Issuer { get; set; }
		public string Audience { get; set; }
		public string Algorithm { get; set; }
		public int ExpiryInMins { get; set; }

	}
}

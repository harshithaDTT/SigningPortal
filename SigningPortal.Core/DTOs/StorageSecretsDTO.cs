namespace SigningPortal.Core.DTOs
{
	public class StorageSecretsDTO
	{
		public string ClientId { get; set; }
		public string ClientSecret { get; set; }
		public string ApplicationName { get; set; }
		public string AuthUrl { get; set; }
		public string TokenUrl { get; set; }
		public string RedirectUrl { get; set; }
		public string Scope { get; set; }
		public int AccountExpiry { get; set; } = 10;
	}
}

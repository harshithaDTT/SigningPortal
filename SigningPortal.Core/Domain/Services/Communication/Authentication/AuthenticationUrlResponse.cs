namespace SigningPortal.Core.Domain.Services.Communication.Authentication
{
	public class AuthenticationUrlResponse
	{
		public AuthenticationUrlResponse(string url)
		{
			Url = url;
		}
		public string Url { get; set; }
	}
}

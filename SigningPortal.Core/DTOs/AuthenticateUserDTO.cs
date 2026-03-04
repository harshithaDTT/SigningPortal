namespace SigningPortal.Core.DTOs
{
	public class AuthenticateUserDTO
	{
		public string code { get; set; } = null;

		public string nonce { get; set; } = null;
	}
}

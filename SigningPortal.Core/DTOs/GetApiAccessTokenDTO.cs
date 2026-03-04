namespace SigningPortal.Core.DTOs
{
	public class GetApiAccessTokenDTO
	{
		public string email { get; set; } = null;

		public string name { get; set; } = null;

		public string suid { get; set; } = null;
	}

	public class GetApiAccessTokenDTOOld
	{
		public string email { get; set; } = null;

		public string name { get; set; } = null;

		public string suid { get; set; } = null;
		public string key { get; set; } = null;
	}
}

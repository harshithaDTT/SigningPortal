namespace SigningPortal.Core.DTOs
{
	public class PushNotificationDTO
	{
		public string AccessToken { get; set; }

		public string Suid { get; set; }

		public string Title { get; set; } = "Signing Application";

		public string Body { get; set; }

		public string Text { get; set; } = string.Empty;

		public string Url { get; set; } = string.Empty;

		public string Context { get; set; } = string.Empty;
	}
}

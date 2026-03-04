namespace SigningPortal.Core.DTOs
{
	public class NotificationDTO
	{
		public string Sender { get; set; } = null!;

		public string Receiver { get; set; } = null!;

		public string Link { get; set; } = null!;

		public string Text { get; set; } = null!;
	}
}

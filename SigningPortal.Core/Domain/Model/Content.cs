namespace SigningPortal.Core.Domain.Model
{
	public class Content
	{
		public Content(string link, string text)
		{
			Link = link;
			Text = text;
		}
		public string Link { get; set; } = null!;

		public string Text { get; set; } = null!;
	}

	public class NotificationMetaData
	{
		public NotificationMetaData(string type, string typeId)
		{
			Type = type;
			TypeId = typeId;
		}
		public NotificationMetaData(string type, string typeId, bool signStatus)
		{
			Type = type;
			TypeId = typeId;
			SignStatus = signStatus;
		}
		public string Type { get; set; } = string.Empty;
		public string TypeId { get; set; } = string.Empty;
		public bool SignStatus { get; set; } = true;
	}
}

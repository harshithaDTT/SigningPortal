using MongoDB.Bson;
using SigningPortal.Core.Constants;
using System;

namespace SigningPortal.Core.Domain.Model
{
	[BsonCollection("Notification")]
	public class Notification : BaseEntity
	{

		// Parameterless constructor for deserialization in Hangfire
		public Notification()
		{
			_id = ObjectId.GenerateNewId().ToString();
			CreatedAt = DateTime.UtcNow;
			UpdatedAt = DateTime.UtcNow;
			Content = new Content(string.Empty, string.Empty);
		}

		public Notification(string sender, string receiver, string link, string text)
		{
			_id = ObjectId.GenerateNewId().ToString();
			Sender = sender;
			Receiver = receiver;
			Content = new Content(link, text);
			CreatedAt = DateTime.UtcNow;
			UpdatedAt = DateTime.UtcNow;
		}
		public Notification(string sender, string receiver, string link, string text, string orgId)
		{
			_id = ObjectId.GenerateNewId().ToString();
			Sender = sender;
			Receiver = receiver;
			OrganizationId = orgId;
			AccountType = string.IsNullOrEmpty(orgId) ? AccountTypeConstants.Self : AccountTypeConstants.Organization;
			Content = new Content(link, text);
			CreatedAt = DateTime.UtcNow;
			UpdatedAt = DateTime.UtcNow;
		}
		public Notification(string sender, string receiver, string link, string text, string orgId, NotificationMetaData metaData)
		{
			_id = ObjectId.GenerateNewId().ToString();
			Sender = sender;
			Receiver = receiver;
			OrganizationId = orgId;
			AccountType = string.IsNullOrEmpty(orgId) ? AccountTypeConstants.Self : AccountTypeConstants.Organization;
			Content = new Content(link, text);
			MetaData = metaData;
			CreatedAt = DateTime.UtcNow;
			UpdatedAt = DateTime.UtcNow;
		}
		public string Sender { get; set; } = null!;

		public bool Read { get; set; } = false;

		public string Receiver { get; set; } = null!;

		public string Status { get; set; } = "New";

		public string OrganizationId { get; set; } = string.Empty;

		public string AccountType { get; set; } = string.Empty;

		public NotificationMetaData MetaData { get; set; } = null;

		public Content Content { get; set; }

	}
}

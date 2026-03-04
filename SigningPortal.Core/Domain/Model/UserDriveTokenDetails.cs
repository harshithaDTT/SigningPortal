using MongoDB.Bson.Serialization.Attributes;
using System;

namespace SigningPortal.Core.Domain.Model
{
	[Serializable]
	[BsonCollection("UserDriveTokenDetails")]
	public class UserDriveTokenDetails : BaseEntity
	{
		private DateTime _linkingTime;
		private DateTime _tokenExpiryTime;
		private DateTime _expiryDate;

		public string Suid { get; set; }

		public string UserEmail { get; set; }

		public string StorageName { get; set; }

		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime TokenExpiryTime
		{
			get => _tokenExpiryTime;
			set => _tokenExpiryTime = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}

		public string TokenDetails { get; set; }

		public bool ActiveStorage { get; set; }

		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime LinkingTime
		{
			get => _linkingTime;
			set => _linkingTime = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}

		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime ExpiryDate
		{
			get => _expiryDate;
			set => _expiryDate = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}

		public string State { get; set; }

		public string Status { get; set; }

		public string OrganizationId { get; set; }

		public string OrganizationName { get; set; }

		public string AccountType { get; set; }
	}
}

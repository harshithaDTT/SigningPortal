using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace SigningPortal.Core.Domain.Model
{
	public class BaseEntity
	{
		private DateTime _createdAt;
		private DateTime _updatedAt;

		[BsonId]
		[BsonRepresentation(BsonType.ObjectId)]
		public virtual string _id { get; set; }

		[BsonElement]
		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime CreatedAt
		{
			get => _createdAt;
			set => _createdAt = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}

		[BsonElement]
		[BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
		public DateTime UpdatedAt
		{
			get => _updatedAt;
			set => _updatedAt = value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));
		}
	}
}

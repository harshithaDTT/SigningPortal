using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Model
{
	[Serializable]
	[BsonCollection("SubscriberOrgUserTemplate")]
	public class SubscriberOrgUserTemplate : BaseEntity
	{
		public string Suid { get; set; }

		public string OrganizationId { get; set; }


		[BsonRepresentation(BsonType.ObjectId)]
		public string TemplateId { get; set; }

		public IList<UserTemplate> TemplateDetails { get; set; }
	}
}

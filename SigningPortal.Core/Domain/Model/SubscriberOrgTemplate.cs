using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Model
{

	[Serializable]
	[BsonCollection("SubscriberOrgTemplate")]
	public class SubscriberOrgTemplate : BaseEntity
	{
		public string Suid { get; set; }

		public string OrganizationId { get; set; }


		[BsonRepresentation(BsonType.ObjectId)]
		public string TemplateId { get; set; }

		public IList<Template> TemplateDetails { get; set; }
	}
}

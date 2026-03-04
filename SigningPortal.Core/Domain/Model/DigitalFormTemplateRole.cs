using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using SigningPortal.Core.DTOs;
using System;

namespace SigningPortal.Core.Domain.Model
{
	[Serializable]
	[BsonCollection("DigitalFormTemplateRole")]
	public class DigitalFormTemplateRole : BaseEntity
	{
		[BsonRepresentation(BsonType.ObjectId)]
		public string TemplateId { get; set; }

		public string Email { get; set; }

		public Role Roles { get; set; }

		public string AnnotationsList { get; set; }

		public int SigningOrder { get; set; }

		public placeHolderCoordinates PlaceHolderCoordinates { get; set; }

		public esealplaceHolderCoordinates EsealPlaceHolderCoordinates { get; set; }

		public string CreatedBy { get; set; }

		public string UpdatedBy { get; set; }
	}
}

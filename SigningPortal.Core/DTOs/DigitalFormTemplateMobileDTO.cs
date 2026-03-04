using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class DigitalFormTemplateMobileDTO : BaseEntity
	{
		public string TemplateName { get; set; }

		public string Status { get; set; }

		public string DocumentName { get; set; }

		public string OrganizationUid { get; set; }

		public string HtmlSchema { get; set; }

		public string PdfSchema { get; set; }

		public List<DigitalFormTemplateRoleMobileDTO> Roles { get; set; } = new();
	}

	public class DigitalFormTemplateRoleMobileDTO : BaseEntity
	{
		public string TemplateId { get; set; }

		public Role Roles { get; set; }

		public string AnnotationsList { get; set; }

		public placeHolderCoordinates PlaceHolderCoordinates { get; set; }

		public esealplaceHolderCoordinates EsealPlaceHolderCoordinates { get; set; }

	}
}

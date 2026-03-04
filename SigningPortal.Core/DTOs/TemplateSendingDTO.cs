using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class TemplateSendingDTO
	{
		public string FormId { get; set; }
		public string DocumentName { get; set; }
		public string RequestName { get; set; }
		public string RequestType { get; set; }
		public string TemplateType { get; set; }
		public string HtmlSchema { get; set; }
		public string PdfSchema { get; set; }
		public string RoleSchema { get; set; }

		public string AccessToken { get; set; }
		public string PreFilledData { get; set; }
		public bool DisableOrder { get; set; }
		public List<Dictionary<string, TemplateSignerDetails>> RolesMapping { get; set; }
		public Dictionary<string, RoleAnnotationValue> RoleAnnotations { get; set; }
		public Dictionary<string, int> RoleSigningOrder { get; set; }
	}

	public class TemplateSignerDetails
	{
		public User Signer { get; set; }
		public string SignerName { get; set; }
		public string OrganizationId { get; set; } = string.Empty;
		public string OrganizationName { get; set; } = string.Empty;
		public string RoleName { get; set; }
		public bool HasDelegation { get; set; } = false;
		public string DelegationId { get; set; } = string.Empty;
		public List<User> AlternateSignatories { get; set; } = new();
	}

	public class RoleAnnotationValue
	{
		public AnnotationTypes AnnotationType { get; set; }
		public string AnnotationList { get; set; }
	}

	public class AnnotationTypes
	{
		public placeHolderCoordinates PlaceHolderCoordinates { get; set; } = null;
		public esealplaceHolderCoordinates EsealplaceHolderCoordinates { get; set; } = null;
		public qrPlaceHolderCoordinates QrPlaceHolderCoordinates { get; set; } = null;
	}
}

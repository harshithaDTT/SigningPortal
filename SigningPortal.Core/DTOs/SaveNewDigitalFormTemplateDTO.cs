using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class SaveNewDigitalFormTemplateDTO
	{
		public IFormFile File { get; set; } = null;
		public string Model { get; set; }
	}

	public class TemplateModelDTO
	{
		public DigitalFormTemplateModel docConfig { get; set; }

		public List<Role> roles { get; set; }

		public string rolesConfig { get; set; }
	}

	public class DigitalFormTemplateModel
	{
		public string name { get; set; }

		public string documentName { get; set; }

		public string docType { get; set; }

		public string htmlSchema { get; set; }

		public string pdfSchema { get; set; }

		public string advancedSettings { get; set; }

		public string daysToComplete { get; set; }

		public string numberOfSignatures { get; set; }

		public bool allSigRequired { get; set; }

		public bool publishGlobally { get; set; }

		public bool sequentialSigning { get; set; }

		public bool dataStorage { get; set; } = true;

		public string submissionUrl { get; set; }

		public List<string> submissionEmails { get; set; } = [];

	}

	public class RoleDetails
	{
		public string email { get; set; }

		public Role role { get; set; }

		public int signingOrder { get; set; }

		public string annotationsList { get; set; }

		public placeHolderCoordinates placeHolderCoordinates { get; set; }

		public esealplaceHolderCoordinates esealPlaceHolderCoordinates { get; set; }
	}

	public class UpdatedRoleDetail
	{
		public string roleId { get; set; }
		public string email { get; set; }
		public Role role { get; set; }
		public int signingOrder { get; set; }
		public string annotationsList { get; set; }
		public placeHolderCoordinates placeHolderCoordinates { get; set; }
		public esealplaceHolderCoordinates esealPlaceHolderCoordinates { get; set; }
	}

	public class Role
	{
		public string email { get; set; }

		public string suid { get; set; }

		public string organizationId { get; set; } = string.Empty;

		public string organizationName { get; set; } = string.Empty;

		public string delegationId { get; set; } = string.Empty;

		public string name { get; set; }

		public string description { get; set; }
	}
}

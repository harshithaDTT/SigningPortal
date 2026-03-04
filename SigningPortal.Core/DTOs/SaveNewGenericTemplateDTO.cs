using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class SaveNewGenericTemplateDTO
	{
		public IFormFile File { get; set; }

		public string Model { get; set; }
	}

	public class GenericTemplateModel
	{
		public string TemplateName { get; set; }

		public string TemplateId { get; set; }

		public string DaysToComplete { get; set; }

		public string DocumentName { get; set; }

		public string SettingConfig { get; set; }

		public Signcoordinates SignCords { get; set; }

		public Esealcoordinates EsealCords { get; set; }

		public QrCoordinates QrCords { get; set; }

		public bool QrCodeRequired { get; set; }

		public IList<GenericTemplateRole> RoleList { get; set; }

		public int SignatureTemplate { get; set; }

		public int EsealSignatureTemplate { get; set; }

		public bool ESealRequired { get; set; }

		public bool DisableOrder { get; set; }

		public bool AllSignatureRequired { get; set; }

		public int RequiredSignatureNo { get; set; }
		public int Rotation { get; set; }
	}

	public class GenericTemplateRole
	{
		public string RoleName { get; set; }

		public string Email { get; set; }

		public string Suid { get; set; }

		public string Order { get; set; }

		public bool AllowComments { get; set; }

		public bool SignatureMandatory { get; set; }

		public bool ESeal { get; set; }
	}
}

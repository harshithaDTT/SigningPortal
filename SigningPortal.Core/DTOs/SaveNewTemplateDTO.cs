using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class SaveNewTemplateDTO
	{
		public IFormFile File { get; set; }

		public string Model { get; set; }

	}

	public class TemplateModel
	{
		public string TemplateName { get; set; }

		public string TemplateId { get; set; }

		public string DocumentName { get; set; }

		public string SettingConfig { get; set; }

		public Signcoordinates SignCords { get; set; }

		public Esealcoordinates EsealCords { get; set; }

		public QrCoordinates QrCords { get; set; }

		public bool QrCodeRequired { get; set; }

		public IList<Roles> RoleList { get; set; }

		public IList<string> EmailList { get; set; }

		public int SignatureTemplate { get; set; }

		public int EsealSignatureTemplate { get; set; }

		public int Rotation { get; set; }

        public string htmlSchema { get; set; }

    }

	public class Roles
	{
		public int Order { get; set; }

		public string Role { get; set; }

		public bool Eseal { get; set; }
	}

	public class Signcoordinates
	{
		public string coordinates { get; set; }
	}

	public class Esealcoordinates
	{
		public string coordinates { get; set; }
	}

	public class QrCoordinates
	{
		public string coordinates { get; set; }
	}
}

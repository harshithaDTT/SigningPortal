using SigningPortal.Core.DTOs;
using System;
using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Model
{
	[Serializable]
	[BsonCollection("Template")]
	public class Template : BaseEntity
	{
		public string TemplateName { get; set; }

		public string DocumentName { get; set; }

		public string Annotations { get; set; }

		public string EsealAnnotations { get; set; }

		public string QrCodeAnnotations { get; set; }

		public bool QrCodeRequired { get; set; }

		public string SettingConfig { get; set; }

		public IList<Roles> RoleList { get; set; }

		public IList<string> EmailList { get; set; }

		public int SignatureTemplate { get; set; }

		public int EsealSignatureTemplate { get; set; }
		public int Rotation { get; set; }

		public string Status { get; set; }

		public string EdmsId { get; set; }

		public string CreatedBy { get; set; }

		public string UpdatedBy { get; set; }

        public string HtmlSchema { get; set; }
    }
}

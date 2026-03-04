using SigningPortal.Core.DTOs;
using System;
using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Model
{

	[Serializable]
	[BsonCollection("Generic Template")]
	public class GenericTemplate : BaseEntity
	{
		public string TemplateName { get; set; }

		public string DocumentName { get; set; }

		public string DaysToComplete { get; set; }

		public bool QrCodeRequired { get; set; }

		public bool EsealCodeRequired { get; set; }

		public IList<GenericTemplateRole> RoleList { get; set; }

		public int SignatureTemplate { get; set; }

		public int EsealSignatureTemplate { get; set; }

		public string Annotations { get; set; }

		public string EsealAnnotations { get; set; }

		public string QrCodeAnnotations { get; set; }

		public string Status { get; set; }

		public string EdmsId { get; set; }

		public bool ESealRequired { get; set; }

		public bool DisableOrder { get; set; }

		public bool AllSignatureRequired { get; set; }

		public int RequiredSignatureNo { get; set; }
		public int Rotation { get; set; }

		public string CreatedBy { get; set; }

		public string UpdatedBy { get; set; }
	}
}
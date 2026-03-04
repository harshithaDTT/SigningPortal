namespace SigningPortal.Core.DTOs
{
	public class BulkSignDTO
	{
		public string TemplateId { get; set; }

		public string TemplateName { get; set; }

		public string SourcePath { get; set; }

		public string SignedPath { get; set; }

		public string Annotations { get; set; }

		public string EsealAnnotations { get; set; }
	}
}

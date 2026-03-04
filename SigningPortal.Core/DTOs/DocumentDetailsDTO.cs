using System;

namespace SigningPortal.Core.DTOs
{
	public class DocumentDetailsDTO
	{
		public string templateId { get; set; }
		public string templateName { get; set; }
		public string organizationId { get; set; }
		public string suid { get; set; }
		public string signatureAnnotations { get; set; }
		public string esealAnnotations { get; set; }
		public string sourcePath { get; set; }
		public string signedPath { get; set; }
		public string status { get; set; }
		public string corelationId { get; set; }
		public object signedBy { get; set; }
		public object completedAt { get; set; }
		public string ownerName { get; set; }
		public string ownerEmail { get; set; }
		public object signerEmail { get; set; }
		public Result result { get; set; }
		public string _id { get; set; }
		public DateTime createdAt { get; set; }
		public DateTime updatedAt { get; set; }
	}
}

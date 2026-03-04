using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.DTOs;
using System.Collections.Generic;
namespace SigningPortal.Core.Domain.Services.Communication.TemplateDocuments
{
	public class SentTemplateDocumentListResponse
	{
		public TemplateDocument MyCommonDoc { get; set; }

		public List<TemplateRecepient> Recepients { get; set; } = new();

		public int SentDocCount { get; set; }

		public int CompleteStatusCount { get; set; }
	}
	public class SentTemplateDocumentListResponseMobileDTO
	{
		public TemplateDocumentMobileDTO MyCommonDoc { get; set; }

		public List<TemplateRecepientMobileDTO> Recepients { get; set; } = new();

		public int SentDocCount { get; set; }

		public int CompleteStatusCount { get; set; }
	}
}

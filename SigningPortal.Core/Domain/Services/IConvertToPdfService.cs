using Microsoft.AspNetCore.Http;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
	public interface IConvertToPdfService
	{
		Task<ServiceResult> ConvertToPdf(IFormFile file);

		Task<ServiceResult> AddCommentsToPdf(CommentrequestDTO request);

		Task<ServiceResult> InitialWatermark(InitialWatermarkDTO request, Dictionary<string, IFormFile> imageFiles);

	}
}

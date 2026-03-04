using Microsoft.AspNetCore.Http;
using SigningPortal.Core.Domain.Services.Communication;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
    public interface IS3StorageService
    {
        Task<ServiceResult> UploadAsync(string objectName, IFormFile file);
        Task<ServiceResult> DownloadAsync(string documentId, string filePath);
        Task<ServiceResult> DeleteAsync(string documentId, string filePath);
        Task<ServiceResult> DeleteMultipleAsync(List<string> filePaths);
    }
}

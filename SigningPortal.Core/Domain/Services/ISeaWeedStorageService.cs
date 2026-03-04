using Microsoft.AspNetCore.Http;
using SigningPortal.Core.Domain.Services.Communication;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
    public interface ISeaWeedStorageService
    {
        Task<ServiceResult> GetDocumentAsync(string documentId, string filePath);
        Task<ServiceResult> UploadDocumentAsync(string objectName, IFormFile file);
        Task<ServiceResult> DeleteDocumentAsync(string documentId, string filePath);
        Task<ServiceResult> DeleteMultipleAsync(List<string> filePaths);
    }
}

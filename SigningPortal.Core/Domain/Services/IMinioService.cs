using Microsoft.AspNetCore.Http;
using SigningPortal.Core.Domain.Services.Communication;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
    public interface IMinioService
    {
        //Task<ServiceResult> UploadDocumentAsync(string objectName, IFormFile file);
        Task<ServiceResult> SaveDocumentToMinio(string expiryDate, IFormFile file);

        Task<ServiceResult> GetDocumentAsync(string documentId);

        Task<ServiceResult> DeleteDocumentFromMinioAsync(string documentId);

        Task<ServiceResult> DeleteDocumentsAsync();

        Task<ServiceResult> DeleteDocumentsByIdListAsync(List<string> documentIds, List<string> filePaths);

        Task<ServiceResult> UpdateSavedDocumentAsync(string documentId, IFormFile file);
    }
}

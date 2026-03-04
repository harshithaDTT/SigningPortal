using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
    public interface IS3DocumentRepository
    {
        Task<FileStorage> InsertAsync(FileStorage doc);

        Task<FileStorage> GetByIdAsync(string documentId);

        Task<List<(string DocumentId, string FilePath)>> GetActiveExpiredDocumentIdsAsync();

        Task UpdateAsync(FileStorage doc);

        Task<bool> MarkDocumentsExpiredAsync(List<string> documentIds);


        Task<bool> DeleteAsync(string documentId);

        Task<bool> DeleteManyAsync(List<string> documentIds);

    }
}

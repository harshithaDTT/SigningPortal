using MongoDB.Driver;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
    public class MinioDocumentRepository : GenericRepository<FileStorage>, IMinioDocumentRepository
    {
        public MinioDocumentRepository(IMongoDbSettings settings) : base(settings)
        {
        }

        public async Task<FileStorage> InsertAsync(FileStorage doc)
        {
            await Collection.InsertOneAsync(doc);
            return doc;
        }

        public async Task<FileStorage> GetByIdAsync(string documentId)
        {
            return await Collection
                .Find(x => x.DocumentId == documentId)
                .FirstOrDefaultAsync();
        }

        public async Task<List<(string DocumentId, string FilePath)>> GetActiveExpiredDocumentIdsAsync()
        {
            var filterBuilder = Builders<FileStorage>.Filter;
            var filter = filterBuilder.And(
                filterBuilder.Eq(x => x.Status, DocumentStorageConstants.Saved),
                filterBuilder.Lt(x=> x.ExpireDate,DateTime.UtcNow));

            var result = await Collection
                .Find(filter)
                .Project(doc => new
                {
                    doc.DocumentId,
                    doc.FilePath
                })
                .ToListAsync();

            // Convert the anonymous object to a tuple (string, string)
            return result.Select(x => (x.DocumentId, x.FilePath)).ToList();
        }

        public async Task UpdateAsync(FileStorage doc)
        {
            await Collection.ReplaceOneAsync(
                x => x.DocumentId == doc.DocumentId,
                doc
            );
        }

        public async Task<bool> MarkDocumentsExpiredAsync(List<string> documentIds)
        {
            var filter = Builders<FileStorage>.Filter.In(x => x.DocumentId, documentIds);

            var update = Builders<FileStorage>.Update
                .Set(x => x.Status, DocumentStorageConstants.Expired);

            var result = await Collection.UpdateManyAsync(filter, update);

            return result.ModifiedCount > 0;
        }

        public async Task<bool> DeleteAsync(string documentId)
        {
            var result = await Collection.DeleteOneAsync(x => x.DocumentId == documentId);
            return result.DeletedCount > 0;
        }

        public async Task<bool> DeleteManyAsync(List<string> documentIds)
        {
            var filter = Builders<FileStorage>.Filter.In(x => x.DocumentId, documentIds);
            var result = await Collection.DeleteManyAsync(filter);

            return result.DeletedCount > 0;
        }
    }
}

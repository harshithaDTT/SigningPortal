using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services.Communication;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
    public class StorageService : IStorageService
    {
        private readonly ILogger<StorageService> _logger;
        private readonly S3StorageConfiguration _config;
        private readonly IS3DocumentRepository _s3DocumentRepository;
        private readonly IS3StorageService _s3StorageService;

        public StorageService(ILogger<StorageService> logger,
                             IOptions<S3StorageConfiguration> config,
                             IS3DocumentRepository s3DocumentRepository,
                             IS3StorageService s3StorageService)
        {
            _logger = logger;
            _config = config.Value;
            _s3DocumentRepository = s3DocumentRepository;

            _s3StorageService = s3StorageService;
        }

        //public async Task<ServiceResult> UploadDocumentAsync(string objectName, IFormFile file)
        //{
        //    try
        //    {
        //        _logger.LogInformation(
        //            "Uploading file to s3. Bucket: {Bucket}, Object: {Object}, Size: {Size}",
        //            _config.Bucket, objectName, file.Length
        //        );

        //        bool exists = await _s3Client.BucketExistsAsync(
        //            new BucketExistsArgs().WithBucket(_config.Bucket)
        //        );

        //        if (!exists)
        //        {
        //            _logger.LogWarning("Bucket {Bucket} does not exist. Creating...", _config.Bucket);

        //            await _s3Client.MakeBucketAsync(
        //                new MakeBucketArgs().WithBucket(_config.Bucket)
        //            );

        //            _logger.LogInformation("Bucket {Bucket} created successfully.", _config.Bucket);
        //        }

        //        using var stream = file.OpenReadStream();

        //        await _s3Client.PutObjectAsync(
        //            new PutObjectArgs()
        //                .WithBucket(_config.Bucket)
        //                .WithObject(objectName)
        //                .WithStreamData(stream)
        //                .WithObjectSize(file.Length)
        //                .WithContentType(file.ContentType)
        //        );

        //        string path = $"{_config.Bucket}/{objectName}";
        //        _logger.LogInformation("File uploaded to s3 successfully: {Path}", path);

        //        return new ServiceResult(path, "File uploaded successfully", true);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex,
        //            "UploadDocumentAsync failed. FileName: {FileName}, Bucket: {Bucket}, Object: {Object}",
        //            file.FileName, _config.Bucket, objectName);

        //        return new ServiceResult("Failed to upload file to s3");
        //    }
        //}


        public async Task<ServiceResult> DeleteDocumentsAsync()
        {
            try
            {
                var activeDocuments = await _s3DocumentRepository.GetActiveExpiredDocumentIdsAsync();

                if (activeDocuments.Any())
                {
                    var documentIds = activeDocuments.Select(doc => doc.DocumentId).ToList();
                    var documentsUpdated = await _s3DocumentRepository.MarkDocumentsExpiredAsync(documentIds);
                    if (documentsUpdated)
                    {
                        _logger.LogInformation("Marked {Count} documents as expired.", documentIds.Count);

                        var filePaths = activeDocuments.Select(doc => doc.FilePath).ToList();
                        return await _s3StorageService.DeleteMultipleAsync(filePaths);
                    }
                    else
                    {
                        _logger.LogWarning("No documents were marked as expired.");
                        return new ServiceResult(message: "No documents deleted");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DeleteDocuments failed.");
            }
            return new ServiceResult(message: "DeleteDocuments failed.");
        }

        public async Task<ServiceResult> DeleteDocumentsByIdListAsync(List<string> documentIds, List<string> filePaths)
        {
            var documentsUpdated = await _s3DocumentRepository.MarkDocumentsExpiredAsync(documentIds);
            if (documentsUpdated)
            {
                _logger.LogInformation("Marked {Count} documents as expired.", documentIds.Count);

                return await _s3StorageService.DeleteMultipleAsync(filePaths);
            }
            else
            {
                _logger.LogWarning("No documents were marked as expired.");
                return new ServiceResult(message: "No documents deleted");
            }
        }

        public async Task<ServiceResult> SaveDocument(string expiryDate, IFormFile file)
        {
            try
            {
                _logger.LogInformation("SaveDocumentTos3 started. File: {FileName}, Size: {Size}",
                    file.FileName, file.Length);

                if (file == null)
                {
                    return new ServiceResult("No file provided");
                }

                if (string.IsNullOrEmpty(expiryDate))
                {
                    return new ServiceResult("Expiry date can not be null or empty");
                }

                DateTime? expDate = null;
                if (!string.IsNullOrWhiteSpace(expiryDate))
                {
                    if (DateTime.TryParse(expiryDate, out var parsed))
                    {
                        expDate = parsed;
                    }
                    else
                    {
                        _logger.LogWarning("Invalid expiry date provided: {Expiry}", expiryDate);
                    }
                }

                var doc = new FileStorage
                {
                    DocumentId = string.Concat(Guid.NewGuid().ToString().Where(char.IsDigit)),
                    Label = file.FileName,
                    ExpireDate = expDate,
                    ModifiedDate = DateTime.UtcNow,
                    Status = DocumentStorageConstants.Saved
                };

                _logger.LogInformation("Inserting metadata for document {DocId}", doc.DocumentId);

                //await _repository.InsertAsync(doc);

                string objectName = $"{doc.DocumentId}";
                var uploadResult = await _s3StorageService.UploadAsync(objectName, file);

                if (!uploadResult.Success)
                {
                    _logger.LogError("File upload failed for document {DocId}", doc.DocumentId);
                    return new ServiceResult("File upload to s3 failed");
                }

                string filePath = uploadResult.Result.ToString();

                doc.FilePath = filePath;
                doc.MimeType = file.ContentType;
                doc.Status = DocumentStorageConstants.Saved;
                doc.ModifiedDate = DateTime.UtcNow;

                var document = await _s3DocumentRepository.InsertAsync(doc);
                if (document == null)
                {
                    _logger.LogError("Failed to insert document metadata for {DocId}", doc.DocumentId);
                    return new ServiceResult("Failed to save document metadata");
                }

                _logger.LogInformation(
                    "Document {DocId} saved successfully. Path: {Path}",
                    doc.DocumentId, filePath);

                return new ServiceResult(doc.DocumentId, "File saved successfully to s3", true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "SaveDocumentTos3 failed for file {FileName}", file.FileName);
            }

            return new ServiceResult(message: "An error occurred while saving the document to s3");
        }

        public async Task<ServiceResult> GetDocumentAsync(string documentId)
        {
            try
            {
                DateTime startTime = DateTime.UtcNow;

                var doc = await _s3DocumentRepository.GetByIdAsync(documentId);
                if (doc == null)
                {
                    _logger.LogWarning($"Document {documentId} not found in metadata.");
                    return new ServiceResult("Document not found");
                }

                if (string.IsNullOrEmpty(doc.FilePath))
                {
                    _logger.LogWarning($"Document {documentId} exists but no file path set.");
                    return new ServiceResult("File not uploaded for this document");
                }
                if (doc.Status != DocumentStorageConstants.Saved)
                {
                    _logger.LogWarning($"Document {documentId} is not active. Status: {doc.Status}");
                    return new ServiceResult("Document is no longer available");
                }

                //var parts = doc.FilePath.Split('/', 2);
                //string bucket = parts[0];
                //string objectName = parts[1];

                //var memoryStream = new MemoryStream();

                //try
                //{
                //    await _s3Client.GetObjectAsync(
                //        new GetObjectArgs()
                //            .WithBucket(bucket)
                //            .WithObject(objectName)
                //            .WithCallbackStream(stream =>
                //            {
                //                stream.CopyTo(memoryStream);
                //            })
                //    );
                //}
                //catch (Exception s3Ex)
                //{
                //    _logger.LogError(s3Ex, $"Failed downloading object from s3: {doc.FilePath}");
                //    return new ServiceResult("Failed to retrieve file from storage");
                //}

                //memoryStream.Position = 0;
                //var bytes = memoryStream.ToArray();

                //if (bytes == null || bytes.Length == 0)
                //{
                //    _logger.LogError($"Document (ID: {documentId}) returned empty content.");
                //    return new ServiceResult("Document content empty");
                //}
                var document = await _s3StorageService.DownloadAsync(documentId, doc.FilePath);
                if (!document.Success)
                {
                    _logger.LogError($"Failed to get document content for {documentId}: {document.Message}");
                    return new ServiceResult("Failed to retrieve document content");
                }

                return new ServiceResult(document.Result, "Document retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"GetDocumentAsync Exception: {ex.Message}");
                return new ServiceResult("Something went wrong while retrieving document");
            }
        }

        //public async Task<ServiceResult> UpdateDocumentAsync(string documentId, IFormFile file)
        //{
        //    _logger.LogInformation("UpdateDocumentAsync called. DocId: {DocId}, File: {File}",
        //        documentId, file.FileName);

        //    try
        //    {
        //        return await UpdateSavedDocumentAsync(documentId, file);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex,
        //            "Unexpected error in UpdateDocumentAsync. DocId: {DocId}", documentId);

        //        return new ServiceResult("Failed to update document");
        //    }
        //}


        //public async Task<ServiceResult> CreateVersionDocumentAsync(string documentId, IFormFile file)
        //{
        //    _logger.LogInformation("CreateVersionDocumentAsync started. BaseDocId: {DocId}", documentId);

        //    try
        //    {
        //        var original = await _s3DocumentRepository.GetByIdAsync(documentId);

        //        if (original == null)
        //        {
        //            _logger.LogWarning("Base document not found for versioning. DocId: {DocId}", documentId);
        //            return new ServiceResult("Base document not found");
        //        }

        //        var newVersion = new SigningDocument
        //        {
        //            DocumentId = Guid.NewGuid().ToString(),
        //            Label = file.FileName,
        //            Status = "VERSIONED",
        //            MimeType = file.ContentType,
        //            ModifiedDate = DateTime.UtcNow,
        //            ExpireDate = original.ExpireDate
        //        };

        //        await _s3DocumentRepository.InsertAsync(newVersion);

        //        string objectName = $"{newVersion.DocumentId}_{file.FileName}";
        //        var uploadResult = await _s3StorageService.UploadDocumentAsync(objectName, file);

        //        if (!uploadResult.Success)
        //        {
        //            _logger.LogError("Failed to upload file for versioned document");
        //            return new ServiceResult("Version file upload failed");
        //        }

        //        newVersion.FilePath = uploadResult.Result.ToString();

        //        await _s3DocumentRepository.UpdateAsync(newVersion);

        //        return new ServiceResult(
        //            new { docId = newVersion.DocumentId },
        //            "New document version created successfully",
        //            true
        //        );
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex,
        //            "CreateVersionDocumentAsync failed. BaseDocId: {DocId}", documentId);

        //        return new ServiceResult("Error while creating document version");
        //    }
        //}

        public async Task<ServiceResult> UpdateSavedDocumentAsync(string documentId, IFormFile file)
        {
            _logger.LogInformation("UpdateSavedDocumentAsync started. DocId: {DocId}", documentId);

            try
            {
                var doc = await _s3DocumentRepository.GetByIdAsync(documentId);

                if (doc == null)
                {
                    _logger.LogWarning("Update failed. Document not found. DocId: {DocId}", documentId);
                    return new ServiceResult("Document not found");
                }

                if (doc.Status != DocumentStorageConstants.Saved)
                {
                    _logger.LogWarning($"Document {documentId} is not active. Status: {doc.Status}");
                    return new ServiceResult("Document is no longer available");
                }

                if (!string.IsNullOrWhiteSpace(doc.FilePath))
                {
                    var objectName = doc.FilePath.Split('/').Last();

                    try
                    {
                        _logger.LogInformation("Deleting old file from s3: {Object}", objectName);

                        //await _s3Client.RemoveObjectAsync(
                        //    new RemoveObjectArgs()
                        //        .WithBucket(_config.Bucket)
                        //        .WithObject(objectName)
                        //);
                        var deleteResult = await _s3StorageService.DeleteAsync(documentId, doc.FilePath);
                        if (!deleteResult.Success)
                        {
                            _logger.LogError("Failed to delete document metadata for DocId: {DocId}", documentId);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to delete old file from s3. DocId: {DocId}", documentId);
                        return new ServiceResult("Old file could not be replaced");
                    }
                }

                string newObjectName = $"{doc.DocumentId}";
                var uploadResult = await _s3StorageService.UploadAsync(newObjectName, file);

                if (!uploadResult.Success)
                {
                    _logger.LogError("Upload failed while updating document. DocId: {DocId}", documentId);
                    return new ServiceResult("Failed to upload updated file");
                }

                doc.FilePath = uploadResult.Result.ToString();
                doc.Label = file.FileName;
                doc.MimeType = file.ContentType;
                doc.ModifiedDate = DateTime.UtcNow;

                await _s3DocumentRepository.UpdateAsync(doc);

                _logger.LogInformation("Document updated successfully. DocId: {DocId}", documentId);

                return new ServiceResult(true, "Document updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Unexpected error inside UpdateSavedDocumentAsync. DocId: {DocId}", documentId);

                return new ServiceResult("Error while updating the document");
            }
        }

        public async Task<ServiceResult> DeleteDocumentAsync(string documentId)
        {
            _logger.LogInformation("DeleteDocumentAsync started for DocumentId: {DocId}", documentId);

            try
            {
                var doc = await _s3DocumentRepository.GetByIdAsync(documentId);

                if (doc == null)
                {
                    _logger.LogWarning("DocumentId {DocId} not found in database.", documentId);
                    return new ServiceResult("Document not found");
                }

                if (doc.Status != DocumentStorageConstants.Saved)
                {
                    _logger.LogWarning($"Document {documentId} is not active. Status: {doc.Status}");
                    return new ServiceResult("Document is no longer available");
                }

                if (string.IsNullOrWhiteSpace(doc.FilePath))
                {
                    _logger.LogWarning("Document {DocId} has no associated file path.", documentId);
                    return new ServiceResult("Document file missing");
                }

                string objectName = doc.FilePath.Contains("/")
                    ? doc.FilePath.Split('/').Last()
                    : doc.FilePath;

                //_logger.LogInformation("Deleting file from s3. Bucket: {Bucket}, Object: {Object}",
                //    _config.Bucket, objectName);

                //var removeArgs = new RemoveObjectArgs()
                //    .WithBucket(_config.Bucket)
                //    .WithObject(objectName);

                //try
                //{
                //    await _s3Client.RemoveObjectAsync(removeArgs);
                //    _logger.LogInformation("File removed from s3: {Object}", objectName);
                //}
                //catch (Exception s3Ex)
                //{
                //    _logger.LogError(s3Ex,
                //        "Failed to remove file from s3. DocumentId: {DocId}, Object: {Object}",
                //        documentId, objectName);

                //    return new ServiceResult("Failed to delete document file from storage");
                //}
                //try
                //{
                //    await _s3DocumentRepository.DeleteAsync(documentId);
                //    _logger.LogInformation("Metadata deleted for DocumentId: {DocId}", documentId);
                //}
                //catch (Exception mongoEx)
                //{
                //    _logger.LogError(mongoEx,
                //        "Failed to delete metadata for DocumentId: {DocId}", documentId);

                //    return new ServiceResult("File deleted but metadata removal failed");
                //}

                var deleteResult = await _s3StorageService.DeleteAsync(documentId, doc.FilePath);
                if (!deleteResult.Success)
                {
                    _logger.LogError("Failed to delete document metadata for DocId: {DocId}", documentId);
                    return new ServiceResult("Failed to delete document metadata");
                }

                return new ServiceResult(true, "Document deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error deleting document {DocId}", documentId);
                return new ServiceResult("Error deleting document");
            }
        }
    }
}

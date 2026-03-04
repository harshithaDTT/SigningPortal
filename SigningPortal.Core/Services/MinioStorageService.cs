using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel;
using Minio.DataModel.Args;
using Minio.Exceptions;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reactive.Linq;
using System.Threading.Tasks;

public class MinioStorageService : IMinioStorageService
{
    private readonly ILogger<MinioStorageService> _logger;
    private readonly IMinioClient _minioClient;
    private readonly MinioConfiguration _config;

    public MinioStorageService(
        ILogger<MinioStorageService> logger,
        IMinioClient minioClient,
        IOptions<MinioConfiguration> config)
    {
        _logger = logger;
        _minioClient = minioClient;
        _config = config.Value;
    }

    // ================================
    // GET DOCUMENT
    // ================================
    public async Task<ServiceResult> GetDocumentAsync(string documentId, string filePath)
    {
        try
        {
            DateTime startTime = DateTime.UtcNow;

            if (string.IsNullOrEmpty(filePath))
            {
                _logger.LogWarning($"Document {documentId} has no file path.");
                return new ServiceResult("File not uploaded for this document");
            }

            var parts = filePath.Split('/', 2);
            string bucket = parts[0];
            string objectName = parts[1];

            var memoryStream = new MemoryStream();

            try
            {
                await _minioClient.GetObjectAsync(
                    new GetObjectArgs()
                        .WithBucket(bucket)
                        .WithObject(objectName)
                        .WithCallbackStream(stream =>
                        {
                            stream.CopyTo(memoryStream);
                        })
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to download {filePath}");
                return new ServiceResult("Failed to retrieve file from MinIO");
            }

            memoryStream.Position = 0;
            var bytes = memoryStream.ToArray();

            if (bytes.Length == 0)
            {
                return new ServiceResult("Document content empty");
            }

            _logger.LogInformation(
                $"Document {documentId} retrieved successfully. Size: {bytes.Length} bytes. Time: {DateTime.UtcNow - startTime}"
            );

            return new ServiceResult(bytes, "Document retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetDocumentAsync Exception");
            return new ServiceResult("Something went wrong while retrieving document");
        }
    }

    // ================================
    // UPLOAD DOCUMENT
    // ================================

    public async Task<ServiceResult> UploadDocumentAsync(string objectName, IFormFile file)
    {
        try
        {
            _logger.LogInformation(
                "Uploading file to MinIO. Bucket: {Bucket}, Object: {Object}, Size: {Size}",
                _config.Bucket, objectName, file.Length
            );

            bool exists = await _minioClient.BucketExistsAsync(
                new BucketExistsArgs().WithBucket(_config.Bucket)
            );

            if (!exists)
            {
                _logger.LogWarning("Bucket {Bucket} does not exist. Creating...", _config.Bucket);

                await _minioClient.MakeBucketAsync(
                    new MakeBucketArgs().WithBucket(_config.Bucket)
                );

                _logger.LogInformation("Bucket {Bucket} created successfully.", _config.Bucket);
            }

            using var stream = file.OpenReadStream();

            await _minioClient.PutObjectAsync(
                new PutObjectArgs()
                    .WithBucket(_config.Bucket)
                    .WithObject(objectName)
                    .WithStreamData(stream)
                    .WithObjectSize(file.Length)
                    .WithContentType(file.ContentType)
            );

            string path = $"{_config.Bucket}/{objectName}";
            _logger.LogInformation("File uploaded to MinIO successfully: {Path}", path);

            return new ServiceResult(path, "File uploaded successfully", true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "UploadDocumentAsync failed. FileName: {FileName}, Bucket: {Bucket}, Object: {Object}",
                file.FileName, _config.Bucket, objectName);

            return new ServiceResult("Failed to upload file to MinIO");
        }
    }

    // ================================
    // DELETE DOCUMENT
    // ================================
    public async Task<ServiceResult> DeleteDocumentAsync(string documentId, string filePath)
    {
        _logger.LogInformation("DeleteDocumentAsync started for DocumentId: {DocId}", documentId);

        try
        {
            if (string.IsNullOrWhiteSpace(filePath))
            {
                _logger.LogWarning("Document {DocId} has no file path.", documentId);
                return new ServiceResult("Document file missing");
            }

            string bucket = filePath.Split('/')[0];
            string objectName = filePath.Split('/').Last();

            _logger.LogInformation("Deleting from MinIO. Bucket: {Bucket}, Object: {Object}",
                bucket, objectName);

            try
            {
                await _minioClient.RemoveObjectAsync(
                    new RemoveObjectArgs()
                        .WithBucket(_config.Bucket)
                        .WithObject(objectName)
                );

                _logger.LogInformation("File removed from MinIO: {Object}", objectName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to remove file from MinIO for DocumentId {DocId}", documentId);

                return new ServiceResult("Failed to delete file from storage");
            }

            return new ServiceResult(true, "Document deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deleting document {DocId}", documentId);
            return new ServiceResult("Error deleting document");
        }
    }

    //public async Task<ServiceResult> DeleteMultipleAsync(List<string> filePaths)
    //{
    //    try
    //    {
    //        // Extract only object names (remove bucket prefix)
    //        var objectNames = filePaths
    //            .Select(path => path.Contains("/") ? path.Split('/').Last() : path)
    //            .ToList();


    //        var args = new RemoveObjectsArgs()
    //            .WithBucket(_config.Bucket)
    //            .WithObjects(objectNames);

    //        // This returns an IObservable<DeleteError>
    //        var observable = await _minioClient.RemoveObjectsAsync(args);

    //        if (observable.Any())
    //        {
    //            foreach (var err in observable)
    //                _logger.LogError($"Failed to delete: {err.Key}, Error: {err.Message}");

    //            return new ServiceResult("Some files failed to delete");
    //        }

    //        return new ServiceResult(true, "All files deleted successfully");
    //    }
    //    catch (Exception ex)
    //    {
    //        _logger.LogError(ex, "Bulk deletion failed");
    //        return new ServiceResult("Failed to delete files");
    //    }
    //}

    public async Task<ServiceResult> DeleteMultipleAsync(List<string> filePaths)
    {
        try
        {
            // Extract object names (remove bucket prefix)
            var objectNames = filePaths
                .Select(path => path.Contains("/") ? path.Split('/').Last() : path)
                .ToList();

            var args = new RemoveObjectsArgs()
                .WithBucket(_config.Bucket)
                .WithObjects(objectNames);

            var errors = await _minioClient.RemoveObjectsAsync(args);

            if (errors.Count > 0)
            {
                foreach (var err in errors)
                    _logger.LogError($"Failed to delete: {err.Key}, Error: {err.Message}");

                return new ServiceResult("Some files failed to delete");
            }

            return new ServiceResult(true, "All files deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Bulk deletion failed");
            return new ServiceResult("Failed to delete files");
        }
    }


}

using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace SigningPortal.Core.Services
{
    public class SeaweedFsStorageService : ISeaWeedStorageService
    {
        private readonly ILogger<SeaweedFsStorageService> _logger;
        private readonly IAmazonS3 _s3;
        private readonly SeaweedFsConfiguration _config;

        public SeaweedFsStorageService(
            ILogger<SeaweedFsStorageService> logger,
            IOptions<SeaweedFsConfiguration> config)
        {
            _logger = logger;
            _config = config.Value;

            _s3 = new AmazonS3Client(
                new AnonymousAWSCredentials(),
                new AmazonS3Config
                {
                    ServiceURL = _config.Endpoint,
                    ForcePathStyle = true,
                    UseHttp = true
                });
        }

        public async Task<ServiceResult> GetDocumentAsync(string documentId, string filePath)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(filePath))
                {
                    _logger.LogWarning("Document {DocId} has no file path", documentId);
                    return new ServiceResult("File not uploaded");
                }

                var (bucket, key) = SplitPath(filePath);
                using var memoryStream = new MemoryStream();

                try
                {
                    var response = await _s3.GetObjectAsync(bucket, key);
                    await response.ResponseStream.CopyToAsync(memoryStream);
                }
                catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    _logger.LogWarning("File not found in SeaweedFS: {Path}", filePath);
                    return new ServiceResult("File not found");
                }

                var bytes = memoryStream.ToArray();
                return bytes.Length == 0
                    ? new ServiceResult("Document content empty")
                    : new ServiceResult(bytes, "Document retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetDocumentAsync failed for {DocId}", documentId);
                return new ServiceResult("Failed to retrieve document");
            }
        }

        public async Task<ServiceResult> UploadDocumentAsync(string objectName, IFormFile file)
        {
            try
            {
                await EnsureBucketExistsAsync(_config.Bucket);

                var key = objectName;

                _logger.LogInformation(
                    "Uploading to SeaweedFS. Bucket={Bucket}, Key={Key}, Size={Size}",
                    _config.Bucket, key, file.Length);

                using var stream = file.OpenReadStream();

                await _s3.PutObjectAsync(new PutObjectRequest
                {
                    BucketName = _config.Bucket,
                    Key = key,
                    InputStream = stream,
                    ContentType = file.ContentType
                });

                var path = $"{_config.Bucket}/{key}";
                return new ServiceResult(path, "File uploaded successfully", true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "UploadDocumentAsync failed. File={File}, Bucket={Bucket}",
                    file.FileName, _config.Bucket);

                return new ServiceResult("Failed to upload file");
            }
        }

        public async Task<ServiceResult> DeleteDocumentAsync(string documentId, string filePath)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(filePath))
                {
                    _logger.LogWarning("Document {DocId} has no file path", documentId);
                    return new ServiceResult("File path missing");
                }

                var (bucket, key) = SplitPath(filePath);

                try
                {
                    await _s3.DeleteObjectAsync(bucket, key);
                }
                catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
                {

                }

                return new ServiceResult(true, "Document deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DeleteDocumentAsync failed for {DocId}", documentId);
                return new ServiceResult("Failed to delete document");
            }
        }

        public async Task<ServiceResult> DeleteMultipleAsync(List<string> filePaths)
        {
            try
            {
                var objects = filePaths
                    .Select(p => new KeyVersion { Key = p.Split('/').Last() })
                    .ToList();

                var request = new DeleteObjectsRequest
                {
                    BucketName = _config.Bucket,
                    Objects = objects
                };

                var response = await _s3.DeleteObjectsAsync(request);

                if (response.DeleteErrors.Any())
                {
                    foreach (var err in response.DeleteErrors)
                        _logger.LogError("Failed delete {Key}: {Msg}", err.Key, err.Message);

                    return new ServiceResult("Some files failed to delete");
                }

                return new ServiceResult(true, "All files deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Bulk delete failed");
                return new ServiceResult("Failed to delete files");
            }
        }

        private async Task EnsureBucketExistsAsync(string bucket)
        {
            try
            {
                await _s3.HeadBucketAsync(new HeadBucketRequest { BucketName = bucket });
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                await _s3.PutBucketAsync(new PutBucketRequest { BucketName = bucket });
            }
        }

        private static (string bucket, string key) SplitPath(string path)
        {
            var parts = path.Split('/', 2);
            return (parts[0], parts[1]);
        }
    }
}

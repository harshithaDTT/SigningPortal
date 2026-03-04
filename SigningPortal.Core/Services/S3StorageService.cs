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
    public class S3StorageService : IS3StorageService
    {
        private readonly ILogger<S3StorageService> _logger;
        private readonly IAmazonS3 _s3;
        private readonly S3StorageConfiguration _config;

        public S3StorageService(
       ILogger<S3StorageService> logger,
       IOptions<S3StorageConfiguration> config, IAmazonS3 s3)
        {
            _logger = logger;
            _config = config.Value;

            _s3 = s3;
        }


        private static AmazonS3Client CreateClient(S3StorageConfiguration config)
        {
            var s3Config = new AmazonS3Config
            {
                ServiceURL = config.Endpoint,
                ForcePathStyle = true,
                UseHttp = true
            };

            if (string.IsNullOrWhiteSpace(config.AccessKey))
            {
                return new AmazonS3Client(new AnonymousAWSCredentials(), s3Config);
            }

            return new AmazonS3Client(
                config.AccessKey,
                config.SecretKey,
                s3Config);
        }

        private static (string bucket, string key) SplitPath(string path)
        {
            var parts = path.Split('/', 2);
            return (parts[0], parts[1]);
        }

        private async Task EnsureBucketExistsAsync()
        {
            try
            {
                await _s3.HeadBucketAsync(new HeadBucketRequest
                {
                    BucketName = _config.Bucket
                });
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                await _s3.PutBucketAsync(new PutBucketRequest
                {
                    BucketName = _config.Bucket
                });
            }
        }

        public async Task<ServiceResult> UploadAsync(string objectName, IFormFile file)
        {
            try
            {
                await EnsureBucketExistsAsync();

                using var stream = file.OpenReadStream();

                await _s3.PutObjectAsync(new PutObjectRequest
                {
                    BucketName = _config.Bucket,
                    Key = objectName,
                    InputStream = stream,
                    ContentType = file.ContentType
                });

                return new ServiceResult(
                    $"{_config.Bucket}/{objectName}",
                    "File uploaded successfully",
                    true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Upload failed");
                return new ServiceResult("Failed to upload file");
            }
        }

        public async Task<ServiceResult> DownloadAsync(string documentId, string filePath)
        {
            try
            {
                var (bucket, key) = SplitPath(filePath);
                using var ms = new MemoryStream();

                var response = await _s3.GetObjectAsync(bucket, key);
                await response.ResponseStream.CopyToAsync(ms);

                var bytes = ms.ToArray();
                return bytes.Length == 0
                    ? new ServiceResult("Document content empty")
                    : new ServiceResult(bytes, "File downloaded successfully");
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return new ServiceResult("File not found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Download failed for {DocId}", documentId);
                return new ServiceResult("Failed to download file");
            }
        }

        public async Task<ServiceResult> DeleteAsync(string documentId, string filePath)
        {
            try
            {
                var (bucket, key) = SplitPath(filePath);

                await _s3.DeleteObjectAsync(bucket, key);

                return new ServiceResult(true, "File deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Delete failed for {DocId}", documentId);
                return new ServiceResult("Failed to delete file");
            }
        }

        public async Task<ServiceResult> DeleteMultipleAsync(List<string> filePaths)
        {
            try
            {
                var objects = filePaths
                    .Select(p => new KeyVersion { Key = p.Split('/').Last() })
                    .ToList();

                var response = await _s3.DeleteObjectsAsync(new DeleteObjectsRequest
                {
                    BucketName = _config.Bucket,
                    Objects = objects
                });

                if (response.DeleteErrors.Any())
                {
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

    }
}

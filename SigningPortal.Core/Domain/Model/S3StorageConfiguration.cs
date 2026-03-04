namespace SigningPortal.Core.Domain.Model
{
    public class S3StorageConfiguration
    {
        public string Provider { get; set; }
        public string Endpoint { get; set; }
        public string Bucket { get; set; }
        public string? AccessKey { get; set; }
        public string? SecretKey { get; set; }
    }

}

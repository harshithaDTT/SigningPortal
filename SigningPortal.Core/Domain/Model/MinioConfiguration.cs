namespace SigningPortal.Core.Domain.Model
{
    public class MinioConfiguration
    {
        public string Endpoint { get; set; }
        public string AccessKey { get; set; }
        public string SecretKey { get; set; }
        public string Bucket { get; set; }
    }
}

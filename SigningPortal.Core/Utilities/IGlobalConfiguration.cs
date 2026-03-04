namespace SigningPortal.Core.Utilities
{
    public interface IGlobalConfiguration
    {
        string ApiTokenKeySecret { get; set; }
        string FrontEndSecret { get; set; }
        string IDPClientId { get; set; }
        string IDPClientSecret { get; set; }
        string MobileIDPClientId { get; set; }
        string MobileIDPClientSecret { get; set; }
        //string RabbitMQConnectionString { get; set; }
        string ReddisConnectionString { get; set; }
        public string KafkaBootstrapServers { get; set; }
        public string KafkaTopicName { get; set; }

        public bool KafkaEnabled { get; set; }
    }
}

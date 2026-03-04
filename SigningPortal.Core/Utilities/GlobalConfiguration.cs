namespace SigningPortal.Core.Utilities
{
    public class GlobalConfiguration : IGlobalConfiguration
    {
        public string ApiTokenKeySecret { get; set; }
        public string FrontEndSecret { get; set; }
        public string IDPClientId { get; set; }
        public string IDPClientSecret { get; set; }
        public string MobileIDPClientId { get; set; }
        public string MobileIDPClientSecret { get; set; }
        //public string RabbitMQConnectionString { get; set; }
        public string ReddisConnectionString { get; set; }
        public string KafkaBootstrapServers { get; set; }
        public string KafkaTopicName { get; set; }

        public bool KafkaEnabled { get; set; }    
    }
}

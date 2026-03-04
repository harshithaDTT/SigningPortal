using Confluent.Kafka;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;

namespace SigningPortal.Core.Utilities
{
    public class LogClient : ILogClient, IDisposable
    {
        private readonly IConfiguration _configuration;
        private readonly IGlobalConfiguration _globalConfiguration;
        private readonly ILogger<LogClient> _logger;

        private IProducer<Null, string> _producer;
        //private IAdminClient _adminClient;
        private readonly string _topicName;
        private readonly bool isKafkaEnabled;
        private bool _disposed = false;

        public LogClient(ILogger<LogClient> logger,
             IConfiguration configuration,
             IGlobalConfiguration globalConfiguration)
        {
            _logger = logger;
            _configuration = configuration;
            _globalConfiguration = globalConfiguration;
            isKafkaEnabled = globalConfiguration?.KafkaEnabled ?? false;

			_logger.LogInformation("-->LogClient");
            _logger.LogInformation("****INSIDE INITLIBRARY****");

            // Determine bootstrap servers: prefer global configuration, fallback to IConfiguration
            var bootstrapServers = _globalConfiguration?.KafkaBootstrapServers ??
                    _configuration.GetValue<string>("Config:SigningPortalLogConfig:BootstrapServers");

            if (string.IsNullOrWhiteSpace(bootstrapServers) && isKafkaEnabled)
            {
                _logger.LogError("Kafka bootstrap servers not configured. Please set KafkaBootstrapServers in global configuration or Config:SigningPortalLogConfig:BootstrapServers.");
                throw new Exception("Kafka bootstrap servers not configured.");
            }

            _topicName = _globalConfiguration?.KafkaTopicName ??  _configuration.GetValue<string>("Config:SigningPortalLogConfig:TopicName");
            if (string.IsNullOrWhiteSpace(_topicName) && isKafkaEnabled)
            {
                _logger.LogError("Kafka topic name not configured. Please set Config:SigningPortalLogConfig:TopicName");
                throw new Exception("Kafka topic name not configured.");
            }
            if (!string.IsNullOrWhiteSpace(bootstrapServers))
            {
				int result = ConnectToKafka(bootstrapServers);
				if (0 != result)
				{
					_logger.LogError("Cannot connect to Kafka cluster");
					throw new Exception("Cannot connect to Kafka cluster");
				}
			}
			

            _logger.LogInformation("****INITLIBRARY FINISHED****");
            _logger.LogInformation("<--LogClient");
        }

        private int ConnectToKafka(string bootstrapServers)
        {
            _logger.LogInformation("-->ConnectToKafka");
            int result = -1;

            try
            {
                var producerConfig = new ProducerConfig
                {
                    BootstrapServers = bootstrapServers,
                    Acks = Acks.All, // Wait for all replicas
                    EnableIdempotence = true,
                    MessageTimeoutMs = 30000,
                    // other recommended settings can be added here
                };

                var adminConfig = new AdminClientConfig
                {
                    BootstrapServers = bootstrapServers
                };

                _producer = new ProducerBuilder<Null, string>(producerConfig)
                    //.SetErrorHandler((p, e) => _logger.LogError("Kafka producer error: {0}", e.Reason))
                    .Build();

                //_adminClient = new AdminClientBuilder(adminConfig).Build();

                _logger.LogInformation("TOPIC NAME IS {0}", _topicName);

                //// Create topic if it doesn't exist (best-effort)
                //try
                //{
                //    var numPartitions = _configuration.GetValue<int?>("Config:SigningPortalLogConfig:NumPartitions") ?? 3;
                //    var replicationFactor = _configuration.GetValue<short?>("Config:SigningPortalLogConfig:ReplicationFactor") ?? (short)1;

                //    var topicSpec = new TopicSpecification
                //    {
                //        Name = _topicName,
                //        NumPartitions = numPartitions,
                //        ReplicationFactor = replicationFactor
                //    };

                //    _logger.LogInformation("Attempting to create topic {0} (partitions: {1}, replication: {2})", _topicName, numPartitions, replicationFactor);

                //    // CreateTopicsAsync throws if topic exists; catch and continue
                //    _adminClient.CreateTopicsAsync([topicSpec]).Wait();
                //    _logger.LogInformation("Topic {0} created.", _topicName);
                //}
                //catch (AggregateException ae)
                //{
                //    // If topic already exists or creation not permitted, log and continue
                //    foreach (var ex in ae.InnerExceptions)
                //    {
                //        _logger.LogError("Topic creation warning: {0}", ex.Message);
                //    }
                //}
                //catch (Exception ex)
                //{
                //    // Non-fatal - log and continue
                //    _logger.LogError("Topic creation attempt failed (continuing): {0}", ex.Message);
                //}

                result = 0;
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError(ex, "Cannot connect to Kafka cluster");
                return result;
            }

            _logger.LogInformation("<--ConnectToKafka");
            return result;
        }

        public int SendSigningPortalLogMessage(LogMessage SigningPortalLogMessage)
        {
            _logger.LogInformation("-->SendSigningPortalLogMessage");

            int result = 0;

            if (SigningPortalLogMessage == null)
            {
                _logger.LogError("Invalid Input Parameter");
                return -1;
            }

            try
            {
                var payload = JsonConvert.SerializeObject(SigningPortalLogMessage);

                if (_producer != null)
                {
                    // Produce synchronously but unwrap exceptions cleanly
                    var deliveryResult = _producer.ProduceAsync(_topicName, new Message<Null, string> { Value = payload })
                            .GetAwaiter()
                            .GetResult();

                    if (deliveryResult.Status == PersistenceStatus.Persisted ||
                     deliveryResult.Status == PersistenceStatus.PossiblyPersisted)
                    {
                        result = 0;
                        _logger.LogInformation("Message delivered to topic {0} at partition {1} @ offset {2}",
                         deliveryResult.Topic, deliveryResult.Partition, deliveryResult.Offset);
                    }
                    else
                    {
                        _logger.LogError("Failed to deliver message to Kafka. Status: {0}", deliveryResult.Status);
                        result = -1;
                    }
                }
                else
                {
                    _logger.LogError("Kafka producer is not initialized");
                    result = -1;
                }
            }
            catch (ProduceException<Null, string> pex)
            {
                Monitor.SendException(pex);
                _logger.LogError("Kafka produce exception: {0} - {1}", pex.Error.Code, pex.Error.Reason);
                result = -1;
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError("Error while sending log message to Kafka: {0}", ex.Message);
                result = -1;
            }

            _logger.LogInformation("<--SendSigningPortalLogMessage");
            return result;
        }

        public int SendLog(string Suid, string serviceName,
               DateTime startTime, string MessageForLog, string logMessageType)
        {
            DateTime endTime = DateTime.UtcNow;
            TimeSpan diff = endTime - startTime;
            _logger.LogInformation("Time execution for service : {0} in total seconds : {1} ", serviceName, diff.TotalSeconds);
            int result;
            var guid = Guid.NewGuid().ToString();

            LogMessage logMessage = new LogMessage
            {
                identifier = Suid,
                transactionID = guid,
                serviceName = serviceName,
                startTime = startTime.ToString("s"),
                endTime = DateTime.UtcNow.ToString("s"),
                logMessage = MessageForLog + " Total time for execution in seconds : " + diff.TotalSeconds,
                logMessageType = logMessageType,
                transactionType = "BUSINESS",
                correlationID = guid,
                serviceProviderName = _globalConfiguration.IDPClientId,
                serviceProviderAppName = "SigningPortal",
                signatureType = "NONE"
            };

            var checkSum = PKIMethods.Instance.AddChecksum(JsonConvert.SerializeObject(logMessage));
            logMessage.checksum = checkSum;

            // Send log message to Kafka topic
            result = SendSigningPortalLogMessage(logMessage);
            if (0 != result)
            {
                _logger.LogError("Failed to send log message to Kafka topic");
                return result;
            }
            return result;
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;

            try
            {
                _producer?.Flush(TimeSpan.FromSeconds(10));
                _producer?.Dispose();
                //_adminClient?.Dispose();
            }
            catch (Exception ex)
            {
                _logger.LogError("Error while disposing Kafka clients: {0}", ex.Message);
            }
        }
    }
}

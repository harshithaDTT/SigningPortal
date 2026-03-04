namespace SigningPortal.Core
{
	public class MongoDbSettings : IMongoDbSettings
	{
		public string DatabaseName { get; set; }

		public string ConnectionString { get; set; }

		public string AuthenticationLogDbConnectionString { get; set; }

		public string AuthenticationLogDatabaseName { get; set; }
	}
}

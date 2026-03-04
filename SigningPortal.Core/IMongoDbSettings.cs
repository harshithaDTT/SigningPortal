namespace SigningPortal.Core
{
	public interface IMongoDbSettings
	{
		string DatabaseName { get; set; }

		string ConnectionString { get; set; }

		string AuthenticationLogDbConnectionString { get; set; }

		string AuthenticationLogDatabaseName { get; set; }
	}
}

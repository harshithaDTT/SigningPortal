namespace SigningPortal.Core.Domain.Services.Communication.Documents
{
	public class FileConfigurationResponse
	{
		public string AllowedFileSize { get; set; }

		public int GlobalLatancyPeriod { get; set; }

		public int LatancyPeriod { get; set; }
	}
}

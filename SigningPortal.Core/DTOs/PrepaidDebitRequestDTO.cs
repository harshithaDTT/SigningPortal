using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class PrepaidDebitRequestDTO
	{
		public string organizationId { get; set; }
		public double totalDebits { get; set; }
		public Dictionary<string, string> serviceDefinitions { get; set; } = new Dictionary<string, string>();
	}
	public class PostpaidDebitRequestDTO
	{
		public string subscriberSuid { get; set; }
		public string organizationId { get; set; }
		public bool transactionForOrganization { get; set; }
		public string serviceName { get; set; }
	}
}

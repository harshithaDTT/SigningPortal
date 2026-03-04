using System;

namespace SigningPortal.Core.DTOs
{
	public class CreditDetails
	{
		public int id { get; set; }
		public double totalCredits { get; set; }
		public double totalDebits { get; set; }
		public string subscriberSuid { get; set; }
		public DateTime createdOn { get; set; }
		public DateTime updatedOn { get; set; }
		public Servicedefinitions serviceDefinitions { get; set; }
	}

	public class Servicedefinitions
	{
		public int id { get; set; }
		public string serviceName { get; set; }
		public string serviceDisplayName { get; set; }
		public string status { get; set; }
		public bool pricingslabapplicable { get; set; }
	}
}



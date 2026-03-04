using System;
using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class SaveDelegatorDTO
	{
		public string Model { get; set; }
	}

	public class DelegatorModel
	{
		public string AccessToken { get; set; }

		public DateTime StartDateTime { get; set; }

		public DateTime EndDateTime { get; set; }

		public string DocumentType { get; set; }

		public string DelegationStatus { get; set; }

		public string ConsentData { get; set; }

		public string DelegatorConsentDataSignature { get; set; }

		public List<DelegateRecep> Delegatees { get; set; }
	}

	public class DelegateRecep
	{
		public string Email { get; set; }

		public string Suid { get; set; }

		public string FullName { get; set; }

		public string Thumbnail { get; set; }
	}

	public class DelegateConsentData
	{
		public string DelegatorId { get; set; }

		public string DelegatorSuid { get; set; }

		public string DelegatorName { get; set; }

		public string OrganizationId { get; set; }

		public string OrganizationName { get; set; }

		public DateTime StartDateTime { get; set; }

		public DateTime EndDateTime { get; set; }

		public DateTime RequestDateTime { get; set; }

		public string DocumentType { get; set; }

		public List<string> DelegateList { get; set; } = new List<string>();
	}
}

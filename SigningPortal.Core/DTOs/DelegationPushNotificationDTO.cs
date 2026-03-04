using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class DelegationPushNotificationDTO
	{
		public string Title { get; set; }

		public List<string> DelegateeList { get; set; } = new List<string>();

		public string Body { get; set; }

		public string Context { get; set; } = string.Empty;

		public string ConsentData { get; set; }

		public string AccessToken { get; set; }

		public string Url { get; set; } = string.Empty;

		public bool IsDelegator { get; set; } = false;

		public bool IsIdle { get; set; } = false;
	}

	public class ConsentData : DelegateConsentData
	{
		public string DelegationId { get; set; }

		public string FullName { get; set; }

		public List<DelegateRecep> DelegateeList { get; set; } = new List<DelegateRecep>();
	}
}

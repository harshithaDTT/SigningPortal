using SigningPortal.Core.Domain.Model;
using System;
using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class DelegationDTO : BaseEntity
	{
		public string DelegatorName { get; set; }

		public string DelegatorSuid { get; set; }

		public string OrganizationId { get; set; }

		public DateTime StartDateTime { get; set; }

		public DateTime EndDateTime { get; set; }

		public string DelegationStatus { get; set; }

		public string ConsentData { get; set; }

		public IList<DelegateeDTO> Delegatees { get; set; }
	}
	public class DelegateeDTO : BaseEntity
	{
		public string DelegationId { get; set; }

		public string DelegateeSuid { get; set; }

		public string OrganizationId { get; set; }

		public string DelegateeEmail { get; set; }

		public string FullName { get; set; }

		public string ConsentStatus { get; set; }
	}
}

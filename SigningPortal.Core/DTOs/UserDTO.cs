using SigningPortal.Core.Domain.Services.Communication.Authentication;
using System;
using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class UserDTO
	{
		public string Email { get; set; }

		public string Suid { get; set; }

		public string Name { get; set; }

		public DateTime AccessTokenExpiryTime { get; set; }

		public string OrganizationName { get; set; } = "";

		public string OrganizationId { get; set; } = "";

		public string AccountType { get; set; } = "";

        public IList<OrganizationDetails> OrganizationDetails { get; set; }
    }
}

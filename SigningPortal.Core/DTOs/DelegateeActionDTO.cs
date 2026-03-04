namespace SigningPortal.Core.DTOs
{
	public class DelegateeActionDTO
	{
		public string DelegateeSuid { get; set; }

		public string DelegationId { get; set; }

		public string UserPhoto { get; set; } = null;

		public string SigningPin { get; set; } = null;

		public bool Action { get; set; }
	}

	public class DelegatorActionDTO
	{
		public string DelegatorSuid { get; set; }

		public string DelegationId { get; set; }

		public string UserPhoto { get; set; } = null;

		public string SigningPin { get; set; } = null;

		public bool Action { get; set; }
	}
}

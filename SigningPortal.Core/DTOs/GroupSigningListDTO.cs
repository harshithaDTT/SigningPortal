using SigningPortal.Core.Domain.Model;

namespace SigningPortal.Core.DTOs
{
	public class GroupSigningListDTO : BaseEntity
	{
		public string SignerSuid { get; set; }

		public string SignerOrganizationId { get; set; } = string.Empty;

		public string Transaction { get; set; }

		public string Status { get; set; }

		public int TotalFileCount { get; set; }

		public int FailedFileCount { get; set; }

		public int SuccessFileCount { get; set; }

	}
}

using System;

namespace SigningPortal.Core.DTOs
{
	public class StorageListDTO
	{
		public string StorageName { get; set; }

		public bool IsLinked { get; set; } = false;

		public bool Active { get; set; } = false;

		public DateTime ExpiryDate { get; set; }
	}
}

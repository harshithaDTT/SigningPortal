namespace SigningPortal.Core.Domain.Model
{
	[BsonCollection("StorageConfiguration")]
	public class StorageConfiguration : BaseEntity
	{
		public string StorageName { get; set; }
		public string Configuration { get; set; }
		public int AccountExpiry { get; set; }

	}
}

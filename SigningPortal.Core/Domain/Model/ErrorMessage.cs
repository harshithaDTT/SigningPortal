namespace SigningPortal.Core.Domain.Model
{
	[BsonCollection("ErrorMessage")]
	public class ErrorMessage : BaseEntity
	{
		public string code { get; set; }

		public string message { get; set; }

		public string description { get; set; }
	}
}

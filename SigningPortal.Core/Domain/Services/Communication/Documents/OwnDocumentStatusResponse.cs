namespace SigningPortal.Core.Domain.Services.Communication.Documents
{
	public class OwnDocumentStatusResponse
	{
		public long cnt_in_progress { get; set; }

		public long cnt_expired { get; set; }

		public long cnt_declined { get; set; }

		public long cnt_completed { get; set; }
	}

	public class DashboardDocumentStatusResponse
	{
		public long cnt_draft { get; set; }

		public long cnt_send { get; set; }

		public long cnt_received { get; set; }

		public long cnt_referred { get; set; }

	}
}

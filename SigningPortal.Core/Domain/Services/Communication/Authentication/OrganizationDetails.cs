namespace SigningPortal.Core.Domain.Services.Communication.Authentication
{
	public class OrganizationDetails
	{
		public string OrganizationName { get; set; }

		public string OrganizationUid { get; set; }

		public string SubscriberEmailList { get; set; }

		public bool Signatory { get; set; }

		public bool eSealSignatory { get; set; }

		public bool eSealPrepatory { get; set; }
		public bool template { get; set; }
		public bool bulkSign { get; set; }

		public bool Delegate { get; set; }

		public bool DigitalFormPrivilege { get; set; }

    }
}

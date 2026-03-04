using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class QrDecryptDTO
	{
		public string qr_code_format { get; set; }

		//public string photo { get; set; } = null;

		//public string faceData { get; set; } = null;

		public QRData qr_code_data { get; set; }
	}

	public class QRData
	{
		public string document_id { get; set; }

		public string url { get; set; } = null;

		public CriticalData critical_data { get; set; } = null;

		public List<Signatories> signatories { get; set; }
	}

	public class CriticalData
	{
		public string entityName { get; set; }

		public string docSerialNo { get; set; }

		public bool faceRequired { get; set; } = false;
	}

	public class Signatories
	{
		public string name { get; set; }

		public string orgname { get; set; }
	}

	public class QRCodeObjectDTO
	{
		public string publicData { get; set; }

		public string privateData { get; set; }

		public string orgId { get; set; }

		public string photo { get; set; }
	}

	public class QRCodeObjectMyTrustDTO
	{
		public List<string> publicData { get; set; }

		public List<string> privateData { get; set; }

		public string credentialId { get; set; }
	}
}

using SigningPortal.Core.Domain.Services.Communication.SigningService;
using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Services.Communication.Documents
{
	public class VerifySigningRequestResponse
	{
		public IList<signatureDeatils> recpList { get; set; }

		public int signCount { get; set; }
	}
}

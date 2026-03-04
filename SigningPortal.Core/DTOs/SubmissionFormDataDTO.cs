using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class SubmissionFormDataDTO
	{
		public string RequestURL { get; set; }
		public string AuthUser { get; set; }
		public string AuthPassword { get; set; }
		public Dictionary<string, string> Headers { get; set; }
	}

}

using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class SignatoriesDTO
	{
		public UserProfileDTO userProfile { get; set; }

		public List<OrgDetailsDTO> orgDtos { get; set; }
	}
	public class UserProfileDTO
	{
		public string ugpassEmail { get; set; }

		public string suid { get; set; }

		public string selfieThumbnail { get; set; }

		public string name { get; set; }
		public string emailList { get; set; }
		public string status { get; set; }
	}

	public class OrgDetailsDTO
	{
		public string orgUid { get; set; }
		public string orgName { get; set; }
		public List<string> employee_list { get; set; }

		public List<string> eseal_employee_list { get; set; }
		public bool has_eseal_permission { get; set; }

		public string initial { get; set; }
	}

	public class SignatoriesNewDTO
	{
		public UserProfileNewDTO userProfile { get; set; }

		public List<OrgDetailsNewDTO> orgDtos { get; set; }
	}
	public class UserProfileNewDTO
	{
		public string ugpassEmail { get; set; }
		public string suid { get; set; }	
		public string name { get; set; }
		public string emailList { get; set; }
		public string status { get; set; }
	}

	public class OrgDetailsNewDTO
	{
		public string orgUid { get; set; }
		public string orgName { get; set; }
		public List<string> employee_list { get; set; }
		public List<string> eseal_employee_list { get; set; }
		public bool has_eseal_permission { get; set; }		
	}

}


using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;

namespace SigningPortal.Core.DTOs
{
	public class SaveNewDocumentDTO
	{
		public IFormFile file { get; set; }

		public IFormFile originalFile { get; set; } = null;

		public string model { get; set; }
	}
	public class Model
	{
		public string tempid { get; set; }
		//public string action { get; set; }
		public Docdetails docdetails { get; set; }
		public string docData { get; set; }
		public string fileName { get; set; }
		public Signcords signCords { get; set; }
		public QrCords QrCords { get; set; }
		public Esealcords esealCords { get; set; }
		public string watermarkText { get; set; }
		public string actoken { get; set; }
		public bool disableOrder { get; set; }
		public bool multisign { get; set; }
		public string htmlschema { get; set; }
		public string pdfschema { get; set; }
		public bool qrCodeRequired { get; set; } = false;
		public string docSerialNo { get; set; } = string.Empty;
		public string entityName { get; set; } = string.Empty;
		public bool faceRequired { get; set; } = false;
		public bool isMobile { get; set; } = false;
		public bool allowToAssignSomeone { get; set; }

		//public int rotation { get; set; }
	}

	public class Docdetails
	{
		public string ownerName { get; set; }
		public List<Receps> receps { get; set; }
		public string tempname { get; set; }
		public string daysToComplete { get; set; }
		public int signaturesRequiredCount { get; set; }
		public string autoReminders { get; set; }
		public string remindEvery { get; set; }
		public string annotations { get; set; }
		//public string noteToAll { get; set; }
		public string orgn_name { get; set; }
		public string watermark { get; set; }
		public DateTime expiredate { get; set; }
	}

	public class Signcords
	{
		public string coordinates { get; set; }
	}

	public class QrCords
	{
		public string coordinates { get; set; }
	}

	public class Esealcords
	{
		public string coordinates { get; set; }
	}

	public class Receps
	{
		public string index { get; set; }
		public int order { get; set; }
		public string email { get; set; }

		public string suid { get; set; }
		public string name { get; set; }
		public string alternateSignatories { get; set; }
		public List<User> alternateSignatoriesList { get; set; }
		public bool allowComments { get; set; }
		public bool signatureMandatory { get; set; }
		public bool eseal { get; set; }
		public bool initial { get; set; }
		public bool hasDelegation { get; set; }
		public string delegationId { get; set; }
		public string referredBy { get; set; }
		public string referredTo { get; set; }
		public string signedBy { get; set; }
		public string orgUID { get; set; }
		public string orgName { get; set; }
		public int signTemplate { get; set; } = 0;
		public int esealTemplate { get; set; } = 0;

	}

	public class User
	{
		public string email { get; set; }

		public string suid { get; set; }
	}

	public class Coordinates
	{
		public string fieldName { get; set; }
		public double posX { get; set; }
		public double posY { get; set; }
		public int PageNumber { get; set; }
		public double width { get; set; }
		public double height { get; set; }
	}
	public class ESealCoordinates
	{
		public string fieldName { get; set; }
		public double posX { get; set; }
		public double posY { get; set; }
		public int PageNumber { get; set; }
		public double width { get; set; }
		public double height { get; set; }
		public string organizationID { get; set; }
	}

}

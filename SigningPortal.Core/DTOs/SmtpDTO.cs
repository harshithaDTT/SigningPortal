using System.Collections.Generic;
using System.Linq;

namespace SigningPortal.Core.DTOs
{
	public class SmtpDTO
	{
		public string Server { get; set; }
		public int Port { get; set; }
		public string SenderUser { get; set; }
		public string Password { get; set; }

	}


	public class Message
	{
		public List<string> To { get; set; }
		public string Subject { get; set; }
		public string Content { get; set; }
		public byte[] Attachment { get; set; }
		public bool IsAttachmentPresent { get; set; } = false;

		public Message()
		{
			// Parameterless constructor required for Hangfire JSON deserialization
			To = new List<string>();
		}

		public Message(IEnumerable<string> to, string subject, string content)
		{
			To = to.ToList();
			Subject = subject;
			Content = content;
		}

		public Message(IEnumerable<string> to, string subject, string content, byte[] attachment, bool isAttachmentPresent)
		{
			To = to.ToList();
			Subject = subject;
			Content = content;
			Attachment = attachment;
			IsAttachmentPresent = isAttachmentPresent;
		}
	}

	public class EmailConfiguration
	{
		public string From { get; set; }
		public string SmtpServer { get; set; }
		public int Port { get; set; }
		public string UserName { get; set; }
		public string Password { get; set; }
	}

	public class SendEmailObj
	{
		public string Id { get; set; }
		public string UserName { get; set; }
		public string UserEmail { get; set; }
	}
	public class SmtpSettings
	{
		public string SmtpHost { get; set; }
		public string FromName { get; set; }
		public string FromEmailAddr { get; set; }
		public bool RequireAuth { get; set; }
		public string SmtpUserName { get; set; }
		public string SmtpPwd { get; set; }
		public bool RequiresSsl { get; set; }
		public int SmtpPort { get; set; }
		public string MailSubject { get; set; }
		public string Template { get; set; }
		public int Id { get; set; }
	}
}

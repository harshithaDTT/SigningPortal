using SigningPortal.Core.DTOs;
using System.Threading.Tasks;

namespace SigningPortal.Core.Utilities
{
	public interface IEmailSender
	{
		Task<int> SendEmail(Message message);

		Task<int> SendEmailWithAttachment(Message message, string fileName);
		public bool TestSmtpConnection();
	}
}

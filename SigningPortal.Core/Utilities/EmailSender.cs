using MailKit.Net.Smtp;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using SigningPortal.Core.DTOs;
using System;
using System.Net.Mime;
using System.Text;
using System.Threading.Tasks;

namespace SigningPortal.Core.Utilities
{
	public class EmailSender : IEmailSender
	{
		private readonly ILogger<EmailSender> _logger;
		private readonly IConfiguration _configuration;
		private readonly IGlobalConfiguration _globalConfiguration;
		private readonly SmtpDTO SMTP;
		public EmailSender(ILogger<EmailSender> logger,
			IConfiguration configuration,
			IGlobalConfiguration globalConfiguration)
		{
			_configuration = configuration;
			_globalConfiguration = globalConfiguration;
			_logger = logger;
			SMTP = _configuration.GetSection("SMTP").Get<SmtpDTO>();
		}

		private MimeMessage CreateEmailMessage(Message message)
		{
			_logger.LogDebug("-->CreateEmailMessage");

			if (message == null)
			{
				_logger.LogError("Invalid Input Parameter");
				return null;
			}

			var emailMessage = new MimeMessage();

			try
			{
				emailMessage.From.Add(new MailboxAddress(SMTP.SenderUser));

				// Convert each string to MailboxAddress
				foreach (var address in message.To)
				{
					emailMessage.To.Add(MailboxAddress.Parse(address));
				}

				emailMessage.Subject = message.Subject;
				emailMessage.Body = new TextPart(MimeKit.Text.TextFormat.Html)
				{
					Text = message.Content
				};
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError("CreateEmailMessage Failed : {0}", ex.Message);
				return null;
			}

			_logger.LogDebug("<--CreateEmailMessage");
			return emailMessage;
		}

		private async Task<int> Send(MimeMessage mailMessage)
		{
			_logger.LogInformation("-->Send");
			int result = -1;

			// Validate Input Parameters
			if (null == mailMessage)
			{
				_logger.LogError("Invalid Input Parameter");
				return result;
			}

			using (var client = new SmtpClient())
			{
				try
				{
					// Get EncryptionKey
					//var frontEndSecret = _configuration.GetValue<string>("Secret:FrontEndSecret");
					var Key = _globalConfiguration.FrontEndSecret;
					if (null == Key)
					{
						_logger.LogError("Failed to get keys");
						return result;
					}

					string EncryptedPassword =
						Encoding.UTF8.GetString(Convert.FromBase64String(Key));
					if (null == EncryptedPassword)
					{
						_logger.LogError("Failed to convert to bytes");
						return result;
					}


					var DecryptedPasswd = string.Empty;

					// Decrypt Password
					DecryptedPasswd = PKIMethods.Instance.PKIDecryptSecureWireData(SMTP!.Password);
					if (null == DecryptedPasswd)
					{
						_logger.LogError("Failed to decrypt text");
						return result;
					}

					var mailConfig = new EmailConfiguration();

					mailConfig.SmtpServer = SMTP.Server;
					mailConfig.Port = SMTP.Port;
					mailConfig.UserName = SMTP.SenderUser;
					mailConfig.Password = DecryptedPasswd;

					if (SMTP.Port == 465)
					{
						client.Connect(mailConfig.SmtpServer,
						mailConfig.Port, true);
					}
					else if (SMTP.Port == 587)
					{
						client.Connect(mailConfig.SmtpServer,
						mailConfig.Port, false);
					}

					client.AuthenticationMechanisms.Remove("XOAUTH2");
					client.Authenticate(mailConfig.UserName,
						mailConfig.Password);
					await client.SendAsync(mailMessage);
					result = 0;
				}
				catch (Exception error)
				{
					Monitor.SendException(error);
					_logger.LogError("Failed to send Mail: {0}", error.Message);
					_logger.LogError("Inner Exception: {0}", error.InnerException != null ? error.InnerException.Message : "No inner exception");
				}
				finally
				{
					client.Disconnect(true);
					client.Dispose();
				}
			}

			_logger.LogInformation("<--Send");
			return result;
		}

		public bool TestSmtpConnection()
		{
			_logger.LogInformation("-->TestSmtpConnection");
			bool result = false;


			using (var client = new SmtpClient())
			{
				try
				{
					if (SMTP.Port == 465)
					{
						client.Connect(SMTP.Server,
						SMTP.Port, true);
					}
					else if (SMTP.Port == 587)
					{
						client.Connect(SMTP.Server,
						SMTP.Port, false);
					}
					client.AuthenticationMechanisms.Remove("XOAUTH2");
					client.Authenticate(SMTP.SenderUser,
						SMTP.Password);
					result = true;
				}
				catch (Exception error)
				{
					Monitor.SendException(error);
					_logger.LogError("Failed to TestSmtpConnection: {0}",
						error.Message);
				}
				finally
				{
					client.Disconnect(true);
					client.Dispose();
				}
			}

			_logger.LogInformation("<--TestSmtpConnection");
			return result;
		}

		public async Task<int> SendEmail(Message message)
		{
			_logger.LogInformation("-->SendEmail");
			int result = -1;

			// Validate Input Parameters
			if (null == message)
			{
				_logger.LogError("Invalid Input Parameter");
				return result;
			}

			var emailMessage = CreateEmailMessage(message);
			if (null == emailMessage)
			{
				_logger.LogError("CreateEmailMessage Failed");
				return result;
			}

			// Send Email
			result = await Send(emailMessage);
			if (0 != result)
			{
				_logger.LogError("Send Email Failed");
				return result;
			}

			//Return Success
			result = 0;

			_logger.LogDebug("<--SendEmail");
			return result;
		}

		public async Task<int> SendEmailWithAttachment(Message message, string fileName)
		{
			_logger.LogInformation("-->SendEmailWithAttachment");
			int result = -1;

			// Validate Input Parameters
			if (null == message)
			{
				_logger.LogError("Invalid Input Parameter");
				return result;
			}

			var emailMessage = CreateEmailMessageWithAttachment(message, fileName);
			if (null == emailMessage)
			{
				_logger.LogError("CreateEmailMessage Failed");
				return result;
			}

			// Send Email
			result = await Send(emailMessage);
			if (0 != result)
			{
				_logger.LogError("Send Email With Attachment Failed");
				_logger.LogError("Send Email With Attachment Failed to email : " + message.To[0]);
				return result;
			}

			foreach (var email in message.To)
			{
				_logger.LogInformation("Send Email With Attachment to email success : " + email);
			}
			//Return Success
			result = 0;

			_logger.LogInformation("<--SendEmailWithAttachment");
			return result;
		}

		private MimeMessage CreateEmailMessageWithAttachment(Message message, string fileName)
		{
			_logger.LogInformation("-->CreateEmailMessageWithAttachment");

			if (message == null)
			{
				_logger.LogError("Invalid Input Parameter");
				return null;
			}

			var emailMessage = new MimeMessage();

			try
			{
				emailMessage.From.Add(new MailboxAddress(SMTP.SenderUser));

				// Convert email strings to MailboxAddress
				foreach (var address in message.To)
				{
					emailMessage.To.Add(MailboxAddress.Parse(address));
				}

				emailMessage.Subject = message.Subject;
				emailMessage.Body = new TextPart(MimeKit.Text.TextFormat.Html)
				{
					Text = message.Content
				};

				if (message.IsAttachmentPresent)
				{
					var builder = new BodyBuilder();

					if (message.Attachment != null && message.Attachment.Length > 0)
					{
						if (fileName.Contains(".pdf"))
						{
							fileName = fileName.Replace(".pdf", "");
						}
						builder.Attachments.Add(fileName + "_signed.pdf", message.Attachment, MimeKit.ContentType.Parse(MediaTypeNames.Application.Pdf));
					}

					builder.HtmlBody = message.Content;
					emailMessage.Body = builder.ToMessageBody();
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError("CreateEmailMessageWithAttachment Failed : {0}", ex.Message);
				return null;
			}

			_logger.LogInformation("<--CreateEmailMessageWithAttachment");
			return emailMessage;
		}
	}
}

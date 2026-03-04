using Microsoft.AspNetCore.Http;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Threading.Tasks;

namespace SigningPortal.Core.Utilities
{
	public interface IDocumentHelper
	{
		Task SendAnEmailToSender(SendEmailObj data);

		Task SendAnEmailToFormSender(SendEmailObj data);


		Task SendAnEmailToRecipient(SendEmailObj data, string actoken = null, Document document = null);

		Task SendAnEmailToFormRecipient(SendEmailObj data, string actoken = null, TemplateDocument doc = null);

		Task SendSignedDocumentDetailsNotifiaction(string corelationID, string msg, bool signStatus = true);

		Task SendSignedFormDocumentDetailsNotifiaction(string corelationID, string msg,
														string docname, string orgId);

		Task<ServiceResult> SaveCertificateToEDMS(string id, string docname, string suid);

		Task<ServiceResult> SaveDocumentToEDMS(IFormFile DocData, string docname, string expiryDate, string suid);

		Task<ServiceResult> UpdateDocumentToEDMS(string id, IFormFile DocData, string docname, string suid);

		Task SendNotification(string suid_orgid, string msg);

		Task<Document> GetDocumentById(string id);

		//Task PushNotification(string accessToken, string email, string message);

		//Task DelegationPushNotification(DelegationPushNotificationDTO pushNotificationObj);

		Task SendEmailToAllRecepients(string docId, string content, string subject, bool isAttachmentPresent, bool isSignComplete = false);
		Task SendEmailToAllFormRecepients(string docId, string content, string subject, bool isAttachmentPresent, bool isSignComplete = false);

		Task SendEmailToDelegatee(string id, string subject, bool toSender = false);

		Task SendDelegateeActionEmailToDelegator(string id, string subject);
		//Task SendSignedFormDetailsNotifiaction(string corelationID, string msg);
		//Task NewSendSignedFormDetailsNotifiaction(string corelationID, string docName, string msg, string orgId = "");
		//void DigitalFormPushNotification(DigitalFormPushNotificationDTO pushNotificationObj);
		Task SendAnEmailToFormCreator(SendEmailObj data, byte[] attachment = null);
		Task SendAnEmailToFormSigner(SendEmailObj data, DigitalFormTemplate doc = null, byte[] attachment = null);
		Task SendDeclineSignatureNotifiactionToAllRecepient(string tempId, NotificationDTO declineNotification, string acToken = null);
		Task SendNotificationToDelgator(Notification notification);


		Task SendSignedFormDocumentDetailsNotifiaction(string corelationID, string msg);
		Task SendDeclineFormSignatureNotifiactionToAllTemplateRecepient(string tempId, NotificationDTO declineNotification, string acToken = null);
		Task SendSignedDocumentDetailsNotifiactionGroupSigning(string corelationID, string msg, bool signStatus = true);
	}
}

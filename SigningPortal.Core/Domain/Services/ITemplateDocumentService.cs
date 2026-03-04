using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
	public interface ITemplateDocumentService
	{
		Task<ServiceResult> GetMyTemplateDocumentList(UserDTO userDTO);

		Task<ServiceResult> GetReceivedTemplateDocumentsList(UserDTO userDTO);

		Task<ServiceResult> GetTemplateDocumentByIdAsync(string id);

		Task<ServiceResult> GetOrganiztionUsersListAsync(string organizationId);

		Task<ServiceResult> GetSentTemplateDocumentList(UserDTO userDTO);

		Task<ServiceResult> GetTemplateDocumentListByGroupIdAsync(string groupId);

		Task<ServiceResult> SaveTemplateDocumentListAsync(TemplateSendingDTO requestObj, UserDTO user, string requestGrpId = null);
		Task<ServiceResult> GetTemplateDocumentListByFormIdAsync(string formId);
		Task<ServiceResult> SentTemplateDocumentListExists(UserDTO user);
		Task<ServiceResult> GetReferredDocumentsList(UserDTO userDTO);
	}
}

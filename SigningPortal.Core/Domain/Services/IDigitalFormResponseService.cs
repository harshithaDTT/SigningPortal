using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
	public interface IDigitalFormResponseService
	{
		Task<ServiceResult> DeleteFormResponseBySuidAndTempId(string suid, string tempId);
		Task<ServiceResult> GenerateCSVResponseSheet(string formId);
		Task<ServiceResult> GetDigitalFormFillDataAsync(string suid,string idpToken="");
		Task<ServiceResult> GetDigitalFormResponseByIdAsync(string roleId);
		Task<ServiceResult> GetDigitalFormResponseByTemplateIdAndSuidAsync(string templateId, string suid);
		Task<ServiceResult> GetDigitalFormResponseListByTemplateIdAsync(string tempId);
		Task<ServiceResult> GetNewDigitalFormResponseListByTemplateIdAsync(string tempId);
		Task<ServiceResult> GetSelfDigitalFormResponseListAsync(UserDTO user);
		//Task<ServiceResult> NewCallBackDigitalFormResponseUpdateAsync(RecieveDocumentDTO dto);
		Task<ServiceResult> NewSaveDigitalFormResponseAsync(DigitalFormResponseDTO dto, UserDTO userDTO);
		Task<ServiceResult> SaveDigitalFormResponseAsync(DigitalFormResponseDTO dto, UserDTO userDTO);
		Task<ServiceResult> SendFormSigngingRequestAsync(FormSigngingRequestDTO dto, UserDTO userDTO);
		Task<ServiceResult> ReceivedFormDocumentAsync(RecieveDocumentDTO dto);
		Task<ServiceResult> GetNewDigitalFormResponseByDocIdFormIdAsync(string docId, string tempId);
		Task<ServiceResult> GenerateNewCSVResponseSheet(string formId);
		Task<ServiceResult> DeclineTemplateDocumentSigningAsync(string tempDocumentId, DeclineDocumentSigningDTO declineDocumentSigning);
		Task<ServiceResult> GetNewDigitalFormResponseListByRequestGroupIdAsync(string requestGrpId);
	}
}

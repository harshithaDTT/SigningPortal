using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
	public interface IDigitalFormTemplateService
	{
		Task<ServiceResult> GetDigitalFormTemplateByIdAsync(string templateId);
		Task<ServiceResult> GetDigitalFormTemplateListAsync(UserDTO userDTO);
		//Task<ServiceResult> GetDigitalFormTemplateListByGroupIdAsync(string id);
		Task<ServiceResult> GetDigitalFormTemplatePublishGlobalListAsync(UserDTO userDTO);
		Task<ServiceResult> GetDigitalFormTemplatePublishListAsync(UserDTO userDTO);
		Task<ServiceResult> GetGlobalTemplateListAsync();
		Task<ServiceResult> PublishUnpublishTemplateStatusAsync(string templateId, string action, UserDTO user);
		Task<ServiceResult> NewPublishUnpublishTemplateStatusAsync(PublishUnpublishTemplateDTO dto, UserDTO user);
		Task<ServiceResult> SaveNewDigitalFormTemplateAsync(SaveNewDigitalFormTemplateDTO newDoc, UserDTO userDTO);
		Task<ServiceResult> UpdateDigitalFormTemplateAsync(UpdateDigitalFormTemplateDTO newDoc, UserDTO userDTO);
		Task<ServiceResult> GetNewDigitalFormTemplatePublishGlobalListAsync(UserDTO userDTO);
		Task<ServiceResult> GetNewDigitalFormTemplatePublishListAsync(UserDTO userDTO);
	}
}

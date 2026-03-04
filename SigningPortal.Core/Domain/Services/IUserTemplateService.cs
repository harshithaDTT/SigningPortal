using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
	public interface IUserTemplateService
	{
		Task<ServiceResult> GetSignatureTemplateList();
		Task<ServiceResult> SaveNewTemplateAsync(SaveNewTemplateDTO template, UserDTO userDetails);

		Task<ServiceResult> GetTemplateListAsync(UserDTO userDTO);

		Task<ServiceResult> GetTemplateListForBulkSignAsync(UserDTO userDTO);

		Task<ServiceResult> GetTemplateDetailsAsync(string templateId);

		Task<ServiceResult> UpdateTemplateAsync(UpdateTemplateDTO updateTemplate, UserDTO userDTO);

		Task<ServiceResult> VerifyOrganizationUserBySignatureTemplateAsync(VerifyOrganizationUserDTO verifyOrgUser, UserDTO userDTO);

		Task<ServiceResult> DeleteTemplateAsync(string templateId, UserDTO userDTO);
	}
}

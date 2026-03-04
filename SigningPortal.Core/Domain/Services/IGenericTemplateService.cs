using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
	public interface IGenericTemplateService
	{
		Task<ServiceResult> GetGenericTemplateListAsync(UserDTO userDTO);
		Task<ServiceResult> SaveNewGenericTemplateAsync(SaveNewGenericTemplateDTO template, UserDTO userDetails);
		Task<ServiceResult> UpdateGenericTemplateAsync(UpdateGenericTemplateDTO updateTemplate,
			UserDTO userDTO);
		Task<ServiceResult> GetGenericTemplateDetailsAsync(string templateId);

	}
}

using SigningPortal.Core.Domain.Services.Communication;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
	public interface IDigitalFormTemplateRoleService
	{
		Task<ServiceResult> GetDigitalFormTemplateRoleByIdAsync(string roleId);
		Task<ServiceResult> GetDigitalFormTemplateRoleListByTemplateIdAsync(string templateId);
	}
}

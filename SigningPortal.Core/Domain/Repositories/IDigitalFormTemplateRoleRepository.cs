using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface IDigitalFormTemplateRoleRepository
	{
		Task<bool> DeleteDigitalFormTemplateRoleListAsync(List<DigitalFormTemplateRole> templates);
		Task<DigitalFormTemplateRole> GetDigitalFormTemplateRoleAsync(string id);
		Task<List<DigitalFormTemplateRole>> GetDigitalFormTemplateRoleListAsync();
		Task<List<DigitalFormTemplateRole>> GetDigitalFormTemplateRoleListByTemplateIdAsync(string templateId);
		Task<DigitalFormTemplateRole> SaveDigitalFormTemplateRoleAsync(DigitalFormTemplateRole template);
		Task<List<DigitalFormTemplateRole>> SaveDigitalFormTemplateRoleListAsync(List<DigitalFormTemplateRole> templates);
		Task<bool> UpdateDigitalFormTemplateRoleById(DigitalFormTemplateRole template);
		Task<bool> UpdateDigitalFormTemplateRoleList(List<DigitalFormTemplateRole> templates);
	}
}

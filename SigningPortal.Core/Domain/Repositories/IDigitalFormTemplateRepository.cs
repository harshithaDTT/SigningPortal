using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface IDigitalFormTemplateRepository
	{
		Task<bool> BulkUpdateDigitalFormTemplateStatus(List<DigitalFormTemplate> templates);
		Task<List<DigitalFormTemplate>> GetAllPublishedDigitalFormsAsync();
		Task<DigitalFormTemplate> GetDigitalFormTemplateAsync(string id);
		Task<List<DigitalFormTemplate>> GetDigitalFormTemplateListAsync(UserDTO user);
		//Task<List<DigitalFormTemplate>> GetDigitalFormTemplateListByGroupIdAsync(string id);
		Task<List<DigitalFormTemplate>> GetDigitalFormTemplatePublishGlobalListAsync();
		Task<List<DigitalFormTemplate>> GetDigitalFormTemplatePublishListAsync(UserDTO user);
		Task<bool> IsDigitalFormTemplateNameExists(string templateName, string orgId, string templateId = null);
		Task<DigitalFormTemplate> SaveDigitalFormTemplateAsync(DigitalFormTemplate template);
		Task<bool> UpdateDigitalFormTemplate(DigitalFormTemplate template);
		Task<bool> UpdateDigitalFormTemplateStatus(DigitalFormTemplate template);
	}
}

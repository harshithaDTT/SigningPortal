using SigningPortal.Core.Domain.Model;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface ITemplateRepository
	{
		Task<Template> SaveTemplateAsync(Template template);

		Task<Template> GetTemplateAsync(string id);

		Task<bool> UpdateTemplateById(Template template);

		Task<bool> DeleteTemplateAsync(string templateId);
	}
}

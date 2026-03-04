using SigningPortal.Core.Domain.Model;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface IGenericTemplateRepository
	{
		Task<GenericTemplate> SaveGenericTemplateAsync(GenericTemplate template);

		Task<GenericTemplate> GetGenericTemplateAsync(string id);

		Task<bool> UpdateGenericTemplateById(GenericTemplate template);

		Task<bool> DeleteGenericTemplateAsync(string templateId);
	}
}

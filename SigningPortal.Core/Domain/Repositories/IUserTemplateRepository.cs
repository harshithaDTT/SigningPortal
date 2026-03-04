using SigningPortal.Core.Domain.Model;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface IUserTemplateRepository
	{
		Task<UserTemplate> SaveTemplateAsync(UserTemplate template);

		Task<UserTemplate> GetTemplateAsync(string id);

		Task<bool> UpdateTemplateById(UserTemplate template);

		Task<bool> DeleteTemplateAsync(string templateId);
	}
}

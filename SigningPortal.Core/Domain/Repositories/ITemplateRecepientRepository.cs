using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface ITemplateRecepientRepository
	{
		Task<TemplateRecepient> DeclinedCommentDetailsAsync(string tempId);
		Task<bool> DeclineSigningAsync(string tempId, User user, string comment);
		Task DeleteTemplateRecepientByTempId(IList<string> idList);
		Task<TemplateRecepient> FindTemplateRecepientByCorelationId(string corelationId);
		Task<IList<TemplateRecepient>> GetCurrentTemplateRecepientList(string tempId);
		Task<IList<TemplateRecepient>> GetTemplateRecepientBySuidAndOrganizationIdAsync(string suid, string orgId);
		Task<TemplateRecepient> GetTemplateRecepientBySuidAndTempId(string suid, string tempId);
		Task<IList<TemplateRecepient>> GetTemplateRecepientBySuidAsync(string suid);
		Task<IList<TemplateRecepient>> GetTemplateRecepientLeft(string tempId);
		Task<IList<TemplateRecepient>> GetTemplateRecepientListByDocIdAsync(string id);
		Task<IList<TemplateRecepient>> GetTemplateRecepientListByTakenActionAsync(string suid, bool action);
		Task<IList<TemplateRecepient>> GetTemplateRecepientListByTempIdAsync(TemplateRecepient TemplateRecepient);
		Task<TemplateRecepient> SaveTemplateRecepient(TemplateRecepient TemplateRecepient);
		Task<IList<TemplateRecepient>> SaveTemplateRecepientListAsync(IList<TemplateRecepient> TemplateRecepient);
		Task<bool> UpdateTakenActionOfTemplateRecepientById(string id);
		Task<bool> UpdateTemplateRecepientById(TemplateRecepient TemplateRecepient);
		Task<bool> UpdateCorrelationIdOfTemplateRecepientById(string id, string corelationId, string signerName, string accessToken, string idpToken, string email);
		Task<IList<TemplateRecepient>> GetTemplateRecepientByAlternateEmailSuidAsync(string suid);
	}
}

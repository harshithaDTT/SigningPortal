using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface ISubscriberOrgGenericTemplateRepository
	{
		Task<SubscriberOrgGenericTemplate> SaveSubscriberOrgGenericTemplate(SubscriberOrgGenericTemplate subscriberOrgTemplate);

		Task<IList<SubscriberOrgGenericTemplate>> GetGenericTemplateListBySuidAndOrgId(string suid, string orgId);

		Task<IList<SubscriberOrgGenericTemplate>> GetGenericTemplateListByOrgId(string orgId);

		Task<bool> DeleteSubscriberOrgGenericTemplate(string templateId, UserDTO userDTO);
	}
}

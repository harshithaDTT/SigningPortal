using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface ISubscriberOrgTemplateRepository
	{
		Task<SubscriberOrgTemplate> SaveSubscriberOrgTemplate(SubscriberOrgTemplate subscriberOrgTemplate);

		Task<IList<SubscriberOrgTemplate>> GetTemplateListBySuidAndOrgId(string suid, string orgId);

		Task<IList<SubscriberOrgTemplate>> GetTemplateListByOrgId(string orgId);

		Task<bool> DeleteSubscriberOrgTemplate(string templateId, UserDTO userDTO);
	}
}

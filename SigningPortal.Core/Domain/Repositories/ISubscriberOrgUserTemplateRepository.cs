using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface ISubscriberOrgUserTemplateRepository
	{
		Task<SubscriberOrgUserTemplate> SaveSubscriberOrgTemplate(SubscriberOrgUserTemplate subscriberOrgTemplate);

		//Task<IList<SubscriberOrgUserTemplate>> GetTemplateListBySuidAndOrgId(string suid, string orgId);

		Task<IList<SubscriberOrgUserTemplate>> GetTemplateListBySuid(string suid);

		Task<bool> DeleteSubscriberOrgTemplate(string templateId, UserDTO userDTO);
	}
}

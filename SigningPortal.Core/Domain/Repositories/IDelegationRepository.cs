using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface IDelegationRepository
	{
		Task<Delegation> SaveDelegate(Delegation delegates);

		Task<Delegation> GetDelegateById(string id);

		Task<Delegation> GetDelegateByOrgIdAndSuid(string orgId, string suid);

		Task<IList<Delegation>> GetDelegateByIdList(List<string> list);

		Task<IList<Delegation>> GetDelegatesListByOrgIdAndSuid(string orgId, string suid);

		Task<IList<Delegation>> GetScheduledDelegationList();

		Task<bool> UpdateDelegateById(Delegation delegator);

		Task<bool> UpdateDelegateConsentDataById(Delegation delegator);
		Task<bool> UpdateDelegatorConsentDataById(Delegation delegator);
		Task<IList<Delegation>> GetNewDelegationListBySuidAndOrgIdAsync(string suid, string orgId);
	}
}

using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface IDelegateeRepository
	{
		Task<IList<Delegatee>> SaveDelegatee(IList<Delegatee> delegateRecep);

		Task<IList<Delegatee>> GetDelegateeListBySuidAsync(string suid);

		Task<IList<Delegatee>> GetDelegateeListBySuidAndOrgIdAsync(string suid, string orgId);

		Task<bool> UpdateDelegateeById(Delegatee delegatee);
	}
}

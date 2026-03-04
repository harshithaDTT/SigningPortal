using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface IAuthenticationRepository
	{
		Task<IList<Auditlogs>> GetUserLastLoginAsyc(string suid, string clientId);
	}
}

using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface IGroupSigningRepository
	{
		Task<IList<GroupSigning>> GetGroupSigningListBySuidAndOrgIdAsync(string suid, string orgId);
        Task<bool> DeleteAsync(string id);
		Task<GroupSigning> GetGroupSigningRequestByIdAsync(string id);
		Task<GroupSigning> SaveRequestAsync(GroupSigning document);
		Task<bool> UpdateGroupSigningAsync(GroupSigning document);
		Task<bool> UpdateGroupSigningStatusAsync(string id, string status);
	}
}

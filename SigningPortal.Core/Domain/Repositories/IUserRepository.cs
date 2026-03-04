using SigningPortal.Core.Domain.Model;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface IUserRepository
	{
		Task<BlockedUser> GetBlockedUserEmailAsync(string email);

		Task<bool> UpdateBlockedEmailListAsync(string userEmail, BlockedUser blockedUser);

		Task<BlockedUser> BlockEmailAsync(BlockedUser user);
	}
}

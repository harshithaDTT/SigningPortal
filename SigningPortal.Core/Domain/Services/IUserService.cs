using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
	public interface IUserService
	{
		Task<ServiceResult> CheckIDPUsersAsync(CheckIdpUserDTO req, string userEmail);

		Task<ServiceResult> UpdateUserBlockListAsync(string userEmail, BlockUnblockUserDTO userDTO);

		Task<ServiceResult> SearchUserEmailListAsync(string email);

		Task<ServiceResult> GetOrganizationEmailListAsync(string orgID);

		Task<ServiceResult> BlockedUserEmailListAsync(string email);

		Task<ServiceResult> GetSubscriberOrgnizationListByEmailAsync(string email);
	}
}

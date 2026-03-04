using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
	public interface IDelegationService
	{
		Task<ServiceResult> GetDelegateDetailsByIdAsync(string id);

		Task<ServiceResult> GetDelegateDetailsByOrgIdAndSuidAsync(string orgId, string suid);

		Task<ServiceResult> RevokeDelegateAsync(string id);

		Task<ServiceResult> SaveDelegatorAsync(SaveDelegatorDTO delegateDTO, UserDTO user);

		Task<ServiceResult> DelegateeActionAsync(DelegateeActionDTO delegateeAction);

		Task<ServiceResult> GetDelegatesListByOrgIdAndSuidAsync(UserDTO user);

		Task<ServiceResult> GetBusinessUsersListByOrgAsync(UserDTO user);

		Task<ServiceResult> GetReceivedDelegatesBySuidAndOrgIdAsync(string suid, string orgId);

		Task<ServiceResult> GetScheduledDelegationListAsync();
		Task<ServiceResult> DelegatorActionAsync(DelegatorActionDTO action);
		Task<ServiceResult> GetNewDelegationListBySuidAndOrgIdAsync(string suid, string orgId);
		Task<ServiceResult> SaveNewDelegatorAsync(SaveDelegatorDTO delegateDTO, UserDTO user);
	}
}

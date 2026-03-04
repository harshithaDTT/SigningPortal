using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
	public interface IStorageIntegrationService
	{
		Task<ServiceResult> GetStorageListAsync(UserDTO userDTO);

		Task<ServiceResult> SetStorageActiveAsync(string storageName, UserDTO userDTO);

		Task<ServiceResult> UnsetStorageActiveAsync(string storageName, UserDTO userDTO);


        Task<ServiceResult> GetAuthenticationUrlAsync(string storageName);

		Task<ServiceResult> UnlinkStorageAsync(string storageName, UserDTO userDTO);

		Task<ServiceResult> LinkUserStorageAsync(string storageName, string code, UserDTO userDTO);

		Task<ServiceResult> GetDriveConfigurationAsync(string storageName, UserDTO userDTO);
		Task ScheduledUnlinking();
	}
}

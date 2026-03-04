using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface IUserStorageRepository
	{
		Task<UserDriveTokenDetails> SaveUserStorageDetails(UserDriveTokenDetails userDetails);

		Task<UserDriveTokenDetails> GetUserStorageDetailsAsync(string uid, string orgId, string storageName, string Status = null);

		Task<UserDriveTokenDetails> GetActiveUserStorageDetailsAsync(string uid, string orgId);

		Task<bool> SetStorageActiveAsync(string storageName, UserDTO userDTO);

		Task<bool> UpdateUserStorageDetailsAsync(UserDriveTokenDetails data);

		Task<bool> UnlinkUserStorageAsync(UserDTO user, string StorageName);

		Task DeleteUserStorageDetailsBykey(string suid, string orgId, string StorageName);

		Task DeleteAllUserStorageDetails();
		Task<List<UserDriveTokenDetails>> GetAllActiveStateUserStorageDetailsListAsync();

		Task<bool> UnsetStorageActiveAsync(string storageName, UserDTO userDTO);

    }
}

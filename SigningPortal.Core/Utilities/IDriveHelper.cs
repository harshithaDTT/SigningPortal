using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace SigningPortal.Core.Utilities
{
	public interface IDriveHelper
	{
		Task<ServiceResult> IsAccessTokenValidAsync(string StorageName, UserDTO User);
		Task<ServiceResult> GetAuthenticationUrl(string StorageName);
		Task<ServiceResult> GetAccessToken(string code, string StorageName, UserDTO User);

		Task<ServiceResult> UpdateAccessTokenAsync(string StorageName, UserDTO User);

		Task<ServiceResult> UploadFileToDriveAsync(IList<Recepients> recp, byte[] fileByteArray, string fileName,
			string fileDescription);

		Task<ServiceResult> UploadFileOnOneDrive(UserDTO User, MemoryStream stream, string fileName);
		Task<ServiceResult> SendDriveUnlinkEmail(UserDriveTokenDetails details);
		Task UploadFileToDriveAsyncWrapper(IList<Recepients> recp, byte[] fileByteArray, string fileName, string fileDescription); //Wrapper for Hangfire
	}
}

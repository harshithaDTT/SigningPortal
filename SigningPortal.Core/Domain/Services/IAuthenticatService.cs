using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
	public interface IAuthenticatService
	{
		ServiceResult GetAuthorizationUrl();

		Task<ServiceResult> AuthenticateUser(AuthenticateUserDTO requestObj);

		Task<ServiceResult> GetApiAccess(GetApiAccessTokenDTO requestObj, string authtoken);

		ServiceResult GetApiAccessOld(GetApiAccessTokenDTOOld requestObj, string authtoken);

		ServiceResult UpdateApiAccessTokenAsync(UpdateApiAccessTokenDTO requestObj, UserDTO userDTO);
		Task<ServiceResult> GetUserProfileImage(string accessToken);
        Task<ServiceResult> AuthenticateVerifier(AuthenticateUserDTO requestObj);
        ServiceResult GetVerificationAuthorizationUrl();
    }
}

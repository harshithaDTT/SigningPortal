using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
	public interface IGroupSigningService
	{
		Task<ServiceResult> SaveAndSignGroupRequestAsync(List<string> documentIds, string transaction, UserDTO user, string acToken, GroupSigningAuthDTO auth = null);
		Task<ServiceResult> RetryGroupSigningRequestAsync(GroupSigning groupSigning, List<string> documentIds, UserDTO user, string acToken, GroupSigningAuthDTO auth = null);
		Task<ServiceResult> UpdateGroupSigningStatusAsync(string id);
		Task<ServiceResult> GetGroupSigningListAsync(UserDTO userDTO);
		Task<ServiceResult> GroupSigningStatusAsync(string groupId);
		Task<ServiceResult> GetGroupSigningRequestByIdAsync(string requestId);
	}
}

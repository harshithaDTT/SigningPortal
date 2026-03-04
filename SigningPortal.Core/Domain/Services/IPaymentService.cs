using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
	public interface IPaymentService
	{
		Task<ServiceResult> IsCreditAvailable(UserDTO userdata, bool isEsealPresent, bool isSignaturePresent = false);

		Task<ServiceResult> GetCreditDeatails(UserDTO userdata);
		Task<(bool isPrepaid, ServiceResult result)> IsGroupCreditAvailable(UserDTO userdata, bool isEsealPresent, bool isSignaturePresent, int signCnt = 0, int esealCnt = 0);
		Task<ServiceResult> IsPrepaidOrPostpaidAsync(UserDTO userdata);
	}
}

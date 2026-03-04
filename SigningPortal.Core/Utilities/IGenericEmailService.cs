using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Threading.Tasks;

namespace SigningPortal.Core.Utilities
{
	public interface IGenericEmailService
	{
		Task<ServiceResult> SendGenericEmail(Message message);
		Task<ServiceResult> SendGenericEmailWithAttachment(Message message, string fileName);
	}
}
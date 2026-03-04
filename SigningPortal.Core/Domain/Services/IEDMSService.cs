using SigningPortal.Core.Domain.Services.Communication;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
	public interface IEDMSService
	{
		Task<ServiceResult> GetDocumentAsync(string id);
		//Task<ServiceResult> saveDocumentAsync(SaveFileDTO filee);
	}
}

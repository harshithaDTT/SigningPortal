using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface IDigitalFormResponseRepository
	{
		Task<DigitalFormResponse> GetDigitalFormResponseAsync(string id);
		Task<DigitalFormResponse> GetDigitalFormResponseByCorelationIdAsync(string corelationId);
		Task<DigitalFormResponse> GetDigitalFormResponseByFormIdAsync(string id);
		Task<DigitalFormResponse> GetDigitalFormResponseByIdAsync(string formId, string userSuid);
		Task<List<DigitalFormResponse>> GetDigitalFormResponseListAsync(string tempId);
		Task<List<DigitalFormResponse>> GetSelfDigitalFormResponseListAsync(string suid);
		Task<bool> IsDigitalFormResponseExistAsync(string formId, string userSuid);
		Task<DigitalFormResponse> SaveDigitalFormResponseAsync(DigitalFormResponse template);
		Task<bool> UpdateDigitalFormResponseById(DigitalFormResponse template);
		Task<bool> DeleteDigitalFormResponseByCorelationId(string corelationId);
		Task<bool> DeleteDigitalFormResponseByTempIdAndSuid(string suid, string tempId);
		Task<DigitalFormResponse> GetDigitalFormResponseByTemplateIdRequestIdAndSuidAsync(string tempId, string reqId, string suid);
		Task<List<DigitalFormResponse>> GetDigitalFormResponseListByTemplateIdAndRequestIdAsync(string tempId, string reqId);
	}
}

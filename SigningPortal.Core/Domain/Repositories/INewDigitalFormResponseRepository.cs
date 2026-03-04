using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface INewDigitalFormResponseRepository
	{
		Task<NewDigitalFormResponse> SaveNewDigitalFormResponseAsync(NewDigitalFormResponse template);
		Task<NewDigitalFormResponse> GetNewDigitalFormResponseAsync(string id);
		Task<NewDigitalFormResponse> GetNewDigitalFormResponseByDocIdFormIdAsync(string docId, string formId);
		Task<NewDigitalFormResponse> GetNewDigitalFormResponseByIdAsync(string formId, string userSuid);
		Task<NewDigitalFormResponse> GetNewDigitalFormResponseByFormIdAsync(string id);
		Task<NewDigitalFormResponse> GetNewDigitalFormResponseByCorelationIdAsync(string correlationId);
		Task<List<NewDigitalFormResponse>> GetNewDigitalFormResponseListAsync(string tempId);
		Task<List<NewDigitalFormResponse>> GetSelfNewDigitalFormResponseListAsync(string suid);
		Task<bool> UpdateNewDigitalFormResponseById(NewDigitalFormResponse template, string correlationId);
		Task<bool> UpdateNewDigitalFormSignersResponseById(NewDigitalFormResponse template, string id);
		Task<bool> UpdateNewDigitalFormResponseStatusById(NewDigitalFormResponse template, string correlationId);
		Task<bool> DeleteNewDigitalFormResponseByCorelationId(string correlationId);
		Task<bool> DeleteNewDigitalFormResponseByTempIdAndSuid(string suid, string tempId);
		Task<bool> UpdateNewDigitalFormResponseStatusByTempDocId(string templateDocId, string status);
		Task<NewDigitalFormResponse> GetNewDigitalFormResponseByDocIdAsync(string tempDocId);
		Task<List<NewDigitalFormResponse>> GetNewDigitalFormResponseListByTemplateDocumentIdListAsync(IList<string> tempDocIdList);
	}
}

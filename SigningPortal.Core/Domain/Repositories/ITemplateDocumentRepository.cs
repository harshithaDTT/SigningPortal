using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface ITemplateDocumentRepository
	{
		Task DeleteTemplateDocumentsByIdsAsync(IList<string> idList);
		Task<IList<TemplateDocument>> GetAllTemplateDocumentsBySuid(string suid);
		Task<IList<TemplateDocument>> GetAllTemplateDocumentsBySuidAndOrganizationId(string suid, string orgId);
		Task<long> GetOwnTemplateDocumentStatusCountAsync(string suid, string accontType, string currentOrgId, string status);
		Task<IList<TemplateDocument>> GetPendingTemplateDocumentListAsync(IList<string> recepientsId, IList<string> statusList);
		Task<IList<TemplateDocument>> GetSentTemplateDocumentListAsync(string suid, string accountType, string organizationId, bool isMultisign);
		Task<TemplateDocument> GetTemplateDocumentById(string id);
		Task<TemplateDocument> GetTemplateDocumentByRecepientsTempIdAsync(string tempid);
		Task<TemplateDocument> GetTemplateDocumentByTempIdAsync(string tempid);
		Task<TemplateDocument> GetTemplateDocumentDetailsByRecepientsTempIdAsync(string tempid);
		Task<IList<TemplateDocument>> GetTemplateDocumentListAsync(string suid, string organizationId, bool isMultisign = false);
		Task<IList<TemplateDocument>> GetTemplateDocumentListByRequestGroupId(string groupId);
		Task<IList<TemplateDocument>> GetTemplateDocumentListByTempIdList(IList<string> tempIdList);
		Task<IList<TemplateDocument>> OtherTemplateDocumentStatusAsync(List<string> list);
		Task<TemplateDocument> SaveTemplateDocument(TemplateDocument TemplateDocument);
		Task<List<TemplateDocument>> SaveTemplateDocumentList(List<TemplateDocument> TemplateDocumentList);
		Task<bool> UpdateArrayInTemplateDocumentById(TemplateDocument TemplateDocument);
		Task<bool> UpdateTemplateDocumentById(TemplateDocument TemplateDocument);
		Task<bool> UpdateTemplateDocumentStatusAsync(string tempId, string updatedStatus);
		Task<bool> UpdateTemplateDocumentEdmsIdById(TemplateDocument TemplateDocument);
		Task<TemplateDocument> GetTemplateResponseDocument(string formId, string suid, string orgId);
		Task<TemplateDocument> GetGlobalTemplateResponseDocument(string formId, string suid);
		Task<IList<TemplateDocument>> GetTemplateDocumentListByFormIdAsync(string formId);
		Task<long> UpdateExpiredTemplateDocumentStatus();
		Task<bool> TemplateDocumentsBySuidAndOrganizationIdExists(string suid, string orgId);
		Task<TemplateDocument> GetTemplateDocumentDetailsByTemplateRecepientsTempIdAsync(string tempid);
		Task<IList<TemplateDocument>> GetDocumentByTempIdList(IList<string> tempIdList, bool isMultisign);
	}
}

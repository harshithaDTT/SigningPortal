using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.DTOs;
using SigningPortal.Core.Utilities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface IDocumentRepository
	{
		Task<long> GetOwnDocumentStatusCountAsync(string suid, string accontType, string currentOrgId, string status);

		Task<IList<Document>> OtherDocumentStatusAsync(List<string> list);

		//Task<IList<Document>> GetDocumentByRecepientsIdsAsync(List<string> recepientsId);

		Task<Document> GetDocumentByRecepientsTempIdAsync(string tempid);

		Task<Document> SaveDocument(Document document);

		Task<Document> GetDocumentById(string id);

		Task<bool> UpdateDocumentById(Document document);

		//Task UpdateRecepientsListInDocumentById(Document document);

		Task<IList<Document>> GetAllDocumentsBySuid(string suid);

		Task DeleteDocumentsByIdsAsync(IList<string> idList);

		Task<bool> UpdateDocumentStatusAsync(string tempId, string updatedStatus);

		//Task<IList<Document>> GetDocumentListByRecepientsIdsAsync(string recepientsId);
		////Task<IList<Document>> GetDocumentListByRecepientsIdsAsync(IList<string> recepientsId);

		Task<IList<Document>> GetPendingDocumentListAsync(IList<string> recepientsId, IList<string> statusList);

		Task<long> UpdateExpiredDocumentStatus();

		Task<long> UpdateExpiredDocumentStatusByTempIdList(IList<string> idList);

		Task<IList<Document>> GetDocumentByAutoReminder(string reminder);

		Task<bool> UpdateDocumentBlockedStatusAsync(string id, bool blockedStatus);


		Task<IList<Document>> GetDocumnetListAsync(string suid, string accountType, string organizationId, bool isMultisign);

		Task<IList<Document>> GetSentDocumnetListAsync(string suid, string accountType, string organizationId, bool isMultisign);

		Task<Document> GetDocumentByTempIdAsync(string tempid);

		Task<IList<Document>> GetDocumentByTempIdList(IList<string> tempIdList, bool isMultisign);

		Task<IList<Document>> GetDocumentByTempIdList(IList<string> tempIdList);

		Task<bool> UpdateArrayInDocumentById(Document document);

		Task<Document> GetDocumentDetailsByRecepientsTempIdAsync(string tempid);

		Task<bool> UpdateAssignSomeoneDetailsInDocumentById(Document document);

		Task<(IList<Document> Documents, long TotalCount)> GetPaginatedDocumentListAsync(
			string suid, string accountType, string organizationId,	bool isMultisign, int pageNumber, int pageSize);
        Task<(IList<Document> Documents, long TotalCount)> GetPaginatedSentDocumentListAsync(
            string suid, string accountType, string organizationId, bool isMultisign, int pageNumber, int pageSize);
		Task<IList<Document>> GetDocumnetListByFilterAsync(string suid, string accountType, string organizationId,
			bool isMultisign, DocumentListFilterDTO documentListFilter);
		Task<IList<Document>> GetSentDocumnetListByFilterAsync(string suid, string accountType, string organizationId,
			bool isMultisign, DocumentListFilterDTO documentListFilter);
		Task<IList<Document>> GetDocumentByTempIdListByFilter(string suid, IList<string> tempIdList, bool isMultisign,
			DocumentListFilterDTO documentListFilter);
		Task<(IList<Document> Documents, long TotalCount)> GetPaginatedDocumnetListByFilterAsync(string suid, string accountType, string organizationId,
			bool isMultisign, DocumentListFilterDTO documentListFilter, int pageNumber, int pageSize, bool isPagination, string searchTerm = null);
		Task<(IList<Document> Documents, long TotalCount)> GetPaginatedSentDocumnetListByFilterAsync(string suid, string accountType, string organizationId,
			bool isMultisign, DocumentListFilterDTO documentListFilter, int pageNumber, int pageSize, bool isPagination, string searchTerm = null);
		Task<bool> UpdateDocumentListBlockedStatusAsync(List<string> ids, bool blockedStatus);
	}
}

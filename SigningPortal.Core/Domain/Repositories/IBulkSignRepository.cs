using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface IBulkSignRepository
	{
		Task<BulkSign> SaveBulkSignData(BulkSign bulkSign);
		Task<IList<BulkSign>> GetBulkSigDataList(string orgId, string suid);
		Task<IList<BulkSign>> GetReceivedBulkSignDataList(string orgId, string signerEmail);
		Task<BulkSign> GetBulkSignDataByCorelationId(string corelationId);
		Task<BulkSign> GetBulkSignData(string id);
		Task<bool> UpdateBulkSignData(BulkSign bulkSign);
		Task<IList<BulkSign>> GetBulkSigDataListByTemplateId(string templateID);
		Task<bool> IsBulkSigningTransactionNameExists(string transactionName, string orgId);
		Task<IList<BulkSign>> GetSentBulkSignDataList(string orgId, string suid);
		Task<bool> UpdateBulkSignSrcDestData(BulkSign bulkSign);
	}
}

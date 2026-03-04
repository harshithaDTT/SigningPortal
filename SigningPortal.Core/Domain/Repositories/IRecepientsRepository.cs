using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface IRecepientsRepository
	{

		Task<IList<Recepients>> GetRecepientsListByTakenActionAsync(string suid, bool action);

		Task<IList<Recepients>> GetRecepientsBySuidAsync(string suid);

		Task<IList<Recepients>> GetRecepientsByAlternateEmailSuidAsync(string suid);

		Task<IList<Recepients>> GetRecepientsListByDocIdAsync(string id);

		Task<IList<Recepients>> GetRecepientsListByTempIdAsync(Recepients recepients);

		Task<Recepients> SaveReceipt(Recepients recepients);

		Task<IList<Recepients>> SaveRecepientsAsync(IList<Recepients> recepients);

		Task<bool> UpdateRecepientsById(Recepients recepients);

		Task<bool> UpdateTakenActionOfRecepientById(string id, string signaturePreviewObject = "");

		Task DeleteRecepientsByTempId(IList<string> idList);

		Task<IList<Recepients>> GetRecepientsLeft(string tempId);

		Task<IList<Recepients>> GetCurrentRecepientsList(string tempId);

		Task<Recepients> FindRecepientsByCorelationId(string corelationId);

		Task<Recepients> DeclinedCommentDetailsAsync(string tempId);

		Task<bool> DeclineSigningAsync(string tempId, User user, string comment);

		Task<Recepients> GetRecepientsBySuidAndTempId(string suid, string tempId);
		Task<Recepients> GetRecepientByIdAsync(string id);
		Task<bool> UpdateRecepientStatusById(string id, string status);
	}
}

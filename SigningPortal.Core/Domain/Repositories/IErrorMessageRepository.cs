using SigningPortal.Core.Domain.Model;
using System.Collections.Generic;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface IErrorMessageRepository
	{
		List<ErrorMessage> GetAllErrorMessages();
		void DeleteAllErrorMessages();
	}
}

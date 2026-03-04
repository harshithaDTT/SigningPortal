using SigningPortal.Core.Domain.Model;

namespace SigningPortal.Web.ViewModels.GroupSignings
{
	public class TransactionListViewModel
	{

		public IList<GroupSigning> GroupSigninglist { get; set; } = new List<GroupSigning>();
	}
}

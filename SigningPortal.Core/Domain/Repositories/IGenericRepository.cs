using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Repositories
{
	public interface IGenericRepository<TEntity>
	{
		Task<long> GetCountAsync(FilterDefinition<TEntity> filter);

		Task<IList<TEntity>> FindAllAsync(FilterDefinition<TEntity> filter);
	}
}

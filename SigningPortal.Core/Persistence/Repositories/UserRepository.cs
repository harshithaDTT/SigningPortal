using MongoDB.Driver;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class UserRepository : GenericRepository<BlockedUser>, IUserRepository
	{
		public UserRepository(IMongoDbSettings settings) : base(settings)
		{

		}

		public async Task<BlockedUser> GetBlockedUserEmailAsync(string email)
		{
			var filter = Builders<BlockedUser>.Filter.Eq(x => x.Email, email);
			return await Collection.Find(filter).FirstOrDefaultAsync();
		}

		public async Task<bool> UpdateBlockedEmailListAsync(string type, BlockedUser blockedUser)
		{
			UpdateDefinition<BlockedUser> updateFilter = null;
			var filter = Builders<BlockedUser>.Filter.Eq(x => x.Email, blockedUser.Email);

			if (type == "Email")
			{
				updateFilter = Builders<BlockedUser>.Update.Set(x => x.BlockedEmailList, blockedUser.BlockedEmailList);
			}

			if (type == "Domain")
			{
				updateFilter = Builders<BlockedUser>.Update.Set(x => x.BlockedDomainList, blockedUser.BlockedDomainList);
			}

			var update = await Collection.UpdateOneAsync(filter, updateFilter, options: new UpdateOptions { IsUpsert = false });
			if (update != null)
			{
				if (update.ModifiedCount > 0)
				{
					return true;
				}
				else
				{
					return false;
				}
			}
			else
			{
				return false;
			}
		}

		public async Task<BlockedUser> BlockEmailAsync(BlockedUser user)
		{
			await Collection.InsertOneAsync(user);
			return user;
		}
	}
}

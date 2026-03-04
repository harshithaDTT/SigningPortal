using MongoDB.Driver;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
    public class UserStorageRepository : GenericRepository<UserDriveTokenDetails>, IUserStorageRepository
    {
        public UserStorageRepository(IMongoDbSettings settings) : base(settings)
        {
        }
        public async Task<UserDriveTokenDetails> SaveUserStorageDetails(UserDriveTokenDetails userDetails)
        {
            await Collection.InsertOneAsync(userDetails);
            return userDetails;
        }

        public async Task<UserDriveTokenDetails> GetUserStorageDetailsAsync(string uid, string orgId, string storageName, string Status = null)
        {
            var filter = Builders<UserDriveTokenDetails>.Filter;
            var userDetailsFilter = filter.Eq(x => x.Suid, uid) & filter.Eq(x => x.OrganizationId, orgId) & filter.Eq(x => x.StorageName, storageName);

            if (Status != null)
                userDetailsFilter = userDetailsFilter & filter.Eq(x => x.Status, StorageAccountStatus.Active);

            return await Collection.Find(userDetailsFilter).FirstOrDefaultAsync();
        }

        public async Task<UserDriveTokenDetails> GetActiveUserStorageDetailsAsync(string uid, string orgId)
        {
            var filter = Builders<UserDriveTokenDetails>.Filter;
            var userDetailsFilter = filter.Eq(x => x.Suid, uid) & filter.Eq(x => x.OrganizationId, orgId)
                 & filter.Eq(x => x.Status, StorageAccountStatus.Active) & filter.Eq(x => x.ActiveStorage, true);

            return await Collection.Find(userDetailsFilter).FirstOrDefaultAsync();
        }

        public async Task<List<UserDriveTokenDetails>> GetAllActiveStateUserStorageDetailsListAsync()
        {
            var filter = Builders<UserDriveTokenDetails>.Filter;

            // Filter to find records where 'State' is 'Active'
            var userDetailsFilter = filter.Eq(x => x.State, StorageAccountStatus.Active);

            // Return the list of matching documents
            return await Collection.Find(userDetailsFilter).ToListAsync();
        }

        public async Task<bool> SetStorageActiveAsync(string storageName, UserDTO userDTO)
        {

            var filter = Builders<UserDriveTokenDetails>.Filter;
            var falseFilter = filter.Eq(x => x.Suid, userDTO.Suid) & filter.Eq(x => x.OrganizationId, userDTO.OrganizationId) & filter.Eq(x => x.ActiveStorage, true);
            var UpdateFilter = Builders<UserDriveTokenDetails>.Update;
            var updateFalseFilter = UpdateFilter.Set(x => x.ActiveStorage, false);

            var updateResult = await Collection.UpdateOneAsync(falseFilter, updateFalseFilter, options: new UpdateOptions { IsUpsert = false });
            if (updateResult != null)
            {
                if (updateResult.ModifiedCount > 0)
                {
                    var setTrueFilter = filter.Eq(x => x.Suid, userDTO.Suid) & filter.Eq(x => x.OrganizationId, userDTO.OrganizationId) & filter.Eq(x => x.StorageName, storageName);
                    var updateTrueFilter = UpdateFilter.Set(x => x.ActiveStorage, true);
                    var updateActiveResult = await Collection.UpdateOneAsync(setTrueFilter, updateTrueFilter, options: new UpdateOptions { IsUpsert = false });
                    if (updateActiveResult != null)
                    {
                        if (updateActiveResult.ModifiedCount > 0)
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
                else
                {
                    var setTrueFilter = filter.Eq(x => x.Suid, userDTO.Suid) & filter.Eq(x => x.OrganizationId, userDTO.OrganizationId) & filter.Eq(x => x.StorageName, storageName);
                    var updateTrueFilter = UpdateFilter.Set(x => x.ActiveStorage, true);
                    var updateActiveResult = await Collection.UpdateOneAsync(setTrueFilter, updateTrueFilter, options: new UpdateOptions { IsUpsert = false });
                    if (updateActiveResult != null)
                    {
                        if (updateActiveResult.ModifiedCount > 0)
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
            }
            else
            {
                return false;
            }

        }

        public async Task<bool> UnsetStorageActiveAsync(string storageName, UserDTO userDTO)
        {
            var filter = Builders<UserDriveTokenDetails>.Filter;
            var activeStorageFilter = filter.Eq(x => x.Suid, userDTO.Suid)
                & filter.Eq(x => x.OrganizationId, userDTO.OrganizationId)
                & filter.Eq(x => x.StorageName, storageName)
                & filter.Eq(x => x.Status, StorageAccountStatus.Active)
                & filter.Eq(x => x.ActiveStorage, true);

            var updateFilter = Builders<UserDriveTokenDetails>.Update;
            var updateActiveFilter = updateFilter.Set(x => x.ActiveStorage, false);

            var updateResult = await Collection.UpdateOneAsync(activeStorageFilter, updateActiveFilter, options: new UpdateOptions { IsUpsert = false });
            if (updateResult != null)
            {
                if (updateResult.ModifiedCount > 0)
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

        public async Task<bool> UpdateUserStorageDetailsAsync(UserDriveTokenDetails data)
        {
            var filter = Builders<UserDriveTokenDetails>.Filter;
            var userDetailsFilter = filter.Eq(x => x.Suid, data.Suid) & filter.Eq(x => x.OrganizationId, data.OrganizationId) & filter.Eq(x => x.StorageName, data.StorageName);
            var updateFilter = Builders<UserDriveTokenDetails>.Update;
            var update = updateFilter.Set(x => x.TokenDetails, data.TokenDetails)
                .Set(x => x.TokenExpiryTime, data.TokenExpiryTime)
                .Set(x => x.OrganizationName, data.OrganizationName)
                .Set(x => x.LinkingTime, data.LinkingTime)
                .Set(x => x.ExpiryDate, data.ExpiryDate)
                .Set(x => x.State, data.State)
                .Set(x => x.Status, data.Status);

            var updateResult = await Collection.UpdateOneAsync(userDetailsFilter, update, options: new UpdateOptions { IsUpsert = false });
            if (updateResult != null)
            {
                if (updateResult.ModifiedCount > 0)
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

        public async Task<bool> UnlinkUserStorageAsync(UserDTO user, string StorageName)
        {
            var filter = Builders<UserDriveTokenDetails>.Filter;
            var userDetailsFilter = filter.Eq(x => x.Suid, user.Suid) & filter.Eq(x => x.OrganizationId, user.OrganizationId) & filter.Eq(x => x.StorageName, StorageName);
            var updateFilter = Builders<UserDriveTokenDetails>.Update;
            var update = updateFilter
                .Set(x => x.Status, StorageAccountStatus.Deactive)
                .Set(x => x.TokenDetails, string.Empty)
                .Set(x => x.State, StorageAccountStatus.Expired)
                .Set(x => x.ActiveStorage, false);

            var updateResult = await Collection.UpdateOneAsync(userDetailsFilter, update, options: new UpdateOptions { IsUpsert = false });
            if (updateResult != null)
            {
                if (updateResult.ModifiedCount > 0)
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

        public async Task DeleteUserStorageDetailsBykey(string suid, string orgId, string StorageName)
        {
            var Filter = Builders<UserDriveTokenDetails>.Filter;
            var deleteFilter = Filter.Eq(x => x.Suid, suid) & Filter.Eq(x => x.OrganizationId, orgId) & Filter.Eq(x => x.StorageName, StorageName);
            await Collection.DeleteOneAsync(deleteFilter);
        }

        public async Task DeleteAllUserStorageDetails()
        {
            await Collection.DeleteManyAsync(x => x.StorageName == StorageConstant.GOOGLE_DRIVE);
        }
    }
}

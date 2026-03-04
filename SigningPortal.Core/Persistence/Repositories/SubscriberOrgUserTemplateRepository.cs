using MongoDB.Driver;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class SubscriberOrgUserTemplateRepository : GenericRepository<SubscriberOrgUserTemplate>, ISubscriberOrgUserTemplateRepository
	{
		public SubscriberOrgUserTemplateRepository(IMongoDbSettings settings) : base(settings)
		{

		}

		public async Task<SubscriberOrgUserTemplate> SaveSubscriberOrgTemplate(SubscriberOrgUserTemplate subscriberOrgTemplate)
		{
			await Collection.InsertOneAsync(subscriberOrgTemplate);
			return subscriberOrgTemplate;
		}

		public async Task<bool> DeleteSubscriberOrgTemplate(string templateId, UserDTO userDTO)
		{
			var filter = Builders<SubscriberOrgUserTemplate>.Filter;
			var autoFilter = filter.Eq(x => x.Suid, userDTO.Suid) & filter.Eq(x => x.OrganizationId, userDTO.OrganizationId)
				& filter.Eq(x => x.TemplateId, templateId);

			var deleteSubscriberOrgTemplate = await Collection.DeleteOneAsync(autoFilter);
			if (deleteSubscriberOrgTemplate.DeletedCount == 0)
			{
				return false;
			}
			else
			{
				return true;
			}
		}

		//public async Task<IList<SubscriberOrgUserTemplate>> GetTemplateListBySuidAndOrgId(string suid, string orgId)
		//{
		//    var templateCollection = GetCollection<UserTemplate>("UserTemplate");
		//    var filter = Builders<SubscriberOrgUserTemplate>.Filter;
		//    var autoFilter = filter.Eq(x => x.Suid, suid) & filter.Eq(x => x.OrganizationId, orgId);

		//    return await Collection.Aggregate()
		//        .Match(autoFilter)
		//        .Sort(Builders<SubscriberOrgUserTemplate>.Sort.Descending(x => x.CreatedAt))
		//        .Lookup<SubscriberOrgUserTemplate, UserTemplate, SubscriberOrgUserTemplate>(templateCollection, x => x.TemplateId, temp => temp._id, @orgtempX => orgtempX.TemplateDetails)
		//        .As<SubscriberOrgUserTemplate>().ToListAsync();
		//}


		public async Task<IList<SubscriberOrgUserTemplate>> GetTemplateListBySuid(string suid)
		{
			var templateCollection = GetCollection<UserTemplate>("UserTemplate");
			var filter = Builders<SubscriberOrgUserTemplate>.Filter;
			var autoFilter = filter.Eq(x => x.Suid, suid);

			return await Collection.Aggregate()
				.Match(autoFilter)
				.Sort(Builders<SubscriberOrgUserTemplate>.Sort.Descending(x => x.CreatedAt))
				.Lookup<SubscriberOrgUserTemplate, UserTemplate, SubscriberOrgUserTemplate>(templateCollection, x => x.TemplateId, temp => temp._id, @orgtempX => orgtempX.TemplateDetails)
				.As<SubscriberOrgUserTemplate>().ToListAsync();
		}
	}
}

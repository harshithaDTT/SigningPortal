using MongoDB.Driver;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class SubscriberOrgGenericTemplateRepository : GenericRepository<SubscriberOrgGenericTemplate>,
		ISubscriberOrgGenericTemplateRepository
	{
		public SubscriberOrgGenericTemplateRepository(IMongoDbSettings settings) : base(settings)
		{

		}

		public async Task<SubscriberOrgGenericTemplate> SaveSubscriberOrgGenericTemplate(SubscriberOrgGenericTemplate
			subscriberOrgGenTemplate)
		{
			await Collection.InsertOneAsync(subscriberOrgGenTemplate);
			return subscriberOrgGenTemplate;
		}

		public async Task<bool> DeleteSubscriberOrgGenericTemplate(string templateId, UserDTO userDTO)
		{
			var filter = Builders<SubscriberOrgGenericTemplate>.Filter;
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

		public async Task<IList<SubscriberOrgGenericTemplate>> GetGenericTemplateListBySuidAndOrgId(string suid, string orgId)
		{
			var templateCollection = GetCollection<GenericTemplate>("Generic Template");
			var filter = Builders<SubscriberOrgGenericTemplate>.Filter;
			var autoFilter = filter.Eq(x => x.Suid, suid) & filter.Eq(x => x.OrganizationId, orgId);

			return await Collection.Aggregate()
				.Match(autoFilter)
				.Sort(Builders<SubscriberOrgGenericTemplate>.Sort.Descending(x => x.CreatedAt))
				.Lookup<SubscriberOrgGenericTemplate, GenericTemplate, SubscriberOrgGenericTemplate>(templateCollection, x => x.TemplateId,
				temp => temp._id, @orgtempX => orgtempX.TemplateDetails)
				.As<SubscriberOrgGenericTemplate>().ToListAsync();
		}

		public async Task<IList<SubscriberOrgGenericTemplate>> GetGenericTemplateListByOrgId(string orgId)
		{
			var templateCollection = GetCollection<GenericTemplate>("Generic Template");
			var filter = Builders<SubscriberOrgGenericTemplate>.Filter;
			var autoFilter = filter.Eq(x => x.OrganizationId, orgId);

			return await Collection.Aggregate()
				.Match(autoFilter)
				.Sort(Builders<SubscriberOrgGenericTemplate>.Sort.Descending(x => x.CreatedAt))
				.Lookup<SubscriberOrgGenericTemplate, GenericTemplate, SubscriberOrgGenericTemplate>(templateCollection, x => x.TemplateId,
				temp => temp._id, @orgtempX => orgtempX.TemplateDetails)
				.As<SubscriberOrgGenericTemplate>().ToListAsync();
		}
	}
}

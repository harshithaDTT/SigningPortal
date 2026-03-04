using MongoDB.Driver;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.DTOs;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class SubscriberOrgTemplateRepository : GenericRepository<SubscriberOrgTemplate>, ISubscriberOrgTemplateRepository
	{
		public SubscriberOrgTemplateRepository(IMongoDbSettings settings) : base(settings)
		{

		}

		public async Task<SubscriberOrgTemplate> SaveSubscriberOrgTemplate(SubscriberOrgTemplate subscriberOrgTemplate)
		{
			await Collection.InsertOneAsync(subscriberOrgTemplate);
			return subscriberOrgTemplate;
		}

		public async Task<bool> DeleteSubscriberOrgTemplate(string templateId, UserDTO userDTO)
		{
			var filter = Builders<SubscriberOrgTemplate>.Filter;
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

		public async Task<IList<SubscriberOrgTemplate>> GetTemplateListBySuidAndOrgId(string suid, string orgId)
		{
			var templateCollection = GetCollection<Template>("Template");
			var filter = Builders<SubscriberOrgTemplate>.Filter;
			var autoFilter = filter.Eq(x => x.Suid, suid) & filter.Eq(x => x.OrganizationId, orgId);

			return await Collection.Aggregate()
				.Match(autoFilter)
				.Sort(Builders<SubscriberOrgTemplate>.Sort.Descending(x => x.CreatedAt))
				.Lookup<SubscriberOrgTemplate, Template, SubscriberOrgTemplate>(templateCollection, x => x.TemplateId, temp => temp._id, @orgtempX => orgtempX.TemplateDetails)
				.As<SubscriberOrgTemplate>().ToListAsync();
		}


		public async Task<IList<SubscriberOrgTemplate>> GetTemplateListByOrgId(string orgId)
		{
			var templateCollection = GetCollection<Template>("Template");
			var filter = Builders<SubscriberOrgTemplate>.Filter;
			var autoFilter = filter.Eq(x => x.OrganizationId, orgId);

			return await Collection.Aggregate()
				.Match(autoFilter)
				.Sort(Builders<SubscriberOrgTemplate>.Sort.Descending(x => x.CreatedAt))
				.Lookup<SubscriberOrgTemplate, Template, SubscriberOrgTemplate>(templateCollection, x => x.TemplateId, temp => temp._id, @orgtempX => orgtempX.TemplateDetails)
				.As<SubscriberOrgTemplate>().ToListAsync();
		}
	}
}

using MongoDB.Driver;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class DigitalFormTemplateRoleRepository : GenericRepository<DigitalFormTemplateRole>, IDigitalFormTemplateRoleRepository
	{
		public DigitalFormTemplateRoleRepository(IMongoDbSettings settings) : base(settings)
		{

		}

		public async Task<DigitalFormTemplateRole> SaveDigitalFormTemplateRoleAsync(DigitalFormTemplateRole template)
		{
			await Collection.InsertOneAsync(template);
			return template;
		}
		public async Task<List<DigitalFormTemplateRole>> SaveDigitalFormTemplateRoleListAsync(List<DigitalFormTemplateRole> templates)
		{
			await Collection.InsertManyAsync(templates);
			return templates;
		}
		public async Task<DigitalFormTemplateRole> GetDigitalFormTemplateRoleAsync(string id)
		{
			return await Collection.Aggregate()
				.Match(x => x._id == id)
				.FirstOrDefaultAsync();
		}
		public async Task<List<DigitalFormTemplateRole>> GetDigitalFormTemplateRoleListAsync()
		{
			return await Collection.Aggregate().ToListAsync();
		}
		public async Task<List<DigitalFormTemplateRole>> GetDigitalFormTemplateRoleListByTemplateIdAsync(string templateId)
		{
			var filter = Builders<DigitalFormTemplateRole>.Filter.Eq(x => x.TemplateId, templateId);
			return await Collection.Find(filter).ToListAsync();
		}
		public async Task<bool> UpdateDigitalFormTemplateRoleById(DigitalFormTemplateRole template)
		{
			var filter = Builders<DigitalFormTemplateRole>.Filter.Eq(x => x._id, template._id);
			var updateFilter = Builders<DigitalFormTemplateRole>.Update;
			var update = updateFilter
							.Set(x => x.TemplateId, template.TemplateId)
							.Set(x => x.Email, template.Email)
							.Set(x => x.Roles, template.Roles)
							.Set(x => x.AnnotationsList, template.AnnotationsList)
							.Set(x => x.PlaceHolderCoordinates, template.PlaceHolderCoordinates)
							.Set(x => x.EsealPlaceHolderCoordinates, template.EsealPlaceHolderCoordinates)
							.Set(x => x.UpdatedAt, template.UpdatedAt)
							.Set(x => x.UpdatedBy, template.UpdatedBy);

			var updatedTemplate = await Collection.UpdateOneAsync(filter, update, options: new UpdateOptions { IsUpsert = false });

			return updatedTemplate?.ModifiedCount > 0;

		}
		public async Task<bool> UpdateDigitalFormTemplateRoleList(List<DigitalFormTemplateRole> templates)
		{
			var filter = Builders<DigitalFormTemplateRole>.Filter.In(x => x._id, templates.Select(t => t._id));
			var updateFilter = Builders<DigitalFormTemplateRole>.Update;

			var updates = templates.Select(template =>
				updateFilter
					.Set(x => x.UpdatedAt, template.UpdatedAt)
					.Set(x => x.UpdatedBy, template.UpdatedBy)
			);

			var result = await Collection.UpdateManyAsync(filter, Builders<DigitalFormTemplateRole>.Update.Combine(updates));

			return result.ModifiedCount > 0;
		}
		public async Task<bool> DeleteDigitalFormTemplateRoleListAsync(List<DigitalFormTemplateRole> templates)
		{
			var filter = Builders<DigitalFormTemplateRole>.Filter.In(x => x._id, templates.Select(t => t._id));
			var result = await Collection.DeleteManyAsync(filter);

			return result.DeletedCount > 0;
		}
	}
}

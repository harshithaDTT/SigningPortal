using MongoDB.Driver;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class DigitalFormTemplateRepository : GenericRepository<DigitalFormTemplate>, IDigitalFormTemplateRepository
	{
		public DigitalFormTemplateRepository(IMongoDbSettings settings) : base(settings)
		{

		}

		public async Task<List<DigitalFormTemplate>> GetAllPublishedDigitalFormsAsync()
		{
			var roleCollection = GetCollection<DigitalFormTemplateRole>("DigitalFormTemplateRole");

			return await Collection.Aggregate()
				.Match(x => x.Status == TemplateConstants.Publish)
				.Lookup<DigitalFormTemplate, DigitalFormTemplateRole, DigitalFormTemplate>(roleCollection, doc => doc._id, rec => rec.TemplateId, @docX => docX.Roles)
				.ToListAsync();
		}

		public async Task<bool> IsDigitalFormTemplateNameExists(string templateName, string orgId, string templateId = null)
		{
			FilterDefinition<DigitalFormTemplate> filter = Builders<DigitalFormTemplate>.Filter.Eq(x => x.TemplateName, templateName) &
															Builders<DigitalFormTemplate>.Filter.Eq(x => x.OrganizationUid, orgId);

			if (!string.IsNullOrEmpty(templateId))
			{
				filter &= Builders<DigitalFormTemplate>.Filter.Ne(x => x._id, templateId);
			}

			var count = await Collection.CountDocumentsAsync(filter);
			return count > 0;
		}

		public async Task<DigitalFormTemplate> SaveDigitalFormTemplateAsync(DigitalFormTemplate template)
		{
			await Collection.InsertOneAsync(template);
			return template;
		}
		public async Task<DigitalFormTemplate> GetDigitalFormTemplateAsync(string id)
		{
			var roleCollection = GetCollection<DigitalFormTemplateRole>("DigitalFormTemplateRole");

			return await Collection.Aggregate()
				.Match(x => x._id == id)
				.Lookup<DigitalFormTemplate, DigitalFormTemplateRole, DigitalFormTemplate>(roleCollection, doc => doc._id, rec => rec.TemplateId, @docX => docX.Roles)
				.FirstOrDefaultAsync();
		}
		public async Task<List<DigitalFormTemplate>> GetDigitalFormTemplateListAsync(UserDTO user)
		{
			var roleCollection = GetCollection<DigitalFormTemplateRole>("DigitalFormTemplateRole");

			return await Collection.Aggregate()
				.Match(x => x.OrganizationUid == user.OrganizationId)
				.Match(x => x.Suid == user.Suid)
				.Lookup<DigitalFormTemplate, DigitalFormTemplateRole, DigitalFormTemplate>(roleCollection, doc => doc._id, rec => rec.TemplateId, @docX => docX.Roles)
				.SortByDescending(x => x.CreatedAt)
				.ToListAsync();
		}
		public async Task<List<DigitalFormTemplate>> GetDigitalFormTemplatePublishListAsync(UserDTO user)
		{
			var roleCollection = GetCollection<DigitalFormTemplateRole>("DigitalFormTemplateRole");

			return await Collection.Aggregate()
				.Match(x => x.OrganizationUid == user.OrganizationId)
				.Match(x => x.Status == TemplateConstants.Publish)
				.Match(x => x.PublishGlobally == false)
				.Lookup<DigitalFormTemplate, DigitalFormTemplateRole, DigitalFormTemplate>(roleCollection, doc => doc._id, rec => rec.TemplateId, @docX => docX.Roles)
				.SortByDescending(x => x.CreatedAt)
				.ToListAsync();
		}
		//public async Task<List<DigitalFormTemplate>> GetDigitalFormTemplateListByGroupIdAsync(string id)
		//{
		//    return await Collection.Aggregate()
		//        .Match(x => x.FormGroupId == id)
		//        .Match(x => x.PublishGlobally == true)
		//        .Match(x => x.Status == TemplateConstants.Publish)
		//        .SortByDescending(x => x.CreatedAt)
		//        .ToListAsync();
		//}
		public async Task<List<DigitalFormTemplate>> GetDigitalFormTemplatePublishGlobalListAsync()
		{
			var roleCollection = GetCollection<DigitalFormTemplateRole>("DigitalFormTemplateRole");

			return await Collection.Aggregate()
				.Match(x => x.PublishGlobally == true)
				.Match(x => x.Status == TemplateConstants.Publish)
				.Lookup<DigitalFormTemplate, DigitalFormTemplateRole, DigitalFormTemplate>(roleCollection, doc => doc._id, rec => rec.TemplateId, @docX => docX.Roles)
				.SortByDescending(x => x.CreatedAt)
				.ToListAsync();
		}

		public async Task<bool> BulkUpdateDigitalFormTemplateStatus(List<DigitalFormTemplate> templates)
		{
			if (templates == null || templates.Count == 0)
				return false;

			// Create tasks for updating templates in parallel
			var updateTasks = templates.Select(template =>
			{
				var filter = Builders<DigitalFormTemplate>.Filter.Eq(x => x._id, template._id);
				var update = Builders<DigitalFormTemplate>.Update
					.Set(x => x.UpdatedAt, DateTime.UtcNow)
					.Set(x => x.Status, template.Status)
					.Set(x => x.PublishGlobally, template.PublishGlobally);

				return Collection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = false });
			});

			// Execute all update tasks in parallel and wait for them to complete
			var updateResults = await Task.WhenAll(updateTasks);

			// Check if all updates were successful
			return updateResults.All(result => result.ModifiedCount > 0);
		}



		public async Task<bool> UpdateDigitalFormTemplateStatus(DigitalFormTemplate template)
		{

			var filter = Builders<DigitalFormTemplate>.Filter.Eq(x => x._id, template._id);
			var updateFilter = Builders<DigitalFormTemplate>.Update;
			var update = updateFilter
				.Set(x => x.UpdatedAt, DateTime.UtcNow)
				.Set(x => x.Status, template.Status)
				.Set(x => x.PublishGlobally, template.PublishGlobally);

			var updatedTemplate = await Collection.UpdateOneAsync(filter, update, options: new UpdateOptions { IsUpsert = false });
			if (updatedTemplate != null)
			{
				if (updatedTemplate.ModifiedCount > 0)
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
		public async Task<bool> UpdateDigitalFormTemplate(DigitalFormTemplate template)
		{
			var filter = Builders<DigitalFormTemplate>.Filter.Eq(x => x._id, template._id);
			var updateFilter = Builders<DigitalFormTemplate>.Update;

			var update = updateFilter
				.Set(x => x.TemplateName, template.TemplateName)
				.Set(x => x.OrganizationUid, template.OrganizationUid)
				.Set(x => x.Suid, template.Suid)
				.Set(x => x.Status, template.Status)
				.Set(x => x.EdmsId, template.EdmsId)
				.Set(x => x.DocumentName, template.DocumentName)
				.Set(x => x.AdvancedSettings, template.AdvancedSettings)
				.Set(x => x.DaysToComplete, template.DaysToComplete)
				.Set(x => x.NumberOfSignatures, template.NumberOfSignatures)
				.Set(x => x.AllSigRequired, template.AllSigRequired)
				.Set(x => x.PublishGlobally, template.PublishGlobally)
				.Set(x => x.HtmlSchema, template.HtmlSchema)
				.Set(x => x.PdfSchema, template.PdfSchema)
				.Set(x => x.Type, template.Type)
				.Set(x => x.SequentialSigning, template.SequentialSigning)
				.Set(x => x.CreatedBy, template.CreatedBy)
				.Set(x => x.UpdatedBy, template.UpdatedBy)
				.Set(x => x.UpdatedAt, DateTime.UtcNow);
				//.Set(x => x.Model, template.Model);

			var updatedTemplate = await Collection.UpdateOneAsync(filter, update, options: new UpdateOptions { IsUpsert = false });

			return updatedTemplate?.ModifiedCount > 0;
		}

	}
}

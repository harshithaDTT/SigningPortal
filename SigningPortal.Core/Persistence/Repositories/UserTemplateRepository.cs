using MongoDB.Driver;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using System.Threading.Tasks;

namespace SigningPortal.Core.Persistence.Repositories
{
	public class UserTemplateRepository : GenericRepository<UserTemplate>, IUserTemplateRepository
	{
		public UserTemplateRepository(IMongoDbSettings settings) : base(settings)
		{

		}

		public async Task<UserTemplate> SaveTemplateAsync(UserTemplate template)
		{
			await Collection.InsertOneAsync(template);
			return template;
		}

		public async Task<UserTemplate> GetTemplateAsync(string id)
		{
			return await Collection.Aggregate()
				.Match(x => x._id == id)
				.FirstOrDefaultAsync();
		}

		public async Task<bool> DeleteTemplateAsync(string templateId)
		{
			var filter = Builders<UserTemplate>.Filter.Eq(x => x._id, templateId);

			var result = await Collection.DeleteOneAsync(filter);
			if (result.DeletedCount == 0)
			{
				return false;
			}
			else
			{
				return true;
			}
		}

		public async Task<bool> UpdateTemplateById(UserTemplate template)
		{

			var filter = Builders<UserTemplate>.Filter.Eq(x => x._id, template._id);
			var updateFilter = Builders<UserTemplate>.Update;
			var update = updateFilter.Set(x => x.Annotations, template.Annotations)
				.Set(x => x.EsealAnnotations, template.EsealAnnotations)
				.Set(x => x.QrCodeAnnotations, template.QrCodeAnnotations)
				.Set(x => x.QrCodeRequired, template.QrCodeRequired)
				.Set(x => x.SettingConfig, template.SettingConfig)
				.Set(x => x.SignatureTemplate, template.SignatureTemplate)
				.Set(x => x.EsealSignatureTemplate, template.EsealSignatureTemplate)
				.Set(x => x.UpdatedAt, template.UpdatedAt)
				.Set(x => x.UpdatedBy, template.UpdatedBy);

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
	}
}

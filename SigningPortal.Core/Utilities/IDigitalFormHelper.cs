using SigningPortal.Core.DTOs;

namespace SigningPortal.Core.Utilities
{
	public interface IDigitalFormHelper
	{
		string GenerateHtmlString(FillFormData data);
		string GenerateSimHtmlString(FillFormData data);
		string RequestGenerateHtmlString(FillFormData data);
		string RequestWebhtmlString(FillFormData data);
		string ViewFilledForm(FillFormData data);
		string WebhtmlString(FillFormData data);
	}
}
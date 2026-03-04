namespace SigningPortal.Web.Utilities
{
	public interface IRazorRendererHelper
	{
		string RenderPartialToString<TModel>(string partialName, TModel model);
	}
}

namespace SigningPortal.Core.Utilities
{
	public interface IConstantError
	{
		string GetMessage(string Code);
		void DeleteAllErrorMessagesAsync();
	}
}

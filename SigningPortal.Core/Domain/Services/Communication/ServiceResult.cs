namespace SigningPortal.Core.Domain.Services.Communication
{
	public class ServiceResult
	{
		public ServiceResult(object resource, string message = null)
		{
			Success = true;
			Message = message;
			Result = resource;
		}

		public ServiceResult(object resource, string message, bool success)
		{
			Success = success;
			Message = message;
			Result = resource;
		}

		public ServiceResult(string message)
		{
			Success = false;
			Message = message;
			Result = null;
		}

		public bool Success { get; protected set; }

		public string Message { get; protected set; }

		public object Result { get; protected set; }
	}
}

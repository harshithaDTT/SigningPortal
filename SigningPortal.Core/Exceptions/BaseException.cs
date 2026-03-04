using System;

namespace SigningPortal.Core.Exceptions
{
	public abstract class BaseException : Exception
	{
		protected int StatusCode { get; }

		public BaseException() : base()
		{
		}

		public BaseException(string message) : base(message)
		{
		}

		public BaseException(string message, Exception ex) : base(message, ex)
		{
		}

		public BaseException(string message, int statusCode) : this(message)
		{
			StatusCode = statusCode;
		}
	}
}

using System;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace SigningPortal.Core.Utilities
{
	public interface IBackgroundService
	{
		void FireAndForget<T>(Action<T> action);
		void FireAndForgetAsync<T>(Func<T, Task> action);
		void RunBackgroundTask<T>(Expression<Func<T, Task>> action);
	}
}
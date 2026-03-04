using Hangfire.Common;
using Hangfire.States;
using Hangfire.Storage;
using System;

namespace SigningPortal.Core.Sheduler
{
	public class AutomaticExpirationAttribute : JobFilterAttribute, IApplyStateFilter
	{
		private readonly TimeSpan _expiration;

		public AutomaticExpirationAttribute(int days = 1)
		{
			_expiration = TimeSpan.FromDays(days);
		}

		public void OnStateApplied(ApplyStateContext context, IWriteOnlyTransaction transaction)
		{
			context.JobExpirationTimeout = _expiration;
		}

		public void OnStateUnapplied(ApplyStateContext context, IWriteOnlyTransaction transaction) { }
	}

}

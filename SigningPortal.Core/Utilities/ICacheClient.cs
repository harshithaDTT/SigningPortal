using StackExchange.Redis;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Utilities
{
	public interface ICacheClient
	{
		//Get record from cache
		public Task<T> Get<T>(string name, string key,
			CommandFlags flags = CommandFlags.None);

		// Set record in cache
		public Task<(int retValue, string errorMsg)> Add(string name, string key,
			object value, TimeSpan? expiry = null, When when = When.Always,
			CommandFlags flags = CommandFlags.None);

		// Delete record from cache
		public Task<(int retValue, string errorMsg)> Remove(string name,
			string key, CommandFlags flags = CommandFlags.None);

		// Check if record exists in cache
		public Task<(int retValue, string errorMsg)> Exists(string name,
			string key, CommandFlags flags = CommandFlags.None);
		public (int retValue, string errorMsg) KeyExists(string name,
			string key, CommandFlags flags = CommandFlags.None);

		public Task<(int retValue, double totalSeconds)> TimeToLeave(string name,
		string key);

		public Task<IList<T>> GetAll<T>(string name);
		public Task<(int nextIndex, IList<T>)> GetAll<T>(string name,
			int index,
			int count);

		// HashSet Redis
		Task<(int retValue, string errorMsg)> AddHashRecordAsync(string name, string key, object value, TimeSpan? expiry = null, CommandFlags flags = CommandFlags.None);
		Task<(T value, string errorMsg)> GetHashRecordAsync<T>(string name, string key, CommandFlags flags = CommandFlags.None);
		Task<(Dictionary<string, T> data, string errorMsg)> GetAllHashRecordsAsync<T>(string name, CommandFlags flags = CommandFlags.None);
		Task<(bool deleted, string errorMsg)> DeleteHashFieldAsync(string name, string key, CommandFlags flags = CommandFlags.None);
		Task<(bool exists, string errorMsg)> HashFieldExistsAsync(string name, string key, CommandFlags flags = CommandFlags.None);
	}
}

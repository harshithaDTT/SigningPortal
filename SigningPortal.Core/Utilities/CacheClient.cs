using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SigningPortal.Core.Constants;
using StackExchange.Redis;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Utilities
{
	public class CacheClient : ICacheClient
	{
		private readonly ILogger<CacheClient> _logger;
		private readonly IGlobalConfiguration _globalConfiguration;
		private static Lazy<IConnectionMultiplexer> _connection = null;
		private readonly ConfigurationOptions configuration;

		public CacheClient(ILogger<CacheClient> logger, IGlobalConfiguration globalConfiguration)
		{
			_logger = logger;
			_globalConfiguration = globalConfiguration;

			_logger.LogDebug("-->CacheClient");

			// Get Configuration string from database.

			string configString = _globalConfiguration.ReddisConnectionString;

			configuration = ConfigurationOptions.Parse(configString);
			configuration.ClientName = "REDIS CLIENT";
			configuration.ConnectTimeout = 10000;     // 10 seconds
			configuration.SyncTimeout = 10000;        // 10 seconds
			configuration.AsyncTimeout = 10000;       // 10 seconds (added in newer versions)
			configuration.AbortOnConnectFail = false; // Recommended for resilience
			configuration.ConnectRetry = 3;           // Retry connecting up to 3 times

			try
			{
				_connection = new Lazy<IConnectionMultiplexer>(() =>
				{
					ConnectionMultiplexer redis =
					ConnectionMultiplexer.Connect(configuration);
					return redis;
				});
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError("Redis Server Initialization Failed:{0}",
					   ex.Message);
				throw;
			}

			_logger.LogDebug("<--CacheClient");
		}

		public IConnectionMultiplexer Connection
		{
			get
			{
				return _connection.Value;
			}
		}

		// For the default database
		public IDatabase Database => Connection.GetDatabase();

		// Get record from cache
		public async Task<T> Get<T>(string name, string key,
			CommandFlags flags = CommandFlags.None)
		{
			_logger.LogDebug("-->GetCacheRecord");

			// Validate input parameters
			if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(key))
			{
				_logger.LogError("Invalid Input Parameter");
				return default;
			}

			// Prepare key
			var finalKey = name + ":" + key;

			try
			{
				var serializedObject = await Database.StringGetAsync(finalKey, flags);

				if (!serializedObject.HasValue)
				{
					_logger.LogWarning("Failed to get cache record");
					return default;
				}

				var json = serializedObject.ToString();

				return JsonConvert.DeserializeObject<T>(json);
			}
			catch (Exception error)
			{
				Monitor.SendException(error);
				_logger.LogError("Get Cache Record Failed:{0}", error.Message);
				return default;
			}
		}

		// Set record in cache
		public async Task<(int retValue, string errorMsg)> Add(string name, string key,
			object value, TimeSpan? expiry = null, When when = When.Always,
			CommandFlags flags = CommandFlags.None)
		{
			_logger.LogDebug("-->AddCacheRecord");

			// Validate input parameters
			if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(key) ||
				null == value)
			{
				_logger.LogError("Invalid Input Parameter");
				return (-1, "Invalid Parameters");
			}

			// Serialize the object
			var serializedObject = JsonConvert.SerializeObject(value);
			if (serializedObject == null)
			{
				_logger.LogError("JsonConvert.SerializeObject() failed");
				return (-1, "JsonConvert.SerializeObject() failed");
			}

			// Prepare key
			var finalKey = name + ":" + key;

			try
			{
				// Set the object
				bool status = await Database.StringSetAsync(key: finalKey,
					value: serializedObject, expiry: expiry, when, flags);
				if (!status)
				{
					_logger.LogError("Failed to set object");
					return (CacheCodes.E_FAIL, "Failed to set object");
				}
			}
			catch (RedisCommandException error)
			{
				Monitor.SendException(error);
				_logger.LogError("Add Cache Record Failed:{0}", error.Message);
				return (CacheCodes.REDIS_COMMAND_EXCEPTION, error.Message);
			}
			catch (RedisTimeoutException error)
			{
				Monitor.SendException(error);
				_logger.LogError("Add Cache Record Failed:{0}", error.Message);
				return (CacheCodes.REDIS_TIMEOUT_EXCEPTION, error.Message);
			}
			catch (RedisConnectionException error)
			{
				Monitor.SendException(error);
				_logger.LogError("Add Cache Record Failed:{0}", error.Message);
				return (CacheCodes.REDIS_TIMEOUT_EXCEPTION, error.Message);
			}
			catch (Exception error)
			{
				Monitor.SendException(error);
				_logger.LogError("Add Cache Record Failed:{0}", error.Message);
				return (-1, error.Message);
			}

			_logger.LogDebug("<--AddCacheRecord");
			return (0, string.Empty);
		}

		// Delete record from cache
		public async Task<(int retValue, string errorMsg)> Remove(string name,
			string key, CommandFlags flags = CommandFlags.FireAndForget)
		{
			_logger.LogDebug("-->DeleteCacheRecord");

			// Validate input parameters
			if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(key))
			{
				_logger.LogError("Invalid Input Parameter");
				return (-1, "Invalid Parameters");
			}

			// Prepare key
			var finalKey = name + ":" + key;

			try
			{
				// Delete object from cache
				bool isDeleted = await Database.KeyDeleteAsync(finalKey, flags);
				if (!isDeleted)
				{
					_logger.LogWarning("Failed to delete record from cache");
					return (-104, "Failed to delete");
				}
			}
			catch (Exception error)
			{
				Monitor.SendException(error);
				_logger.LogError("Delete Cache Record Failed:{0}", error.Message);
				return (-1, error.Message);
			}

			return (0, string.Empty);
		}

		// Check if record exists in cache
		public async Task<(int retValue, string errorMsg)> Exists(string name,
			string key, CommandFlags flags = CommandFlags.None)
		{
			_logger.LogDebug("-->IsCacheRecordExists");

			// Validate input parameters
			if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(key))
			{
				_logger.LogError("Invalid Input Parameter");
				return (-1, "Invalid Parameters");
			}

			// Prepare key
			var finalKey = name + ":" + key;

			try
			{
				// Check if key exist or not
				var isExist = await Database.KeyExistsAsync(finalKey, flags);
				if (!isExist)
				{
					_logger.LogWarning("Cache Record Not Exists");
					return (0, string.Empty);
				}
			}
			catch (Exception error)
			{
				Monitor.SendException(error);
				_logger.LogError("Check Cache Record Exists:{0}", error.Message);
				return (-1, error.Message);
			}

			_logger.LogDebug("<--IsCacheRecordExists");
			return (104, string.Empty);
		}

		// Check if record exists in cache
		public (int retValue, string errorMsg) KeyExists(string name,
			string key, CommandFlags flags = CommandFlags.None)
		{
			_logger.LogDebug("-->IsCacheRecordExists");

			// Validate input parameters
			if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(key))
			{
				_logger.LogError("Invalid Input Parameter");
				return (-1, "Invalid Parameters");
			}

			// Prepare key
			var finalKey = name + ":" + key;

			try
			{
				// Check if key exist or not
				var isExist = Database.KeyExists(finalKey, flags);
				if (!isExist)
				{
					_logger.LogWarning("Cache Record Not Exists");
					return (0, string.Empty);
				}
			}
			catch (Exception error)
			{
				Monitor.SendException(error);
				_logger.LogError("Check Cache Record Exists:{0}", error.Message);
				return (-1, error.Message);
			}

			_logger.LogDebug("<--IsCacheRecordExists");
			return (104,string.Empty);
		}



		// Check time to leave of key in cache
		public async Task<(int retValue, double totalSeconds)> TimeToLeave(string name,
			string key)
		{
			_logger.LogDebug("-->TimeToLeave");

			// Validate input parameters
			if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(key))
			{
				_logger.LogError("Invalid Input Parameter");
				return (-1, 0);
			}

			// Prepare key
			var finalKey = name + ":" + key;

			try
			{
				// Check if key exist or not
				var seconds = await Database.KeyTimeToLiveAsync(finalKey);
				if (null == seconds)
				{
					_logger.LogWarning("Record does not exists or does not have timeout");
					return (104, 0);
				}

				return (0, seconds.Value.TotalSeconds);
			}
			catch (Exception error)
			{
				Monitor.SendException(error);
				_logger.LogError("Check Cache Record TimeToLeave Exists:{0}",
					error.Message);
				return (-1, 0);
			}
		}

		// GetAll Results from Session Manager(Redis)
		public async Task<IList<T>> GetAll<T>(string name)
		{
			_logger.LogDebug("-->GetAllRecords");
			var command = string.Format("*{0}*", name);
			var nextCursor = 0;
			var isTrue = true;
			IList<T> result = new List<T>();

			try
			{
				while (isTrue)
				{
					var list = (RedisResult[])await Database.ExecuteAsync("Scan", nextCursor,
						"match", command);
					nextCursor = (int)list[0];
					if (nextCursor == 0)
					{
						isTrue = false;
					}
					var keys = (RedisKey[])list[1];

					foreach (var item in keys)
					{
						// Get the serialized object from cache
						var serializedObject = await Database.StringGetAsync(item.ToString());

						if (!serializedObject.HasValue)
							continue;  // skip this key instead of returning default

						var json = serializedObject.ToString();  // explicit conversion

						if (string.IsNullOrWhiteSpace(json))
							continue; // skip empty strings

						// Deserialize safely
						var obj = JsonConvert.DeserializeObject<T>(json);

						if (obj != null)
						{
							result.Add(obj);
						}
					}
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError("GetAllRecords Failed:{0}", ex.Message);
				return null;
			}

			_logger.LogDebug("<--GetAllRecords");
			return result;
		}

		public async Task<(int nextIndex, IList<T>)> GetAll<T>(string name,
			int index, int count)
		{
			_logger.LogDebug("-->GetAllRecords");

			// Validate input parameters
			if (string.IsNullOrEmpty(name))
			{
				_logger.LogError("Invalid Input Parameter");
				return (0, new List<T>());
			}

			var command = string.Format("*{0}*", name);
			var nextIndex = 0;
			IList<T> result = new List<T>();

			try
			{
				var list = (RedisResult[])await Database.ExecuteAsync("Scan", index,
					"match", command, "count", count);
				nextIndex = (int)list[0];

				var keys = (RedisKey[])list[1];

				foreach (var item in keys)
				{
					// Get the serialized object from cache
					var serializedObject = await Database.StringGetAsync(item.ToString());

					if (!serializedObject.HasValue)
						continue;  // skip this key instead of returning default

					var json = serializedObject.ToString();  // explicit conversion

					if (string.IsNullOrWhiteSpace(json))
						continue; // skip empty strings

					// Deserialize safely
					var obj = JsonConvert.DeserializeObject<T>(json);

					if (obj != null)
					{
						result.Add(obj);
					}
				}
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError("GetAllRecords Failed:{0}", ex.Message);
				return (0, new List<T>());
			}

			_logger.LogDebug("<--GetAllRecords");
			return (nextIndex, result);
		}

		public async Task<(int retValue, string errorMsg)> AddHashRecordAsync(string name, string key,
						object value, TimeSpan? expiry = null, CommandFlags flags = CommandFlags.None)
		{
			_logger.LogDebug("-->AddHashRecordAsync");

			// Validate input parameters
			if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(key) || value == null)
			{
				_logger.LogError("Invalid Input Parameter");
				return (-1, "Invalid Parameters");
			}

			// Serialize the object
			string serializedObject;
			try
			{
				serializedObject = JsonConvert.SerializeObject(value);
			}
			catch (Exception ex)
			{
				_logger.LogError("Serialization failed: {0}", ex.Message);
				return (-1, "Serialization failed");
			}

			try
			{
				// Set the field in the Redis hash
				bool status = await Database.HashSetAsync(name, key, serializedObject, flags: flags);
				if (!status)
				{
					_logger.LogError("Failed to set hash field or Hash field already existed with same value");
					return (CacheCodes.E_FAIL, "Failed to set hash field or Hash field already existed with same value");
				}

				// Optionally set expiry on the hash key (if not already set)
				if (expiry.HasValue)
				{
					await Database.KeyExpireAsync(name, expiry.Value, flags);
				}
			}
			catch (RedisCommandException ex)
			{
				Monitor.SendException(ex);
				_logger.LogError("Add Hash Record Failed: {0}", ex.Message);
				return (CacheCodes.REDIS_COMMAND_EXCEPTION, ex.Message);
			}
			catch (RedisTimeoutException ex)
			{
				Monitor.SendException(ex);
				_logger.LogError("Add Hash Record Failed: {0}", ex.Message);
				return (CacheCodes.REDIS_TIMEOUT_EXCEPTION, ex.Message);
			}
			catch (RedisConnectionException ex)
			{
				Monitor.SendException(ex);
				_logger.LogError("Add Hash Record Failed: {0}", ex.Message);
				return (CacheCodes.REDIS_CONNECTION_EXCEPTION, ex.Message);
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError("Add Hash Record Failed: {0}", ex.Message);
				return (-1, ex.Message);
			}

			_logger.LogDebug("<--AddHashRecordAsync");
			return (0, string.Empty);
		}

		public async Task<(T value, string errorMsg)> GetHashRecordAsync<T>(string name, string key, CommandFlags flags = CommandFlags.None)
		{
			_logger.LogDebug("-->GetHashRecordAsync");

			if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(key))
			{
				_logger.LogError("Invalid Input Parameter");
				return (default!, "Invalid Parameters"); // null-forgiving
			}

			try
			{
				RedisValue serialized = await Database.HashGetAsync(name, key, flags);

				if (!serialized.HasValue)
					return (default!, "Field not found"); // null-forgiving

				var json = serialized.ToString();
				if (string.IsNullOrWhiteSpace(json))
					return (default!, "Field is empty"); // null-forgiving

				var value = JsonConvert.DeserializeObject<T>(json);

				return (value!, string.Empty); // null-forgiving
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError("Get Hash Record Failed: {0}", ex.Message);
				return (default!, ex.Message); // null-forgiving
			}
		}
		public async Task<(Dictionary<string, T> data, string errorMsg)> GetAllHashRecordsAsync<T>(string name, CommandFlags flags = CommandFlags.None)
		{
			_logger.LogDebug("-->GetAllHashRecordsAsync");

			if (string.IsNullOrEmpty(name))
			{
				_logger.LogError("Invalid Input Parameter");
				return (new Dictionary<string, T>(), "Invalid Parameters"); // empty dictionary instead of null
			}

			try
			{
				var entries = await Database.HashGetAllAsync(name, flags);
				if (entries == null || entries.Length == 0)
				{
					return (new Dictionary<string, T>(), string.Empty);
				}

				Dictionary<string, T> result = new Dictionary<string, T>();
				foreach (var entry in entries)
				{
					var key = entry.Name.ToString();
					if (string.IsNullOrEmpty(key))
					{
						_logger.LogWarning("Skipped empty key in hash '{HashName}'", name);
						continue;
					}

					var json = entry.Value.ToString();
					if (string.IsNullOrWhiteSpace(json))
					{
						_logger.LogWarning("Skipped empty value for key '{Key}' in hash '{HashName}'", key, name);
						continue;
					}

					var value = JsonConvert.DeserializeObject<T>(json);
					if (value != null)
					{
						result[key] = value;
					}
				}

				return (result, string.Empty);
			}
			catch (RedisCommandException ex)
			{
				Monitor.SendException(ex);
				_logger.LogError("Add Hash Record Failed: {0}", ex.Message);
				return (new Dictionary<string, T>(), ex.Message); // empty dictionary
			}
			catch (RedisTimeoutException ex)
			{
				Monitor.SendException(ex);
				_logger.LogError("Add Hash Record Failed: {0}", ex.Message);
				return (new Dictionary<string, T>(), ex.Message);
			}
			catch (RedisConnectionException ex)
			{
				Monitor.SendException(ex);
				_logger.LogError("Add Hash Record Failed: {0}", ex.Message);
				return (new Dictionary<string, T>(), ex.Message);
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError("Get All Hash Records Failed: {0}", ex.Message);
				return (new Dictionary<string, T>(), ex.Message);
			}
		}
		public async Task<(bool deleted, string errorMsg)> DeleteHashFieldAsync(string name, string key, CommandFlags flags = CommandFlags.None)
		{
			_logger.LogDebug("-->DeleteHashFieldAsync");

			if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(key))
			{
				_logger.LogError("Invalid Input Parameter");
				return (false, "Invalid Parameters");
			}

			try
			{
				bool deleted = await Database.HashDeleteAsync(name, key, flags);
				return (deleted, string.Empty);
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError("Delete Hash Field Failed: {0}", ex.Message);
				return (false, ex.Message);
			}
		}

		public async Task<(bool exists, string errorMsg)> HashFieldExistsAsync(string name, string key, CommandFlags flags = CommandFlags.None)
		{
			_logger.LogDebug("-->HashFieldExistsAsync");

			if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(key))
			{
				_logger.LogError("Invalid Input Parameter");
				return (false, "Invalid Parameters");
			}

			try
			{
				bool exists = await Database.HashExistsAsync(name, key, flags);
				return (exists, string.Empty);
			}
			catch (Exception ex)
			{
				Monitor.SendException(ex);
				_logger.LogError("Check Hash Field Exists Failed: {0}", ex.Message);
				return (false, ex.Message);
			}
		}

	}
}

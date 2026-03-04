using System;

namespace SigningPortal.Core
{
	[AttributeUsage(AttributeTargets.Class, Inherited = false)]
	public class BsonCollectionAttribute : Attribute
	{
		public string CollectionName { get; }

		public BsonCollectionAttribute(string collectionName)
		{
			CollectionName = collectionName;
		}
	}
}

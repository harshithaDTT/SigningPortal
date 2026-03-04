using SigningPortal.Core.DTOs;

namespace SigningPortal.Core.Utilities
{
	public interface IGlobalDriveStorageConfiguration
	{
		StorageSecretsDTO GoogleStorageSecret { get; }
		StorageSecretsDTO OneDriveStorageSecret { get; }
	}
}
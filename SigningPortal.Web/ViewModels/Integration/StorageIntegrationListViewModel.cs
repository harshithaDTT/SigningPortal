using SigningPortal.Core.DTOs;

namespace SigningPortal.Web.ViewModels.Integration
{
    public class StorageIntegrationListViewModel
    {
        public StorageIntegrationListViewModel()
        {
            OneDriveStorage = new StorageListDTO(); // Assuming StorageDTO is the type of OneDriveStorage
            GoogleDriveStorage = new StorageListDTO(); // Assuming StorageDTO is the type of GoogleDriveStorage
        }

        public IList<StorageListDTO> StrorageList { get; set; } = new List<StorageListDTO>();

        public StorageListDTO GoogleDriveStorage { get; set; }
        public StorageListDTO OneDriveStorage { get; set; }
        public bool GoogleDrive { get; set; } = false;
        public bool OneDrive { get; set; } = false;
    }
}

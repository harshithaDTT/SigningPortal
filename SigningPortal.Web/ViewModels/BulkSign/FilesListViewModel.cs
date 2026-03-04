namespace SigningPortal.Web.ViewModels.BulkSign
{
    public class FilesListViewModel
    {
        public IList<string> FileNamesList { get; set; } = new List<string>();

        public string sourcePath { get; set; }
    }
}

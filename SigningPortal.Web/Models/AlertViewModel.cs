namespace SigningPortal.Web.Models
{
    public class AlertViewModel
    {
        public string Message { get; set; }
        public string Type { get; set; }

        public bool IsSuccess { get; set; } = false;
    }
}

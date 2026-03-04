namespace SigningPortal.Core.DTOs
{
    public class DocumentStatusCountDTO
    {
        public int Total { get; set; } = 0;
        public int InProgress { get; set; } = 0;
        public int Completed { get; set; } = 0;
        public int Expired { get; set; } = 0;
        public int Declined { get; set; } = 0;
        public int Recalled { get; set; } = 0;

    }
}
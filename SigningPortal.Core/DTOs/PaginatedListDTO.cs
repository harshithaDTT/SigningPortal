namespace SigningPortal.Core.DTOs
{
    public class PaginatedListDTO
    {
        public DocumentListFilterDTO DocumentListFilter { get; set; } = null;

        public FilterDocumentDTO FilterDocument { get; set; } = null;

        public int PageNumber { get; set; }

        public int PageSize { get; set; }

        public bool Pagination { get; set; } = true;
    }
}

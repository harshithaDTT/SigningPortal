using Microsoft.AspNetCore.Http;

namespace SigningPortal.Core.DTOs
{
    public class CommentrequestDTO
    {
        public IFormFile File { get; set; }
        public string Comments { get; set; }
      
    }
}

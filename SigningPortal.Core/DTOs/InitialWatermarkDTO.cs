using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SigningPortal.Core.DTOs
{
    public class InitialWatermarkDTO
    {
        [FromForm(Name = "pdf")]
        public IFormFile Pdf { get; set; }

        [FromForm(Name = "params")]
        public string Params { get; set; }

        [FromForm(Name = "text")]
        public string Text { get; set; }

        [FromForm(Name = "font_size")]

        public string Font_size { get; set; }
    }
}

namespace SigningPortal.Web.ViewModels.Templates
{
    public class PreviewTemplateViewModel
    {      
            public string templateName { get; set; }

            public string documentName { get; set; }

            public string annotations { get; set; }

            public string esealAnnotations { get; set; }

            public string qrCodeAnnotations { get; set; }

            public bool qrCodeRequired { get; set; }

            public string settingConfig { get; set; }

          //  public IList<Roles> roleList { get; set; }

            public IList<string> emailList { get; set; }

            public int signatureTemplate { get; set; }

            public int esealSignatureTemplate { get; set; }
            public int rotation { get; set; }

            public string status { get; set; }

            public string edmsId { get; set; }

            public string _id { get; set; }

            public string createdBy { get; set; }

            public string updatedBy { get; set; }

        public string htmlSchema { get; set; }

    }
}

using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core;
using SigningPortal.Core.DTOs;
using System;
using System.Collections.Generic;
using SigningPortal.Core.Domain.Services.Communication.TemplateDocuments;

namespace SigningPortal.Web.ViewModels.FormRequests
{
    public class AllFormRequestsListViewModel
    {
        public IList<TemplateDocument> myRequests { get; set; }
        public IList<SentTemplateDocumentListResponse> sentRequests { get; set; }
        public IList<TemplateDocument> receiveRequests { get; set; }

		public IList<TemplateDocument> bulksignSentFormListRequests { get; set; }

	}

    public class Sentformspresent
    {
        public bool isformspresent {get; set;}
    }

}


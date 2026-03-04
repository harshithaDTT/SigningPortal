using DinkToPdf;
using DinkToPdf.Contracts;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SigningPortal.Core.Constants;
using SigningPortal.Core.Domain.Model;
using SigningPortal.Core.Domain.Repositories;
using SigningPortal.Core.Domain.Services;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace SigningPortal.Core.Utilities
{
    public class DocumentHelper : IDocumentHelper
    {
        private readonly ILogger<DocumentHelper> _logger;
        private readonly IConfiguration _configuration;
        private readonly IRecepientsRepository _recepientsRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IDelegationRepository _delegationRepository;
        private readonly IDigitalFormResponseRepository _digitalFormResponseRepository;
        private readonly IDigitalFormTemplateRepository _digitalFormTemplateRepository;
        private readonly IDocumentRepository _documentRepository;
        private IHubContext<NotificationHub> _notificationHub;
        private IWebHostEnvironment _environment;
        private readonly IConverter _converter;
        private readonly ICacheClient _cacheClient;
        private readonly HttpClient _client;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConstantError _constantError;
        private readonly ILogClient _logClient;
        private readonly IEDMSService _edmsService;
        private readonly ITemplateDocumentRepository _templateDocumentRepository;
        private readonly ITemplateRecepientRepository _templateRecepientRepository;
        private readonly IBackgroundService _backgroundService;
        private readonly IGenericEmailService _genericEmailService;
        private readonly IMinioService _minioService;
        private readonly IStorageService _storageService;

        public DocumentHelper(ILogger<DocumentHelper> logger,
            IConfiguration configuration,
            IConverter converter,
            IHttpClientFactory httpClientFactory,
            ICacheClient cacheClient,
            IRecepientsRepository recepientsRepository,
            IHubContext<NotificationHub> notificationHub,
            IDigitalFormTemplateRepository digitalFormTemplateRepository,
            IDigitalFormResponseRepository digitalFormResponseRepository,
            INotificationRepository notificationRepository,
            IDelegationRepository delegationRepository,
            IWebHostEnvironment environment,
            IDocumentRepository documentRepository,
            IConstantError constantError,
            ILogClient logClient,
            IEDMSService edmsService,
            ITemplateDocumentRepository templateDocumentRepository,
            ITemplateRecepientRepository templateRecepientRepository,
            IBackgroundService backgroundService,
            IGenericEmailService genericEmailService,
            IStorageService storageService,
            IMinioService minioService)

        {
            _recepientsRepository = recepientsRepository;
            _notificationRepository = notificationRepository;
            _delegationRepository = delegationRepository;
            _documentRepository = documentRepository;
            _digitalFormResponseRepository = digitalFormResponseRepository;
            _digitalFormTemplateRepository = digitalFormTemplateRepository;
            _configuration = configuration;
            _logger = logger;
            _converter = converter;
            _environment = environment;
            _notificationHub = notificationHub;
            _cacheClient = cacheClient;
            _constantError = constantError;
            _httpClientFactory = httpClientFactory;
            _logClient = logClient;
            _edmsService = edmsService;
            _templateDocumentRepository = templateDocumentRepository;
            _templateRecepientRepository = templateRecepientRepository;
            _backgroundService = backgroundService;

            _client = _httpClientFactory.CreateClient("ignoreSSL");
            _client.Timeout = TimeSpan.FromMinutes(10);
            _genericEmailService = genericEmailService;
            _minioService = minioService;
            _storageService = storageService;
        }

        private string GetVersionedLogoUrl()
        {
            var rootPath = string.IsNullOrWhiteSpace(_environment.WebRootPath)
                ? _environment.ContentRootPath
                : _environment.WebRootPath;
            var logoPath = Path.Combine(rootPath, "Resource", "uploads", "justsignlogo.png");

            var version = DateTime.UtcNow.Ticks;
            if (File.Exists(logoPath))
            {
                version = File.GetLastWriteTimeUtc(logoPath).Ticks;
            }

            var portalUrl = _configuration.GetValue<string>("Config:Signing_portal:PORTAL_URL")?.TrimEnd('/');
            return $"{portalUrl}/Resource/uploads/justsignlogo.png?v={version}";
        }

        public async Task SendNotification(string suid_orgid, string msg)
        {
            try
            {
                //var connectionId = await _cacheClient.Get<string>
                // ("SingingPortalNotificationSockrtIDs", email);
                //if (string.IsNullOrEmpty(connectionId))
                //{
                //	_logger.LogError($"SendNotification :- Connection id of user ({email}) not found");

                //}
                //else
                //{
                await _notificationHub.Clients.User(suid_orgid).SendAsync("NewNotification", msg);
                _logger.LogInformation($"SendNotification success for user ({suid_orgid})");

                //}
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError($"SendNotification exception:- {0}", ex.Message);
            }
        }

        public byte[] GetCertificateHtml(Document docdata)
        {

            List<Recepients> receps = docdata.Recepients.ToList();
            receps.Sort((a, b) => a.Order < b.Order ? -1 : a.Order > b.Order ? 1 : 0);

            // var subPath = $"Resource{pathSeperator}uploads{pathSeperator}ugpasslogo.jpg";
            var subPath = "Resource/uploads/justsignlogo.png";

            string ImagePath = Path.Combine(_environment.ContentRootPath, subPath);
            byte[] imageArray = System.IO.File.ReadAllBytes(ImagePath);
            string base64ImageRepresentation = Convert.ToBase64String(imageArray);


            var html = "<!DOCTYPE html> <html> <head> <title>Certificate of Completion</title> </head> " +
                              "<body > " +
                                    "<div style='width:100%;font-family: Arial, Helvetica, sans-serif;line-height: 1.5;'> " +
                                         "<h2 style='text-align: center;font-size:24px;'>" +
                                               " <img style='width:320px;margin-right: 25px;' src='data:image/png;base64," + base64ImageRepresentation + "'/>" +
                                                 "Certificate of Completion" +
                                         "</h2>" +
                                         " <h3 style='background:#acc43d; color:#ffffff;padding:7px;font-size:20px;'>Summary</h3>" +
                                         " <table width='100%' style='font-size:18px;'> " +
                                                 "<tr> <td width='20%'>Document ID</td> <td width='80%'>" + docdata._id + "</ td> </tr> " +
                                                 "<tr> <td>Document Name</td> <td>" + docdata.DocumentName + "</td> </tr>" +
                                                 " <tr> <td>Sent By</td> <td>" + docdata.OwnerName + "</td> </tr>";


            if (!string.IsNullOrEmpty(docdata.OrganizationName))
            {
                html += "<tr><td> Organization </td> <td>" + docdata.OrganizationName + "</td></tr> ";
            }


            html += "<tr> <td>Sent On</td> <td>" + docdata.CreatedAt.ToString("ddd MMM dd yyyy HH:mm:ss") + " GMT+0530 (India Standard Time)</td> </tr>" +
                     "<tr> <td>Completed On</td> <td>" + docdata.CompleteTime.ToString("ddd MMM dd yyyy HH:mm:ss") + " GMT+0530 (India Standard Time)</td> </tr>" +
                      " </table> " +
                           "<h3 style='background:#acc43d; color:#ffffff;padding:7px;font-size:20px;'>Recepients</h3> " +
                            "<table width='100%' style='font-size:18px;'> " +
                                 "<tr> <td>Signers: " + receps.Count + "</td> <td>Sign Order: Sequential</td> </tr>" +
                             " </table> " +
                            "<br/>";


            var i = 1;
            foreach (Recepients recep in receps)
            {
                html += "<h5 style='font-size:18px;'>" + i + ") " + recep.Email + "</h5> " +
                "<table style='font-size:18px;'>" +
                "<tr> <td>Email On</td> <td>" + recep.SigningReqTime.ToString("ddd MMM dd yyyy HH:mm:ss") + " GMT+0530 (India Standard Time)" + "</td> </tr> " +
                "<tr> <td>Signed On</td> <td>" + recep.SigningCompleteTime.ToString("ddd MMM dd yyyy HH:mm:ss") + " GMT+0530 (India Standard Time)" + "</td> </tr> " +
                "</table>`";
                i++;
            }


            html += "</div>" +
                "</body>" +
            "</html> ";

            var fileRand = Guid.NewGuid().ToString("N");
            // var optput = Path.Combine(_environment.ContentRootPath, @"resources\" + fileRand + ".pdf");

            var globalSettings = new GlobalSettings
            {
                ColorMode = ColorMode.Color,
                Orientation = Orientation.Portrait,
                PaperSize = PaperKind.A4,
                Margins = new MarginSettings { Top = 5, Bottom = 18, Left = 10, Right = 10 },

                // Out = optput
            };

            var objectSettings = new ObjectSettings
            {
                PagesCount = true,
                HtmlContent = html,
                WebSettings = { DefaultEncoding = "utf-8", Background = true },
                //HeaderSettings = { FontSize = 10, Right = "Page [page] of [toPage]", Line = true },
                //FooterSettings = { FontSize = 8, Center = "PDF demo from JeminPro", Line = true },
            };

            var htmlToPdfDocument = new HtmlToPdfDocument()
            {
                GlobalSettings = globalSettings,
                Objects = { objectSettings },
            };
            var ByteArry = _converter.Convert(htmlToPdfDocument);
            return ByteArry;
        }

        private string GenerateEmailForFormCreator(string formName, string documentlink)
        {
            var logoUrl = GetVersionedLogoUrl();

            return string.Format("<html> <head></head>" + "" +
                "<body style='font-family: Lato,Helvetica,Arial,sans-serif;'> " +
                "<table border='0' width='480px' cellpadding='5' cellspacing='5' align='center'>" +
                "<center>" +
                    "<tr> <td style='text-align: center'><img style='width: 200px' src='{0}'></td> </tr>" +
                    "<tr> <td style='background: #acc43d;'>" +
                         "<h1 style='border: 1px solid #acc43d;border-radius: 2px;" +
                               "font-family: Lato,Helvetica,Arial,sans-serif;font-size: 20px;" +
                               "color: #ffffff;text-decoration: none;font-weight:bold;" +
                               "display: inline-block;'>" +
                             "  Document Signed" +
                          "</h1>" +
                         "</td> " +
                     "</tr> " +
                "</center> " +
                "</table> " +
                "<table border='0' width='480px' cellpadding='7' cellspacing='7' align='center'>" +
                     " <tr> <td>The form {1} has been signed successfully. Click below to check the status of the document. </td> </tr>" +
                "</table> " +
                "<table width='100%' cellspacing='0' cellpadding='0' align='center'>" +
                   " <tr> <td> " +
                        "<table cellspacing='0' cellpadding='0' align='center'> " +
                             "<tr> <td style='border-radius: 2px;' bgcolor='#acc43d'> " +
                                  "<a href='{2}' target='_blank' style='padding: 9px 29px; " +
                                       "border: 1px solid #acc43d;border-radius: 17px;font-family: " +
                                       "Lato,Helvetica,Arial,sans-serif;font-size: 16px; color: #ffffff;" +
                                       "text-decoration: none;font-weight:bold;display: inline-block;'> " +
                                       "View Document" +
                                  " </a>" +
                           " </td> </tr> " +
                      "</table>" +
                  " </td> </tr>" +
               "</table> " +
               "<table border='0' width='480px' cellpadding='5' cellspacing='5' align='center'>" +
               "<center> " +
                   " <tr> <td>" +
                       "<p style='font-size:10px;'>* This is an automated email from Signing Portal." +
                            "Please contact the sender for any queries regarding this email. " +
                        "</p>" +
                    "</td> </tr> " +
               "</center> " +
               "</table> </body> </html>", logoUrl, formName, documentlink);

        }

        private string GenerateEmailForSender(string username, string documentlink)
        {
            var logoUrl = GetVersionedLogoUrl();

            return string.Format("<html> <head></head>" + "" +
                "<body style='font-family: Lato,Helvetica,Arial,sans-serif;'> " +
                "<table border='0' width='480px' cellpadding='5' cellspacing='5' align='center'>" +
                "<center>" +
                    "<tr> <td style='text-align: center'><img style='width: 200px' src='{0}'></td> </tr>" +
                    "<tr> <td style='background: #acc43d;'>" +
                         "<h1 style='border: 1px solid #acc43d;border-radius: 2px;" +
                               "font-family: Lato,Helvetica,Arial,sans-serif;font-size: 20px;" +
                               "color: #ffffff;text-decoration: none;font-weight:bold;" +
                               "display: inline-block;'>" +
                             "  Document Signed" +
                          "</h1>" +
                         "</td> " +
                     "</tr> " +
                "</center> " +
                "</table> " +
                "<table border='0' width='480px' cellpadding='7' cellspacing='7' align='center'>" +
                     " <tr> <td>{1} has signed the document sent by you. Click below to check the status of the document. </td> </tr>" +
                "</table> " +
                "<table width='100%' cellspacing='0' cellpadding='0' align='center'>" +
                   " <tr> <td> " +
                        "<table cellspacing='0' cellpadding='0' align='center'> " +
                             "<tr> <td style='border-radius: 2px;' bgcolor='#acc43d'> " +
                                  "<a href='{2}' target='_blank' style='padding: 9px 29px; " +
                                       "border: 1px solid #acc43d;border-radius: 17px;font-family: " +
                                       "Lato,Helvetica,Arial,sans-serif;font-size: 16px; color: #ffffff;" +
                                       "text-decoration: none;font-weight:bold;display: inline-block;'> " +
                                       "View Document" +
                                  " </a>" +
                           " </td> </tr> " +
                      "</table>" +
                  " </td> </tr>" +
               "</table> " +
               "<table border='0' width='480px' cellpadding='5' cellspacing='5' align='center'>" +
               "<center> " +
                   " <tr> <td>" +
                       "<p style='font-size:10px;'>* This is an automated email from Signing Portal." +
                            "Please contact the sender for any queries regarding this email. " +
                        "</p>" +
                    "</td> </tr> " +
               "</center> " +
               "</table> </body> </html>", logoUrl, username, documentlink);

        }

        private string GenerateDocumentInfoEmailForAllRecepients(string content, string title, Document document, bool isSignComplete)
        {
            //var subPath = "Resource/uploads/ugpasslogo.jpg";

            //string ImagePath = Path.Combine(_environment.ContentRootPath, subPath);
            //byte[] imageArray = System.IO.File.ReadAllBytes(ImagePath);
            //string base64ImageRepresentation = Convert.ToBase64String(imageArray);

            var logoUrl = GetVersionedLogoUrl();

            var html = "<html> <head></head>" + "" +
                "<body style='font-family: Lato,Helvetica,Arial,sans-serif;'> " +
                "<table border='0' width='480px' cellpadding='5' cellspacing='5' align='center'>" +
                "<center>" +
                   "<tr> <td style='text-align: center'><img style='width: 200px' src='" + logoUrl + "'></td> </tr>" +
                    "<tr> <td style='background: #acc43d;'>" +
                         "<h1 style='border: 1px solid #acc43d;border-radius: 2px;" +
                               "font-family: Lato,Helvetica,Arial,sans-serif;font-size: 20px;" +
                               "color: #ffffff;text-decoration: none;font-weight:bold;" +
                               "display: inline-block;'>" +
                             title +
                          "</h1>" +
                         "</td> " +
                     "</tr> " +
                "</center> " +
                "</table> " +
                "<table border='0' width='480px' cellpadding='7' cellspacing='7' align='center'>" +
                     " <tr> <td>" + content + " </td> </tr>" +
                "</table> ";

            if (document.MultiSign)
            {
                html += "<table style = 'border: 1px solid;border-collapse: collapse;' width = '480px' cellpadding = '5' cellspacing = '5' align = 'center' >" +
                   //"<center>" +
                   "<thead>" +
                       "<tr>" +

                           "<th style = 'border: 1px solid;' > Signatories </ th >" +
                           "<th style = 'border: 1px solid;' > Status </ th >" +
                       "</tr>" +
                   "</thead>" +
                   "<tbody>";


                foreach (var recep in document.Recepients)
                {
                    html += "<tr>";
                    //if (!String.IsNullOrEmpty(recep.Name))
                    //{
                    //    html += "<td style = 'text-align: center; border: 1px solid;' > " + recep.Name + " </td>";
                    //}
                    //else
                    //{
                    html += "<td style = 'text-align: center; border: 1px solid;' > " + recep.Email + " </td>";
                    //}
                    if (isSignComplete)
                    {
                        html += "<td style = 'text-align: center; border: 1px solid;' > Signed </td>";
                    }
                    else if (recep.TakenAction && string.IsNullOrEmpty(recep.ReferredTo))
                    {
                        html += "<td style = 'text-align: center; border: 1px solid;' > Signed </td>";
                    }
                    else if (recep.TakenAction && !string.IsNullOrEmpty(recep.ReferredTo))
                    {
                        html += "<td style = 'text-align: center; border: 1px solid;' > Assigned Someone </td>";
                    }
                    else if (!recep.TakenAction && recep.Decline)
                    {
                        html += "<td style = 'text-align: center; border: 1px solid;' > Rejected </td>";
                    }
                    else if (!recep.TakenAction && !recep.Decline)
                    {
                        html += "<td style = 'text-align: center; border: 1px solid;' > Need to sign </td>";
                    }
                    html += "</tr>";
                }
                html += "</tbody>" +
                   //"</center>"+
                   "</table> ";
            }




            html +=
                "<table border='0' width='480px' cellpadding='5' cellspacing='5' align='center'>" +
               "<center> " +
                   " <tr> <td>" +
                       "<p style='font-size:10px;'>* This is an automated email from Signing Portal." +
                            "Please contact the sender for any queries regarding this email. " +
                        "</p>" +
                    "</td> </tr> " +
               "</center> " +
               "</table> </body> </html>";

            return html;

        }

        private string GenerateDocumentInfoEmailForAllFormRecepients(string content, string title, TemplateDocument document, bool isSignComplete)
        {
            //var subPath = "Resource/uploads/ugpasslogo.jpg";

            //string ImagePath = Path.Combine(_environment.ContentRootPath, subPath);
            //byte[] imageArray = System.IO.File.ReadAllBytes(ImagePath);
            //string base64ImageRepresentation = Convert.ToBase64String(imageArray);

            var logoUrl = GetVersionedLogoUrl();

            var html = "<html> <head></head>" + "" +
                "<body style='font-family: Lato,Helvetica,Arial,sans-serif;'> " +
                "<table border='0' width='480px' cellpadding='5' cellspacing='5' align='center'>" +
                "<center>" +
                   "<tr> <td style='text-align: center'><img style='width: 200px' src='" + logoUrl + "'></td> </tr>" +
                    "<tr> <td style='background: #acc43d;'>" +
                         "<h1 style='border: 1px solid #acc43d;border-radius: 2px;" +
                               "font-family: Lato,Helvetica,Arial,sans-serif;font-size: 20px;" +
                               "color: #ffffff;text-decoration: none;font-weight:bold;" +
                               "display: inline-block;'>" +
                             title +
                          "</h1>" +
                         "</td> " +
                     "</tr> " +
                "</center> " +
                "</table> " +
                "<table border='0' width='480px' cellpadding='7' cellspacing='7' align='center'>" +
                     " <tr> <td>" + content + " </td> </tr>" +
                "</table> ";

            if (document.MultiSign)
            {
                html += "<table style = 'border: 1px solid;border-collapse: collapse;' width = '480px' cellpadding = '5' cellspacing = '5' align = 'center' >" +
                   //"<center>" +
                   "<thead>" +
                       "<tr>" +

                           "<th style = 'border: 1px solid;' > Signatories </th>" +
                           "<th style = 'border: 1px solid;' > Status </th>" +
                       "</tr>" +
                   "</thead>" +
                   "<tbody>";


                foreach (var recep in document.TemplateRecepients)
                {
                    html += "<tr>";
                    //if (!String.IsNullOrEmpty(recep.Name))
                    //{
                    //    html += "<td style = 'text-align: center; border: 1px solid;' > " + recep.Name + " </td>";
                    //}
                    //else
                    //{
                    html += "<td style = 'text-align: center; border: 1px solid;' > " + recep.Signer.email + " </td>";
                    //}
                    if (isSignComplete)
                    {
                        html += "<td style = 'text-align: center; border: 1px solid;' > Signed </td>";
                    }
                    //else if (recep.TakenAction && string.IsNullOrEmpty(recep.ReferredTo))
                    //{
                    //	html += "<td style = 'text-align: center; border: 1px solid;' > Signed </td>";
                    //}
                    //else if (recep.TakenAction && !string.IsNullOrEmpty(recep.ReferredTo))
                    //{
                    //	html += "<td style = 'text-align: center; border: 1px solid;' > Assigned Someone </td>";
                    //}
                    else if (!recep.TakenAction && recep.Decline)
                    {
                        html += "<td style = 'text-align: center; border: 1px solid;' > Rejected </td>";
                    }
                    else if (!recep.TakenAction && !recep.Decline)
                    {
                        html += "<td style = 'text-align: center; border: 1px solid;' > Need to sign </td>";
                    }
                    html += "</tr>";
                }
                html += "</tbody>" +
                   //"</center>"+
                   "</table> ";
            }




            html +=
                "<table border='0' width='480px' cellpadding='5' cellspacing='5' align='center'>" +
               "<center> " +
                   " <tr> <td>" +
                       "<p style='font-size:10px;'>* This is an automated email from Signing Portal." +
                            "Please contact the sender for any queries regarding this email. " +
                        "</p>" +
                    "</td> </tr> " +
               "</center> " +
               "</table> </body> </html>";

            return html;

        }

        private string GenerateEmailForRecipient(string username, string documentlink,
            string expireDate, string noteToAll)
        {
            //var subPath = $"Resource{pathSeperator}uploads{pathSeperator}ugpasslogo.jpg";
            //var subPath = "Resource/uploads/ugpasslogo.jpg";

            //string ImagePath = Path.Combine(_environment.ContentRootPath, subPath);
            //byte[] imageArray = System.IO.File.ReadAllBytes(ImagePath);
            //string base64ImageRepresentation = Convert.ToBase64String(imageArray);

            var logoUrl = GetVersionedLogoUrl();

            return string.Format("<html>" +
                "<head></head>" +
                "<body style='font-family: Lato,Helvetica,Arial,sans-serif;'>" +
                "<table border='0' width='480px' cellpadding='5' cellspacing='5' align='center'>" +
                    "<center>" +
                           "<tr>" +
                                "<td style='text-align: center'><img style='width: 200px' src='{0}'></td>" +
                           "</tr>" +
                           "<tr>" +
                                "<td style='background: #acc43d;'>" +
                                     "<h1 style='border: 1px solid #acc43d;border-radius: 2px;font-family: Lato,Helvetica," +
                                             "Arial,sans-serif;font-size: 20px; color: #ffffff;text-decoration: none;" +
                                             "font-weight:bold;display: inline-block;'>" +
                                             "Request for Digital Signature" +
                                     "</h1>" +
                                "</td>" +
                           "</tr>" +
                      "</center>" +
                "</table>" +

                "<table  border='0' width='480px' cellpadding='7' cellspacing='7' align='center'>" +
                    // "<tr>" +
                    //	"<td><h4>Organization</h4></td>" +
                    //	"<td><h4>NITA</h4></td>" +
                    //"</tr>" +

                    "<tr>" +
                        "<td><h4>Sender</h4></td>" +
                        "<td><h4>{1}</h4></td>" +
                    "</tr>" +

                    "<tr>" +
                        "<td><h4>Expire Date</h4></td>" +
                        "<td><h4>{2}</h4></td>" +
                    "</tr>" +

                    "<tr>" +
                        "<td><h4>Message</h4></td>" +
                        "<td><h4>{3}</h4></td>" +
                    "</tr>" +
                "</table>" +

                "<table width='100%' cellspacing='0' cellpadding='0' align='center'>" +
                   "<tr>" +
                      "<td>" +
                          "<table cellspacing='0' cellpadding='0' align='center'>" +
                             "<tr>" +
                                  "<td style='border-radius: 2px;' bgcolor='#acc43d'>" +
                                      "<a href='{4}' target='_blank'" +
                                         "style='padding: 9px 29px;" +
                                         " border: 1px solid #acc43d;border-radius: 17px;" +
                                         "font-family: Lato,Helvetica,Arial,sans-serif;" +
                                         "font-size: 16px;color: #ffffff;text-decoration: none;" +
                                         "font-weight:bold;display: inline-block;'>" +
                                          "Go to Signing Portal" +
                                      "</a>" +
                                  "</td>" +
                             "</tr>" +
                          "</table>" +
                      "</td>" +
                  "</tr>" +
                "</table>" +

                "<table border='0' width='480px' cellpadding='5' cellspacing='5' align='center'>" +
                      "<center>" +
                           "<tr>" +
                                "<td>      " +
                                  "<p style='font-size:10px;'>* This is an automated email from Signing Portal. " +
                                  "Please contact the sender for any queries regarding this email" +
                                  "</p>" +
                                "</td>" +
                           "</tr>" +
                     "</center>" +
                "</table>" +
                "</body>" +
            "</html>", logoUrl, username, expireDate, noteToAll, documentlink);

        }

        private string GenerateEmailForFormRecipient(string username, string documentlink,
            string expireDate, string noteToAll)
        {
            //var subPath = $"Resource{pathSeperator}uploads{pathSeperator}ugpasslogo.jpg";
            //var subPath = "Resource/uploads/ugpasslogo.jpg";

            //string ImagePath = Path.Combine(_environment.ContentRootPath, subPath);
            //byte[] imageArray = System.IO.File.ReadAllBytes(ImagePath);
            //string base64ImageRepresentation = Convert.ToBase64String(imageArray);

            var logoUrl = GetVersionedLogoUrl();

            return string.Format("<html>" +
                "<head></head>" +
                "<body style='font-family: Lato,Helvetica,Arial,sans-serif;'>" +
                "<table border='0' width='480px' cellpadding='5' cellspacing='5' align='center'>" +
                    "<center>" +
                           "<tr>" +
                                "<td style='text-align: center'><img style='width: 200px' src='{0}'></td>" +
                           "</tr>" +
                           "<tr>" +
                                "<td style='background: #acc43d;'>" +
                                     "<h1 style='border: 1px solid #acc43d;border-radius: 2px;font-family: Lato,Helvetica," +
                                             "Arial,sans-serif;font-size: 20px; color: #ffffff;text-decoration: none;" +
                                             "font-weight:bold;display: inline-block;'>" +
                                             "Request for Form Signature" +
                                     "</h1>" +
                                "</td>" +
                           "</tr>" +
                      "</center>" +
                "</table>" +

                "<table  border='0' width='480px' cellpadding='7' cellspacing='7' align='center'>" +
                    // "<tr>" +
                    //	"<td><h4>Organization</h4></td>" +
                    //	"<td><h4>NITA</h4></td>" +
                    //"</tr>" +

                    "<tr>" +
                        "<td><h4>Sender</h4></td>" +
                        "<td><h4>{1}</h4></td>" +
                    "</tr>" +

                    "<tr>" +
                        "<td><h4>Expire Date</h4></td>" +
                        "<td><h4>{2}</h4></td>" +
                    "</tr>" +

                    "<tr>" +
                        "<td><h4>Message</h4></td>" +
                        "<td><h4>{3}</h4></td>" +
                    "</tr>" +
                "</table>" +

                "<table width='100%' cellspacing='0' cellpadding='0' align='center'>" +
                   "<tr>" +
                      "<td>" +
                          "<table cellspacing='0' cellpadding='0' align='center'>" +
                             "<tr>" +
                                  "<td style='border-radius: 2px;' bgcolor='#acc43d'>" +
                                      "<a href='{4}' target='_blank'" +
                                         "style='padding: 9px 29px;" +
                                         " border: 1px solid #acc43d;border-radius: 17px;" +
                                         "font-family: Lato,Helvetica,Arial,sans-serif;" +
                                         "font-size: 16px;color: #ffffff;text-decoration: none;" +
                                         "font-weight:bold;display: inline-block;'>" +
                                          "Go to Signing Portal" +
                                      "</a>" +
                                  "</td>" +
                             "</tr>" +
                          "</table>" +
                      "</td>" +
                  "</tr>" +
                "</table>" +

                "<table border='0' width='480px' cellpadding='5' cellspacing='5' align='center'>" +
                      "<center>" +
                           "<tr>" +
                                "<td>      " +
                                  "<p style='font-size:10px;'>* This is an automated email from Signing Portal. " +
                                  "Please contact the sender for any queries regarding this email" +
                                  "</p>" +
                                "</td>" +
                           "</tr>" +
                     "</center>" +
                "</table>" +
                "</body>" +
            "</html>", logoUrl, username, expireDate, noteToAll, documentlink);

        }

        //public async Task SendSignedFormDetailsNotifiaction(string corelationID, string msg)
        //{
        //	try
        //	{
        //		string fileName;

        //		if (string.IsNullOrEmpty(corelationID))
        //		{
        //			_logger.LogError(_constantError.GetMessage("102557"));
        //			return;
        //		}

        //		//return new ServiceResult("corelationID id value getting null or empty string");                                               

        //		var recpData = await _digitalFormResponseRepository.GetDigitalFormResponseByCorelationIdAsync(corelationID);

        //		var docData = await _digitalFormTemplateRepository.GetDigitalFormTemplateAsync(recpData.FormId);

        //		if (docData.DocumentName.Contains(".pdf"))
        //			fileName = docData.DocumentName;
        //		else fileName = docData.DocumentName + ".pdf";

        //		var Msg = string.Format("{0} \n File name : {1}", msg, fileName);

        //		var Notification = new Notification(recpData.SignerName, recpData.SignerEmail
        //				  , "/dashboard/document/" + recpData.FormId + "/status", Msg);
        //		var notificationSuid = recpData.SignerSuid;

        //		Notification.Sender = recpData.SignerSuid;

        //		var newNotification = await _notificationRepository.CreateAsync(Notification);

        //		_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotification(notificationSuid, JsonConvert.SerializeObject(newNotification)));

        //		bool pushNotification = _configuration.GetValue<bool>("PushNotification");
        //		if (recpData.AcToken != null && pushNotification)
        //		{
        //			_backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(recpData.AcToken, recpData.SignerSuid, Msg));
        //		}

        //		_logger.LogInformation("Notification send Successfully");
        //	}
        //	catch (Exception e)
        //	{
        //		Monitor.SendException(e);

        //		_logger.LogError("SendSignedFormDetailsNotifiaction Exception : " + e.Message);
        //		//return new ServiceResult(_constantError.GetMessage("102558"));
        //	}
        //}

        //public async Task NewSendSignedFormDetailsNotifiaction(string corelationID, string docName,
        //						string msg, string orgId = "")
        //{
        //	try
        //	{
        //		string fileName;

        //		if (string.IsNullOrEmpty(corelationID))
        //		{
        //			_logger.LogError(_constantError.GetMessage("102557"));
        //			return;
        //		}

        //		var recpData = await _digitalFormResponseRepository.GetDigitalFormResponseByCorelationIdAsync(corelationID);

        //		var docData = await _digitalFormTemplateRepository.GetDigitalFormTemplateAsync(recpData.FormId);

        //		if (docName.Contains(".pdf"))
        //			fileName = docName;
        //		else fileName = docName + ".pdf";

        //		var Msg = string.Format("{0} \n File name : {1}", msg, fileName);

        //		var Notification = new Notification(recpData.SignerName, recpData.SignerSuid
        //				  , "/dashboard/document/" + recpData.FormId + "/status", Msg, orgId);
        //		var notificationSuid = recpData.SignerSuid;

        //		Notification.Sender = recpData.SignerSuid;

        //		var newNotification = await _notificationRepository.CreateAsync(Notification);

        //		_backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotification(notificationSuid, JsonConvert.SerializeObject(newNotification)));

        //		bool pushNotification = _configuration.GetValue<bool>("PushNotification");
        //		if (recpData.AcToken != null && pushNotification)
        //		{
        //			_backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(recpData.AcToken, recpData.SignerSuid, Msg));
        //		}

        //		_logger.LogInformation("Notification send Successfully");
        //	}
        //	catch (Exception e)
        //	{
        //		Monitor.SendException(e);
        //		_logger.LogError("SendSignedFormDetailsNotifiaction Exception : " + e.Message);
        //		//return new ServiceResult(_constantError.GetMessage("102558"));
        //	}
        //}

        public async Task SendAnEmailToFormCreator(SendEmailObj data, byte[] attachment = null)
        {
            try
            {
                if (string.IsNullOrEmpty(data.Id))
                {
                    _logger.LogError(_constantError.GetMessage("102555"));
                    return;
                }

                var document = await _digitalFormTemplateRepository.GetDigitalFormTemplateAsync(data.Id);

                var docLink = string.Format("{0}/dashboard/document/{1}/status",
                    _configuration.GetValue<string>("Config:Signing_portal:PORTAL_URL"),
                    document._id);

                var mailBody = GenerateEmailForFormCreator(document.TemplateName, docLink);


                var emailList = new List<string>() { document.Email };

                if (document.SubmissionEmails.Count > 0)
                {
                    emailList.AddRange(document.SubmissionEmails);
                }

                var message = new Message(emailList,
                                 "Form Signed",
                                  mailBody
                                );

                if (attachment != null)
                {
                    message.IsAttachmentPresent = true;
                    message.Attachment = attachment;
                }

                try
                {
                    if (attachment != null)
                        await _genericEmailService.SendGenericEmailWithAttachment(message, "Form_Response.pdf");
                    else
                        await _genericEmailService.SendGenericEmail(message);
                    _logger.LogInformation("Mail send Successfully");
                }
                catch (Exception e)
                {
                    Monitor.SendException(e);
                    _logger.LogError("SendEmail fail to user email : " + document.Email + ", Exception : " + e.Message);
                    //return new ServiceResult(_constantError.GetMessage("102556"));
                }
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("SendAnEmailToFormCreator Exception : " + e.Message);
                //return new ServiceResult(_constantError.GetMessage("102556"));
            }
        }

        public async Task SendAnEmailToFormSigner(SendEmailObj data, DigitalFormTemplate doc = null, byte[] attachment = null)
        {
            try
            {
                if (string.IsNullOrEmpty(data.Id))
                {
                    _logger.LogError(_constantError.GetMessage("102555"));
                    return;
                }

                var document = await _digitalFormTemplateRepository.GetDigitalFormTemplateAsync(data.Id);
                if (document == null)
                {
                    if (doc == null)
                    {
                        _logger.LogError(_constantError.GetMessage("102556"));
                        return;
                    }
                    document = doc;
                }

                var response = await _digitalFormResponseRepository.GetDigitalFormResponseByFormIdAsync(data.Id);
                if (response == null)
                {
                    _logger.LogError(_constantError.GetMessage("102556"));
                    return;
                }

                //var docLink = string.Format("{0}/dashboard/document/viewer2/{1}?Suid={2}",
                var docLink = _configuration.GetValue<string>("Config:Signing_portal:PORTAL_URL")
              ?? throw new InvalidOperationException("PORTAL_URL configuration is missing.");
                var HtmlBody = GenerateEmailForRecipient(document.CreatedBy, docLink,
                                document.CreatedAt.AddDays(int.Parse(document.DaysToComplete)).ToShortDateString(),
                                "Form Signed Successfully");

                var message = new Message([response.SignerEmail],
                         "Form Signed",
                          HtmlBody
                        );

                if (attachment != null)
                {
                    message.IsAttachmentPresent = true;
                    message.Attachment = attachment;
                }

                try
                {
                    if (attachment != null)
                        await _genericEmailService.SendGenericEmailWithAttachment(message, "Form_Response.pdf");
                    else
                        await _genericEmailService.SendGenericEmail(message);
                }
                catch (Exception e)
                {
                    Monitor.SendException(e);
                    _logger.LogError("SendEmail fail to user email : " + response.SignerEmail + ", Exception : " + e.Message);
                }

                _logger.LogInformation("Mail send Successfully");
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("SendAnEmailToFormSigner Exception : " + e.Message);
                //return new ServiceResult(_constantError.GetMessage("102556"));
            }
        }

        public async Task SendAnEmailToSender(SendEmailObj data)
        {
            try
            {
                if (string.IsNullOrEmpty(data.Id))
                {
                    _logger.LogError("Document Id is null or empty");
                    return;
                }

                //return new ServiceResult("Document id value getting null or empty string");

                var document = await GetDocumentById(data.Id);

                var docLink = string.Format("{0}/Documents/DocumentDetailsById/{1}",
                    _configuration.GetValue<string>("Config:Signing_portal:PORTAL_URL"),
                    document._id);

                var mailBody = GenerateEmailForSender(data.UserName, docLink);

                var message = new Message(new string[] { document.OwnerEmail },
                                 "Document Signed",
                                  mailBody
                                );

                try
                {
                    await _genericEmailService.SendGenericEmail(message);
                    _logger.LogInformation("Mail send Successfully");
                }
                catch (Exception e)
                {
                    Monitor.SendException(e);
                    _logger.LogError("SendEmail fail to user email : " + document.OwnerEmail + ", Exception : " + e.Message);
                    //return new ServiceResult("Mail sending Fail");
                }
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("SendAnEmailToSender Exception : " + e.Message);
            }
        }

        public async Task SendAnEmailToFormSender(SendEmailObj data)
        {
            try
            {
                if (string.IsNullOrEmpty(data.Id))
                {
                    _logger.LogError(_constantError.GetMessage("102555"));
                    return;
                }
                var document = await _templateDocumentRepository.GetTemplateDocumentByTempIdAsync(data.Id);

                //var docLink = string.Format("{0}/Documents/DocumentDetailsById/{1}",
                //	_configuration.GetValue<string>("Config:Signing_portal:PORTAL_URL"),
                //	document._id);

                var docLink = _configuration.GetValue<string>("Config:Signing_portal:PORTAL_URL")
               ?? throw new InvalidOperationException("PORTAL_URL configuration is missing.");
                var mailBody = GenerateEmailForSender(data.UserName, docLink);

                var message = new Message(new string[] { document.Owner.email },
                                 "Document Signed",
                                  mailBody
                                );

                try
                {
                    await _genericEmailService.SendGenericEmail(message);
                    _logger.LogInformation("Mail send Successfully");
                }
                catch (Exception e)
                {
                    Monitor.SendException(e);
                    _logger.LogError("SendEmail fail to user email : " + document.Owner.email + ", Exception : " + e.Message);
                    //return new ServiceResult("Mail sending Fail");
                }
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("SendAnEmailToSender Exception : " + e.Message);
                //return new ServiceResult("Mail sending Fail");
            }
        }

        public async Task SendAnEmailToRecipient(SendEmailObj data, string actoken = null, Document doc = null)
        {
            try
            {
                if (string.IsNullOrEmpty(data?.Id))
                    return;
                //return new ServiceResult("Document id value getting null or empty string");

                bool pushNotification = _configuration.GetValue<bool>("PushNotification");

                var document = await GetDocumentById(data.Id);
                if (document == null)
                {
                    if (doc == null)
                    {
                        return;
                    }
                    document = doc;
                }

                var docLink = _configuration.GetValue<string>("Config:Signing_portal:PORTAL_URL")
               ?? throw new InvalidOperationException("PORTAL_URL configuration is missing.");
                var currentRecipient = await _recepientsRepository.GetCurrentRecepientsList(data.Id);
                if (currentRecipient == null || currentRecipient.Count == 0)
                {
                    _logger.LogError($"Not found recipients for: {data.Id}");
                    return;
                }

                var HtmlBody = GenerateEmailForRecipient(
                    document.OwnerName ?? string.Empty,
                    docLink,
                    document.ExpireDate.ToString(),
                    string.Empty
                );

                foreach (var recipient in currentRecipient)
                {
                    //check for self signing owner notification
                    if (document.MultiSign && document.OwnerID != recipient.Suid)
                    //if (!((document.Recepients?.Count ?? 0) == 1 && document.OwnerID == recipient.Suid) || singleSign)
                    /*if (!string.Equals(data.UserEmail, recipient?.Email, StringComparison.OrdinalIgnoreCase))*/
                    {
                        var emailList = new List<string> { recipient.Email };

                        if (recipient.AlternateSignatories?.Count > 0)
                        {
                            emailList.AddRange(recipient.AlternateSignatories.Select(x => x.email));
                        }

                        var message = new Message(
                            emailList.ToArray(),
                            "Document For Signing",
                            HtmlBody
                        );

                        try
                        {
                            await _genericEmailService.SendGenericEmail(message);
                        }
                        catch (Exception e)
                        {
                            Monitor.SendException(e);
                            _logger.LogError($"SendEmail failed to user email: {recipient.Email}, Exception: {e.Message}");
                        }

                        string notificationMeessage;

                        if ((document.Recepients?.Count ?? 0) == currentRecipient.Count)
                        {
                            notificationMeessage = $"{data.UserName} sent the document {document.DocumentName} to you for signing in the " +
                                (string.IsNullOrEmpty(recipient.OrganizationId) ? "self account" : $"{recipient.OrganizationName} account");
                        }
                        else
                        {
                            var previousSigner = document.Recepients?.FirstOrDefault(x => x.Order == recipient.Order - 1);
                            if (previousSigner != null)
                            {
                                notificationMeessage = $"{previousSigner.Name} has signed the document {document.DocumentName}";
                            }
                            else
                            {
                                notificationMeessage = $"Document {document.DocumentName} has been sent to you for signing.";
                            }
                        }

                        var notification = await _notificationRepository.CreateAsync(new Notification(
                            data.UserEmail,
                            recipient.Suid,
                            docLink,
                            notificationMeessage,
                            recipient.OrganizationId,
                            new(NotificationTypeConstants.Document, document._id)
                        ));

                        string org = string.IsNullOrEmpty(recipient.OrganizationId) ? AccountTypeConstants.Self : recipient.OrganizationId;

                        if (recipient.AlternateSignatories?.Count > 0)
                        {
                            var alternatSignatoryNotificationMeessage = $"{data.UserName} referred you a document {document.DocumentName} to sign to " +
                                (string.IsNullOrEmpty(recipient.OrganizationId) ? "self account" : $"{recipient.OrganizationName} account");

                            foreach (var signatory in recipient.AlternateSignatories)
                            {
                                var newNotification = await _notificationRepository.CreateAsync(new Notification(
                                    data.UserEmail,
                                    signatory.suid,
                                    docLink,
                                    alternatSignatoryNotificationMeessage,
                                    recipient.OrganizationId,
                                    new(NotificationTypeConstants.Document, document._id)
                                ));

                                _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotification($"{signatory.suid}_{org}", JsonConvert.SerializeObject(newNotification)));

                                if (!string.IsNullOrEmpty(actoken) && pushNotification)
                                {
                                    _backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(actoken, signatory.suid, alternatSignatoryNotificationMeessage));
                                }
                            }
                        }

                        _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotification($"{recipient.Suid}_{org}", JsonConvert.SerializeObject(notification)));

                        if (!string.IsNullOrEmpty(actoken) && pushNotification)
                        {
                            _backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(actoken, recipient.Suid, notificationMeessage));
                        }
                        //else
                        //{
                        //	//uncomment for certificate generation time
                        //	//recipient.SigningReqTime = DateTime.UtcNow;
                        //	//await _recepientsRepository.UpdateRecepientsById(recipient);
                        //}
                    }
                }

            }
            catch (Exception e)
            {
                _logger.LogError("SendAnEmailToRecipient Exception: " + e.Message);
                Monitor.SendException(e);
            }
        }

        public async Task SendAnEmailToFormRecipient(SendEmailObj data, string actoken = null, TemplateDocument doc = null)
        {
            try
            {
                if (string.IsNullOrEmpty(data.Id))
                {
                    _logger.LogError(_constantError.GetMessage("102555"));
                    return;
                }

                bool pushNotification = _configuration.GetValue<bool>("PushNotification");

                var templateDocument = await _templateDocumentRepository.GetTemplateDocumentById(data.Id);
                if (templateDocument == null)
                {
                    if (doc == null)
                    {
                        _logger.LogError(_constantError.GetMessage("102556"));
                        return;
                    }
                    templateDocument = doc;
                }

                //var docLink = string.Format("{0}/dashboard/templateDocument/viewer2/{1}?Suid={2}",
                var docLink = _configuration.GetValue<string>("Config:Signing_portal:PORTAL_URL")
               ?? throw new InvalidOperationException("PORTAL_URL configuration is missing.");
                var currentRecipient = await _templateRecepientRepository.GetCurrentTemplateRecepientList(data.Id);
                if (currentRecipient.Count == 0)
                {
                    _logger.LogError("Not found recipients for :" + data.Id);
                    return;
                }

                var HtmlBody = GenerateEmailForFormRecipient(data.UserName, docLink,
                                templateDocument.ExpieryDate.ToString(),
                                string.Empty);

                foreach (var recipient in currentRecipient)
                {
                    if (data.UserEmail.ToLower() != recipient.Signer.email.ToLower())
                    {
                        var emailList = new string[] { recipient.Signer.email };

                        //if (recipient.AlternateSignatories.Count != 0)
                        //{
                        //	var alternateEmailList = new List<string>();
                        //	foreach (var signatory in recipient.AlternateSignatories)
                        //	{
                        //		alternateEmailList.Add(signatory.email);
                        //	}
                        //	emailList = emailList.Concat(alternateEmailList).ToArray<string>();
                        //}

                        var message = new Message(emailList,
                                 "Form For Signing",
                                  HtmlBody
                                );
                        try
                        {
                            await _genericEmailService.SendGenericEmail(message);
                        }
                        catch (Exception e)
                        {
                            Monitor.SendException(e);
                            _logger.LogError("SendEmail fail to user email : " + recipient.Signer.email + ", Exception : " + e.Message);
                        }

                        //uncomment for certificate generation time
                        //recipient.SigningReqTime = DateTime.UtcNow;
                        //await _recepientsRepository.UpdateRecepientsById(recipient);

                        string notificationMeessage = string.Empty;

                        if (currentRecipient.Count == templateDocument.TemplateRecepients.Count)
                        {
                            notificationMeessage = data.UserName + " sent the form " + templateDocument.DocumentName + " to you for signing in the "
                                        + (string.IsNullOrEmpty(recipient.OrganizationId) ? "self account" : recipient.OrganizationName + " account");
                        }
                        else
                        {
                            var previousSigner = templateDocument.TemplateRecepients.FirstOrDefault(x => x.Order == recipient.Order - 1);

                            notificationMeessage = $"{previousSigner.SignerName} has signed the form {templateDocument.DocumentName}";
                        }

                        //notification changes
                        var notification = await _notificationRepository.CreateAsync(
                            new Notification(
                                data.UserEmail,
                                recipient.Signer.suid,
                                docLink,
                                notificationMeessage,
                                recipient.OrganizationId,
                                new(NotificationTypeConstants.TemplateDocument, recipient.TemplateDocumentId)));

                        //if (recipient.AlternateSignatories.Count != 0)
                        //{

                        //	var alternatSignatoryNotificationMeessage = data.UserName + " referred you a document " + templateDocument.DocumentName + " to sign to "
                        //					+ (string.IsNullOrEmpty(recipient.OrganizationId) ? "self" : recipient.OrganizationName + " account");

                        //	foreach (var signatory in recipient.AlternateSignatories)
                        //	{
                        //		//notification changes
                        //		var newNotification = await _notificationRepository.CreateAsync(new Notification(data.UserEmail, signatory.suid,
                        //			docLink, alternatSignatoryNotificationMeessage, recipient.OrganizationId));

                        //		// SignalR Notification to AlternateSignatories
                        //		await SendNotification(signatory.suid, JsonConvert.SerializeObject(newNotification));

                        //		if (actoken != null && pushNotification)
                        //		{
                        //			sender.PushNotification(actoken, signatory.email, alternatSignatoryNotificationMeessage);
                        //		}
                        //	}
                        //}

                        // SignalR Notification
                        string org = string.IsNullOrEmpty(notification.OrganizationId) ? AccountTypeConstants.Self : notification.OrganizationId;

                        _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotification($"{recipient.Signer.suid}_{org}", JsonConvert.SerializeObject(notification)));

                        if (actoken != null && pushNotification)
                        {
                            _backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(actoken, recipient.Signer.suid, notificationMeessage));
                        }
                    }
                    else
                    {
                        //uncomment for certificate generation time
                        //recipient.SigningReqTime = DateTime.UtcNow;
                        //await _recepientsRepository.UpdateRecepientsById(recipient);
                    }
                }

                _logger.LogInformation("Mail send Successfully");
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("SendAnEmailToRecipient Exception : " + e.Message);
                //return new ServiceResult("Mail sending Fail");
            }
        }

        public async Task SendDeclineSignatureNotifiactionToAllRecepient(string tempId, NotificationDTO declineNotification, string acToken = null)
        {
            try
            {
                if (string.IsNullOrEmpty(tempId))
                {
                    _logger.LogError("Document id value getting null or empty string");
                    return;
                }


                bool pushNotification = _configuration.GetValue<bool>("PushNotification");

                var ownerSUID = declineNotification.Receiver;

                var allRecepients = await _recepientsRepository.GetRecepientsListByDocIdAsync(tempId);

                if (allRecepients != null || allRecepients.Count != 0)
                {
                    foreach (var recep in allRecepients)
                    {
                        if (recep.Email != declineNotification.Sender && recep.Suid != ownerSUID)
                        {
                            declineNotification.Receiver = recep.Suid;

                            Notification notificationData = new Notification(
                                declineNotification.Sender,
                                declineNotification.Receiver,
                                declineNotification.Link,
                                declineNotification.Text,
                                recep.OrganizationId,
                                new(NotificationTypeConstants.Document, tempId));

                            await _notificationRepository.CreateAsync(notificationData);

                            string org = string.IsNullOrEmpty(notificationData.OrganizationId) ? AccountTypeConstants.Self : notificationData.OrganizationId;

                            _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotification($"{declineNotification.Receiver}_{org}", JsonConvert.SerializeObject(notificationData)));


                            if (acToken != null && pushNotification)
                            {
                                _backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(acToken, recep.Suid, declineNotification.Text));
                            }
                        }

                        if (recep.AlternateSignatories.Count != 0)
                        {

                            foreach (var signatory in recep.AlternateSignatories)
                            {
                                //if (declineNotification.Sender != signatory.email)
                                //{
                                declineNotification.Receiver = signatory.suid;

                                Notification notificationData = new Notification(
                                    declineNotification.Sender,
                                    declineNotification.Receiver,
                                    declineNotification.Link,
                                    declineNotification.Text,
                                    recep.OrganizationId,
                                    new(NotificationTypeConstants.Document, tempId));

                                //notification changes
                                var newNotification = await _notificationRepository.CreateAsync(notificationData);

                                // SignalR Notification to AlternateSignatories
                                string org = string.IsNullOrEmpty(newNotification.OrganizationId) ? AccountTypeConstants.Self : newNotification.OrganizationId;
                                _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotification($"{signatory.suid}_{org}", JsonConvert.SerializeObject(newNotification)));

                                if (acToken != null && pushNotification)
                                {
                                    _backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(acToken, signatory.suid, declineNotification.Text));
                                }
                                //}
                            }
                        }
                    }
                }
                _logger.LogInformation("Notification sent successfully");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError("SendDeclineSignatureNotifiactionToAllRecepient Exception : " + ex.Message);
            }
        }

        public async Task SendDeclineFormSignatureNotifiactionToAllTemplateRecepient(string tempId, NotificationDTO declineNotification, string acToken = null)
        {
            try
            {
                if (string.IsNullOrEmpty(tempId))
                {
                    _logger.LogError("Document id value getting null or empty string");
                    return;
                }


                bool pushNotification = _configuration.GetValue<bool>("PushNotification");

                var ownerSUID = declineNotification.Receiver;

                var allRecepients = await _templateRecepientRepository.GetTemplateRecepientListByDocIdAsync(tempId);

                if (allRecepients != null || allRecepients.Count != 0)
                {
                    foreach (var recep in allRecepients)
                    {
                        if (recep.Signer.email != declineNotification.Sender && recep.Signer.suid != ownerSUID)
                        {
                            declineNotification.Receiver = recep.Signer.suid;

                            Notification notificationData = new Notification(
                                declineNotification.Sender,
                                declineNotification.Receiver,
                                declineNotification.Link,
                                declineNotification.Text,
                                recep.OrganizationId,
                                new(NotificationTypeConstants.TemplateDocument, tempId));

                            await _notificationRepository.CreateAsync(notificationData);

                            string org = string.IsNullOrEmpty(notificationData.OrganizationId) ? AccountTypeConstants.Self : notificationData.OrganizationId;

                            _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotification($"{declineNotification.Receiver}_{org}", JsonConvert.SerializeObject(notificationData)));


                            if (acToken != null && pushNotification)
                            {
                                _backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(acToken, recep.Signer.suid, declineNotification.Text));
                            }
                        }

                        if (recep.AlternateSignatories.Count != 0)
                        {

                            foreach (var signatory in recep.AlternateSignatories)
                            {
                                //if (declineNotification.Sender != signatory.email)
                                //{
                                declineNotification.Receiver = signatory.suid;

                                Notification notificationData = new Notification(
                                    declineNotification.Sender,
                                    declineNotification.Receiver,
                                    declineNotification.Link,
                                    declineNotification.Text,
                                    recep.OrganizationId,
                                    new(NotificationTypeConstants.TemplateDocument, tempId));

                                //notification changes
                                var newNotification = await _notificationRepository.CreateAsync(notificationData);

                                // SignalR Notification to AlternateSignatories
                                string org = string.IsNullOrEmpty(newNotification.OrganizationId) ? AccountTypeConstants.Self : newNotification.OrganizationId;
                                _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotification($"{signatory.suid}_{org}", JsonConvert.SerializeObject(newNotification)));

                                if (acToken != null && pushNotification)
                                {
                                    _backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(acToken, signatory.suid, declineNotification.Text));
                                }
                                //}
                            }
                        }
                    }
                }
                _logger.LogInformation("Notification sent successfully");
            }
            catch (Exception ex)
            {
                Monitor.SendException(ex);
                _logger.LogError("SendDeclineSignatureNotifiactionToAllRecepient Exception : " + ex.Message);
            }
        }

        public async Task SendSignedFormDocumentDetailsNotifiaction(string corelationID, string msg,
                                                        string docname, string orgId)
        {
            try
            {
                if (string.IsNullOrEmpty(corelationID))
                {
                    _logger.LogError(_constantError.GetMessage("102557"));
                    return;
                    //return new ServiceResult("corelationID id value getting null or empty string");
                }

                _logger.LogInformation("SendSignedFormDocumentDetailsNotifiaction corelation id : " + corelationID);

                var recpData = await _templateRecepientRepository.FindTemplateRecepientByCorelationId(corelationID);
                _logger.LogInformation("SendSignedFormDocumentDetailsNotifiaction recepient data : " + JsonConvert.SerializeObject(recpData));
                var docData = _templateDocumentRepository.GetTemplateDocumentById(recpData.TemplateDocumentId).Result;

                var Msg = string.Format("{0} \nFile name : {1}", msg, docData.DocumentName);


                // Document Owner Notification Message after Document Signing
                var ownerNotification = new Notification(
                    docData.Owner.email,
                    docData.Owner.suid,
                    "",
                    Msg,
                    docData.OrganizationId,
                    new(NotificationTypeConstants.TemplateDocument, docData._id));
                var ownerNotificationSuid = docData.Owner.suid;

                // Document Recepient Notification Message after Document Signing
                var recepNotification = new Notification(
                    recpData.Signer.email,
                    recpData.Signer.suid,
                    "",
                    Msg,
                    recpData.OrganizationId,
                    new(NotificationTypeConstants.TemplateDocument, docData._id));
                var recepNotificationSuid = recpData.Signer.suid;

                //in case of allow anyone can sign / AlternateSignatories

                //if (recpData.AlternateSignatories.Count > 0)
                //{
                //    foreach (var alternateSignatories in recpData.AlternateSignatories)
                //    {
                //        if (alternateSignatories.email == recpData.SignedBy)
                //        {
                //            recepNotification.Receiver = alternateSignatories.suid;
                //            recepNotificationSuid = alternateSignatories.suid;
                //            break;
                //        }
                //    }
                //}

                //For Recepient
                var newRecepNotification = await _notificationRepository.CreateAsync(recepNotification);

                string org = string.IsNullOrEmpty(newRecepNotification.OrganizationId) ? AccountTypeConstants.Self : newRecepNotification.OrganizationId;
                _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotification($"{recepNotificationSuid}_{org}", JsonConvert.SerializeObject(newRecepNotification)));

                bool pushNotification = _configuration.GetValue<bool>("PushNotification");

                if ((recpData.IdpToken != null && pushNotification))//|| docData.IsMobile)
                {
                    _backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(recpData.IdpToken, recpData.Signer.suid, Msg));

                    //in case of allow anyone can sign / AlternateSignatories

                    //if (recpData.AlternateSignatories.Any())
                    //{
                    //    string altMessage = Msg + $"\n by {recpData.SignedBy}";

                    //    foreach (var altSignatory in recpData.AlternateSignatories)
                    //    {
                    //        sender.PushNotification(recpData.AccessToken, altSignatory.email, altMessage);
                    //    }
                    //}
                }

                //For Owner
                if (recpData.Status != RecepientStatus.Signed && recpData.Signer.suid != docData.Owner.suid)
                {
                    var newownerNotification = await _notificationRepository.CreateAsync(ownerNotification);

                    string ownerOrg = string.IsNullOrEmpty(newownerNotification.OrganizationId) ? AccountTypeConstants.Self : newownerNotification.OrganizationId;

                    _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotification($"{ownerNotificationSuid}_{ownerOrg}", JsonConvert.SerializeObject(newownerNotification)));

                    if ((recpData.IdpToken != null && pushNotification))//|| docData.IsMobile)
                    {
                        _backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(recpData.IdpToken, docData.Owner.suid, Msg));
                    }
                }
                _logger.LogInformation("Notification send Successfully");
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("SendSignedDocumentDetailsNotifiaction Exception : " + e.Message);
                //return new ServiceResult("Notification send Fail");
            }
        }

        public async Task SendSignedDocumentDetailsNotifiaction(string corelationID, string msg, bool signStatus = true)
        {
            try
            {
                if (string.IsNullOrEmpty(corelationID))
                {
                    _logger.LogError(_constantError.GetMessage("102557"));
                    return;
                    //return new ServiceResult("corelationID id value getting null or empty string");
                }

                _logger.LogInformation("SendSignedDocumentDetailsNotifiaction corelation id : " + corelationID);

                var recpData = await _recepientsRepository.FindRecepientsByCorelationId(corelationID);
                //_logger.LogInformation("SendSignedDocumentDetailsNotifiaction recepient data : " + JsonConvert.SerializeObject(recpData));
                var docData = await GetDocumentById(recpData.Tempid);

                var Msg = string.Format("{0} \nFile name : {1}", msg, docData.DocumentName);


                // Document Owner Notification Message after Document Signing
                var ownerNotification = new Notification(
                    docData.OwnerEmail,
                    docData.OwnerID,
                    "/dashboard/document/" + recpData.Tempid + "/status",
                    Msg,
                    docData.OrganizationId,
                    new(NotificationTypeConstants.Document, docData._id, signStatus));
                var ownerNotificationSuid = docData.OwnerID;

                // Document Recepient Notification Message after Document Signing
                var recepNotification = new Notification(
                    recpData.SignedBy,
                    recpData.Suid,
                    "/dashboard/document/" + recpData.Tempid + "/status",
                    Msg,
                    recpData.OrganizationId,
                    new(NotificationTypeConstants.Document, docData._id, signStatus));

                var recepNotificationSuid = recpData.Suid;

                if (recpData.AlternateSignatories.Count > 0)
                {
                    foreach (var alternateSignatories in recpData.AlternateSignatories)
                    {
                        if (alternateSignatories.email == recpData.SignedBy)
                        {
                            recepNotification.Receiver = alternateSignatories.suid;
                            recepNotificationSuid = alternateSignatories.suid;
                            break;
                        }
                    }
                }

                //For Recepient
                var newRecepNotification = await _notificationRepository.CreateAsync(recepNotification);

                string org = string.IsNullOrEmpty(newRecepNotification.OrganizationId) ? AccountTypeConstants.Self : newRecepNotification.OrganizationId;

                _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotification($"{recepNotificationSuid}_{org}", JsonConvert.SerializeObject(newRecepNotification)));

                bool pushNotification = _configuration.GetValue<bool>("PushNotification");

                if ((recpData.AccessToken is string acToken && pushNotification) || docData.IsMobile)
                {

                    _backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(recpData.AccessToken, recpData.Suid, Msg));

                    if (recpData.AlternateSignatories.Any())
                    {
                        string altMessage = Msg + $"\n by {recpData.SignedBy}";

                        foreach (var altSignatory in recpData.AlternateSignatories)
                        {
                            _backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(recpData.AccessToken, altSignatory.suid, altMessage));
                        }
                    }
                }

                //For Owner
                if (!docData.Recepients.Any(x => x.Suid == docData.OwnerID))
                {
                    if (recpData.Status != RecepientStatus.Signed && recpData.Suid != docData.OwnerID)
                    {
                        var newownerNotification = await _notificationRepository.CreateAsync(ownerNotification);

                        string ownerOrg = string.IsNullOrEmpty(newownerNotification.OrganizationId) ? AccountTypeConstants.Self : newownerNotification.OrganizationId;

                        _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotification($"{ownerNotificationSuid}_{ownerOrg}", JsonConvert.SerializeObject(newownerNotification)));

                        if ((recpData.AccessToken is string accessToken && pushNotification) || docData.IsMobile)
                        {
                            _backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(recpData.AccessToken, docData.OwnerID, Msg));
                        }
                    }
                    _logger.LogInformation("Notification send Successfully");
                }
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("SendSignedDocumentDetailsNotifiaction Exception : " + e.Message);
                //return new ServiceResult("Notification send Fail");
            }
        }

        public async Task SendSignedDocumentDetailsNotifiactionGroupSigning(string corelationID, string msg, bool signStatus = true)
        {
            try
            {
                if (string.IsNullOrEmpty(corelationID))
                {
                    _logger.LogError(_constantError.GetMessage("102557"));
                    return;
                    //return new ServiceResult("corelationID id value getting null or empty string");
                }

                _logger.LogInformation("SendSignedDocumentDetailsNotifiaction corelation id : " + corelationID);

                var recpData = await _recepientsRepository.FindRecepientsByCorelationId(corelationID);
                //_logger.LogInformation("SendSignedDocumentDetailsNotifiaction recepient data : " + JsonConvert.SerializeObject(recpData));
                var docData = await GetDocumentById(recpData.Tempid);

                var Msg = string.Format("{0} \nFile name : {1}", msg, docData.DocumentName);


                // Document Owner Notification Message after Document Signing
                var ownerNotification = new Notification(
                    docData.OwnerEmail,
                    docData.OwnerID,
                    "/dashboard/document/" + recpData.Tempid + "/status",
                    Msg,
                    docData.OrganizationId,
                    new(NotificationTypeConstants.Document, docData._id, signStatus));

                var ownerNotificationSuid = docData.OwnerID;

                // Document Recepient Notification Message after Document Signing
                var recepNotification = new Notification(
                    recpData.SignedBy,
                    recpData.Suid,
                    "/dashboard/document/" + recpData.Tempid + "/status",
                    Msg,
                    recpData.OrganizationId,
                    new(NotificationTypeConstants.Document, docData._id, signStatus));

                var recepNotificationSuid = recpData.Suid;

                if (recpData.AlternateSignatories.Count > 0)
                {
                    foreach (var alternateSignatories in recpData.AlternateSignatories)
                    {
                        if (alternateSignatories.email == recpData.SignedBy)
                        {
                            recepNotification.Receiver = alternateSignatories.suid;
                            recepNotificationSuid = alternateSignatories.suid;
                            break;
                        }
                    }
                }

                bool pushNotification = _configuration.GetValue<bool>("PushNotification");

                //For Owner
                if (recpData.Status != RecepientStatus.Signed && recpData.Suid != docData.OwnerID)
                {
                    var newownerNotification = await _notificationRepository.CreateAsync(ownerNotification);

                    string org = string.IsNullOrEmpty(newownerNotification.OrganizationId) ? AccountTypeConstants.Self : newownerNotification.OrganizationId;

                    _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotification($"{ownerNotificationSuid}_{org}", JsonConvert.SerializeObject(newownerNotification)));

                    if ((recpData.AccessToken is string acToken && pushNotification) || docData.IsMobile)
                    {
                        _backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(recpData.AccessToken, docData.OwnerID, Msg));
                    }
                }
                _logger.LogInformation("Notification send Successfully");
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("SendSignedDocumentDetailsNotifiaction Exception : " + e.Message);
                //return new ServiceResult("Notification send Fail");
            }
        }

        public async Task SendSignedFormDocumentDetailsNotifiaction(string corelationID, string msg)
        {
            try
            {
                if (string.IsNullOrEmpty(corelationID))
                {
                    _logger.LogError(_constantError.GetMessage("102557"));
                    return;
                    //return new ServiceResult("corelationID id value getting null or empty string");
                }


                _logger.LogInformation("SendSignedFormDocumentDetailsNotifiaction corelation id : " + corelationID);

                var recpData = await _templateRecepientRepository.FindTemplateRecepientByCorelationId(corelationID);
                _logger.LogInformation("SendSignedFormDocumentDetailsNotifiaction recepient data : " + JsonConvert.SerializeObject(recpData));
                var docData = await _templateDocumentRepository.GetTemplateDocumentById(recpData.TemplateDocumentId);

                var Msg = string.Format("{0} \nFile name : {1}", msg, docData.DocumentName);


                // Document Owner Notification Message after Document Signing
                var ownerNotification = new Notification(
                    docData.Owner.email,
                    docData.Owner.suid,
                    "/dashboard/document/" + recpData.TemplateDocumentId + "/status",
                    Msg,
                    docData.OrganizationId,
                    new(NotificationTypeConstants.TemplateDocument, docData._id));

                var ownerNotificationSuid = docData.Owner.suid;

                // Document Recepient Notification Message after Document Signing
                var recepNotification = new Notification(
                    recpData.SignedBy,
                    recpData.Signer.suid,
                    "/dashboard/document/" + recpData.TemplateDocumentId + "/status",
                    Msg,
                    recpData.OrganizationId,
                    new(NotificationTypeConstants.TemplateDocument, docData._id));
                var recepNotificationSuid = recpData.Signer.suid;

                if (recpData.AlternateSignatories.Count > 0)
                {
                    foreach (var alternateSignatories in recpData.AlternateSignatories)
                    {
                        if (alternateSignatories.email == recpData.SignedBy)
                        {
                            recepNotification.Receiver = alternateSignatories.suid;
                            recepNotificationSuid = alternateSignatories.suid;
                            break;
                        }
                    }
                }

                //For Recepient
                var newRecepNotification = await _notificationRepository.CreateAsync(recepNotification);

                string org = string.IsNullOrEmpty(newRecepNotification.OrganizationId) ? AccountTypeConstants.Self : newRecepNotification.OrganizationId;

                _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotification($"{recepNotificationSuid}_{org}", JsonConvert.SerializeObject(newRecepNotification)));

                bool pushNotification = _configuration.GetValue<bool>("PushNotification");

                if ((recpData.IdpToken != null && pushNotification))//|| docData.IsMobile)
                {
                    _backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(recpData.IdpToken, recpData.Signer.suid, Msg));

                    if (recpData.AlternateSignatories.Any())
                    {
                        string altMessage = Msg + $"\n by {recpData.SignedBy}";

                        foreach (var altSignatory in recpData.AlternateSignatories)
                        {
                            _backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(recpData.IdpToken, altSignatory.suid, altMessage));
                        }
                    }
                }

                //For Owner
                if (recpData.Status != RecepientStatus.Signed && recpData.Signer.suid != docData.Owner.suid)
                {
                    var newownerNotification = await _notificationRepository.CreateAsync(ownerNotification);

                    string ownerOrg = string.IsNullOrEmpty(newownerNotification.OrganizationId) ? AccountTypeConstants.Self : newownerNotification.OrganizationId;

                    _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotification($"{ownerNotificationSuid}_{ownerOrg}", JsonConvert.SerializeObject(newownerNotification)));

                    if ((recpData.IdpToken != null && pushNotification))// || docData.IsMobile)
                    {
                        _backgroundService.RunBackgroundTask<IGenericPushNotificationService>(sender => sender.SendGenericPushNotification(recpData.IdpToken, docData.Owner.suid, Msg));
                    }
                }
                _logger.LogInformation("Notification send Successfully");
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("SendSignedDocumentDetailsNotifiaction Exception : " + e.Message);
                //return new ServiceResult("Notification send Fail");
            }
        }

        public async Task<ServiceResult> SaveCertificateToEDMS(string id, string docname, string suid)
        {
            // Get Start Time
            DateTime startTime = DateTime.UtcNow;
            var logMessageType = "";
            var MessageForLog = "";


            StreamContent fileStreamContent = null;
            MemoryStream memoryStream = null;
            StringContent content = null;

            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    logMessageType = SigningPortalLogMessageType.Failed;
                    MessageForLog = SigningPortalLogMessage.SaveCertificateToEdmsFailed;

                    return new ServiceResult(_constantError.GetMessage("102555"));
                    //return new ServiceResult("Document id value getting null or empty string");
                }


                if (string.IsNullOrEmpty(docname))
                {
                    logMessageType = SigningPortalLogMessageType.Failed;
                    MessageForLog = SigningPortalLogMessage.SaveCertificateToEdmsFailed;
                    return new ServiceResult(_constantError.GetMessage("102559"));
                    //return new ServiceResult("certificate name value getting null or empty string");
                }

                var docData = await GetDocumentById(id);
                var PdfByteArrydata = GetCertificateHtml(docData);

                memoryStream = new MemoryStream(PdfByteArrydata);
                fileStreamContent = new StreamContent(memoryStream);
                fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");

                var requestContent = new MultipartFormDataContent();

                content = new StringContent(docname + ".pdf");

                requestContent.Add(fileStreamContent, "file", docname + ".pdf");
                requestContent.Add(content, "model");
                var baseUrl = _configuration["Config:EDMSConfig:EDMS_Url"]
              ?? throw new InvalidOperationException("EDMS_Url configuration is missing.");

                var SaveDocUrl = new Uri(new Uri(baseUrl), "save-doc-edms");
                HttpResponseMessage response = await _client.PostAsync(SaveDocUrl, requestContent);
                if (response == null)
                {
                    logMessageType = SigningPortalLogMessageType.Failed;
                    MessageForLog = SigningPortalLogMessage.SaveCertificateToEdmsFailed;
                    _logger.LogError($"The request with URI = {SaveDocUrl} failed ");
                    return new ServiceResult(_constantError.GetMessage("102560"));
                    //return new ServiceResult("Failed to save certificate in edms ");
                }
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    var bytes = await response.Content.ReadAsStringAsync();
                    var responseString = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation("Save Certificate to edms response :" + responseString);
                    JObject obj = JsonConvert.DeserializeObject<JObject>(responseString);
                    if (obj["success"]?.Value<bool>() == true)
                    {
                        logMessageType = SigningPortalLogMessageType.Success;
                        MessageForLog = SigningPortalLogMessage.SaveCertificateToEdmsSuccess;

                        var result = obj["result"]?.Value<string>() ?? string.Empty;
                        var message = obj["message"]?.Value<string>() ?? string.Empty;

                        return new ServiceResult(result, message);
                    }
                    else
                    {
                        logMessageType = SigningPortalLogMessageType.Failed;
                        MessageForLog = SigningPortalLogMessage.SaveCertificateToEdmsFailed;
                        var message = obj["message"]?.Value<string>() ?? string.Empty;
                        return new ServiceResult(message);
                    }
                }
                else
                {
                    Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
                    $"with status code={response.StatusCode}");

                    logMessageType = SigningPortalLogMessageType.Failed;
                    MessageForLog = SigningPortalLogMessage.SaveCertificateToEdmsFailed;
                    _logger.LogError($"SaveCertificateToEDMS Api call to edms url={response.RequestMessage.RequestUri} failed " +
                               $"with status code={response.StatusCode}");

                    return new ServiceResult(_constantError.GetMessage("102560") + " : " + response.ReasonPhrase);
                    //return new ServiceResult("Failed to save certificate in edms : " + response.ReasonPhrase);
                }

            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                logMessageType = SigningPortalLogMessageType.Failed;
                MessageForLog = SigningPortalLogMessage.SaveCertificateToEdmsFailed;
                _logger.LogError("Failed to save certificate in edms : " + e.Message);
                return new ServiceResult(_constantError.GetMessage("102560"));
                //return new ServiceResult("Failed to save certificate in edms ");
            }
            finally
            {
                fileStreamContent?.Dispose();
                memoryStream?.Dispose();
                content?.Dispose();

                var result = _logClient.SendLog(suid, SigningPortalLogServiceName.SaveDocumentToEdms,
                    startTime, MessageForLog, logMessageType);
                if (0 != result)
                {
                    _logger.LogError("Failed to send log message to service log server");
                    //return new ClientResponse("Failed to send log message to service " +
                    //    "log server");
                }
            }
        }

        public async Task<ServiceResult> SaveDocumentToEDMS(IFormFile DocData, string docname, string expiryDate, string suid)
        {
            // Get Start Time
            DateTime startTime = DateTime.UtcNow;
            var logMessageType = "";
            var MessageForLog = "";
            try
            {
                if (DocData == null)
                {
                    logMessageType = SigningPortalLogMessageType.Failed;
                    MessageForLog = SigningPortalLogMessage.SaveDocumentToEdmsFailed;
                    return new ServiceResult(_constantError.GetMessage("102561"));
                    //return new ServiceResult("Document data value getting null or empty string");
                }

                if (string.IsNullOrEmpty(docname))
                {
                    logMessageType = SigningPortalLogMessageType.Failed;
                    MessageForLog = SigningPortalLogMessage.SaveDocumentToEdmsFailed;
                    return new ServiceResult(_constantError.GetMessage("102562"));
                    //return new ServiceResult("Document name value getting null or empty string");
                }

                string fileName = Path.GetFileNameWithoutExtension(docname);

                var saveStatus = await _storageService.SaveDocument(expiryDate, DocData);

                logMessageType = SigningPortalLogMessageType.Success;
                MessageForLog = SigningPortalLogMessage.SaveCertificateToEdmsSuccess;

                return saveStatus;

            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                logMessageType = SigningPortalLogMessageType.Failed;
                MessageForLog = SigningPortalLogMessage.SaveDocumentToEdmsFailed;
                _logger.LogError("Failed to save document in edms : " + e.Message);
                return new ServiceResult(_constantError.GetMessage("102534"));
            }
            finally
            {
                var result = _logClient.SendLog(suid, SigningPortalLogServiceName.SaveDocumentToEdms,
                    startTime, MessageForLog, logMessageType);
                if (0 != result)
                {
                    _logger.LogError("Failed to send log message to service log server");
                    //return new ClientResponse("Failed to send log message to service " +
                    //    "log server");
                }
            }
        }

        public async Task<ServiceResult> UpdateDocumentToEDMS(string id, IFormFile DocData, string docname, string suid)
        {
            // Get Start Time
            DateTime startTime = DateTime.UtcNow;
            var logMessageType = "";
            var MessageForLog = "";

            //FileStream readStream = null;
            //FileStream writeStream = null;
            //StreamContent fileStreamContent = null;
            //ByteArrayContent bytesArray = null;
            StringContent content = null;
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    logMessageType = SigningPortalLogMessageType.Failed;
                    MessageForLog = SigningPortalLogMessage.UpdateDocumentToEdmsFailed;
                    return new ServiceResult(_constantError.GetMessage("102555"));
                    //return new ServiceResult("Document id value getting null or empty string");
                }

                if (DocData == null)
                {
                    logMessageType = SigningPortalLogMessageType.Failed;
                    MessageForLog = SigningPortalLogMessage.UpdateDocumentToEdmsFailed;
                    return new ServiceResult(_constantError.GetMessage("102561"));
                    //return new ServiceResult("Document data value getting null or empty string");
                }

                if (string.IsNullOrEmpty(docname))
                {
                    logMessageType = SigningPortalLogMessageType.Failed;
                    MessageForLog = SigningPortalLogMessage.UpdateDocumentToEdmsFailed;
                    return new ServiceResult(_constantError.GetMessage("102562"));
                    //return new ServiceResult("Document name value getting null or empty string");
                }

                string fileName = Path.GetFileNameWithoutExtension(docname);

                var updatedStatus = await _storageService.UpdateSavedDocumentAsync(id, DocData);

                if (updatedStatus.Success == false)
                {
                    _logger.LogError(updatedStatus.Message.ToString());
                    _logger.LogInformation(updatedStatus.Result.ToString());
                }

                return updatedStatus;

            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                logMessageType = SigningPortalLogMessageType.Failed;
                MessageForLog = SigningPortalLogMessage.UpdateDocumentToEdmsFailed;
                _logger.LogError(_constantError.GetMessage("102564") + " : " + e.Message);
                //_logger.LogError("Failed to update document in edms : " + e.Message);
                return new ServiceResult(_constantError.GetMessage("102539"));
                //return new ServiceResult("Failed to update document in edms ");
            }
            finally
            {
                //fileStreamContent?.Dispose();
                content?.Dispose();
                //readStream?.Close();
                //bytesArray.Dispose();
                //DeleteFiles(Path.Combine(_environment.ContentRootPath, "Resource"));

                var result = _logClient.SendLog(suid, SigningPortalLogServiceName.SaveDocumentToEdms,
                    startTime, MessageForLog, logMessageType);
                if (0 != result)
                {
                    _logger.LogError("Failed to send log message to service log server");
                    //return new ClientResponse("Failed to send log message to service " +
                    //    "log server");
                }
            }
        }

        public async Task<Document> GetDocumentById(string id)
        {
            _logger.LogInformation("GetDocumentById : Id: {0}", id);
            var document = await _documentRepository.GetDocumentById(id);
            if (document == null)
            {
                _logger.LogError("GetDocumentById document details get null");
                return null;
            }



            //var recepients = await _recepientsRepository.GetRecepientsListByDocIdAsync(id);
            //if (document == null)
            //{
            //    _logger.LogError("GetDocumentById recepients list details get null");
            //    return null;
            //}

            //document.Recepients = recepients;
            return document;
        }

        //public async Task PushNotification(string accessToken, string suid, string message)
        //{
        //	try
        //	{
        //		PushNotificationDTO pushNotificationObj = new PushNotificationDTO
        //		{
        //			AccessToken = accessToken,
        //			Suid = suid,
        //			Body = message
        //		};

        //		var response = await _client.PostAsJsonAsync<PushNotificationDTO>(_configuration.GetValue<string>("Config:PushNotificationUrl"), pushNotificationObj);
        //		if (response.StatusCode == HttpStatusCode.OK)
        //		{
        //			APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
        //			if (apiResponse.Success)
        //			{
        //				_logger.LogInformation("Push notification sent successfully to {0}", suid);
        //				_logger.LogInformation(message);
        //			}
        //			else
        //			{
        //				_logger.LogInformation(apiResponse.Message.ToString());
        //				_logger.LogInformation("Push notification failed : " + suid);
        //			}
        //		}
        //		else
        //		{
        //			_logger.LogError($"The request with URI={response.RequestMessage.RequestUri} failed " +
        //			$"with status code={response.StatusCode}");
        //			Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
        //			$"with status code={response.StatusCode}");
        //		}
        //	}
        //	catch (Exception ex)
        //	{
        //		Monitor.SendException(ex);
        //		_logger?.LogError(ex.Message);
        //		_logger?.LogError("Failed to send push notification");
        //	}
        //}

        //public async Task DelegationPushNotification(DelegationPushNotificationDTO pushNotificationObj)
        //{
        //	try
        //	{
        //		//string json = JsonConvert.SerializeObject(pushNotificationObj,
        //		//        new JsonSerializerSettings { ContractResolver = new CamelCasePropertyNamesContractResolver() });
        //		//StringContent content = new StringContent(json, Encoding.UTF8, "application/json");

        //		var response = await _client.PostAsJsonAsync<DelegationPushNotificationDTO>(_configuration.GetValue<string>("Config:DelegationPushNotificationUrl"), pushNotificationObj);
        //		if (response.StatusCode == HttpStatusCode.OK)
        //		{
        //			APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
        //			if (apiResponse.Success)
        //			{
        //				_logger.LogInformation("Push notification sent successfully to {0}");
        //				//_logger.LogInformation(message);
        //			}
        //			else
        //			{
        //				_logger.LogInformation(apiResponse.Result.ToString());
        //				_logger.LogInformation("Push notification failed : {0}");
        //			}
        //		}
        //		else
        //		{
        //			Monitor.SendMessage($"The request with URI={response.RequestMessage.RequestUri} failed " +
        //			$"with status code={response.StatusCode}");
        //		}
        //	}
        //	catch (Exception ex)
        //	{
        //		Monitor.SendException(ex);
        //		_logger?.LogError(ex.Message);
        //		_logger?.LogError("Failed to send push notification");
        //	}
        //}


        //public async void DigitalFormPushNotification(DigitalFormPushNotificationDTO pushNotificationObj)
        //{
        //    try
        //    {
        //        var response = _client.PostAsJsonAsync<DigitalFormPushNotificationDTO>(_configuration.GetValue<string>("Config:DigitalFormPushNotificationUrl"), pushNotificationObj).Result;
        //        if (response.StatusCode == HttpStatusCode.OK)
        //        {
        //            APIResponse apiResponse = JsonConvert.DeserializeObject<APIResponse>(await response.Content.ReadAsStringAsync());
        //            if (apiResponse.Success)
        //            {
        //                _logger.LogInformation("Push notification sent successfully to {0}");
        //                //_logger.LogInformation(message);
        //            }
        //            else
        //            {
        //                _logger.LogInformation(apiResponse.Result.ToString());
        //                _logger.LogInformation("Push notification failed : {0}");
        //            }
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger?.LogError(ex.Message);
        //        _logger?.LogError("Failed to send push notification");
        //    }
        //}

        public async Task SendEmailToAllRecepients(string docId, string content, string subject, bool isAttachmentPresent, bool isSignComplete = false)
        {
            try
            {
                Message message;
                ServiceResult edmsDocument;

                var documentDetails = await GetDocumentById(docId);

                if (documentDetails != null)
                {
                    var CompleteSignList = documentDetails.CompleteSignList.Select(x => x.email).ToList<string>();
                    var PendingSignList = documentDetails.PendingSignList.Select(x => x.email).ToList<string>();
                    var emailToList = CompleteSignList.Concat(PendingSignList);

                    var emailData = GenerateDocumentInfoEmailForAllRecepients(content, subject, documentDetails, isSignComplete);

                    message = new Message(emailToList,
                        subject,
                        emailData
                        );

                    if (isAttachmentPresent)
                    {
                        _logger.LogInformation("---------edms start : " + DateTime.UtcNow);
                        edmsDocument = await _edmsService.GetDocumentAsync(documentDetails.EdmsId);
                        _logger.LogInformation("---------edms end : " + DateTime.UtcNow);



                        message.Attachment = (byte[])edmsDocument.Result;
                        message.IsAttachmentPresent = true;
                        _logger.LogInformation("---------send mail with attachment start : " + DateTime.UtcNow);

                        _backgroundService.RunBackgroundTask<IGenericEmailService>(sender => sender.SendGenericEmailWithAttachment(message, documentDetails.DocumentName));

                        if (isSignComplete)
                        {
                            _backgroundService.RunBackgroundTask<IDriveHelper>(sender => sender.UploadFileToDriveAsync(documentDetails.Recepients, (byte[])edmsDocument.Result, documentDetails.DocumentName, "Digitally Signed Document"));
                        }

                        _logger.LogInformation("---------send mail with attachment end : " + DateTime.UtcNow);
                    }
                    else
                    {
                        _backgroundService.RunBackgroundTask<IGenericEmailService>(sender => sender.SendGenericEmailWithAttachment(message, documentDetails.DocumentName));
                    }


                    _logger.LogInformation("Mail send Successfully");
                    return;
                }
                _logger.LogError("Mail send Fail");
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("SendEmailToAllRecepients Exception : " + e.Message);
                //return new ServiceResult(_constantError.GetMessage("102558"));
            }
        }

        public async Task SendEmailToAllFormRecepients(string docId, string content, string subject, bool isAttachmentPresent, bool isSignComplete = false)
        {
            try
            {
                Message message;
                ServiceResult edmsDocument;

                var documentDetails = await _templateDocumentRepository.GetTemplateDocumentById(docId);

                if (documentDetails != null)
                {
                    var CompleteSignList = documentDetails.CompleteSignList.Select(x => x.email).ToList<string>();
                    var PendingSignList = documentDetails.PendingSignList.Select(x => x.email).ToList<string>();
                    var emailToList = CompleteSignList.Concat(PendingSignList);

                    var emailData = GenerateDocumentInfoEmailForAllFormRecepients(content, subject, documentDetails, isSignComplete);

                    message = new Message(emailToList,
                        subject,
                        emailData
                        );

                    if (isAttachmentPresent)
                    {
                        _logger.LogInformation("---------edms start : " + DateTime.UtcNow);
                        edmsDocument = await _edmsService.GetDocumentAsync(documentDetails.EdmsId);
                        _logger.LogInformation("---------edms end : " + DateTime.UtcNow);



                        message.Attachment = (byte[])edmsDocument.Result;
                        message.IsAttachmentPresent = true;
                        _logger.LogInformation("---------send mail with attachment start : " + DateTime.UtcNow);

                        _backgroundService.RunBackgroundTask<IGenericEmailService>(sender => sender.SendGenericEmailWithAttachment(message, documentDetails.DocumentName));

                        //Google drive upload

                        //if (isSignComplete)
                        //{
                        //	_backgroundService.RunBackgroundTask<IDriveHelper>(async (sender) =>
                        //	{
                        //		await _driveHelper.UploadFileToDriveAsync(documentDetails.Recepients, (byte[])edmsDocument.Result, documentDetails.DocumentName, "Digitally Signed Document");
                        //	});
                        //}

                        _logger.LogInformation("---------send mail with attachment end : " + DateTime.UtcNow);
                    }
                    else
                    {
                        _backgroundService.RunBackgroundTask<IGenericEmailService>(sender => sender.SendGenericEmailWithAttachment(message, documentDetails.DocumentName));
                    }


                    _logger.LogInformation("Mail send Successfully");
                    return;
                }
                _logger.LogError("Mail send Fail");
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("SendEmailToAllRecepients Exception : " + e.Message);
                //return new ServiceResult(_constantError.GetMessage("102558"));
                _logger.LogError("Mail send Fail");
            }
        }

        public async Task SendNotificationToDelgator(Notification notification)
        {
            try
            {
                var newNotification = await _notificationRepository.CreateAsync(notification);

                string org = string.IsNullOrEmpty(newNotification.OrganizationId) ? AccountTypeConstants.Self : newNotification.OrganizationId;

                _backgroundService.RunBackgroundTask<IDocumentHelper>(sender => sender.SendNotification($"{notification.Receiver}_{org}", JsonConvert.SerializeObject(newNotification)));

                _logger.LogInformation("Notification sent successfully");
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("SendNotificationToDelgator Exception : " + e.Message);
            }
        }

        public async Task SendEmailToDelegatee(string id, string subject, bool toSender = false)
        {
            try
            {
                List<string> delegatees = new List<string>();

                var delegator = _delegationRepository.GetDelegateById(id).Result;

                if (delegator == null)
                {
                    _logger.LogError("Delgator Details Not Found");
                    return;
                }

                var delegateeList = delegator.Delegatees;

                foreach (var delegatee in delegateeList)
                    delegatees.Add(delegatee.DelegateeEmail);

                if (toSender)
                    delegatees.Add(delegator.DelegatorEmail);

                var htmlbody = GenerateEmailForDelegatee(delegator.DelegatorName.ToUpper(), delegator.StartDateTime.ToLocalTime().ToString("dd/MM/yyyy hh:mm:ss tt"),
                                                            delegator.EndDateTime.ToLocalTime().ToString("dd/MM/yyyy hh:mm:ss tt"), delegator.DelegationStatus);

                var message = new Message(delegatees, subject, htmlbody);

                try
                {
                    await _genericEmailService.SendGenericEmail(message);
                    _logger.LogInformation("Mail send Successfully");
                }
                catch (Exception e)
                {
                    Monitor.SendException(e);
                    _logger.LogError("SendEmail fail to Delegatee email , Exception : " + e.Message);
                    //return new ServiceResult("Mail sending Fail");
                }

            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("Mail Send Fail");
            }
        }

        public async Task SendDelegateeActionEmailToDelegator(string id, string subject)
        {
            try
            {
                List<string> sender = new List<string>();

                var delegator = _delegationRepository.GetDelegateById(id).Result;

                if (delegator == null)
                {
                    _logger.LogError("Delgator Details Not Found");
                    return;
                }

                var delegateeList = delegator.Delegatees.ToList();

                sender.Add(delegator.DelegatorEmail);

                var htmlbody = GenerateEmailForDelegator(delegateeList, delegator.StartDateTime.ToLocalTime().ToString("dd/MM/yyyy hh:mm:ss tt"),
                                                delegator.EndDateTime.ToLocalTime().ToString("dd/MM/yyyy hh:mm:ss tt"), delegator.DelegationStatus);

                var message = new Message(sender, subject, htmlbody);

                try
                {
                    await _genericEmailService.SendGenericEmail(message);
                    _logger.LogInformation("Mail send Successfully");
                }
                catch (Exception e)
                {
                    Monitor.SendException(e);
                    _logger.LogError("SendEmail fail to Delegatee email , Exception : " + e.Message);
                    //return new ServiceResult("Mail sending Fail");
                }
            }
            catch (Exception e)
            {
                Monitor.SendException(e);
                _logger.LogError("Mail Send Fail");
            }
        }

        private string GenerateEmailForDelegatee(string sender, string startDate, string endDate, string status)
        {
            var logoUrl = GetVersionedLogoUrl();

            return string.Format("<html>" +
                            "<head></head>" +
                            "<body style='font-family: Lato,Helvetica,Arial,sans-serif;'>" +
                            "<table border='0' width='480px' cellpadding='5' cellspacing='5' align='center'>" +
                                "<center>" +
                                       "<tr>" +
                                        "<td style='text-align: center'><img style='width: 200px' src='{0}'></td>" +
                                       "</tr>" +
                                       "<tr>" +
                                            "<td style='background: #acc43d;'>" +
                                                 "<h1 style='border: 1px solid #acc43d;border-radius: 2px;font-family: Lato,Helvetica," +
                                                         "Arial,sans-serif;font-size: 20px; color: #ffffff;text-decoration: none;" +
                                                         "font-weight:bold;display: inline-block;'>" +
                                                         "Signature Delegation Details" +
                                                 "</h1>" +
                                            "</td>" +
                                       "</tr>" +
                                  "</center>" +
                            "</table>" +

                            "<table  border='0' width='480px' cellpadding='7' cellspacing='7' align='center'>" +
                                // "<tr>" +
                                //    "<td><h4>Organization</h4></td>" +
                                //    "<td><h4>NITA</h4></td>" +
                                //"</tr>" +

                                "<tr>" +
                                    "<td><h4>Sender</h4></td>" +
                                    "<td><h4>{1}</h4></td>" +
                                "</tr>" +

                                "<tr>" +
                                    "<td><h4>Start Date</h4></td>" +
                                    "<td><h4>{2} (EAT)</h4></td>" +
                                "</tr>" +

                                "<tr>" +
                                    "<td><h4>End Date</h4></td>" +
                                    "<td><h4>{3} (EAT)</h4></td>" +
                                "</tr>" +
                                "<tr>" +
                                    "<td><h4>Delegation Status</h4></td>" +
                                    "<td><h4>{4}</h4></td>" +
                                "</tr>" +
                            "</table>" +

                            "<table border='0' width='480px' cellpadding='5' cellspacing='5' align='center'>" +
                                  "<center>" +
                                       "<tr>" +
                                            "<td>      " +
                                              "<p style='font-size:10px;'>* This is an automated email from Signing Portal. " +
                                              "Please contact the sender for any queries regarding this email" +
                                              "</p>" +
                                            "</td>" +
                                       "</tr>" +
                                 "</center>" +
                            "</table>" +
                            "</body>" +
                        "</html>", logoUrl, sender, startDate, endDate, status);

        }

        private string GenerateEmailForDelegator(List<Delegatee> delegatee, string startDate, string endDate, string status)
        {
            var logoUrl = GetVersionedLogoUrl();

            var emailbody = string.Format("<html>" +
                             "<head></head>" +
                             "<body style='font-family: Lato,Helvetica,Arial,sans-serif;'>" +
                             "<table border='0' width='480px' cellpadding='5' cellspacing='5' align='center'>" +
                                 "<center>" +
                                        "<tr>" +
                                             "<td style='text-align: center'><img style='width: 200px' src='{0}'></td>" +
                                        "</tr>" +
                                        "<tr>" +
                                             "<td style='background: #acc43d;'>" +
                                                  "<h1 style='border: 1px solid #acc43d;border-radius: 2px;font-family: Lato,Helvetica," +
                                                          "Arial,sans-serif;font-size: 20px; color: #ffffff;text-decoration: none;" +
                                                          "font-weight:bold;display: inline-block;'>" +
                                                          "Signature Delegation Details" +
                                                  "</h1>" +
                                             "</td>" +
                                        "</tr>" +
                                   "</center>" +
                             "</table>" +

                             "<table  border='0' width='480px' cellpadding='7' cellspacing='7' align='center'>"
                                 // "<tr>" +
                                 //    "<td><h4>Organization</h4></td>" +
                                 //    "<td><h4>NITA</h4></td>" +
                                 //"</tr>"                                             
                                 , logoUrl);

            foreach (var dele in delegatee)
            {
                emailbody += string.Format(
                    "<tr>" +
                       "<td><h4>{0}</h4></td>" +
                        "<td><h4>{1}</h4></td>" +
                    "</tr>", dele.DelegateeEmail, dele.ConsentStatus);
            }
            emailbody += string.Format(
                "<tr>" +
                    "<td><h4>Start Date</h4></td>" +
                    "<td><h4>{0} (EAT)</h4></td>" +
                "</tr>" +

                "<tr>" +
                    "<td><h4>End Date</h4></td>" +
                    "<td><h4>{1} (EAT)</h4></td>" +
                "</tr>" +
                "<tr>" +
                    "<td><h4>Delegation Status</h4></td>" +
                    "<td><h4>{2}</h4></td>" +
                "</tr>" +
            "</table>" +

            "<table border='0' width='480px' cellpadding='5' cellspacing='5' align='center'>" +
                  "<center>" +
                       "<tr>" +
                            "<td>      " +
                              "<p style='font-size:10px;'>* This is an automated email from Signing Portal. " +
                              "Please contact the sender for any queries regarding this email" +
                              "</p>" +
                            "</td>" +
                       "</tr>" +
                 "</center>" +
            "</table>" +
            "</body>" +
            "</html>", startDate, endDate, status);

            return emailbody;
        }


    }
}

using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
    public interface IDocumentService
    {
        ServiceResult GetFileConfigurationAsync(string orgId);

        Task<ServiceResult> OwnDocumentStatusAsync(UserDTO userDTO);

        Task<ServiceResult> OtherDocumentStatusAsync(UserDTO userDTO);

        Task<ServiceResult> DocumentStatusAsync(UserDTO userDTO);

        Task<ServiceResult> SaveNewDocumentAsync(SaveNewDocumentDTO document, UserDTO userDetails);

        Task<ServiceResult> GetAllDocumentsAsync(UserDTO user);

        Task<ServiceResult> GetDocumentDetaildByIdAsync(string id);

        Task<ServiceResult> DeleteDocumentByIdListAsync(DeleteDocumentDTO idList);

        Task<ServiceResult> GetDeclinedCommentDetailsAsync(string tempid);

        Task<ServiceResult> DeclineDocumentSigningAsync(string tempId, DeclineDocumentSigningDTO declineDocumentSigningDTO);

        Task<ServiceResult> RecallDocumentToSignAsync(string tempId);

        //Task<ServiceResult> GetPendingActionListAsync(string email);

        //Task<ServiceResult> GetExpireActionListAsync(string email);

        Task<ServiceResult> SendSigningRequestAsync(SigningRequestDTO signingRequest, UserDTO userDTO);

        Task<ServiceResult> SendSigningRequestNewAsync(SigningRequestNewDTO signingRequest, UserDTO userDTO);

        Task<ServiceResult> VerifySignedDocumentAsync(VerifySignedDocumentDTO signedDocument);

        Task<ServiceResult> RecieveDocumentAsync(RecieveDocumentDTO document);

        Task<ServiceResult> IsDocumentBlockedAsync(string documentId, UserDTO user);

        Task<ServiceResult> GetDraftDocumentListAsync(UserDTO userDTO, bool expired = false);

        Task<ServiceResult> GetSentDocumentListAsync(UserDTO userDTO, bool expired = false);

        Task<ServiceResult> GetReceivedDocumentsList(UserDTO userDTO, bool expired = false);

        Task<ServiceResult> GetReferredDocumentsList(UserDTO userDTO, bool expired = false);

        Task<ServiceResult> AssignDocumentToSomeoneAsync(AssignDocumentToSomeoneDTO assignDocumentToSomeone, UserDTO userDTO);

        Task<ServiceResult> GetDocumentsListByFilter(FilterDocumentDTO Model, UserDTO userDTO);

        Task<ServiceResult> GetOrganizationListAsync(string email);

        Task<ServiceResult> GetOrganizationCertificateDetailstAsync(string orgId);
        Task<ServiceResult> GetDocumentDisplayDetaildByIdAsync(string id);
        Task<ServiceResult> GetDocumentReportAsync(string docid);
        Task UpdateExpiredDocuments(string suid);
        Task<ServiceResult> GetAllSelfDocumentListAsync(UserDTO userDTO);
        ServiceResult DocumentFilterListAsync(AllDocumentListDTO listDTO, FilterDocumentDTO Model, UserDTO userDTO);
        Task<ServiceResult> DeleteAllDocumentsBySuidAsync(string suid);
        //Task<ServiceResult> GetPaginatedDraftDocumentListAsync(UserDTO userDTO, int pageNumber, int pageSize = 5);
        //Task<ServiceResult> GetPaginatedSentDocumentListAsync(UserDTO userDTO, int pageNumber, int pageSize = 5);
        //Task<ServiceResult> GetPaginatedReceivedDocumentsList(UserDTO userDTO, int pageNumber, int pageSize = 5);
        //Task<ServiceResult> GetPaginatedReferredDocumentsList(UserDTO userDTO, int pageNumber, int pageSize = 5);
        //Task<ServiceResult> GetDraftDocumentListByFilterAsync(UserDTO userDTO, DocumentListFilterDTO documentFilter);
        //Task<ServiceResult> GetSentDocumentListByFilterAsync(UserDTO userDTO, DocumentListFilterDTO documentFilter);
        //Task<ServiceResult> GetReceivedDocumentsListByFilterAsync(UserDTO userDTO, DocumentListFilterDTO documentFilter);
        //Task<ServiceResult> GetReferredDocumentsByFilterListAsync(UserDTO userDTO, DocumentListFilterDTO documentFilter);
        Task<ServiceResult> GetPaginatedDraftDocumentListByFilterAsync(UserDTO userDTO,
            DocumentListFilterDTO documentFilter, int pageNumber, int pageSize, bool isPagination, string searchTerm = null);
        Task<ServiceResult> GetPaginatedSentDocumentListByFilterAsync(UserDTO userDTO,
            DocumentListFilterDTO documentFilter, int pageNumber, int pageSize, bool isPagination, string searchTerm = null);

        Task<ServiceResult> GetPaginatedReferredDocumentsByFilterListAsync(UserDTO userDTO,
            DocumentListFilterDTO documentFilter, int pageNumber, int pageSize, bool isPagination, string searchTerm = null);
        Task<ServiceResult> GetPaginatedReceivedDocumentsListByFilterAsync(UserDTO userDTO,
            DocumentListFilterDTO documentFilter, int pageNumber, int pageSize, bool isPagination, string searchTerm = null);
        Task<ServiceResult> GetPaginatedDocumentsListByFilter(FilterDocumentDTO model, UserDTO userDTO,
            int pageNumber, int pageSize, string searchTerm = null);

        Task<ServiceResult> DashboardDocumentStatusAsync(UserDTO userDTO);

        Task<ServiceResult> GetReferredDocumentStatusCountAsync(UserDTO userDTO);

        Task<ServiceResult> GetReceivedDocumentStatusCountAsync(UserDTO userDTO);
        Task<ServiceResult> GetSentDocumentStatusCountAsync(UserDTO userDTO);
        Task<ServiceResult> GetMyDocumentStatusCountAsync(UserDTO userDTO);



    }
}

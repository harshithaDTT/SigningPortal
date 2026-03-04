using Microsoft.AspNetCore.Http;
using SigningPortal.Core.Domain.Services.Communication;
using SigningPortal.Core.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SigningPortal.Core.Domain.Services
{
	public interface IBulkSignService
	{
		//Task<ServiceResult> SaveBulksignConfigAsync(string templateId, UserDTO userDTO);

		Task<ServiceResult> GetBulkSigDataListAsync(UserDTO userDTO);
		Task<ServiceResult> GetBulkSigDataAsync(string corelationId);
		Task<ServiceResult> PrepareBulkSigningRequestAsync(string id, UserDTO userDTO);
		Task<ServiceResult> GetReceivedBulkSignListAsync(UserDTO user);
		Task<ServiceResult> SaveBulkSigningRequestAsync(string templateId, string transactionName, UserDTO userDTO, string? signerEmail = null);
		Task<ServiceResult> UpdateBulkSigningStatusAsync(string corelationId, bool forSigner);
		Task<ServiceResult> FailBulkSigningRequestAsync(string corelationId);
		Task<ServiceResult> GetBulkSignerListAsync(string OrgId);
		Task<ServiceResult> GetAgentUrlAsync(string OrgId);
		Task<ServiceResult> BulkSignCallBackAsync(BulkSignCallBackDTO bulkSignCallBackDTO);
		Task<ServiceResult> DownloadSignedDocumentAsync(string fileName, string corelationId);
		Task<ServiceResult> GetBulkSigDataListByTemplateIdAsync(string templateID);
		Task<ServiceResult> SaveBulkSigningRequestByPreparatorAsync(string templateId, string transactionName, string signerEmail, UserDTO userDTO);
		Task<ServiceResult> UpdateBulkSigningSourceDestinationAsync(PathDTO dto);
		ServiceResult GetFileConfigurationForBulkSignAsync();
		Task<ServiceResult> GetSentBulkSignListAsync(UserDTO user);
		Task<byte[]> DownloadBulkSignDocumentAsync(DownloadBulkSignDocumentDTO documentDownloadDTO, string url);
		Task<ServiceResult> VerifyPathsAsync(VerifyPathsDTO verifyPaths, string url);
		Task<ServiceResult> BulkSignFileData(BulkSignFileDataDTO dataobj, string url);
		Task<ServiceResult> SendBulkSignRequestAsync(SendBulkSignRequestDTO signingobj, string url);
		Task<ServiceResult> UpdateBulkSignStatus(string corelationId, string url);
		Task<ServiceResult> SendFiles(List<IFormFile> files, string corelationId);
		Task<ServiceResult> UpdateDocumentStatus(string correlationId);

		Task<ServiceResult> BulkSignAsync(SignDTO signDTO, string url, string idToken);
		// LOCAL BULK SIGNING SERVICES
		//Task<ServiceResult> SaveLocalBulkSigningRequestAsync(string templateId, string transactionName, UserDTO userDTO);
		//Task<ServiceResult> UpdateCompletedStatusAsync(string corelationId);
	}
}

namespace SigningPortal.Core.Domain.Services.Communication.SigningService
{
	// NOTE: Generated code may require at least .NET Framework 4.5 or .NET Core/Standard 2.0.
	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	[System.Xml.Serialization.XmlRootAttribute(Namespace = "http://dss.esig.europa.eu/validation/diagnostic", IsNullable = false)]
	public partial class DiagnosticData
	{

		private string documentNameField;

		private System.DateTime validationDateField;

		private DiagnosticDataSignature[] signaturesField;

		private DiagnosticDataCertificate[] usedCertificatesField;

		private object trustedListsField;

		/// <remarks/>
		public string DocumentName
		{
			get
			{
				return this.documentNameField;
			}
			set
			{
				this.documentNameField = value;
			}
		}

		/// <remarks/>
		public System.DateTime ValidationDate
		{
			get
			{
				return this.validationDateField;
			}
			set
			{
				this.validationDateField = value;
			}
		}

		/// <remarks/>
		[System.Xml.Serialization.XmlArrayItemAttribute("Signature", IsNullable = false)]
		public DiagnosticDataSignature[] Signatures
		{
			get
			{
				return this.signaturesField;
			}
			set
			{
				this.signaturesField = value;
			}
		}

		/// <remarks/>
		[System.Xml.Serialization.XmlArrayItemAttribute("Certificate", IsNullable = false)]
		public DiagnosticDataCertificate[] UsedCertificates
		{
			get
			{
				return this.usedCertificatesField;
			}
			set
			{
				this.usedCertificatesField = value;
			}
		}

		/// <remarks/>
		public object TrustedLists
		{
			get
			{
				return this.trustedListsField;
			}
			set
			{
				this.trustedListsField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	public partial class DiagnosticDataSignature
	{

		private string signatureFilenameField;

		private System.DateTime dateTimeField;

		private string signatureFormatField;

		private DiagnosticDataSignatureStructuralValidation structuralValidationField;

		private DiagnosticDataSignatureBasicSignature basicSignatureField;

		private DiagnosticDataSignatureSigningCertificate signingCertificateField;

		private DiagnosticDataSignatureCertificateChain certificateChainField;

		private string contentTypeField;

		private DiagnosticDataSignatureSignatureProductionPlace signatureProductionPlaceField;

		private object commitmentTypeIndicationField;

		private object claimedRolesField;

		private object timestampsField;

		private DiagnosticDataSignatureSignatureScopes signatureScopesField;

		private string idField;

		/// <remarks/>
		public string SignatureFilename
		{
			get
			{
				return this.signatureFilenameField;
			}
			set
			{
				this.signatureFilenameField = value;
			}
		}

		/// <remarks/>
		public System.DateTime DateTime
		{
			get
			{
				return this.dateTimeField;
			}
			set
			{
				this.dateTimeField = value;
			}
		}

		/// <remarks/>
		public string SignatureFormat
		{
			get
			{
				return this.signatureFormatField;
			}
			set
			{
				this.signatureFormatField = value;
			}
		}

		/// <remarks/>
		public DiagnosticDataSignatureStructuralValidation StructuralValidation
		{
			get
			{
				return this.structuralValidationField;
			}
			set
			{
				this.structuralValidationField = value;
			}
		}

		/// <remarks/>
		public DiagnosticDataSignatureBasicSignature BasicSignature
		{
			get
			{
				return this.basicSignatureField;
			}
			set
			{
				this.basicSignatureField = value;
			}
		}

		/// <remarks/>
		public DiagnosticDataSignatureSigningCertificate SigningCertificate
		{
			get
			{
				return this.signingCertificateField;
			}
			set
			{
				this.signingCertificateField = value;
			}
		}

		/// <remarks/>
		public DiagnosticDataSignatureCertificateChain CertificateChain
		{
			get
			{
				return this.certificateChainField;
			}
			set
			{
				this.certificateChainField = value;
			}
		}

		/// <remarks/>
		public string ContentType
		{
			get
			{
				return this.contentTypeField;
			}
			set
			{
				this.contentTypeField = value;
			}
		}

		/// <remarks/>
		public DiagnosticDataSignatureSignatureProductionPlace SignatureProductionPlace
		{
			get
			{
				return this.signatureProductionPlaceField;
			}
			set
			{
				this.signatureProductionPlaceField = value;
			}
		}

		/// <remarks/>
		public object CommitmentTypeIndication
		{
			get
			{
				return this.commitmentTypeIndicationField;
			}
			set
			{
				this.commitmentTypeIndicationField = value;
			}
		}

		/// <remarks/>
		public object ClaimedRoles
		{
			get
			{
				return this.claimedRolesField;
			}
			set
			{
				this.claimedRolesField = value;
			}
		}

		/// <remarks/>
		public object Timestamps
		{
			get
			{
				return this.timestampsField;
			}
			set
			{
				this.timestampsField = value;
			}
		}

		/// <remarks/>
		public DiagnosticDataSignatureSignatureScopes SignatureScopes
		{
			get
			{
				return this.signatureScopesField;
			}
			set
			{
				this.signatureScopesField = value;
			}
		}

		/// <remarks/>
		[System.Xml.Serialization.XmlAttributeAttribute()]
		public string Id
		{
			get
			{
				return this.idField;
			}
			set
			{
				this.idField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	public partial class DiagnosticDataSignatureStructuralValidation
	{

		private bool validField;

		/// <remarks/>
		public bool Valid
		{
			get
			{
				return this.validField;
			}
			set
			{
				this.validField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	public partial class DiagnosticDataSignatureBasicSignature
	{

		private string encryptionAlgoUsedToSignThisTokenField;

		private ushort keyLengthUsedToSignThisTokenField;

		private string digestAlgoUsedToSignThisTokenField;

		private bool referenceDataFoundField;

		private bool referenceDataIntactField;

		private bool signatureIntactField;

		private bool signatureValidField;

		/// <remarks/>
		public string EncryptionAlgoUsedToSignThisToken
		{
			get
			{
				return this.encryptionAlgoUsedToSignThisTokenField;
			}
			set
			{
				this.encryptionAlgoUsedToSignThisTokenField = value;
			}
		}

		/// <remarks/>
		public ushort KeyLengthUsedToSignThisToken
		{
			get
			{
				return this.keyLengthUsedToSignThisTokenField;
			}
			set
			{
				this.keyLengthUsedToSignThisTokenField = value;
			}
		}

		/// <remarks/>
		public string DigestAlgoUsedToSignThisToken
		{
			get
			{
				return this.digestAlgoUsedToSignThisTokenField;
			}
			set
			{
				this.digestAlgoUsedToSignThisTokenField = value;
			}
		}

		/// <remarks/>
		public bool ReferenceDataFound
		{
			get
			{
				return this.referenceDataFoundField;
			}
			set
			{
				this.referenceDataFoundField = value;
			}
		}

		/// <remarks/>
		public bool ReferenceDataIntact
		{
			get
			{
				return this.referenceDataIntactField;
			}
			set
			{
				this.referenceDataIntactField = value;
			}
		}

		/// <remarks/>
		public bool SignatureIntact
		{
			get
			{
				return this.signatureIntactField;
			}
			set
			{
				this.signatureIntactField = value;
			}
		}

		/// <remarks/>
		public bool SignatureValid
		{
			get
			{
				return this.signatureValidField;
			}
			set
			{
				this.signatureValidField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	public partial class DiagnosticDataSignatureSigningCertificate
	{

		private bool attributePresentField;

		private bool digestValuePresentField;

		private bool digestValueMatchField;

		private bool issuerSerialMatchField;

		private string idField;

		/// <remarks/>
		public bool AttributePresent
		{
			get
			{
				return this.attributePresentField;
			}
			set
			{
				this.attributePresentField = value;
			}
		}

		/// <remarks/>
		public bool DigestValuePresent
		{
			get
			{
				return this.digestValuePresentField;
			}
			set
			{
				this.digestValuePresentField = value;
			}
		}

		/// <remarks/>
		public bool DigestValueMatch
		{
			get
			{
				return this.digestValueMatchField;
			}
			set
			{
				this.digestValueMatchField = value;
			}
		}

		/// <remarks/>
		public bool IssuerSerialMatch
		{
			get
			{
				return this.issuerSerialMatchField;
			}
			set
			{
				this.issuerSerialMatchField = value;
			}
		}

		/// <remarks/>
		[System.Xml.Serialization.XmlAttributeAttribute()]
		public string Id
		{
			get
			{
				return this.idField;
			}
			set
			{
				this.idField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	public partial class DiagnosticDataSignatureCertificateChain
	{

		private DiagnosticDataSignatureCertificateChainChainItem chainItemField;

		/// <remarks/>
		public DiagnosticDataSignatureCertificateChainChainItem ChainItem
		{
			get
			{
				return this.chainItemField;
			}
			set
			{
				this.chainItemField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	public partial class DiagnosticDataSignatureCertificateChainChainItem
	{

		private string sourceField;

		private string idField;

		/// <remarks/>
		public string Source
		{
			get
			{
				return this.sourceField;
			}
			set
			{
				this.sourceField = value;
			}
		}

		/// <remarks/>
		[System.Xml.Serialization.XmlAttributeAttribute()]
		public string Id
		{
			get
			{
				return this.idField;
			}
			set
			{
				this.idField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	public partial class DiagnosticDataSignatureSignatureProductionPlace
	{

		private string countryNameField;

		/// <remarks/>
		public string CountryName
		{
			get
			{
				return this.countryNameField;
			}
			set
			{
				this.countryNameField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	public partial class DiagnosticDataSignatureSignatureScopes
	{

		private DiagnosticDataSignatureSignatureScopesSignatureScope signatureScopeField;

		/// <remarks/>
		public DiagnosticDataSignatureSignatureScopesSignatureScope SignatureScope
		{
			get
			{
				return this.signatureScopeField;
			}
			set
			{
				this.signatureScopeField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	public partial class DiagnosticDataSignatureSignatureScopesSignatureScope
	{

		private string nameField;

		private string scopeField;

		private string valueField;

		/// <remarks/>
		[System.Xml.Serialization.XmlAttributeAttribute()]
		public string name
		{
			get
			{
				return this.nameField;
			}
			set
			{
				this.nameField = value;
			}
		}

		/// <remarks/>
		[System.Xml.Serialization.XmlAttributeAttribute()]
		public string scope
		{
			get
			{
				return this.scopeField;
			}
			set
			{
				this.scopeField = value;
			}
		}

		/// <remarks/>
		[System.Xml.Serialization.XmlTextAttribute()]
		public string Value
		{
			get
			{
				return this.valueField;
			}
			set
			{
				this.valueField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	public partial class DiagnosticDataCertificate
	{

		private DiagnosticDataCertificateSubjectDistinguishedName[] subjectDistinguishedNameField;

		private DiagnosticDataCertificateIssuerDistinguishedName[] issuerDistinguishedNameField;

		private string serialNumberField;

		private string commonNameField;

		private string countryNameField;

		private string organizationalUnitField;

		private object authorityInformationAccessUrlsField;

		private DiagnosticDataCertificateCRLDistributionPoints cRLDistributionPointsField;

		private string[] oCSPAccessUrlsField;

		private DiagnosticDataCertificateDigestAlgoAndValues digestAlgoAndValuesField;

		private System.DateTime notAfterField;

		private System.DateTime notBeforeField;

		private ushort publicKeySizeField;

		private string publicKeyEncryptionAlgoField;

		private string[] keyUsageBitsField;

		private bool idKpOCSPSigningField;

		private bool idPkixOcspNoCheckField;

		private DiagnosticDataCertificateBasicSignature basicSignatureField;

		private object certificateChainField;

		private bool trustedField;

		private bool selfSignedField;

		private string[] certificatePolicyIdsField;

		private object qCStatementIdsField;

		private object qCTypesField;

		private object trustedServiceProvidersField;

		private object revocationsField;

		private DiagnosticDataCertificateInfo infoField;

		private string idField;

		/// <remarks/>
		[System.Xml.Serialization.XmlElementAttribute("SubjectDistinguishedName")]
		public DiagnosticDataCertificateSubjectDistinguishedName[] SubjectDistinguishedName
		{
			get
			{
				return this.subjectDistinguishedNameField;
			}
			set
			{
				this.subjectDistinguishedNameField = value;
			}
		}

		/// <remarks/>
		[System.Xml.Serialization.XmlElementAttribute("IssuerDistinguishedName")]
		public DiagnosticDataCertificateIssuerDistinguishedName[] IssuerDistinguishedName
		{
			get
			{
				return this.issuerDistinguishedNameField;
			}
			set
			{
				this.issuerDistinguishedNameField = value;
			}
		}

		/// <remarks/>
		[System.Xml.Serialization.XmlElementAttribute(DataType = "integer")]
		public string SerialNumber
		{
			get
			{
				return this.serialNumberField;
			}
			set
			{
				this.serialNumberField = value;
			}
		}

		/// <remarks/>
		public string CommonName
		{
			get
			{
				return this.commonNameField;
			}
			set
			{
				this.commonNameField = value;
			}
		}

		/// <remarks/>
		public string CountryName
		{
			get
			{
				return this.countryNameField;
			}
			set
			{
				this.countryNameField = value;
			}
		}

		/// <remarks/>
		public string OrganizationalUnit
		{
			get
			{
				return this.organizationalUnitField;
			}
			set
			{
				this.organizationalUnitField = value;
			}
		}

		/// <remarks/>
		public object AuthorityInformationAccessUrls
		{
			get
			{
				return this.authorityInformationAccessUrlsField;
			}
			set
			{
				this.authorityInformationAccessUrlsField = value;
			}
		}

		/// <remarks/>
		public DiagnosticDataCertificateCRLDistributionPoints CRLDistributionPoints
		{
			get
			{
				return this.cRLDistributionPointsField;
			}
			set
			{
				this.cRLDistributionPointsField = value;
			}
		}

		/// <remarks/>
		[System.Xml.Serialization.XmlArrayItemAttribute("Url", IsNullable = false)]
		public string[] OCSPAccessUrls
		{
			get
			{
				return this.oCSPAccessUrlsField;
			}
			set
			{
				this.oCSPAccessUrlsField = value;
			}
		}

		/// <remarks/>
		public DiagnosticDataCertificateDigestAlgoAndValues DigestAlgoAndValues
		{
			get
			{
				return this.digestAlgoAndValuesField;
			}
			set
			{
				this.digestAlgoAndValuesField = value;
			}
		}

		/// <remarks/>
		public System.DateTime NotAfter
		{
			get
			{
				return this.notAfterField;
			}
			set
			{
				this.notAfterField = value;
			}
		}

		/// <remarks/>
		public System.DateTime NotBefore
		{
			get
			{
				return this.notBeforeField;
			}
			set
			{
				this.notBeforeField = value;
			}
		}

		/// <remarks/>
		public ushort PublicKeySize
		{
			get
			{
				return this.publicKeySizeField;
			}
			set
			{
				this.publicKeySizeField = value;
			}
		}

		/// <remarks/>
		public string PublicKeyEncryptionAlgo
		{
			get
			{
				return this.publicKeyEncryptionAlgoField;
			}
			set
			{
				this.publicKeyEncryptionAlgoField = value;
			}
		}

		/// <remarks/>
		[System.Xml.Serialization.XmlArrayItemAttribute("KeyUsage", IsNullable = false)]
		public string[] KeyUsageBits
		{
			get
			{
				return this.keyUsageBitsField;
			}
			set
			{
				this.keyUsageBitsField = value;
			}
		}

		/// <remarks/>
		public bool IdKpOCSPSigning
		{
			get
			{
				return this.idKpOCSPSigningField;
			}
			set
			{
				this.idKpOCSPSigningField = value;
			}
		}

		/// <remarks/>
		public bool IdPkixOcspNoCheck
		{
			get
			{
				return this.idPkixOcspNoCheckField;
			}
			set
			{
				this.idPkixOcspNoCheckField = value;
			}
		}

		/// <remarks/>
		public DiagnosticDataCertificateBasicSignature BasicSignature
		{
			get
			{
				return this.basicSignatureField;
			}
			set
			{
				this.basicSignatureField = value;
			}
		}

		/// <remarks/>
		public object CertificateChain
		{
			get
			{
				return this.certificateChainField;
			}
			set
			{
				this.certificateChainField = value;
			}
		}

		/// <remarks/>
		public bool Trusted
		{
			get
			{
				return this.trustedField;
			}
			set
			{
				this.trustedField = value;
			}
		}

		/// <remarks/>
		public bool SelfSigned
		{
			get
			{
				return this.selfSignedField;
			}
			set
			{
				this.selfSignedField = value;
			}
		}

		/// <remarks/>
		[System.Xml.Serialization.XmlArrayItemAttribute("oid", IsNullable = false)]
		public string[] CertificatePolicyIds
		{
			get
			{
				return this.certificatePolicyIdsField;
			}
			set
			{
				this.certificatePolicyIdsField = value;
			}
		}

		/// <remarks/>
		public object QCStatementIds
		{
			get
			{
				return this.qCStatementIdsField;
			}
			set
			{
				this.qCStatementIdsField = value;
			}
		}

		/// <remarks/>
		public object QCTypes
		{
			get
			{
				return this.qCTypesField;
			}
			set
			{
				this.qCTypesField = value;
			}
		}

		/// <remarks/>
		public object TrustedServiceProviders
		{
			get
			{
				return this.trustedServiceProvidersField;
			}
			set
			{
				this.trustedServiceProvidersField = value;
			}
		}

		/// <remarks/>
		public object Revocations
		{
			get
			{
				return this.revocationsField;
			}
			set
			{
				this.revocationsField = value;
			}
		}

		/// <remarks/>
		public DiagnosticDataCertificateInfo Info
		{
			get
			{
				return this.infoField;
			}
			set
			{
				this.infoField = value;
			}
		}

		/// <remarks/>
		[System.Xml.Serialization.XmlAttributeAttribute()]
		public string Id
		{
			get
			{
				return this.idField;
			}
			set
			{
				this.idField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	public partial class DiagnosticDataCertificateSubjectDistinguishedName
	{

		private string formatField;

		private string valueField;

		/// <remarks/>
		[System.Xml.Serialization.XmlAttributeAttribute()]
		public string Format
		{
			get
			{
				return this.formatField;
			}
			set
			{
				this.formatField = value;
			}
		}

		/// <remarks/>
		[System.Xml.Serialization.XmlTextAttribute()]
		public string Value
		{
			get
			{
				return this.valueField;
			}
			set
			{
				this.valueField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	public partial class DiagnosticDataCertificateIssuerDistinguishedName
	{

		private string formatField;

		private string valueField;

		/// <remarks/>
		[System.Xml.Serialization.XmlAttributeAttribute()]
		public string Format
		{
			get
			{
				return this.formatField;
			}
			set
			{
				this.formatField = value;
			}
		}

		/// <remarks/>
		[System.Xml.Serialization.XmlTextAttribute()]
		public string Value
		{
			get
			{
				return this.valueField;
			}
			set
			{
				this.valueField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	public partial class DiagnosticDataCertificateCRLDistributionPoints
	{

		private string urlField;

		/// <remarks/>
		public string Url
		{
			get
			{
				return this.urlField;
			}
			set
			{
				this.urlField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	public partial class DiagnosticDataCertificateDigestAlgoAndValues
	{

		private DiagnosticDataCertificateDigestAlgoAndValuesDigestAlgoAndValue digestAlgoAndValueField;

		/// <remarks/>
		public DiagnosticDataCertificateDigestAlgoAndValuesDigestAlgoAndValue DigestAlgoAndValue
		{
			get
			{
				return this.digestAlgoAndValueField;
			}
			set
			{
				this.digestAlgoAndValueField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	public partial class DiagnosticDataCertificateDigestAlgoAndValuesDigestAlgoAndValue
	{

		private string digestMethodField;

		private string digestValueField;

		/// <remarks/>
		public string DigestMethod
		{
			get
			{
				return this.digestMethodField;
			}
			set
			{
				this.digestMethodField = value;
			}
		}

		/// <remarks/>
		public string DigestValue
		{
			get
			{
				return this.digestValueField;
			}
			set
			{
				this.digestValueField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	public partial class DiagnosticDataCertificateBasicSignature
	{

		private string encryptionAlgoUsedToSignThisTokenField;

		private string keyLengthUsedToSignThisTokenField;

		private string digestAlgoUsedToSignThisTokenField;

		private bool referenceDataFoundField;

		private bool referenceDataIntactField;

		private bool signatureIntactField;

		private bool signatureValidField;

		/// <remarks/>
		public string EncryptionAlgoUsedToSignThisToken
		{
			get
			{
				return this.encryptionAlgoUsedToSignThisTokenField;
			}
			set
			{
				this.encryptionAlgoUsedToSignThisTokenField = value;
			}
		}

		/// <remarks/>
		public string KeyLengthUsedToSignThisToken
		{
			get
			{
				return this.keyLengthUsedToSignThisTokenField;
			}
			set
			{
				this.keyLengthUsedToSignThisTokenField = value;
			}
		}

		/// <remarks/>
		public string DigestAlgoUsedToSignThisToken
		{
			get
			{
				return this.digestAlgoUsedToSignThisTokenField;
			}
			set
			{
				this.digestAlgoUsedToSignThisTokenField = value;
			}
		}

		/// <remarks/>
		public bool ReferenceDataFound
		{
			get
			{
				return this.referenceDataFoundField;
			}
			set
			{
				this.referenceDataFoundField = value;
			}
		}

		/// <remarks/>
		public bool ReferenceDataIntact
		{
			get
			{
				return this.referenceDataIntactField;
			}
			set
			{
				this.referenceDataIntactField = value;
			}
		}

		/// <remarks/>
		public bool SignatureIntact
		{
			get
			{
				return this.signatureIntactField;
			}
			set
			{
				this.signatureIntactField = value;
			}
		}

		/// <remarks/>
		public bool SignatureValid
		{
			get
			{
				return this.signatureValidField;
			}
			set
			{
				this.signatureValidField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	public partial class DiagnosticDataCertificateInfo
	{

		private DiagnosticDataCertificateInfoMessage messageField;

		/// <remarks/>
		public DiagnosticDataCertificateInfoMessage Message
		{
			get
			{
				return this.messageField;
			}
			set
			{
				this.messageField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/diagnostic")]
	public partial class DiagnosticDataCertificateInfoMessage
	{

		private byte idField;

		private string valueField;

		/// <remarks/>
		[System.Xml.Serialization.XmlAttributeAttribute()]
		public byte Id
		{
			get
			{
				return this.idField;
			}
			set
			{
				this.idField = value;
			}
		}

		/// <remarks/>
		[System.Xml.Serialization.XmlTextAttribute()]
		public string Value
		{
			get
			{
				return this.valueField;
			}
			set
			{
				this.valueField = value;
			}
		}
	}


}

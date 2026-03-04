namespace SigningPortal.Core.Domain.Services.Communication.SigningService
{

	// NOTE: Generated code may require at least .NET Framework 4.5 or .NET Core/Standard 2.0.
	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/simple-report")]
	[System.Xml.Serialization.XmlRootAttribute(Namespace = "http://dss.esig.europa.eu/validation/simple-report", IsNullable = false)]
	public partial class SimpleReport
	{

		private SimpleReportPolicy policyField;

		private System.DateTime validationTimeField;

		private string documentNameField;

		private byte validSignaturesCountField;

		private byte signaturesCountField;

		private SimpleReportSignature signatureField;

		/// <remarks/>
		public SimpleReportPolicy Policy
		{
			get
			{
				return this.policyField;
			}
			set
			{
				this.policyField = value;
			}
		}

		/// <remarks/>
		public System.DateTime ValidationTime
		{
			get
			{
				return this.validationTimeField;
			}
			set
			{
				this.validationTimeField = value;
			}
		}

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
		public byte ValidSignaturesCount
		{
			get
			{
				return this.validSignaturesCountField;
			}
			set
			{
				this.validSignaturesCountField = value;
			}
		}

		/// <remarks/>
		public byte SignaturesCount
		{
			get
			{
				return this.signaturesCountField;
			}
			set
			{
				this.signaturesCountField = value;
			}
		}

		/// <remarks/>
		public SimpleReportSignature Signature
		{
			get
			{
				return this.signatureField;
			}
			set
			{
				this.signatureField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/simple-report")]
	public partial class SimpleReportPolicy
	{

		private string policyNameField;

		private string policyDescriptionField;

		/// <remarks/>
		public string PolicyName
		{
			get
			{
				return this.policyNameField;
			}
			set
			{
				this.policyNameField = value;
			}
		}

		/// <remarks/>
		public string PolicyDescription
		{
			get
			{
				return this.policyDescriptionField;
			}
			set
			{
				this.policyDescriptionField = value;
			}
		}
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/simple-report")]
	public partial class SimpleReportSignature
	{

		private System.DateTime signingTimeField;

		private string signedByField;

		private SimpleReportSignatureSignatureLevel signatureLevelField;

		private string indicationField;

		private string subIndicationField;

		private string[] errorsField;

		private string warningsField;

		private SimpleReportSignatureSignatureScope signatureScopeField;

		private string idField;

		private string signatureFormatField;

		/// <remarks/>
		public System.DateTime SigningTime
		{
			get
			{
				return this.signingTimeField;
			}
			set
			{
				this.signingTimeField = value;
			}
		}

		/// <remarks/>
		public string SignedBy
		{
			get
			{
				return this.signedByField;
			}
			set
			{
				this.signedByField = value;
			}
		}

		/// <remarks/>
		public SimpleReportSignatureSignatureLevel SignatureLevel
		{
			get
			{
				return this.signatureLevelField;
			}
			set
			{
				this.signatureLevelField = value;
			}
		}

		/// <remarks/>
		public string Indication
		{
			get
			{
				return this.indicationField;
			}
			set
			{
				this.indicationField = value;
			}
		}

		/// <remarks/>
		public string SubIndication
		{
			get
			{
				return this.subIndicationField;
			}
			set
			{
				this.subIndicationField = value;
			}
		}

		/// <remarks/>
		[System.Xml.Serialization.XmlElementAttribute("Errors")]
		public string[] Errors
		{
			get
			{
				return this.errorsField;
			}
			set
			{
				this.errorsField = value;
			}
		}

		/// <remarks/>
		public string Warnings
		{
			get
			{
				return this.warningsField;
			}
			set
			{
				this.warningsField = value;
			}
		}

		/// <remarks/>
		public SimpleReportSignatureSignatureScope SignatureScope
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

		/// <remarks/>
		[System.Xml.Serialization.XmlAttributeAttribute()]
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
	}

	/// <remarks/>
	[System.SerializableAttribute()]
	[System.ComponentModel.DesignerCategoryAttribute("code")]
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/simple-report")]
	public partial class SimpleReportSignatureSignatureLevel
	{

		private string descriptionField;

		private string valueField;

		/// <remarks/>
		[System.Xml.Serialization.XmlAttributeAttribute()]
		public string description
		{
			get
			{
				return this.descriptionField;
			}
			set
			{
				this.descriptionField = value;
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
	[System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "http://dss.esig.europa.eu/validation/simple-report")]
	public partial class SimpleReportSignatureSignatureScope
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


}


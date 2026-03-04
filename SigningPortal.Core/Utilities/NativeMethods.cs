using System;
using System.Runtime.InteropServices;

namespace SigningPortal.Core.Utilities
{
	internal static class NativeMethods
	{
		private const string DLL_PATH = "PKIServiceNativeUtils.dll";
		private const string PKI_SERVICE_DLL_PATH = "PKIService.dll";
		private const string MONITOR_PATH = "Sentrydll.dll";
		//private const string MONITOR_PATH = "libSentrysobuild.so";
		//private const string PKI_SERVICE_DLL_PATH = "libPKIService.so";
		//private const string DLL_PATH = "libPKIServiceNativeUtils.so";

		[DllImport(DLL_PATH,
				BestFitMapping = false, CallingConvention = CallingConvention.Cdecl,
				CharSet = CharSet.Ansi, EntryPoint = "InitializeNativeUtils",
				ThrowOnUnmappableChar = true)]
		internal static extern int InitializePKINative();

		[DllImport(DLL_PATH,
		   BestFitMapping = false, CallingConvention = CallingConvention.Cdecl,
		   CharSet = CharSet.Ansi, EntryPoint = "PKIAddChecksumToTransaction",
		   ThrowOnUnmappableChar = true)]
		internal static extern int AddChecksumNative(
		   [MarshalAs(UnmanagedType.LPStr)] string data,
		   int dataLength,
		   ref IntPtr checksum,
		   ref int checksumLength);

		[DllImport(DLL_PATH,
		   BestFitMapping = false, CallingConvention = CallingConvention.Cdecl,
		   CharSet = CharSet.Ansi, EntryPoint = "PKIVerifyChecksumOfTransaction",
		   ThrowOnUnmappableChar = true)]
		internal static extern int VerifyChecksumNative(
		   [MarshalAs(UnmanagedType.LPStr)] string data,
		   int dataLength);

		[DllImport(DLL_PATH,
		   BestFitMapping = false, CallingConvention = CallingConvention.Cdecl,
		   CharSet = CharSet.Ansi, EntryPoint = "PKIWrapSecureData",
		   ThrowOnUnmappableChar = true)]
		internal static extern int PKIWrapSecureDataNative(
		   [MarshalAs(UnmanagedType.LPStr)] string plainData,
		   int dataLength,
		   int fileFormatVersion,
		   int fileContentVersion,
		   int configType,
		   ref IntPtr wrappedData,
		   ref int wrappedDataLength);

		[DllImport(DLL_PATH,
			BestFitMapping = false, CallingConvention = CallingConvention.Cdecl,
			CharSet = CharSet.Ansi, EntryPoint = "CleanupNativeUtils",
			ThrowOnUnmappableChar = true)]
		internal static extern int CleanupPKINative();

		[DllImport(DLL_PATH,
			BestFitMapping = false, CallingConvention = CallingConvention.Cdecl,
			CharSet = CharSet.Ansi, EntryPoint = "PKINativeUtilsGetStatusMessage",
			ThrowOnUnmappableChar = true)]
		internal static extern IntPtr GetStatusMessagePKINative(int errorCode);

		[DllImport(DLL_PATH,
			BestFitMapping = false, CallingConvention = CallingConvention.Cdecl,
			CharSet = CharSet.Ansi, EntryPoint = "PKIFreeMemory",
			ThrowOnUnmappableChar = true)]
		internal static extern int FreeMemoryPKINative(
			IntPtr buffer);


		[DllImport(DLL_PATH,
		   BestFitMapping = false, CallingConvention = CallingConvention.Cdecl,
		   CharSet = CharSet.Ansi, EntryPoint = "PKICreateSecureWireData",
		   ThrowOnUnmappableChar = true)]
		internal static extern int PKICreateSecureWireDataNative(
		   [MarshalAs(UnmanagedType.LPStr)] string plainData,
		   int dataLength,
		   ref IntPtr SecureWireData,
		   ref int SecureWireDataLength);

		[DllImport(DLL_PATH,
		   BestFitMapping = false, CallingConvention = CallingConvention.Cdecl,
		   CharSet = CharSet.Ansi, EntryPoint = "PKIDecryptSecureWireData",
		   ThrowOnUnmappableChar = true)]
		internal static extern int PKIDecryptSecureWireDataNative(
		   [MarshalAs(UnmanagedType.LPStr)] string secureWireData,
		   int secureWireDataLength,
		   ref IntPtr plainData,
		   ref int plainDataLength);

		[DllImport(PKI_SERVICE_DLL_PATH,
			BestFitMapping = false, CallingConvention = CallingConvention.Cdecl,
			CharSet = CharSet.Ansi, EntryPoint = "GenerateTimestampEx",
			ThrowOnUnmappableChar = true)]
		internal static extern int GenerateTimestampNative(
			[MarshalAs(UnmanagedType.LPArray)] byte[] timestampRequest,
			int timestampRequestLength,
			ref IntPtr response,
			ref int responseLength);

		[DllImport(PKI_SERVICE_DLL_PATH,
			BestFitMapping = false, CallingConvention = CallingConvention.Cdecl,
			CharSet = CharSet.Ansi, EntryPoint = "GenerateTimestamp",
			ThrowOnUnmappableChar = true)]
		internal static extern int POSDigiTimeStampNative(
			[MarshalAs(UnmanagedType.LPArray)] byte[] timestampRequest,
			int timestampRequestLength,
			ref IntPtr response,
			ref int responseLength);

		[DllImport(DLL_PATH,
		   BestFitMapping = false, CallingConvention = CallingConvention.Cdecl,
		   CharSet = CharSet.Ansi, EntryPoint = "PKIValidateAndGetLicenseData",
		   ThrowOnUnmappableChar = true)]
		internal static extern int PKIValidateAndGetLicenseData(
		   [MarshalAs(UnmanagedType.LPStr)] string path,
		   ref int numberOfSubscribers,
		   ref int numberOfCertificates,
		   ref int numberOfOnboardings);

		[DllImport(MONITOR_PATH,
			BestFitMapping = false, CallingConvention = CallingConvention.Cdecl,
			CharSet = CharSet.Ansi, EntryPoint = "initializeSentry",
			ThrowOnUnmappableChar = true)]
		internal static extern int InitializeSentry(
			[MarshalAs(UnmanagedType.LPStr)] string dsn,
			[MarshalAs(UnmanagedType.LPStr)] string environment,
			[MarshalAs(UnmanagedType.LPStr)] string release,
			[MarshalAs(UnmanagedType.LPStr)] string dbPath,
		double sampleRate);

		[DllImport(MONITOR_PATH,
			BestFitMapping = false, CallingConvention = CallingConvention.Cdecl,
			CharSet = CharSet.Ansi, EntryPoint = "logMessageSentry",
			ThrowOnUnmappableChar = true)]
		internal static extern int LogMessageSentry(
			[MarshalAs(UnmanagedType.LPStr)] string error_level,
			[MarshalAs(UnmanagedType.LPStr)] string error_message);

		[DllImport(MONITOR_PATH,
			BestFitMapping = false, CallingConvention = CallingConvention.Cdecl,
			CharSet = CharSet.Ansi, EntryPoint = "reportErrorSentry",
			ThrowOnUnmappableChar = true)]
		internal static extern int ReportErrorSentry(
			[MarshalAs(UnmanagedType.LPStr)] string error_type,
			[MarshalAs(UnmanagedType.LPStr)] string error_message);

		[DllImport(MONITOR_PATH,
			BestFitMapping = false, CallingConvention = CallingConvention.Cdecl,
			CharSet = CharSet.Ansi, EntryPoint = "shutdownSentry",
			ThrowOnUnmappableChar = true)]
		public static extern void ShutdownSentry();
	}
}

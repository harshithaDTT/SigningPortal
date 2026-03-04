using System;

namespace SigningPortal.Core.Utilities
{
	public interface ILogClient
	{
		public int SendSigningPortalLogMessage(LogMessage LogMessage);
		int SendLog(string Suid, string serviceName,
			DateTime startTime, string MessageForLog, string logMessageType);
        void Dispose();
    }
}


public class BulkSignCallBackDTO
{
	public string CorrelationId { get; set; }
	public Result Result { get; set; }
}

public class Result
{
	public int TotalFileCount { get; set; }
	public int FailedFileCount { get; set; }
	public int SuccessFileCount { get; set; }
	public Filearray[] FileArray { get; set; }
}

public class Filearray
{
	public string FileName { get; set; }
	public string Status { get; set; }
}

namespace CvBuilder.Backend.Configuration;

public class MongoDbOptions
{
    public const string SectionName = "MongoDb";

    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = "cvbuilder";
    public string CvDocumentsCollection { get; set; } = "cv_documents";
    public string UsersCollection { get; set; } = "users";
    public string AgentSettingsCollection { get; set; } = "agent_settings";
}

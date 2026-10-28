using MongoDB.Bson.Serialization.Attributes;

namespace CvBuilder.Backend.Models;

/// <summary>
/// Stores custom connection configurations for an individual AI agent.
/// </summary>
public class AgentSetting
{
    [BsonId]
    [BsonElement("agentName")]
    public string AgentName { get; set; } = string.Empty;

    [BsonElement("endpoint")]
    public string Endpoint { get; set; } = string.Empty;

    [BsonElement("model")]
    public string Model { get; set; } = string.Empty;

    [BsonElement("apiKey")]
    public string ApiKey { get; set; } = string.Empty;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

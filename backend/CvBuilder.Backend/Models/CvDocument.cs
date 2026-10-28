using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CvBuilder.Backend.Models;

public class CvDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public Guid Id { get; set; } = Guid.NewGuid();

    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("title")]
    public string Title { get; set; } = "My CV";

    [BsonElement("templateKey")]
    public string TemplateKey { get; set; } = "classic";

    [BsonElement("payload")]
    public CvPayload Payload { get; set; } = new();

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("isBase")]
    public bool IsBase { get; set; } = false;
}

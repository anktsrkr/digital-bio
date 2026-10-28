using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CvBuilder.Backend.Models;

public class UserProfile
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public Guid Id { get; set; } = Guid.NewGuid();

    [BsonElement("clerkUserId")]
    public string ClerkUserId { get; set; } = string.Empty;

    [BsonElement("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("preferences")]
    public List<string> Preferences { get; set; } = [];

    [BsonElement("coverLetterHighlights")]
    public List<string> CoverLetterHighlights { get; set; } = [];
}

using MongoDB.Bson.Serialization.Attributes;

namespace CvBuilder.Backend.Models;

/// <summary>Top-level container for the editable CV sections.</summary>
public sealed class CvPayload
{
    [BsonElement("personal")]
    public CvPersonal Personal { get; set; } = new();

    [BsonElement("summary")]
    public string Summary { get; set; } = string.Empty;

    /// <summary>
    /// Cross-career highlight bullets for the standalone "Key Achievements" section.
    /// </summary>
    [BsonElement("keyAchievements")]
    public List<string> KeyAchievements { get; set; } = [];

    [BsonElement("workExperience")]
    public List<CvEmployer> WorkExperience { get; set; } = [];

    [BsonElement("education")]
    public List<CvEducationItem> Education { get; set; } = [];

    [BsonElement("skills")]
    public List<CvSkillItem> Skills { get; set; } = [];

    [BsonElement("certifications")]
    public List<CvCertificationItem> Certifications { get; set; } = [];

    [BsonElement("customSections")]
    public List<CvCustomSection> CustomSections { get; set; } = [];

    /// <summary>
    /// User-chosen render order of the top-level sections.
    /// Built-in keys: summary, achievements, skills, work, certifications, education
    /// Custom sections: custom:{id}
    /// </summary>
    [BsonElement("sectionOrder")]
    public List<string> SectionOrder { get; set; } = [];

    /// <summary>
    /// Canonical built-in section keys in their default order.
    /// </summary>
    public static readonly IReadOnlyList<string> DefaultSectionOrder =
    [
        "summary", "achievements", "skills", "work", "certifications", "education",
    ];
}

/// <summary>The candidate's contact block. Rendered at the top of the CV.</summary>
public sealed class CvPersonal
{
    [BsonElement("fullName")]
    public string FullName { get; set; } = string.Empty;

    [BsonElement("headline")]
    public string Headline { get; set; } = string.Empty;

    [BsonElement("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("phone")]
    public string Phone { get; set; } = string.Empty;

    [BsonElement("location")]
    public string Location { get; set; } = string.Empty;

    [BsonElement("links")]
    public List<string> Links { get; set; } = [];
}

/// <summary>
/// A single employer entry in the work-experience hierarchy.
/// Case A: Engagements is non-empty.
/// Case B: Bullets is non-empty.
/// </summary>
public sealed class CvEmployer
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("role")]
    public string Role { get; set; } = string.Empty;

    [BsonElement("dates")]
    public string Dates { get; set; } = string.Empty;

    [BsonElement("location")]
    public string Location { get; set; } = string.Empty;

    [BsonElement("summary")]
    public string Summary { get; set; } = string.Empty;

    [BsonElement("engagements")]
    public List<CvClientEngagement> Engagements { get; set; } = [];

    [BsonElement("bullets")]
    public List<string> Bullets { get; set; } = [];
}

/// <summary>A single client engagement nested under an employer (Case A).</summary>
public sealed class CvClientEngagement
{
    [BsonElement("clientName")]
    public string ClientName { get; set; } = string.Empty;

    [BsonElement("roleContext")]
    public string RoleContext { get; set; } = string.Empty;

    [BsonElement("achievements")]
    public List<string> Achievements { get; set; } = [];
}

/// <summary>A single education entry.</summary>
public sealed class CvEducationItem
{
    [BsonElement("institution")]
    public string Institution { get; set; } = string.Empty;

    [BsonElement("qualification")]
    public string Qualification { get; set; } = string.Empty;

    [BsonElement("location")]
    public string Location { get; set; } = string.Empty;

    [BsonElement("start")]
    public string Start { get; set; } = string.Empty;

    [BsonElement("end")]
    public string End { get; set; } = string.Empty;

    [BsonElement("details")]
    public string Details { get; set; } = string.Empty;
}

/// <summary>A single skill.</summary>
public sealed class CvSkillItem
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("category")]
    public string? Category { get; set; }
}

/// <summary>A single certification.</summary>
public sealed class CvCertificationItem
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("issuer")]
    public string Issuer { get; set; } = string.Empty;

    [BsonElement("date")]
    public string Date { get; set; } = string.Empty;

    [BsonElement("url")]
    public string Url { get; set; } = string.Empty;
}

/// <summary>A user-defined free-form section.</summary>
public sealed class CvCustomSection
{
    [BsonElement("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("items")]
    public List<string> Items { get; set; } = [];
}

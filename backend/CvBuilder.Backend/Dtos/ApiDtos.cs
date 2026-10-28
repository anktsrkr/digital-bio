using System.Text.Json.Serialization;
using CvBuilder.Backend.Models;

namespace CvBuilder.Backend.Dtos;

// --- Sub-section DTOs --------------------------------------------------------

public sealed record CvPersonalDto(
    [property: JsonPropertyName("fullName")] string FullName,
    [property: JsonPropertyName("headline")] string Headline,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("phone")] string Phone,
    [property: JsonPropertyName("location")] string Location,
    [property: JsonPropertyName("links")] IReadOnlyList<string> Links)
{
    public static CvPersonalDto From(CvPersonal p) => new(
        p.FullName, p.Headline, p.Email, p.Phone, p.Location, p.Links);
}

public sealed record CvClientEngagementDto(
    [property: JsonPropertyName("clientName")] string ClientName,
    [property: JsonPropertyName("roleContext")] string RoleContext,
    [property: JsonPropertyName("achievements")] IReadOnlyList<string> Achievements)
{
    public static CvClientEngagementDto From(CvClientEngagement e) => new(
        e.ClientName, e.RoleContext, e.Achievements);
}

public sealed record CvEmployerDto(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("role")] string Role,
    [property: JsonPropertyName("dates")] string Dates,
    [property: JsonPropertyName("location")] string Location,
    [property: JsonPropertyName("summary")] string Summary,
    [property: JsonPropertyName("engagements")] IReadOnlyList<CvClientEngagementDto> Engagements,
    [property: JsonPropertyName("bullets")] IReadOnlyList<string> Bullets)
{
    public static CvEmployerDto From(CvEmployer w) => new(
        w.Name, w.Role, w.Dates, w.Location, w.Summary,
        (w.Engagements ?? []).Select(CvClientEngagementDto.From).ToArray(),
        w.Bullets ?? []);
}

public sealed record CvEducationItemDto(
    [property: JsonPropertyName("institution")] string Institution,
    [property: JsonPropertyName("qualification")] string Qualification,
    [property: JsonPropertyName("location")] string Location,
    [property: JsonPropertyName("start")] string Start,
    [property: JsonPropertyName("end")] string End,
    [property: JsonPropertyName("details")] string Details)
{
    public static CvEducationItemDto From(CvEducationItem e) => new(
        e.Institution, e.Qualification, e.Location, e.Start, e.End, e.Details);
}

public sealed record CvSkillItemDto(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("category")] string? Category)
{
    public static CvSkillItemDto From(CvSkillItem s) => new(s.Name, s.Category);
}

public sealed record CvCertificationItemDto(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("issuer")] string Issuer,
    [property: JsonPropertyName("date")] string Date,
    [property: JsonPropertyName("url")] string? Url = null)
{
    public static CvCertificationItemDto From(CvCertificationItem c) => new(c.Name, c.Issuer, c.Date, c.Url);
}

public sealed record CvCustomSectionDto(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("items")] IReadOnlyList<string> Items)
{
    public static CvCustomSectionDto From(CvCustomSection s) => new(s.Id, s.Title, s.Items ?? []);
}

public sealed record CvPayloadDto(
    [property: JsonPropertyName("personal")] CvPersonalDto Personal,
    [property: JsonPropertyName("summary")] string Summary,
    [property: JsonPropertyName("keyAchievements")] IReadOnlyList<string> KeyAchievements,
    [property: JsonPropertyName("workExperience")] IReadOnlyList<CvEmployerDto> WorkExperience,
    [property: JsonPropertyName("education")] IReadOnlyList<CvEducationItemDto> Education,
    [property: JsonPropertyName("skills")] IReadOnlyList<CvSkillItemDto> Skills,
    [property: JsonPropertyName("certifications")] IReadOnlyList<CvCertificationItemDto> Certifications,
    [property: JsonPropertyName("customSections")] IReadOnlyList<CvCustomSectionDto> CustomSections,
    [property: JsonPropertyName("sectionOrder")] IReadOnlyList<string> SectionOrder)
{
    public static CvPayloadDto From(CvPayload p) => new(
        CvPersonalDto.From(p.Personal ?? new CvPersonal()),
        p.Summary ?? string.Empty,
        p.KeyAchievements ?? [],
        (p.WorkExperience ?? []).Select(CvEmployerDto.From).ToArray(),
        (p.Education ?? []).Select(CvEducationItemDto.From).ToArray(),
        (p.Skills ?? []).Select(CvSkillItemDto.From).ToArray(),
        (p.Certifications ?? []).Select(CvCertificationItemDto.From).ToArray(),
        (p.CustomSections ?? []).Select(CvCustomSectionDto.From).ToArray(),
        p.SectionOrder ?? []);
}

// --- CV Documents ------------------------------------------------------------

public sealed record CvListItemDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("userId")] string UserId,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("templateKey")] string TemplateKey,
    [property: JsonPropertyName("createdAt")] DateTime CreatedAt,
    [property: JsonPropertyName("updatedAt")] DateTime UpdatedAt,
    [property: JsonPropertyName("isBase")] bool IsBase,
    [property: JsonPropertyName("candidateName")] string? CandidateName = null,
    [property: JsonPropertyName("summary")] string? Summary = null,
    [property: JsonPropertyName("payload")] CvPayloadDto? Payload = null)
{
    public static CvListItemDto From(CvDocument d) => new(
        d.Id,
        d.UserId,
        d.Title,
        d.TemplateKey,
        d.CreatedAt,
        d.UpdatedAt,
        d.IsBase,
        d.Payload?.Personal?.FullName,
        d.Payload?.Summary,
        d.Payload is null ? null : CvPayloadDto.From(d.Payload));
}

public sealed record CvDetailDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("userId")] string UserId,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("templateKey")] string TemplateKey,
    [property: JsonPropertyName("payload")] CvPayloadDto Payload,
    [property: JsonPropertyName("createdAt")] DateTime CreatedAt,
    [property: JsonPropertyName("updatedAt")] DateTime UpdatedAt,
    [property: JsonPropertyName("isBase")] bool IsBase)
{
    public static CvDetailDto From(CvDocument d) => new(
        d.Id,
        d.UserId,
        d.Title,
        d.TemplateKey,
        CvPayloadDto.From(d.Payload ?? new CvPayload()),
        d.CreatedAt,
        d.UpdatedAt,
        d.IsBase);
}

// Request to create a new CV draft
public sealed record CreateCvRequest(
    [property: JsonPropertyName("userId")] string? UserId,
    [property: JsonPropertyName("title")] string? Title,
    [property: JsonPropertyName("templateKey")] string? TemplateKey,
    [property: JsonPropertyName("payload")] CvPayloadDto? Payload);

// Request to update an existing CV
public sealed record UpdateCvRequest(
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("templateKey")] string TemplateKey,
    [property: JsonPropertyName("payload")] CvPayloadDto Payload);

// Request to rewrite an individual CV section
public sealed record ImproveSectionRequest(
    [property: JsonPropertyName("section")] string Section,
    [property: JsonPropertyName("employerIndex")] int? EmployerIndex = null,
    [property: JsonPropertyName("engagementIndex")] int? EngagementIndex = null,
    [property: JsonPropertyName("targetIndex")] int? TargetIndex = null)
{
    public int? EffectiveEmployerIndex => EmployerIndex ?? TargetIndex;
}

public sealed record ImproveSectionResponse(
    [property: JsonPropertyName("original")] string Original,
    [property: JsonPropertyName("improved")] string Improved,
    [property: JsonPropertyName("content")] string Content,
    [property: JsonPropertyName("section")] string Section,
    [property: JsonPropertyName("employerIndex")] int? EmployerIndex,
    [property: JsonPropertyName("engagementIndex")] int? EngagementIndex);

// --- User Profile ------------------------------------------------------------

public sealed record UserProfileDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("clerkUserId")] string ClerkUserId,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("createdAt")] DateTime CreatedAt,
    [property: JsonPropertyName("updatedAt")] DateTime UpdatedAt,
    [property: JsonPropertyName("preferences")] IReadOnlyList<string> Preferences,
    [property: JsonPropertyName("coverLetterHighlights")] IReadOnlyList<string> CoverLetterHighlights)
{
    public static UserProfileDto From(UserProfile u) => new(
        u.Id,
        u.ClerkUserId,
        u.Email,
        u.Name,
        u.CreatedAt,
        u.UpdatedAt,
        u.Preferences ?? [],
        u.CoverLetterHighlights ?? []);
}

public sealed record UpdateProfileRequest(
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("email")] string? Email,
    [property: JsonPropertyName("preferences")] List<string>? Preferences,
    [property: JsonPropertyName("coverLetterHighlights")] List<string>? CoverLetterHighlights);

// --- Agent Settings ----------------------------------------------------------

public sealed record AgentSettingDto(
    [property: JsonPropertyName("agentName")] string AgentName,
    [property: JsonPropertyName("endpoint")] string Endpoint,
    [property: JsonPropertyName("model")] string Model,
    [property: JsonPropertyName("hasApiKey")] bool HasApiKey,
    [property: JsonPropertyName("isCustom")] bool IsCustom);

public sealed record UpdateAgentSettingRequest(
    [property: JsonPropertyName("endpoint")] string Endpoint,
    [property: JsonPropertyName("model")] string Model,
    [property: JsonPropertyName("apiKey")] string? ApiKey);

public sealed record SaveAgentSettingDto(
    [property: JsonPropertyName("agentName")] string AgentName,
    [property: JsonPropertyName("endpoint")] string Endpoint,
    [property: JsonPropertyName("model")] string Model,
    [property: JsonPropertyName("apiKey")] string? ApiKey);

using CvBuilder.Backend.Data;
using CvBuilder.Backend.Dtos;
using CvBuilder.Backend.Models;
using CvBuilder.Backend.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using MongoDB.Driver;

namespace CvBuilder.Backend.Endpoints;

public static class CvBuilderEndpoints
{
    public static IEndpointRouteBuilder MapCvBuilderEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/users/{userId}/cvs", ListUserCvsAsync)
            .WithName("ListUserCvs")
            .WithTags("CV Builder")
            .WithSummary("Lists a user's CV drafts sorted by last update date.");

        var cvs = app.MapGroup("/cvs").WithTags("CV Builder");

        cvs.MapPost("", CreateCvAsync)
            .WithName("CreateCv")
            .WithSummary("Creates a new CV draft.");

        cvs.MapGet("/{id:guid}", GetCvAsync)
            .WithName("GetCv")
            .WithSummary("Gets a single CV draft by ID.");

        cvs.MapPut("/{id:guid}", UpdateCvAsync)
            .WithName("UpdateCv")
            .WithSummary("Replaces a CV draft's title, template, and structured payload.");

        cvs.MapDelete("/{id:guid}", DeleteCvAsync)
            .WithName("DeleteCv")
            .WithSummary("Deletes a CV draft.");

        cvs.MapPost("/{id:guid}/set-base", SetBaseCvAsync)
            .WithName("SetBaseCv")
            .WithSummary("Marks a CV draft as the Base CV for the user.");

        cvs.MapPost("/{id:guid}/pdf", DownloadCvPdfAsync)
            .WithName("DownloadCvDocumentPdf")
            .WithSummary("Renders the CV draft to an ATS-optimised PDF and streams it.")
            .RequireRateLimiting("token-bucket");

        cvs.MapGet("/{id:guid}/pdf", DownloadCvPdfAsync)
            .WithName("GetCvDocumentPdf")
            .WithSummary("Renders the CV draft to an ATS-optimised PDF and streams it.");

        return app;
    }

    // --- GET /api/users/{userId}/cvs ---
    private static async Task<Ok<List<CvListItemDto>>> ListUserCvsAsync(
        [FromRoute] string userId,
        HttpContext httpContext,
        MongoDbContext db,
        CancellationToken ct)
    {
        var effectiveUserId = string.Equals(userId, "me", StringComparison.OrdinalIgnoreCase)
            ? httpContext.GetClerkUserId() ?? userId
            : userId;

        var filter = Builders<CvDocument>.Filter.Eq(c => c.UserId, effectiveUserId);
        var sort = Builders<CvDocument>.Sort.Descending(c => c.UpdatedAt);

        var docs = await db.CvDocuments.Find(filter).Sort(sort).ToListAsync(ct);
        return TypedResults.Ok(docs.Select(CvListItemDto.From).ToList());
    }

    // --- POST /api/cvs ---
    private static async Task<Results<Created<CvDetailDto>, ProblemHttpResult>> CreateCvAsync(
        [FromBody] CreateCvRequest request,
        HttpContext httpContext,
        MongoDbContext db,
        CancellationToken ct)
    {
        var userId = !string.IsNullOrWhiteSpace(request?.UserId)
            ? request.UserId.Trim()
            : httpContext.GetClerkUserId();

        if (string.IsNullOrWhiteSpace(userId))
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Bad request",
                detail: "'userId' is required either in the request body or via authentication token.");
        }

        var templateKey = string.IsNullOrWhiteSpace(request?.TemplateKey)
            ? CvTemplatePalette.Classic
            : request.TemplateKey.Trim().ToLowerInvariant();

        if (!CvTemplatePalette.IsValid(templateKey))
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Bad request",
                detail: $"'templateKey' must be one of: {string.Join(", ", CvTemplatePalette.ValidTemplates)}");
        }

        var payload = MapPayload(request?.Payload);

        var doc = new CvDocument
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = string.IsNullOrWhiteSpace(request?.Title) ? "My CV" : request.Title.Trim(),
            TemplateKey = templateKey,
            Payload = payload,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsBase = false
        };

        await db.CvDocuments.InsertOneAsync(doc, cancellationToken: ct);

        return TypedResults.Created($"/api/cvs/{doc.Id}", CvDetailDto.From(doc));
    }

    // --- GET /api/cvs/{id:guid} ---
    private static async Task<Results<Ok<CvDetailDto>, ProblemHttpResult>> GetCvAsync(
        [FromRoute] Guid id,
        MongoDbContext db,
        CancellationToken ct)
    {
        var filter = Builders<CvDocument>.Filter.Eq(c => c.Id, id);
        var doc = await db.CvDocuments.Find(filter).FirstOrDefaultAsync(ct);

        if (doc is null)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource not found",
                detail: $"CV document {id} was not found.");
        }

        return TypedResults.Ok(CvDetailDto.From(doc));
    }

    // --- PUT /api/cvs/{id:guid} ---
    private static async Task<Results<Ok<CvDetailDto>, ProblemHttpResult>> UpdateCvAsync(
        [FromRoute] Guid id,
        [FromBody] UpdateCvRequest request,
        MongoDbContext db,
        CancellationToken ct)
    {
        if (request is null)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Bad request",
                detail: "Request body is required.");
        }

        var templateKey = string.IsNullOrWhiteSpace(request.TemplateKey)
            ? CvTemplatePalette.Classic
            : request.TemplateKey.Trim().ToLowerInvariant();

        if (!CvTemplatePalette.IsValid(templateKey))
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Bad request",
                detail: $"'templateKey' must be one of: {string.Join(", ", CvTemplatePalette.ValidTemplates)}");
        }

        var filter = Builders<CvDocument>.Filter.Eq(c => c.Id, id);
        var doc = await db.CvDocuments.Find(filter).FirstOrDefaultAsync(ct);

        if (doc is null)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource not found",
                detail: $"CV document {id} was not found.");
        }

        doc.Title = string.IsNullOrWhiteSpace(request.Title) ? doc.Title : request.Title.Trim();
        doc.TemplateKey = templateKey;
        doc.Payload = MapPayload(request.Payload);
        doc.UpdatedAt = DateTime.UtcNow;

        await db.CvDocuments.ReplaceOneAsync(filter, doc, cancellationToken: ct);

        return TypedResults.Ok(CvDetailDto.From(doc));
    }

    // --- DELETE /api/cvs/{id:guid} ---
    private static async Task<Results<NoContent, ProblemHttpResult>> DeleteCvAsync(
        [FromRoute] Guid id,
        MongoDbContext db,
        CancellationToken ct)
    {
        var filter = Builders<CvDocument>.Filter.Eq(c => c.Id, id);
        var result = await db.CvDocuments.DeleteOneAsync(filter, cancellationToken: ct);

        if (result.DeletedCount == 0)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource not found",
                detail: $"CV document {id} was not found.");
        }

        return TypedResults.NoContent();
    }

    // --- POST /api/cvs/{id:guid}/set-base ---
    private static async Task<Results<Ok<CvDetailDto>, ProblemHttpResult>> SetBaseCvAsync(
        [FromRoute] Guid id,
        MongoDbContext db,
        CancellationToken ct)
    {
        var filter = Builders<CvDocument>.Filter.Eq(c => c.Id, id);
        var doc = await db.CvDocuments.Find(filter).FirstOrDefaultAsync(ct);

        if (doc is null)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource not found",
                detail: $"CV document {id} was not found.");
        }

        var filterOthers = Builders<CvDocument>.Filter.And(
            Builders<CvDocument>.Filter.Eq(c => c.UserId, doc.UserId),
            Builders<CvDocument>.Filter.Ne(c => c.Id, id));

        var updateOthers = Builders<CvDocument>.Update
            .Set(c => c.IsBase, false)
            .Set(c => c.UpdatedAt, DateTime.UtcNow);

        await db.CvDocuments.UpdateManyAsync(filterOthers, updateOthers, cancellationToken: ct);

        var updateThis = Builders<CvDocument>.Update
            .Set(c => c.IsBase, true)
            .Set(c => c.UpdatedAt, DateTime.UtcNow);

        await db.CvDocuments.UpdateOneAsync(filter, updateThis, cancellationToken: ct);

        doc.IsBase = true;
        doc.UpdatedAt = DateTime.UtcNow;

        return TypedResults.Ok(CvDetailDto.From(doc));
    }

    // --- Helpers -------------------------------------------------------------

    private static CvPayload MapPayload(CvPayloadDto? p)
    {
        if (p is null)
        {
            var empty = new CvPayload();
            empty.SectionOrder = CvPayload.DefaultSectionOrder.ToList();
            return empty;
        }

        var result = new CvPayload
        {
            Personal = new CvPersonal
            {
                FullName = p.Personal?.FullName ?? string.Empty,
                Headline = p.Personal?.Headline ?? string.Empty,
                Email = p.Personal?.Email ?? string.Empty,
                Phone = p.Personal?.Phone ?? string.Empty,
                Location = p.Personal?.Location ?? string.Empty,
                Links = p.Personal?.Links?.ToList() ?? [],
            },
            Summary = p.Summary ?? string.Empty,
            KeyAchievements = (p.KeyAchievements ?? []).ToList(),
            WorkExperience = (p.WorkExperience ?? []).Select(w => new CvEmployer
            {
                Name = w.Name ?? string.Empty,
                Role = w.Role ?? string.Empty,
                Dates = w.Dates ?? string.Empty,
                Location = w.Location ?? string.Empty,
                Summary = w.Summary ?? string.Empty,
                Engagements = (w.Engagements ?? []).Select(e => new CvClientEngagement
                {
                    ClientName = e.ClientName ?? string.Empty,
                    RoleContext = e.RoleContext ?? string.Empty,
                    Achievements = e.Achievements?.ToList() ?? [],
                }).ToList(),
                Bullets = w.Bullets?.ToList() ?? [],
            }).ToList(),
            Education = (p.Education ?? []).Select(e => new CvEducationItem
            {
                Institution = e.Institution ?? string.Empty,
                Qualification = e.Qualification ?? string.Empty,
                Location = e.Location ?? string.Empty,
                Start = e.Start ?? string.Empty,
                End = e.End ?? string.Empty,
                Details = e.Details ?? string.Empty,
            }).ToList(),
            Skills = (p.Skills ?? []).Select(s => new CvSkillItem
            {
                Name = s.Name ?? string.Empty,
                Category = s.Category,
            }).ToList(),
            Certifications = (p.Certifications ?? []).Select(c => new CvCertificationItem
            {
                Name = c.Name ?? string.Empty,
                Issuer = c.Issuer ?? string.Empty,
                Date = c.Date ?? string.Empty,
                Url = c.Url ?? string.Empty,
            }).ToList(),
            CustomSections = (p.CustomSections ?? []).Select(s => new CvCustomSection
            {
                Id = string.IsNullOrWhiteSpace(s.Id) ? Guid.NewGuid().ToString("N") : s.Id,
                Title = s.Title ?? string.Empty,
                Items = s.Items?.ToList() ?? [],
            }).ToList(),
            SectionOrder = (p.SectionOrder ?? []).Select(x => x ?? string.Empty).Where(x => x.Length > 0).ToList(),
        };

        return NormalizeSectionOrder(result);
    }

    private static CvPayload NormalizeSectionOrder(CvPayload payload)
    {
        var seen = new HashSet<string>(StringComparer.Ordinal);
        var ordered = new List<string>();

        var builtins = CvPayload.DefaultSectionOrder;
        var customIds = payload.CustomSections
            .Where(c => !string.IsNullOrWhiteSpace(c.Id))
            .Select(c => $"custom:{c.Id}")
            .ToHashSet(StringComparer.Ordinal);

        bool IsValid(string slot) =>
            builtins.Contains(slot) || customIds.Contains(slot);

        foreach (var slot in payload.SectionOrder)
        {
            if (slot is null) continue;
            if (IsValid(slot) && seen.Add(slot))
            {
                ordered.Add(slot);
            }
        }

        foreach (var slot in builtins)
        {
            if (seen.Add(slot)) ordered.Add(slot);
        }
        foreach (var slot in customIds)
        {
            if (seen.Add(slot)) ordered.Add(slot);
        }

        payload.SectionOrder = ordered;
        return payload;
    }

    private const string PdfMagicHeader = "%PDF-";

    // --- POST /api/cvs/{id}/pdf ---
    //
    // Renders the draft to PDF via ICvDocumentPdfService and streams the bytes as application/pdf. The
    // download file name follows the spec's "FirstName-LastName-CV" convention, falling back to the
    // document id when the name is blank. Validates %PDF- magic header before streaming.
    private static async Task<Results<FileContentHttpResult, ProblemHttpResult>> DownloadCvPdfAsync(
        [FromRoute] Guid id,
        ICvDocumentPdfService pdfService,
        MongoDbContext db,
        CancellationToken ct)
    {
        var filter = Builders<CvDocument>.Filter.Eq(c => c.Id, id);
        var doc = await db.CvDocuments.Find(filter).FirstOrDefaultAsync(ct);
        if (doc is null)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Resource not found",
                detail: $"CV document {id} was not found.");
        }

        byte[] bytes;
        try
        {
            bytes = pdfService.Render(doc);
        }
        catch (Exception)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "PDF render failure",
                detail: "Could not render the CV to PDF.");
        }

        if (bytes.Length < PdfMagicHeader.Length || !StartsWithMagic(bytes, PdfMagicHeader))
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "PDF render failure",
                detail: "Rendered PDF did not carry the expected magic header.");
        }

        return TypedResults.File(bytes, "application/pdf", fileDownloadName: BuildFileName(doc));
    }

    // Spec file name: "FirstName-LastName-CV.pdf" (sanitised); falls back to the id slug.
    private static string BuildFileName(CvDocument doc)
    {
        var name = doc.Payload?.Personal?.FullName?.Trim();
        if (!string.IsNullOrWhiteSpace(name))
        {
            var slug = string.Join("-", name.Split(' ', StringSplitOptions.RemoveEmptyEntries))
                .ToLowerInvariant();
            slug = new string(slug.Select(ch => char.IsLetterOrDigit(ch) || ch == '-' ? ch : '-').ToArray());
            return $"{slug}-cv.pdf";
        }
        return $"cv-{doc.Id}.pdf";
    }

    // ASCII prefix check without allocating a string for the whole buffer.
    private static bool StartsWithMagic(byte[] bytes, string magic)
    {
        for (int i = 0; i < magic.Length; i++)
        {
            if (bytes[i] != (byte)magic[i])
            {
                return false;
            }
        }
        return true;
    }
}

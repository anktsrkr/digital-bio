using System.Security.Claims;
using CvBuilder.Backend.Data;
using CvBuilder.Backend.Dtos;
using CvBuilder.Backend.Models;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using MongoDB.Driver;

namespace CvBuilder.Backend.Endpoints;

public static class UserProfileEndpoints
{
    public static IEndpointRouteBuilder MapUserProfileEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/profile").WithTags("Profiles");

        group.MapGet("", GetOrCreateProfileAsync)
            .WithName("GetProfile")
            .WithSummary("Gets or auto-creates the user profile for the authenticated Clerk user.");

        group.MapPut("", UpdateProfileAsync)
            .WithName("UpdateProfile")
            .WithSummary("Updates or creates the profile preferences and details for the authenticated user.");

        return app;
    }

    private static async Task<Results<Ok<UserProfileDto>, ProblemHttpResult>> GetOrCreateProfileAsync(
        HttpContext httpContext,
        MongoDbContext db,
        CancellationToken ct)
    {
        var userId = httpContext.GetClerkUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Unauthorized",
                detail: "Authentication required or X-User-Id header missing.");
        }

        var filter = Builders<UserProfile>.Filter.Eq(u => u.ClerkUserId, userId);
        var user = await db.Users.Find(filter).FirstOrDefaultAsync(ct);

        if (user is null)
        {
            var emailClaim = httpContext.User?.FindFirst(ClaimTypes.Email)?.Value
                ?? httpContext.User?.FindFirst("email")?.Value
                ?? string.Empty;

            var nameClaim = httpContext.User?.Identity?.Name
                ?? httpContext.User?.FindFirst("name")?.Value
                ?? string.Empty;

            user = new UserProfile
            {
                Id = Guid.NewGuid(),
                ClerkUserId = userId,
                Email = emailClaim,
                Name = nameClaim,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Preferences = [],
                CoverLetterHighlights = []
            };

            await db.Users.InsertOneAsync(user, cancellationToken: ct);
        }

        return TypedResults.Ok(UserProfileDto.From(user));
    }

    private static async Task<Results<Ok<UserProfileDto>, ProblemHttpResult>> UpdateProfileAsync(
        [FromBody] UpdateProfileRequest request,
        HttpContext httpContext,
        MongoDbContext db,
        CancellationToken ct)
    {
        var userId = httpContext.GetClerkUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Unauthorized",
                detail: "Authentication required or X-User-Id header missing.");
        }

        var filter = Builders<UserProfile>.Filter.Eq(u => u.ClerkUserId, userId);
        var user = await db.Users.Find(filter).FirstOrDefaultAsync(ct);

        if (user is null)
        {
            user = new UserProfile
            {
                Id = Guid.NewGuid(),
                ClerkUserId = userId,
                Email = request?.Email ?? string.Empty,
                Name = request?.Name ?? string.Empty,
                Preferences = request?.Preferences ?? [],
                CoverLetterHighlights = request?.CoverLetterHighlights ?? [],
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await db.Users.InsertOneAsync(user, cancellationToken: ct);
        }
        else
        {
            if (request?.Name is not null) user.Name = request.Name;
            if (request?.Email is not null) user.Email = request.Email;
            if (request?.Preferences is not null) user.Preferences = request.Preferences;
            if (request?.CoverLetterHighlights is not null) user.CoverLetterHighlights = request.CoverLetterHighlights;
            user.UpdatedAt = DateTime.UtcNow;

            await db.Users.ReplaceOneAsync(filter, user, cancellationToken: ct);
        }

        return TypedResults.Ok(UserProfileDto.From(user));
    }
}

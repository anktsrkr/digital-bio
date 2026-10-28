using System.Security.Claims;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace CvBuilder.Backend.Endpoints;

public static class EndpointExtensions
{
    public static IEndpointRouteBuilder MapAllEndpoints(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("/api").RequireAuthorization();
        api.MapCvBuilderEndpoints();
        api.MapUserProfileEndpoints();
        api.MapAgentSettingsEndpoints();
        return app;
    }

    /// <summary>
    /// Extracts the Clerk User ID from the JWT claims principal.
    /// In Clerk tokens, the user identifier is in the 'sub' or NameIdentifier claim.
    /// </summary>
    public static string? GetClerkUserId(this ClaimsPrincipal? principal)
    {
        if (principal == null) return null;

        return principal.FindFirst("sub")?.Value
            ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? principal.FindFirst("userId")?.Value;
    }

    /// <summary>
    /// Resolves the effective user ID from the HttpContext.
    /// Checks ClaimsPrincipal first; if not authenticated, checks the X-User-Id request header for dev/testing.
    /// </summary>
    public static string? GetClerkUserId(this HttpContext context)
    {
        var claimId = context.User?.GetClerkUserId();
        if (!string.IsNullOrWhiteSpace(claimId))
        {
            return claimId;
        }

        if (context.Request.Headers.TryGetValue("X-User-Id", out var headerVal))
        {
            var id = headerVal.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(id))
            {
                return id;
            }
        }

        return null;
    }
}

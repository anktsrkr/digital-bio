using CvBuilder.Backend.Configuration;
using CvBuilder.Backend.Data;
using CvBuilder.Backend.Dtos;
using CvBuilder.Backend.Models;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace CvBuilder.Backend.Endpoints;

public static class AgentSettingsEndpoints
{
    private static readonly string[] KnownAgents =
    [
        "CvSectionWriter",
        "CvSectionWriterAgent"
    ];

    public static IEndpointRouteBuilder MapAgentSettingsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/settings/agents").WithTags("Settings");

        group.MapGet("", GetAllAgentSettingsAsync)
            .WithName("GetAgentSettings")
            .WithSummary("Lists all AI agent settings with their active endpoints and models.");

        group.MapPut("/{agentName}", UpdateAgentSettingAsync)
            .WithName("UpdateAgentSetting")
            .WithSummary("Updates or creates custom AI connection parameters for an agent.");

        group.MapDelete("/{agentName}", ResetAgentSettingAsync)
            .WithName("ResetAgentSetting")
            .WithSummary("Resets custom AI connection parameters for an agent to system defaults.");

        return app;
    }

    private static async Task<Ok<List<AgentSettingDto>>> GetAllAgentSettingsAsync(
        MongoDbContext db,
        IOptions<AiOptions> aiOpts,
        CancellationToken ct)
    {
        var defaults = aiOpts.Value;
        List<AgentSetting> savedSettings = [];
        try
        {
            savedSettings = await db.AgentSettings.Find(Builders<AgentSetting>.Filter.Empty).ToListAsync(ct);
        }
        catch (Exception)
        {
            // Fall back to system defaults if DB is temporarily unreachable or unconfigured
        }

        var settingsDict = savedSettings.ToDictionary(s => s.AgentName, StringComparer.OrdinalIgnoreCase);

        var result = new List<AgentSettingDto>();

        foreach (var agent in KnownAgents)
        {
            if (settingsDict.TryGetValue(agent, out var saved))
            {
                result.Add(new AgentSettingDto(
                    AgentName: agent,
                    Endpoint: saved.Endpoint,
                    Model: saved.Model,
                    HasApiKey: !string.IsNullOrWhiteSpace(saved.ApiKey),
                    IsCustom: true));
            }
            else
            {
                result.Add(new AgentSettingDto(
                    AgentName: agent,
                    Endpoint: defaults.Endpoint,
                    Model: defaults.Model,
                    HasApiKey: !string.IsNullOrWhiteSpace(defaults.ApiKey),
                    IsCustom: false));
            }
        }

        return TypedResults.Ok(result);
    }

    private static async Task<Results<Ok<AgentSettingDto>, ProblemHttpResult>> UpdateAgentSettingAsync(
        [FromRoute] string agentName,
        [FromBody] UpdateAgentSettingRequest request,
        MongoDbContext db,
        IOptions<AiOptions> aiOpts,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(agentName))
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Bad request",
                detail: "'agentName' is required.");
        }

        if (request is null || string.IsNullOrWhiteSpace(request.Endpoint) || string.IsNullOrWhiteSpace(request.Model))
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Bad request",
                detail: "Endpoint and Model are required.");
        }

        var filter = Builders<AgentSetting>.Filter.Eq(s => s.AgentName, agentName);
        var existing = await db.AgentSettings.Find(filter).FirstOrDefaultAsync(ct);

        var apiKey = request.ApiKey;
        if (apiKey == "********" || string.IsNullOrWhiteSpace(apiKey))
        {
            apiKey = existing?.ApiKey ?? string.Empty;
        }

        if (existing is null)
        {
            existing = new AgentSetting
            {
                AgentName = agentName,
                Endpoint = request.Endpoint.Trim(),
                Model = request.Model.Trim(),
                ApiKey = apiKey,
                UpdatedAt = DateTime.UtcNow
            };

            await db.AgentSettings.InsertOneAsync(existing, cancellationToken: ct);
        }
        else
        {
            existing.Endpoint = request.Endpoint.Trim();
            existing.Model = request.Model.Trim();
            existing.ApiKey = apiKey;
            existing.UpdatedAt = DateTime.UtcNow;

            await db.AgentSettings.ReplaceOneAsync(filter, existing, cancellationToken: ct);
        }

        return TypedResults.Ok(new AgentSettingDto(
            AgentName: existing.AgentName,
            Endpoint: existing.Endpoint,
            Model: existing.Model,
            HasApiKey: !string.IsNullOrWhiteSpace(existing.ApiKey),
            IsCustom: true));
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> ResetAgentSettingAsync(
        [FromRoute] string agentName,
        MongoDbContext db,
        CancellationToken ct)
    {
        var filter = Builders<AgentSetting>.Filter.Eq(s => s.AgentName, agentName);
        await db.AgentSettings.DeleteOneAsync(filter, cancellationToken: ct);
        return TypedResults.NoContent();
    }
}

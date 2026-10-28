using System.Text;
using CvBuilder.Backend.Configuration;
using CvBuilder.Backend.Data;
using CvBuilder.Backend.Endpoints;
using CvBuilder.Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using QuestPDF.Infrastructure;
using Scalar.AspNetCore;

// Configure QuestPDF Community license
QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

// 1. Bind Options
builder.Services.Configure<MongoDbOptions>(options =>
{
    builder.Configuration.GetSection(MongoDbOptions.SectionName).Bind(options);
    var mongoUri = builder.Configuration["MONGODB_URI"] ?? Environment.GetEnvironmentVariable("MONGODB_URI");
    if (!string.IsNullOrWhiteSpace(mongoUri))
    {
        options.ConnectionString = mongoUri;
    }
});
builder.Services.Configure<ClerkOptions>(options =>
{
    builder.Configuration.GetSection(ClerkOptions.SectionName).Bind(options);
    var authority = builder.Configuration["CLERK_AUTHORITY"] ?? Environment.GetEnvironmentVariable("CLERK_AUTHORITY");
    var issuer = builder.Configuration["CLERK_ISSUER"] ?? Environment.GetEnvironmentVariable("CLERK_ISSUER");
    var audience = builder.Configuration["CLERK_AUDIENCE"] ?? Environment.GetEnvironmentVariable("CLERK_AUDIENCE");

    if (!string.IsNullOrWhiteSpace(authority))
    {
        options.Authority = authority;
    }
    if (!string.IsNullOrWhiteSpace(issuer))
    {
        options.Issuer = issuer;
    }
    else if (!string.IsNullOrWhiteSpace(options.Authority) && string.IsNullOrWhiteSpace(options.Issuer))
    {
        options.Issuer = options.Authority;
    }
    if (!string.IsNullOrWhiteSpace(audience))
    {
        options.Audience = audience;
    }
});
builder.Services.Configure<AiOptions>(options =>
{
    builder.Configuration.GetSection(AiOptions.SectionName).Bind(options);
    var apiKey = builder.Configuration["AI_API_KEY"]
        ?? builder.Configuration["OPENAI_API_KEY"]
        ?? Environment.GetEnvironmentVariable("AI_API_KEY")
        ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");
    if (!string.IsNullOrWhiteSpace(apiKey))
    {
        options.ApiKey = apiKey;
    }
});

// 2. Register MongoDB Services
builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddHostedService<MongoDbInitializer>();

// 2b. Register PDF Generation Services
builder.Services.AddSingleton<ICvDocumentPdfService, CvDocumentPdfService>();

// 3. Configure CORS for local development, Vercel, and GitHub Pages
const string FrontendCorsPolicy = "FrontendCorsPolicy";
var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy.SetIsOriginAllowed(origin =>
              {
                  if (string.IsNullOrWhiteSpace(origin)) return false;
                  if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
                  return uri.Host == "localhost"
                      || uri.Host.EndsWith(".github.io", StringComparison.OrdinalIgnoreCase)
                      || uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase)
                      || corsOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase)
                      || corsOrigins.Contains("*");
              })
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 4. Configure Clerk JWT Authentication
var clerkOptions = builder.Configuration.GetSection(ClerkOptions.SectionName).Get<ClerkOptions>() ?? new();
var clerkAuthority = builder.Configuration["CLERK_AUTHORITY"]
    ?? Environment.GetEnvironmentVariable("CLERK_AUTHORITY")
    ?? clerkOptions.Authority;
var clerkIssuer = builder.Configuration["CLERK_ISSUER"]
    ?? Environment.GetEnvironmentVariable("CLERK_ISSUER")
    ?? (string.IsNullOrWhiteSpace(clerkOptions.Issuer) ? clerkAuthority : clerkOptions.Issuer);
var clerkAudience = builder.Configuration["CLERK_AUDIENCE"]
    ?? Environment.GetEnvironmentVariable("CLERK_AUDIENCE")
    ?? clerkOptions.Audience;

var isClerkConfigured = !string.IsNullOrWhiteSpace(clerkAuthority)
    && !clerkAuthority.Contains("<")
    && !clerkAuthority.Contains("placeholder");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        if (isClerkConfigured)
        {
            options.Authority = clerkAuthority;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = !string.IsNullOrWhiteSpace(clerkIssuer),
                ValidIssuer = clerkIssuer,
                ValidateAudience = !string.IsNullOrWhiteSpace(clerkAudience),
                ValidAudience = clerkAudience,
                ValidateLifetime = true,
                NameClaimType = "sub"
            };
        }
        else
        {
            // Development fallback when Clerk authority is not yet configured in local settings:
            // Allows the service to start cleanly while still challenging unauthenticated requests.
            var devKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("Clerk_Development_Fallback_Key_32_Chars!"))
            {
                KeyId = "dev-key"
            };
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = devKey,
                NameClaimType = "sub"
            };
        }

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = ctx =>
            {
                Console.WriteLine($"[JWT Error] Authentication failed: {ctx.Exception.Message}");
                return Task.CompletedTask;
            },
            OnChallenge = ctx =>
            {
                Console.WriteLine($"[JWT Challenge] Error: {ctx.Error}, Description: {ctx.ErrorDescription}");
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// 5. Rate Limiter (Token bucket for AI / heavy operations)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddTokenBucketLimiter("token-bucket", opt =>
    {
        opt.TokenLimit = 3;
        opt.QueueLimit = 0;
        opt.ReplenishmentPeriod = TimeSpan.FromSeconds(5);
        opt.TokensPerPeriod = 1;
        opt.AutoReplenishment = true;
    });
});

// 6. OpenAPI Configuration
builder.Services.AddOpenApi();

var app = builder.Build();

// Enable CORS
app.UseCors(FrontendCorsPolicy);

// Enable Auth
app.UseAuthentication();

// Development / Testing fallback: If unauthenticated but X-User-Id is provided, construct ClaimsPrincipal
app.Use(async (context, next) =>
{
    if ((context.User?.Identity?.IsAuthenticated != true) &&
        context.Request.Headers.TryGetValue("X-User-Id", out var devUserIdHeader))
    {
        var devUserId = devUserIdHeader.FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(devUserId))
        {
            var claims = new[]
            {
                new System.Security.Claims.Claim("sub", devUserId),
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, devUserId),
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Name, "Dev User"),
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Email, "dev@example.com")
            };
            var identity = new System.Security.Claims.ClaimsIdentity(claims, "DevFallbackAuth");
            context.User = new System.Security.Claims.ClaimsPrincipal(identity);
        }
    }
    await next();
});

app.UseAuthorization();

// Enable Rate Limiter
app.UseRateLimiter();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment() || builder.Configuration.GetValue<bool>("EnableSwaggerInProduction"))
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "CV Builder API v1");
        options.RoutePrefix = "swagger";
    });
    app.MapScalarApiReference();
}

// Health check / root endpoint
app.MapGet("/", () => Results.Ok(new
{
    status = "healthy",
    service = "CvBuilder.Backend",
    version = "1.0.0",
    timestamp = DateTime.UtcNow
}))
.WithName("RootHealthCheck")
.WithTags("System");

// Detailed health check for all infrastructure dependencies
app.MapGet("/health", async (
    MongoDbContext dbContext,
    Microsoft.Extensions.Options.IOptions<ClerkOptions> clerkOptions,
    Microsoft.Extensions.Options.IOptions<AiOptions> aiOptions) =>
{
    var checks = new Dictionary<string, object>();
    var isHealthy = true;

    // 1. Database Connectivity Check
    try
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
        await dbContext.Database.RunCommandAsync((MongoDB.Driver.Command<MongoDB.Bson.BsonDocument>)"{ping:1}", cancellationToken: cts.Token);
        checks["database"] = new { status = "connected" };
    }
    catch (Exception ex)
    {
        isHealthy = false;
        checks["database"] = new { status = "unreachable", error = ex.Message };
    }

    // 2. Clerk Auth Configuration Check
    var clerkConfigured = !string.IsNullOrWhiteSpace(clerkOptions.Value.Authority)
        && !clerkOptions.Value.Authority.Contains("<")
        && !clerkOptions.Value.Authority.Contains("placeholder");
    checks["clerkAuth"] = new { configured = clerkConfigured, authority = clerkConfigured ? clerkOptions.Value.Authority : "not_configured" };

    // 3. AI Configuration Check
    var aiConfigured = !string.IsNullOrWhiteSpace(aiOptions.Value.ApiKey)
        && !aiOptions.Value.ApiKey.Contains("<")
        && !aiOptions.Value.ApiKey.Contains("placeholder");
    checks["aiService"] = new { configured = aiConfigured, model = aiOptions.Value.Model };

    var result = new
    {
        status = isHealthy ? "healthy" : "degraded",
        service = "CvBuilder.Backend",
        version = "1.0.0",
        environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
        timestamp = DateTime.UtcNow,
        checks
    };

    return Results.Json(result, statusCode: isHealthy ? StatusCodes.Status200OK : StatusCodes.Status503ServiceUnavailable);
})
.WithName("DetailedHealthCheck")
.WithTags("System");

// Map all functional API endpoints
app.MapAllEndpoints();

app.Run();

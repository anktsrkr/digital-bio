using CvBuilder.Backend.Models;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;

namespace CvBuilder.Backend.Data;

public class MongoDbInitializer : IHostedService
{
    private readonly MongoDbContext _context;
    private readonly ILogger<MongoDbInitializer> _logger;

    public MongoDbInitializer(MongoDbContext context, ILogger<MongoDbInitializer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        // Run index initialization in the background so slow or unreachable DB does not block web host startup
        _ = Task.Run(async () =>
        {
            try
            {
                await InitializeAsync(CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Background index initialization encountered an error.");
            }
        });

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    public async Task InitializeAsync(CancellationToken ct = default)
    {
        try
        {
            _logger.LogInformation("Ensuring MongoDB indexes...");

            // 1. Unique index on UserProfile.ClerkUserId
            var userIndexKeys = Builders<UserProfile>.IndexKeys.Ascending(u => u.ClerkUserId);
            var userIndexModel = new CreateIndexModel<UserProfile>(
                userIndexKeys,
                new CreateIndexOptions { Unique = true, Name = "ux_users_clerk_user_id" });
            await _context.Users.Indexes.CreateOneAsync(userIndexModel, cancellationToken: ct);

            // 2. Compound index on CvDocument.UserId + UpdatedAt descending
            var cvIndexKeys = Builders<CvDocument>.IndexKeys
                .Ascending(c => c.UserId)
                .Descending(c => c.UpdatedAt);
            var cvIndexModel = new CreateIndexModel<CvDocument>(
                cvIndexKeys,
                new CreateIndexOptions { Name = "ix_cv_documents_user_id_updated_at" });
            await _context.CvDocuments.Indexes.CreateOneAsync(cvIndexModel, cancellationToken: ct);

            // 3. AgentSetting uniqueness is already enforced natively by [BsonId] (_id index in MongoDB).

            _logger.LogInformation("MongoDB indexes ensured successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not ensure MongoDB indexes. Verify your MongoDB connection string and network reachability.");
        }
    }
}

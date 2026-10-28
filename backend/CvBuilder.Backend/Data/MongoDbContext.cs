using CvBuilder.Backend.Configuration;
using CvBuilder.Backend.Models;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;

namespace CvBuilder.Backend.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    static MongoDbContext()
    {
        try
        {
            BsonSerializer.RegisterSerializer(new GuidSerializer(GuidRepresentation.Standard));
        }
        catch (BsonSerializationException)
        {
            // Already registered
        }
    }

    public MongoDbContext(IOptions<MongoDbOptions> options)
    {
        var opts = options.Value;
        var connectionString = string.IsNullOrWhiteSpace(opts.ConnectionString)
            ? "mongodb://localhost:27017"
            : opts.ConnectionString;

        var databaseName = string.IsNullOrWhiteSpace(opts.DatabaseName)
            ? "cvbuilder"
            : opts.DatabaseName;

        var mongoClientSettings = MongoClientSettings.FromConnectionString(connectionString);
        mongoClientSettings.ServerSelectionTimeout = TimeSpan.FromSeconds(5);
        var client = new MongoClient(mongoClientSettings);
        _database = client.GetDatabase(databaseName);

        CvDocuments = _database.GetCollection<CvDocument>(
            string.IsNullOrWhiteSpace(opts.CvDocumentsCollection) ? "cv_documents" : opts.CvDocumentsCollection);

        Users = _database.GetCollection<UserProfile>(
            string.IsNullOrWhiteSpace(opts.UsersCollection) ? "users" : opts.UsersCollection);

        AgentSettings = _database.GetCollection<AgentSetting>(
            string.IsNullOrWhiteSpace(opts.AgentSettingsCollection) ? "agent_settings" : opts.AgentSettingsCollection);
    }

    public IMongoCollection<CvDocument> CvDocuments { get; }
    public IMongoCollection<UserProfile> Users { get; }
    public IMongoCollection<AgentSetting> AgentSettings { get; }
    public IMongoDatabase Database => _database;
}

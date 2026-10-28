namespace CvBuilder.Backend.Configuration;

public class AiOptions
{
    public const string SectionName = "Ai";

    public string Endpoint { get; set; } = "https://api.openai.com/v1";
    public string Model { get; set; } = "gpt-4o";
    public string ApiKey { get; set; } = string.Empty;
}

namespace CvBuilder.Backend.Configuration;

public class ClerkOptions
{
    public const string SectionName = "Clerk";

    public string Authority { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string? Audience { get; set; }
}

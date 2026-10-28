namespace CvBuilder.Backend.Services;

public static class CvTemplatePalette
{
    public const string Classic = "classic";
    public const string Navy = "navy";
    public const string Teal = "teal";

    public static readonly IReadOnlyList<string> ValidTemplates = [Classic, Navy, Teal];

    private static readonly IReadOnlyDictionary<string, string> Accents = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        [Classic] = "#000000",
        [Navy] = "#1F3A5F",
        [Teal] = "#0F766E",
    };

    /// <summary>Returns the accent hex for the given template key, defaulting to classic (black).</summary>
    public static string Accent(string? templateKey) =>
        templateKey is not null && Accents.TryGetValue(templateKey, out var color) ? color : Accents[Classic];

    /// <summary>True when the key is one of the known templates.</summary>
    public static bool IsValid(string? templateKey) =>
        templateKey is not null && Accents.ContainsKey(templateKey);
}

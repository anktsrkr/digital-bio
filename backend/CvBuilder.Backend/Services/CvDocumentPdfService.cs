using CvBuilder.Backend.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace CvBuilder.Backend.Services;

/// <summary>
/// Default ICvDocumentPdfService built on QuestPDF. Registered as a singleton — document generation is
/// stateless and thread-safe once Settings.License is set (done once in Program.cs).
///
/// Implements the UK ATS CV specification exactly:
///   - A4 (210 × 297 mm), portrait, single column.
///   - Margins: 0.35 in top, 0.25 in bottom, 0.45 in left/right (exact, per spec).
///   - Soft 2-page cap: content is never truncated, but the editor warns when it overflows.
///   - Default font Calibri, with a configurable FontFamily map (Arial / Calibri / Aptos / Helvetica)
///     and graceful fallback so the Linux container renders consistently.
///   - Font sizes: name 21 pt, headings 12 pt bold, employer/role 11 pt bold, body/bullets 10.5 pt.
///     Nothing below 10 pt.
///   - Single (1.0) line spacing; 4 pt after bullets, 10 pt after sections, 5 pt after the name.
///   - Headings: bold ALL CAPS with a 0.5 pt accent bottom rule. Body text black only.
///   - Accent colour (classic = black, navy = #1F3A5F, teal = #0F766E) applied to the name and
///     the contact/heading bottom rules — never body text.
///   - Hanging indent on bullets (left 0.3 cm).
/// </summary>
public sealed class CvDocumentPdfService : ICvDocumentPdfService
{
    // Spec font sizes (pt). QuestPDF sizes are in points.
    private const float NameSize = 21f;
    private const float HeadlineSize = 11f;
    private const float HeadingSize = 12f;
    private const float JobTitleSize = 11f;
    private const float BodySize = 10.5f;

    // Spec spacing (pt).
    private const float AfterName = 5f;
    private const float AfterBullet = 4f;
    private const float AfterSection = 10f;

    // Spec indent (cm → QuestPDF takes Unit).
    private const float BulletIndentCm = 0.3f;

    // Map of supported font families to the embedded font name QuestPDF ships.
    private static readonly IReadOnlyDictionary<string, string> FontMap =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["calibri"] = Fonts.Calibri,
            ["arial"] = Fonts.Arial,
            ["helvetica"] = Fonts.Calibri, // Helvetica not embedded → graceful fallback to Calibri.
            ["aptos"] = Fonts.Calibri,     // Aptos not embedded → graceful fallback to Calibri.
        };

    private readonly string _fontFamily;

    /// <summary>Creates the renderer using the default Calibri font.</summary>
    public CvDocumentPdfService() : this("Calibri") { }

    /// <summary>Creates the renderer with a configurable font family, falling back to Calibri.</summary>
    public CvDocumentPdfService(string fontFamily)
    {
        _fontFamily = ResolveFont(fontFamily);
    }

    private static string ResolveFont(string? fontFamily)
    {
        var key = (fontFamily ?? string.Empty).Trim();
        if (key.Length > 0 && FontMap.TryGetValue(key, out var resolved)) return resolved;
        return Fonts.Calibri;
    }

    public byte[] Render(CvDocument cv)
    {
        ArgumentNullException.ThrowIfNull(cv);
        var accent = CvTemplatePalette.Accent(cv.TemplateKey);
        var payload = cv.Payload;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginTop(0.35f, Unit.Inch);
                page.MarginBottom(0.25f, Unit.Inch);
                page.MarginLeft(0.45f, Unit.Inch);
                page.MarginRight(0.45f, Unit.Inch);
                page.DefaultTextStyle(t => t.FontSize(BodySize).FontFamily(_fontFamily).LineHeight(1f).DisableFontFeature(FontFeatures.StandardLigatures));

                page.Content().Column(col =>
                {
                    RenderHeader(col, payload.Personal, accent);
                    RenderSections(col, payload, accent);
                });
            });
        });

        return document.GeneratePdf();
    }

    public byte[] GeneratePdf(CvDocument cv) => Render(cv);

    // Name (accent colour) + headline, then location / phone / email / each link on its own line.
    private void RenderHeader(ColumnDescriptor col, CvPersonal p, string accent)
    {
        if (!string.IsNullOrWhiteSpace(p.FullName))
        {
            col.Item().Text(p.FullName).FontSize(NameSize).Bold().FontColor(accent);
        }
        col.Item().PaddingTop(AfterName);

        if (!string.IsNullOrWhiteSpace(p.Headline))
        {
            col.Item().Text(p.Headline).FontSize(HeadlineSize).SemiBold().FontColor(Colors.Grey.Darken1);
        }

        // Extract "Twin" or "Digital Twin" link to render inline on the contact line.
        var allLinks = p.Links.Where(l => !string.IsNullOrWhiteSpace(l)).Select(l => l.Trim()).ToList();
        string? digitalTwinDisplay = null;
        string? digitalTwinHref = null;
        var activeLinks = new List<string>();
        foreach (var l in allLinks)
        {
            var (prefix, url) = ParseLink(l);
            if (string.Equals(prefix, "Twin", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(prefix, "Digital Twin", StringComparison.OrdinalIgnoreCase))
            {
                digitalTwinDisplay = CleanUrlForDisplay(url);
                digitalTwinHref = url.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? url : null;
            }
            else
            {
                activeLinks.Add(l);
            }
        }

        // Location, phone, email, and (optionally) Digital Twin on the same line, separated by a bullet;
        // remaining links render as clickable hyperlinks on their own line below.
        var hasLocation = !string.IsNullOrWhiteSpace(p.Location);
        var hasPhone = !string.IsNullOrWhiteSpace(p.Phone);
        var hasEmail = !string.IsNullOrWhiteSpace(p.Email);
        var hasDigitalTwin = digitalTwinDisplay is not null;

        if (hasLocation || hasPhone || hasEmail || hasDigitalTwin)
        {
            col.Item().PaddingTop(2).Text(text =>
            {
                var needsSeparator = false;

                if (hasLocation)
                {
                    text.Span(p.Location.Trim()).FontColor(Colors.Grey.Darken1);
                    needsSeparator = true;
                }

                if (hasPhone)
                {
                    if (needsSeparator)
                    {
                        text.Span(" • ").FontColor(Colors.Grey.Darken1);
                    }
                    text.Hyperlink(p.Phone.Trim(), $"tel:{p.Phone.Trim()}").FontColor(Colors.Grey.Darken1);
                    needsSeparator = true;
                }

                if (hasEmail)
                {
                    if (needsSeparator)
                    {
                        text.Span(" • ").FontColor(Colors.Grey.Darken1);
                    }
                    text.Hyperlink(p.Email.Trim(), $"mailto:{p.Email.Trim()}").FontColor(Colors.Grey.Darken1);
                    needsSeparator = true;
                }

                if (hasDigitalTwin)
                {
                    if (needsSeparator)
                    {
                        text.Span(" • ").FontColor(Colors.Grey.Darken1);
                    }
                    text.Span("Twin: ").FontColor(Colors.Grey.Darken1);
                    if (digitalTwinHref is not null)
                    {
                        text.Hyperlink(digitalTwinDisplay!, digitalTwinHref).FontColor(Colors.Grey.Darken1);
                    }
                    else
                    {
                        text.Span(digitalTwinDisplay!).FontColor(Colors.Grey.Darken1);
                    }
                }
            });
        }

        if (activeLinks.Count > 0)
        {
            col.Item().PaddingTop(2).Text(text =>
            {
                for (int i = 0; i < activeLinks.Count; i++)
                {
                    if (i > 0)
                    {
                        text.Span(" • ").FontColor(Colors.Grey.Darken1);
                    }

                    var link = activeLinks[i];
                    var (prefix, url) = ParseLink(link);
                    var displayUrl = CleanUrlForDisplay(url);
                    var display = !string.IsNullOrEmpty(prefix) ? $"{prefix}: {displayUrl}" : displayUrl;
                    var href = url.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? url : null;
                    if (href is not null)
                    {
                        text.Hyperlink(display, href).FontColor(Colors.Grey.Darken1);
                    }
                    else
                    {
                        text.Span(display).FontColor(Colors.Grey.Darken1);
                    }
                }
            });
        }

        // Thin accent rule under the contact block.
        col.Item().PaddingVertical(4).LineHorizontal(0.5f).LineColor(accent);
    }

    private static (string? prefix, string url) ParseLink(string link)
    {
        var trimmed = link.Trim();
        var index = trimmed.IndexOf(':');
        if (index > 0)
        {
            var prefix = trimmed.Substring(0, index).Trim();
            var url = trimmed.Substring(index + 1).Trim();
            if (!prefix.Equals("http", StringComparison.OrdinalIgnoreCase) &&
                !prefix.Equals("https", StringComparison.OrdinalIgnoreCase))
            {
                return (prefix, url);
            }
        }
        return (null, trimmed);
    }

    private static string CleanUrlForDisplay(string url)
    {
        if (url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return url.Substring(8);
        }
        if (url.StartsWith("http://", StringComparison.OrdinalIgnoreCase))
        {
            return url.Substring(7);
        }
        return url;
    }

    // Emits the top-level sections in the user's chosen order (payload.SectionOrder). Each slot is a
    // built-in key or "custom:{id}". An empty/missing SectionOrder falls back to the default order.
    // The Personal header is always rendered first (by Render) and is NOT part of SectionOrder.
    private void RenderSections(ColumnDescriptor col, CvPayload payload, string accent)
    {
        var order = NormalizeSectionOrder(payload);

        // Index custom sections by "custom:{id}" for O(1) lookup during the dispatch loop.
        var customById = payload.CustomSections
            .Where(c => !string.IsNullOrWhiteSpace(c.Id))
            .GroupBy(c => $"custom:{c.Id}")
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.Ordinal);

        bool needSpacer = false;

        foreach (var slot in order)
        {
            if (IsSectionActive(slot, payload, customById))
            {
                if (needSpacer)
                {
                    col.Item().PaddingTop(AfterSection);
                }

                RenderSection(slot, col, payload, customById);
                needSpacer = true;
            }
        }
    }

    private static bool IsSectionActive(string slot, CvPayload payload, Dictionary<string, CvCustomSection> customById)
    {
        if (slot.StartsWith("custom:", StringComparison.Ordinal))
        {
            return customById.TryGetValue(slot, out var custom) && !string.IsNullOrWhiteSpace(custom.Title);
        }

        return slot switch
        {
            "summary" => !string.IsNullOrWhiteSpace(payload.Summary),
            "achievements" => payload.KeyAchievements.Any(a => !string.IsNullOrWhiteSpace(a)),
            "skills" => payload.Skills.Any(s => !string.IsNullOrWhiteSpace(s.Name)),
            "work" => payload.WorkExperience.Count > 0,
            "certifications" => payload.Certifications.Any(c => !string.IsNullOrWhiteSpace(c.Name)),
            "education" => payload.Education.Count > 0,
            _ => false
        };
    }

    private void RenderSection(string slot, ColumnDescriptor col, CvPayload payload, Dictionary<string, CvCustomSection> customById)
    {
        if (slot.StartsWith("custom:", StringComparison.Ordinal))
        {
            if (customById.TryGetValue(slot, out var custom))
            {
                RenderCustomSection(col, custom);
            }
            return;
        }

        switch (slot)
        {
            case "summary": RenderSummary(col, payload.Summary); break;
            case "achievements": RenderKeyAchievements(col, payload.KeyAchievements); break;
            case "skills": RenderSkills(col, payload.Skills); break;
            case "work": RenderWorkExperience(col, payload.WorkExperience); break;
            case "certifications": RenderCertifications(col, payload.Certifications); break;
            case "education": RenderEducation(col, payload.Education); break;
        }
    }

    // Standalone "Key Achievements" section — a small set of cross-career highlight bullets rendered
    // with the same bullet treatment as employer bullets. Omitted entirely when empty.
    private void RenderKeyAchievements(ColumnDescriptor col, IReadOnlyList<string> achievements)
    {
        var clean = achievements.Where(a => !string.IsNullOrWhiteSpace(a)).Select(a => a!.Trim()).ToList();
        if (clean.Count == 0) return;

        SectionHeading(col, "Key Achievements");
        foreach (var bullet in clean)
        {
            RenderBullet(col, bullet);
        }
    }

    private static List<string> NormalizeSectionOrder(CvPayload payload)
    {
        var seen = new HashSet<string>(StringComparer.Ordinal);
        var ordered = new List<string>();
        var builtins = CvPayload.DefaultSectionOrder;
        var customIds = payload.CustomSections
            .Where(c => !string.IsNullOrWhiteSpace(c.Id))
            .Select(c => $"custom:{c.Id}")
            .ToHashSet(StringComparer.Ordinal);
        bool IsValid(string slot) => builtins.Contains(slot) || customIds.Contains(slot);

        foreach (var slot in payload.SectionOrder)
        {
            if (slot is not null && IsValid(slot) && seen.Add(slot)) ordered.Add(slot);
        }
        foreach (var slot in builtins)
        {
            if (seen.Add(slot)) ordered.Add(slot);
        }
        foreach (var slot in customIds)
        {
            if (seen.Add(slot)) ordered.Add(slot);
        }
        return ordered;
    }

    private void RenderSummary(ColumnDescriptor col, string summary)
    {
        if (string.IsNullOrWhiteSpace(summary)) return;
        SectionHeading(col, "Professional Summary");
        col.Item().Text(summary.Trim());
    }

    // For each category: label on its own line, then skills joined by • on the next line. Matches the
    // "Architecture\nSolution Arch • Integration Arch…" stacked layout.
    private void RenderSkills(ColumnDescriptor col, IReadOnlyList<CvSkillItem> skills)
    {
        var clean = skills.Where(s => !string.IsNullOrWhiteSpace(s.Name)).ToList();
        if (clean.Count == 0) return;
        SectionHeading(col, "Core Skills");

        var grouped = clean
            .GroupBy(s => string.IsNullOrWhiteSpace(s.Category) ? null : s.Category)
            .ToList();

        if (grouped.Count == 1 && grouped[0].Key is null)
        {
            col.Item().Text(string.Join(" • ", grouped[0].Select(s => s.Name!.Trim())));
        }
        else
        {
            foreach (var grp in grouped)
            {
                var label = grp.Key ?? "Other";
                var names = string.Join(" • ", grp.Select(s => s.Name!.Trim()));
                col.Item().Text(label).Bold();
                col.Item().PaddingTop(1).Text(names);
                col.Item().PaddingTop(7);
            }
        }
    }

    // Each CvEmployer → name (bold), Role | Dates, summary; then engagements (Case A) or direct
    // bullets (Case B).
    private void RenderWorkExperience(ColumnDescriptor col, IReadOnlyList<CvEmployer> employers)
    {
        if (employers.Count == 0) return;
        SectionHeading(col, "Professional Experience");

        for (int i = 0; i < employers.Count; i++)
        {
            if (i > 0) col.Item().PaddingTop(8);
            RenderEmployer(col, employers[i]);
        }
    }

    private void RenderEmployer(ColumnDescriptor col, CvEmployer e)
    {
        col.Item().Element(ht => ht.Column(c =>
        {
            var name = e.Name?.Trim();
            var loc = e.Location?.Trim();
            if (!string.IsNullOrEmpty(name) || !string.IsNullOrEmpty(loc))
            {
                c.Item().Row(row =>
                {
                    row.RelativeItem().Text(name ?? string.Empty)
                        .FontSize(JobTitleSize).Bold();
                    if (!string.IsNullOrEmpty(loc))
                    {
                        row.ConstantItem(180).AlignRight().Text(loc)
                            .Medium().FontColor(Colors.Grey.Darken1);
                    }
                });
            }

            var role = e.Role?.Trim();
            var dates = e.Dates?.Trim();
            if (!string.IsNullOrEmpty(role) || !string.IsNullOrEmpty(dates))
            {
                c.Item().Row(row =>
                {
                    row.RelativeItem().Text(role ?? string.Empty)
                        .Medium().FontColor(Colors.Grey.Darken1);
                    if (!string.IsNullOrEmpty(dates))
                    {
                        row.ConstantItem(180).AlignRight().Text(dates)
                            .FontColor(Colors.Grey.Darken1);
                    }
                });
            }

            if (!string.IsNullOrWhiteSpace(e.Summary))
            {
                c.Item().PaddingTop(2).Text(e.Summary.Trim());
            }
        }));

        // Case A: client engagements.
        foreach (var eng in e.Engagements.Where(en => HasEngagementContent(en)))
        {
            RenderEngagement(col, eng);
        }

        // Case B: direct bullets.
        if (e.Engagements.Count == 0)
        {
            foreach (var bullet in e.Bullets.Where(b => !string.IsNullOrWhiteSpace(b)))
            {
                RenderBullet(col, bullet.Trim());
            }
        }
    }

    private void RenderEngagement(ColumnDescriptor col, CvClientEngagement eng)
    {
        col.Item().PaddingTop(AfterBullet).Element(e => e
            .PaddingLeft(BulletIndentCm, Unit.Centimetre)
            .Column(c =>
            {
                if (!string.IsNullOrWhiteSpace(eng.ClientName))
                {
                    c.Item().Text(eng.ClientName.Trim()).Bold();
                }
                if (!string.IsNullOrWhiteSpace(eng.RoleContext))
                {
                    c.Item().Text(eng.RoleContext.Trim()).FontColor(Colors.Grey.Darken1);
                }
                foreach (var achievement in eng.Achievements.Where(a => !string.IsNullOrWhiteSpace(a)))
                {
                    c.Item().PaddingTop(2).Row(r =>
                    {
                        r.ConstantItem(12).Text("•");
                        r.RelativeItem().PaddingLeft(2).Text(achievement.Trim());
                    });
                }
            }));
    }

    private static bool HasEngagementContent(CvClientEngagement eng) =>
        !string.IsNullOrWhiteSpace(eng.ClientName) ||
        !string.IsNullOrWhiteSpace(eng.RoleContext) ||
        eng.Achievements.Any(a => !string.IsNullOrWhiteSpace(a));

    private void RenderBullet(ColumnDescriptor col, string text)
    {
        col.Item().PaddingTop(AfterBullet).Element(e => e
            .PaddingLeft(BulletIndentCm, Unit.Centimetre)
            .Row(r =>
            {
                r.ConstantItem(12).Text("•");
                r.RelativeItem().PaddingLeft(1.5f).Text(text);
            }));
    }

    // Grouped by issuer → issuer label + • cert bullets per group.
    private void RenderCertifications(ColumnDescriptor col, IReadOnlyList<CvCertificationItem> items)
    {
        var clean = items.Where(c => !string.IsNullOrWhiteSpace(c.Name)).ToList();
        if (clean.Count == 0) return;
        SectionHeading(col, "Certifications");

        var grouped = clean
            .GroupBy(c => string.IsNullOrWhiteSpace(c.Issuer) ? null : c.Issuer.Trim())
            .ToList();

        for (int i = 0; i < grouped.Count; i++)
        {
            var grp = grouped[i];
            if (i > 0) col.Item().PaddingTop(5);
            var label = grp.Key ?? "Other";
            var groupUrl = grp.FirstOrDefault(c => !string.IsNullOrWhiteSpace(c.Url))?.Url?.Trim();

            if (!string.IsNullOrEmpty(groupUrl))
            {
                var displayUrl = CleanUrlForDisplay(groupUrl);
                var href = groupUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? groupUrl : $"https://{groupUrl}";
                col.Item().Text(text =>
                {
                    text.Span(label).Bold();
                    text.Span(" (").FontColor(Colors.Grey.Darken1);
                    text.Hyperlink(displayUrl, href).FontColor(Colors.Grey.Darken1);
                    text.Span(")").FontColor(Colors.Grey.Darken1);
                });
            }
            else
            {
                col.Item().Text(label).Bold();
            }

            var certLines = new List<string>();
            foreach (var cert in grp)
            {
                var line = cert.Name!.Trim();
                if (!string.IsNullOrWhiteSpace(cert.Date)) line += $" ({cert.Date.Trim()})";
                certLines.Add(line);
            }

            if (certLines.Count > 0)
            {
                var joined = string.Join(" • ", certLines);
                col.Item().PaddingTop(1).Text(joined);
            }
        }
    }

    // Concise — qualification, institution, date, location and details.
    private void RenderEducation(ColumnDescriptor col, IReadOnlyList<CvEducationItem> items)
    {
        if (items.Count == 0) return;

        col.Item().PreventPageBreak().Column(groupCol =>
        {
            SectionHeading(groupCol, "Education");
            RenderEducationItem(groupCol, items[0]);
        });

        for (int i = 1; i < items.Count; i++)
        {
            col.Item().PaddingTop(6);
            var e = items[i];
            col.Item().PreventPageBreak().Column(innerCol =>
            {
                RenderEducationItem(innerCol, e);
            });
        }
    }

    private void RenderEducationItem(ColumnDescriptor innerCol, CvEducationItem e)
    {
        var qualification = e.Qualification?.Trim();
        var dateRange = FormatDateRange(e.Start, e.End);
        if (!string.IsNullOrEmpty(qualification) || !string.IsNullOrEmpty(dateRange))
        {
            innerCol.Item().Row(row =>
            {
                row.RelativeItem().Text(qualification ?? string.Empty).FontSize(JobTitleSize).Medium();
                if (!string.IsNullOrEmpty(dateRange))
                {
                    row.ConstantItem(180).AlignRight().Text(dateRange)
                        .FontColor(Colors.Grey.Darken1);
                }
            });
        }

        var institution = e.Institution?.Trim();
        var location = e.Location?.Trim();
        var instLoc = new List<string>();
        if (!string.IsNullOrEmpty(institution)) instLoc.Add(institution);
        if (!string.IsNullOrEmpty(location)) instLoc.Add(location);

        if (instLoc.Count > 0)
        {
            innerCol.Item().PaddingTop(1).Text(string.Join(", ", instLoc))
                .FontColor(Colors.Grey.Darken1);
        }

        var details = e.Details?.Trim();
        if (!string.IsNullOrEmpty(details))
        {
            innerCol.Item().PaddingTop(2).Text(details);
        }
    }

    private void RenderCustomSection(ColumnDescriptor col, CvCustomSection section)
    {
        if (string.IsNullOrWhiteSpace(section.Title)) return;
        SectionHeading(col, section.Title!.Trim());
        foreach (var item in section.Items.Where(i => !string.IsNullOrWhiteSpace(i)))
        {
            RenderBullet(col, item.Trim());
        }
    }

    // Bold ALL CAPS heading with a thin accent rule beneath it.
    private static void SectionHeading(ColumnDescriptor col, string title)
    {
        col.Item().Text(title.ToUpperInvariant()).FontSize(HeadingSize).Bold();
        col.Item().PaddingTop(1).LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten1);
        col.Item().PaddingTop(1);
    }

    // "Start – End" with an en dash; tolerates a single date.
    private static string FormatDateRange(string? start, string? end)
    {
        var s = start?.Trim();
        var e = end?.Trim();
        if (string.IsNullOrEmpty(s) && string.IsNullOrEmpty(e)) return "";
        if (string.IsNullOrEmpty(s)) return e!;
        if (string.IsNullOrEmpty(e)) return s;
        return $"{s} – {e}";
    }
}

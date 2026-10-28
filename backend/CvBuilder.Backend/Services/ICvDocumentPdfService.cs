using CvBuilder.Backend.Models;

namespace CvBuilder.Backend.Services;

/// <summary>
/// Renders a structured CvDocument (the CV Builder draft) to an ATS-optimised UK PDF.
/// Kept behind an interface for clean separation of concerns and dependency injection.
/// </summary>
public interface ICvDocumentPdfService
{
    /// <summary>
    /// Renders the CV to PDF bytes honouring the UK ATS spec (A4, 0.35" top, 0.25" bottom, 0.45" left/right margins,
    /// Calibri font, single column, black + one accent). The returned bytes always begin with the PDF magic header "%PDF-".
    /// </summary>
    byte[] Render(CvDocument cv);

    /// <summary>
    /// Alias for Render(cv) per Phase 4 specification.
    /// </summary>
    byte[] GeneratePdf(CvDocument cv) => Render(cv);
}

"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  CvCustomSection,
  CvPayload,
  normalizeSectionOrder,
  SECTION_LABEL,
  TEMPLATE_ACCENT,
  TemplateKey,
} from "@/lib/types";

interface A4PreviewProps {
  payload: CvPayload;
  templateKey?: TemplateKey | string;
  zoom?: number;
}

// QuestPDF spec constants:
// A4 = 210 x 297 mm
// Margins: Top 0.35 in, Bottom 0.25 in, Left 0.45 in, Right 0.45 in
// Fonts: Name 21pt, Headline 11pt (semi-bold), Headings 12pt (bold),
// Employer/JobTitle 11pt (bold), Body/Bullets 10.5pt.
// Spacings: AfterName 5pt, AfterBullet 4pt, AfterSection 10pt, BulletIndent 0.3cm.
// Colors: Default black (#000000), Grey.Darken1 (#757575), Grey.Lighten1 (#BDBDBD).

export function A4Preview({
  payload,
  templateKey = "classic",
  zoom = 100,
}: A4PreviewProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sheetHeight, setSheetHeight] = useState<number>(1123);

  const accent = useMemo(() => {
    const key = (templateKey || "classic").toLowerCase() as TemplateKey;
    return TEMPLATE_ACCENT[key] || TEMPLATE_ACCENT.classic;
  }, [templateKey]);

  const personal = payload.personal || {};

  // Track height to size outer scale container bounds
  useEffect(() => {
    const updateDimensions = () => {
      if (sheetRef.current) {
        setSheetHeight(sheetRef.current.scrollHeight);
      }
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    if (sheetRef.current) {
      observer.observe(sheetRef.current);
    }
    return () => observer.disconnect();
  }, [payload]);

  const parseLink = (link: string): { prefix: string | null; url: string } => {
    const trimmed = link.trim();
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx > 0) {
      const prefix = trimmed.substring(0, colonIdx).trim();
      const rest = trimmed.substring(colonIdx + 1).trim();
      if (prefix.toLowerCase() !== "http" && prefix.toLowerCase() !== "https") {
        return { prefix, url: rest };
      }
    }
    return { prefix: null, url: trimmed };
  };

  const cleanDisplayUrl = (url: string): string => {
    if (url.toLowerCase().startsWith("https://")) {
      return url.substring(8);
    }
    if (url.toLowerCase().startsWith("http://")) {
      return url.substring(7);
    }
    return url;
  };

  // Extract "Twin" or "Digital Twin" to render inline on the contact line, matching QuestPDF exactly
  const { inlineTwin, activeLinks } = useMemo(() => {
    const allLinks = (personal.links || [])
      .filter((l) => l && typeof l === "string" && l.trim().length > 0)
      .map((l) => l.trim());
    let twin: { display: string; href: string | null } | null = null;
    const remaining: string[] = [];

    for (const l of allLinks) {
      const { prefix, url } = parseLink(l);
      if (
        prefix &&
        (prefix.toLowerCase() === "twin" ||
          prefix.toLowerCase() === "digital twin")
      ) {
        const display = cleanDisplayUrl(url);
        const href = url.toLowerCase().startsWith("http")
          ? url
          : `https://${url}`;
        twin = { display, href };
      } else {
        remaining.push(l);
      }
    }

    return { inlineTwin: twin, activeLinks: remaining };
  }, [personal.links]);

  const slots = useMemo(() => normalizeSectionOrder(payload), [payload]);

  // Skills grouped by category in insertion order, matching QuestPDF LINQ GroupBy
  const skillGroups = useMemo(() => {
    const clean = (payload.skills || []).filter((s) => s.name?.trim());
    const map = new Map<string, string[]>();
    for (const s of clean) {
      const cat = s.category?.trim() || "";
      const existing = map.get(cat);
      if (existing) {
        existing.push(s.name.trim());
      } else {
        map.set(cat, [s.name.trim()]);
      }
    }

    return Array.from(map.entries()).map(([rawCategory, names]) => ({
      label: rawCategory || null,
      names: names.join(" • "),
    }));
  }, [payload.skills]);

  const isFlatSkills =
    skillGroups.length === 1 && skillGroups[0].label === null;

  // Certifications grouped by issuer, matching QuestPDF LINQ GroupBy
  const certGroups = useMemo(() => {
    const clean = (payload.certifications || []).filter((c) => c.name?.trim());
    const map = new Map<
      string,
      { url?: string; items: { name: string; date: string }[] }
    >();

    for (const c of clean) {
      const key = c.issuer?.trim() || "Other";
      const itemUrl = c.url?.trim();
      const existing = map.get(key);
      if (existing) {
        existing.items.push({
          name: c.name.trim(),
          date: c.date?.trim() || "",
        });
        if (!existing.url && itemUrl) {
          existing.url = itemUrl;
        }
      } else {
        map.set(key, {
          url: itemUrl,
          items: [{ name: c.name.trim(), date: c.date?.trim() || "" }],
        });
      }
    }

    return Array.from(map.entries()).map(([label, data]) => ({
      label,
      url: data.url,
      items: data.items,
    }));
  }, [payload.certifications]);

  // Custom sections indexed by "custom:{id}"
  const customById = useMemo(() => {
    const dict = new Map<string, CvCustomSection>();
    for (const c of payload.customSections || []) {
      if (c.id?.trim()) {
        dict.set(`custom:${c.id}`, c);
      }
    }
    return dict;
  }, [payload.customSections]);

  const isSectionActive = (slot: string): boolean => {
    if (slot.startsWith("custom:")) {
      const custom = customById.get(slot);
      return Boolean(custom && custom.title && custom.title.trim().length > 0);
    }

    switch (slot) {
      case "summary":
        return Boolean(payload.summary && payload.summary.trim().length > 0);
      case "achievements":
        return Boolean(
          payload.keyAchievements &&
            payload.keyAchievements.some((a) => a && a.trim().length > 0)
        );
      case "skills":
        return Boolean(
          payload.skills &&
            payload.skills.some((s) => s.name && s.name.trim().length > 0)
        );
      case "work":
        return Boolean(
          payload.workExperience && payload.workExperience.length > 0
        );
      case "certifications":
        return Boolean(
          payload.certifications &&
            payload.certifications.some((c) => c.name && c.name.trim().length > 0)
        );
      case "education":
        return Boolean(payload.education && payload.education.length > 0);
      default:
        return false;
    }
  };

  const activeSlots = useMemo(() => {
    return slots.filter((s) => isSectionActive(s));
  }, [slots, payload, customById]);

  const formatDateRange = (start?: string, end?: string): string => {
    const s = start?.trim();
    const e = end?.trim();
    if (!s && !e) return "";
    if (!s) return e!;
    if (!e) return s;
    return `${s} – ${e}`;
  };

  const renderBullet = (text: string, key?: React.Key) => (
    <div
      key={key}
      style={{
        paddingTop: "4pt",
        paddingLeft: "0.3cm",
        display: "flex",
        alignItems: "flex-start",
        fontSize: "10.5pt",
        color: "#000000",
        lineHeight: 1.15,
      }}
    >
      <span
        style={{
          width: "12pt",
          flexShrink: 0,
          color: "#000000",
          userSelect: "none",
        }}
      >
        •
      </span>
      <span style={{ paddingLeft: "1.5pt", flex: 1 }}>{text}</span>
    </div>
  );

  const renderSectionHeading = (title: string) => (
    <div style={{ width: "100%" }}>
      <div
        style={{
          fontSize: "12pt",
          fontWeight: 700,
          textTransform: "uppercase",
          color: "#000000",
          lineHeight: 1.1,
          letterSpacing: "0.02em",
        }}
      >
        {title.toUpperCase()}
      </div>
      <div
        style={{
          marginTop: "1pt",
          borderBottom: "0.5pt solid #BDBDBD",
          marginBottom: "1pt",
        }}
      />
    </div>
  );

  const hasLocation = Boolean(personal.location?.trim());
  const hasPhone = Boolean(personal.phone?.trim());
  const hasEmail = Boolean(personal.email?.trim());
  const hasDigitalTwin = Boolean(inlineTwin);

  const isEmpty =
    !personal.fullName &&
    !personal.headline &&
    !payload.summary?.trim() &&
    activeSlots.length === 0;

  const scale = (zoom || 100) / 100;
  const a4WidthPx = 794;

  return (
    <div className="flex justify-center w-full min-w-full">
      {/* Outer bounding box that physically resizes with zoom to eliminate fake scrollbars */}
      <div
        style={{
          width: `${Math.round(a4WidthPx * scale)}px`,
          height: `${Math.round(sheetHeight * scale)}px`,
          position: "relative",
          flexShrink: 0,
          margin: "0 auto",
          transition: "width 0.15s ease, height 0.15s ease",
        }}
      >
        <div
          style={{
            transform: zoom !== 100 ? `scale(${scale})` : undefined,
            transformOrigin: "top left",
            width: "210mm",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          {/* Exact A4 Sheet: 210mm wide, min 297mm high */}
          <div
            ref={sheetRef}
            className="relative bg-white text-black shadow-2xl ring-1 ring-slate-900/10 select-text"
            style={{
              fontFamily: 'Calibri, Carlito, "Segoe UI", Arial, sans-serif',
              width: "210mm",
              minHeight: "297mm",
              padding: "0.35in 0.45in 0.25in 0.45in",
              boxSizing: "border-box",
              fontSize: "10.5pt",
              lineHeight: 1.15,
              color: "#000000",
            }}
          >

        {/* ── Candidate Header ────────────────────────────────────────── */}
        <div>
          {personal.fullName?.trim() ? (
            <div
              style={{
                fontSize: "21pt",
                fontWeight: 700,
                color: accent,
                lineHeight: 1.05,
              }}
            >
              {personal.fullName.trim()}
            </div>
          ) : (
            <div
              style={{
                fontSize: "21pt",
                fontWeight: 700,
                color: "#94a3b8",
                fontStyle: "italic",
                lineHeight: 1.05,
              }}
            >
              Candidate Full Name
            </div>
          )}

          {/* AfterName Spacing = 5pt */}
          <div style={{ paddingTop: "5pt" }} />

          {personal.headline?.trim() && (
            <div
              style={{
                fontSize: "11pt",
                fontWeight: 600,
                color: "#757575",
                lineHeight: 1.15,
              }}
            >
              {personal.headline.trim()}
            </div>
          )}

          {/* Contact Details Row (Location • Phone • Email • Twin) */}
          {(hasLocation || hasPhone || hasEmail || hasDigitalTwin) && (
            <div
              style={{
                paddingTop: "2pt",
                fontSize: "10.5pt",
                color: "#757575",
                lineHeight: 1.15,
              }}
            >
              {hasLocation && <span>{personal.location!.trim()}</span>}

              {hasPhone && (
                <>
                  {hasLocation && <span> • </span>}
                  <a
                    href={`tel:${personal.phone!.trim()}`}
                    style={{ color: "#757575", textDecoration: "none" }}
                    className="hover:underline"
                  >
                    {personal.phone!.trim()}
                  </a>
                </>
              )}

              {hasEmail && (
                <>
                  {(hasLocation || hasPhone) && <span> • </span>}
                  <a
                    href={`mailto:${personal.email!.trim()}`}
                    style={{ color: "#757575", textDecoration: "none" }}
                    className="hover:underline"
                  >
                    {personal.email!.trim()}
                  </a>
                </>
              )}

              {hasDigitalTwin && (
                <>
                  {(hasLocation || hasPhone || hasEmail) && <span> • </span>}
                  <span>Twin: </span>
                  {inlineTwin!.href ? (
                    <a
                      href={inlineTwin!.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#757575", textDecoration: "none" }}
                      className="hover:underline"
                    >
                      {inlineTwin!.display}
                    </a>
                  ) : (
                    <span>{inlineTwin!.display}</span>
                  )}
                </>
              )}
            </div>
          )}

          {/* Secondary Links Row (LinkedIn • GitHub • Portfolio...) */}
          {activeLinks.length > 0 && (
            <div
              style={{
                paddingTop: "2pt",
                fontSize: "10.5pt",
                color: "#757575",
                lineHeight: 1.15,
              }}
            >
              {activeLinks.map((link, idx) => {
                const { prefix, url } = parseLink(link);
                const displayUrl = cleanDisplayUrl(url);
                const href = url.toLowerCase().startsWith("http")
                  ? url
                  : `https://${url}`;
                const label = prefix ? `${prefix}: ${displayUrl}` : displayUrl;

                return (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span> • </span>}
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#757575", textDecoration: "none" }}
                      className="hover:underline"
                    >
                      {label}
                    </a>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Thin accent rule under contact block (0.5pt with 4pt padding above/below) */}
          <div
            style={{
              paddingTop: "4pt",
              paddingBottom: "4pt",
            }}
          >
            <div style={{ borderBottom: `0.5pt solid ${accent}` }} />
          </div>
        </div>

        {/* ── Dynamic Sections (Order per payload.sectionOrder, 10pt gap) ── */}
        <div>
          {activeSlots.map((slot, sIdx) => {
            const isNeedSpacer = sIdx > 0;

            // 1. Custom Sections
            if (slot.startsWith("custom:")) {
              const customSec = customById.get(slot);
              if (!customSec || !customSec.title?.trim()) return null;
              const cleanItems = (customSec.items || []).filter(
                (i) => i && i.trim().length > 0
              );

              return (
                <div
                  key={slot}
                  style={{ paddingTop: isNeedSpacer ? "10pt" : "0pt" }}
                >
                  {renderSectionHeading(customSec.title.trim())}
                  {cleanItems.map((item, i) => renderBullet(item.trim(), i))}
                </div>
              );
            }

            // 2. Built-in Sections
            switch (slot) {
              case "summary":
                return (
                  <div
                    key="summary"
                    style={{ paddingTop: isNeedSpacer ? "10pt" : "0pt" }}
                  >
                    {renderSectionHeading(SECTION_LABEL.summary)}
                    <div
                      style={{
                        fontSize: "10.5pt",
                        color: "#000000",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.15,
                      }}
                    >
                      {payload.summary!.trim()}
                    </div>
                  </div>
                );

              case "achievements": {
                const cleanBullets = (payload.keyAchievements || []).filter(
                  (b) => b && b.trim().length > 0
                );
                return (
                  <div
                    key="achievements"
                    style={{ paddingTop: isNeedSpacer ? "10pt" : "0pt" }}
                  >
                    {renderSectionHeading(SECTION_LABEL.achievements)}
                    {cleanBullets.map((bullet, i) =>
                      renderBullet(bullet.trim(), i)
                    )}
                  </div>
                );
              }

              case "skills":
                return (
                  <div
                    key="skills"
                    style={{ paddingTop: isNeedSpacer ? "10pt" : "0pt" }}
                  >
                    {renderSectionHeading(SECTION_LABEL.skills)}
                    {isFlatSkills ? (
                      <div
                        style={{
                          fontSize: "10.5pt",
                          color: "#000000",
                          lineHeight: 1.15,
                        }}
                      >
                        {skillGroups[0]?.names}
                      </div>
                    ) : (
                      <div>
                        {skillGroups.map((grp, gIdx) => (
                          <div
                            key={gIdx}
                            style={{
                              paddingBottom:
                                gIdx < skillGroups.length - 1 ? "7pt" : "0pt",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "10.5pt",
                                fontWeight: 700,
                                color: "#000000",
                                lineHeight: 1.15,
                              }}
                            >
                              {grp.label ?? "Other"}
                            </div>
                            <div
                              style={{
                                paddingTop: "1pt",
                                fontSize: "10.5pt",
                                color: "#000000",
                                lineHeight: 1.15,
                              }}
                            >
                              {grp.names}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );

              case "work":
                return (
                  <div
                    key="work"
                    style={{ paddingTop: isNeedSpacer ? "10pt" : "0pt" }}
                  >
                    {renderSectionHeading(SECTION_LABEL.work)}
                    {payload.workExperience?.map((w, empIdx) => {
                      const isCaseA = (w.engagements || []).length > 0;
                      const cleanBullets = (w.bullets || []).filter(
                        (b) => b && b.trim().length > 0
                      );

                      return (
                        <div
                          key={empIdx}
                          style={{
                            paddingTop: empIdx > 0 ? "8pt" : "0pt",
                          }}
                        >
                          {/* Employer Name & Location */}
                          {(w.name?.trim() || w.location?.trim()) && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "baseline",
                                lineHeight: 1.15,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "11pt",
                                  fontWeight: 700,
                                  color: "#000000",
                                  flex: 1,
                                }}
                              >
                                {w.name?.trim() || ""}
                              </div>
                              {w.location?.trim() && (
                                <div
                                  style={{
                                    width: "180pt",
                                    textAlign: "right",
                                    fontSize: "10.5pt",
                                    fontWeight: 500,
                                    color: "#757575",
                                    flexShrink: 0,
                                  }}
                                >
                                  {w.location.trim()}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Role Context & Dates */}
                          {(w.role?.trim() || w.dates?.trim()) && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "baseline",
                                lineHeight: 1.15,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "10.5pt",
                                  fontWeight: 500,
                                  color: "#757575",
                                  flex: 1,
                                }}
                              >
                                {w.role?.trim() || ""}
                              </div>
                              {w.dates?.trim() && (
                                <div
                                  style={{
                                    width: "180pt",
                                    textAlign: "right",
                                    fontSize: "10.5pt",
                                    fontWeight: 400,
                                    color: "#757575",
                                    flexShrink: 0,
                                  }}
                                >
                                  {w.dates.trim()}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Role Summary */}
                          {w.summary?.trim() && (
                            <div
                              style={{
                                paddingTop: "2pt",
                                fontSize: "10.5pt",
                                color: "#000000",
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.15,
                              }}
                            >
                              {w.summary.trim()}
                            </div>
                          )}

                          {/* Case A: Client Engagements */}
                          {isCaseA &&
                            w.engagements.map((eng, eIdx) => {
                              const engBullets = (
                                eng.achievements || []
                              ).filter((b) => b && b.trim().length > 0);
                              return (
                                <div
                                  key={eIdx}
                                  style={{
                                    paddingTop: "4pt",
                                    paddingLeft: "0.3cm",
                                    lineHeight: 1.15,
                                  }}
                                >
                                  {eng.clientName?.trim() && (
                                    <div
                                      style={{
                                        fontSize: "10.5pt",
                                        fontWeight: 700,
                                        color: "#000000",
                                      }}
                                    >
                                      {eng.clientName.trim()}
                                    </div>
                                  )}
                                  {eng.roleContext?.trim() && (
                                    <div
                                      style={{
                                        fontSize: "10.5pt",
                                        fontWeight: 400,
                                        color: "#757575",
                                      }}
                                    >
                                      {eng.roleContext.trim()}
                                    </div>
                                  )}
                                  {engBullets.map((ach, aIdx) => (
                                    <div
                                      key={aIdx}
                                      style={{
                                        paddingTop: "2pt",
                                        display: "flex",
                                        alignItems: "flex-start",
                                        fontSize: "10.5pt",
                                        color: "#000000",
                                        lineHeight: 1.15,
                                      }}
                                    >
                                      <span
                                        style={{
                                          width: "12pt",
                                          flexShrink: 0,
                                          userSelect: "none",
                                        }}
                                      >
                                        •
                                      </span>
                                      <span
                                        style={{
                                          paddingLeft: "2pt",
                                          flex: 1,
                                        }}
                                      >
                                        {ach.trim()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}

                          {/* Case B: Direct Bullets */}
                          {!isCaseA &&
                            cleanBullets.map((bullet, bIdx) =>
                              renderBullet(bullet.trim(), bIdx)
                            )}
                        </div>
                      );
                    })}
                  </div>
                );

              case "certifications":
                return (
                  <div
                    key="certifications"
                    style={{ paddingTop: isNeedSpacer ? "10pt" : "0pt" }}
                  >
                    {renderSectionHeading(SECTION_LABEL.certifications)}
                    {certGroups.map((grp, gIdx) => {
                      const displayUrl = grp.url
                        ? cleanDisplayUrl(grp.url)
                        : null;
                      const href = grp.url
                        ? grp.url.toLowerCase().startsWith("http")
                          ? grp.url
                          : `https://${grp.url}`
                        : null;

                      const certLines = grp.items.map((item) => {
                        return item.date
                          ? `${item.name} (${item.date})`
                          : item.name;
                      });

                      return (
                        <div
                          key={gIdx}
                          style={{
                            paddingTop: gIdx > 0 ? "5pt" : "0pt",
                            lineHeight: 1.15,
                          }}
                        >
                          <div
                            style={{
                              fontSize: "10.5pt",
                              color: "#000000",
                              lineHeight: 1.15,
                            }}
                          >
                            <span style={{ fontWeight: 700 }}>
                              {grp.label}
                            </span>
                            {displayUrl && (
                              <span style={{ color: "#757575" }}>
                                {" ("}
                                <a
                                  href={href!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: "#757575",
                                    textDecoration: "none",
                                  }}
                                  className="hover:underline"
                                >
                                  {displayUrl}
                                </a>
                                {")"}
                              </span>
                            )}
                          </div>
                          {certLines.length > 0 && (
                            <div
                              style={{
                                paddingTop: "1pt",
                                fontSize: "10.5pt",
                                color: "#000000",
                                lineHeight: 1.15,
                              }}
                            >
                              {certLines.join(" • ")}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );

              case "education":
                return (
                  <div
                    key="education"
                    style={{ paddingTop: isNeedSpacer ? "10pt" : "0pt" }}
                  >
                    {renderSectionHeading(SECTION_LABEL.education)}
                    {payload.education?.map((e, idx) => {
                      const range = formatDateRange(e.start, e.end);
                      const instLoc = [e.institution, e.location]
                        .filter((s) => s && s.trim().length > 0)
                        .map((s) => s!.trim())
                        .join(", ");

                      return (
                        <div
                          key={idx}
                          style={{
                            paddingTop: idx > 0 ? "6pt" : "0pt",
                            lineHeight: 1.15,
                          }}
                        >
                          {/* Qualification & Dates */}
                          {(e.qualification?.trim() || range) && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "baseline",
                                lineHeight: 1.15,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "11pt",
                                  fontWeight: 500,
                                  color: "#000000",
                                  flex: 1,
                                }}
                              >
                                {e.qualification?.trim() || ""}
                              </div>
                              {range && (
                                <div
                                  style={{
                                    width: "180pt",
                                    textAlign: "right",
                                    fontSize: "10.5pt",
                                    fontWeight: 400,
                                    color: "#757575",
                                    flexShrink: 0,
                                  }}
                                >
                                  {range}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Institution & Location */}
                          {instLoc && (
                            <div
                              style={{
                                paddingTop: "1pt",
                                fontSize: "10.5pt",
                                fontWeight: 400,
                                color: "#757575",
                                lineHeight: 1.15,
                              }}
                            >
                              {instLoc}
                            </div>
                          )}

                          {/* Details */}
                          {e.details?.trim() && (
                            <div
                              style={{
                                paddingTop: "2pt",
                                fontSize: "10.5pt",
                                color: "#000000",
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.15,
                              }}
                            >
                              {e.details.trim()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );

              default:
                return null;
            }
          })}
        </div>

        {/* Empty placeholder */}
        {isEmpty && (
          <div className="py-24 text-center text-slate-400">
            <p className="text-sm italic">
              Your live CV preview will update automatically here as you edit the sections.
            </p>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}

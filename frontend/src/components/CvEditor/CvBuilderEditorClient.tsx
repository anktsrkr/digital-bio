"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  RiArrowLeftLine,
  RiCheckLine,
  RiDownloadLine,
  RiFileTextLine,
  RiLoader4Line,
  RiPaletteLine,
  RiAddLine,
  RiZoomInLine,
  RiZoomOutLine,
  RiEyeLine,
  RiEditLine,
} from "@remixicon/react";
import { toast } from "sonner";
import {
  CvPayload,
  TemplateKey,
  createDefaultCvPayload,
  normalizeSectionOrder,
} from "@/lib/types";
import { getCv, updateCv, downloadCvPdf } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

// Form Section Components
import { PersonalSection } from "@/components/CvEditor/PersonalSection";
import { SummarySection } from "@/components/CvEditor/SummarySection";
import { KeyAchievementsSection } from "@/components/CvEditor/KeyAchievementsSection";
import { SkillsSection } from "@/components/CvEditor/SkillsSection";
import { ExperienceSection } from "@/components/CvEditor/ExperienceSection";
import { EducationSection } from "@/components/CvEditor/EducationSection";
import { CertificationsSection } from "@/components/CvEditor/CertificationsSection";
import {
  CustomSectionCard,
  createEmptyCustomSection,
} from "@/components/CvEditor/CustomSections";

// Live Preview
import { A4Preview } from "@/components/CvPreview/A4Preview";

type SaveStatus = "saved" | "saving" | "error" | "idle";

export default function CvBuilderEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const id = rawId || searchParams.get("id") || "";

  // Editor State
  const [title, setTitle] = useState("");
  const [templateKey, setTemplateKey] = useState<TemplateKey>("classic");
  const [payload, setPayload] = useState<CvPayload>(() => createDefaultCvPayload());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Save State
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

  // Track if initial fetch completed to avoid auto-saving on mount
  const isHydratedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Load CV Draft
  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setLoadError("No CV ID specified. Please return to the Dashboard to select a CV.");
      return;
    }
    let isSubscribed = true;

    getCv(id)
      .then((data) => {
        if (!isSubscribed) return;
        setTitle(data.title || "Untitled CV");
        const validTemplate = (data.templateKey?.toLowerCase() || "classic") as TemplateKey;
        setTemplateKey(["classic", "navy", "teal"].includes(validTemplate) ? validTemplate : "classic");

        const normalizedPayload: CvPayload = {
          ...createDefaultCvPayload(),
          ...(data.payload || {}),
          sectionOrder: normalizeSectionOrder(data.payload),
        };
        setPayload(normalizedPayload);
        setIsLoading(false);
        setSaveStatus("saved");

        // Allow auto-save after initial hydration
        setTimeout(() => {
          isHydratedRef.current = true;
        }, 300);
      })
      .catch((err: unknown) => {
        if (!isSubscribed) return;
        setLoadError(err instanceof Error ? err.message : "Failed to load CV draft.");
        setIsLoading(false);
      });

    return () => {
      isSubscribed = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [id]);

  // 2. Debounced Auto-Save (250ms)
  const triggerAutoSave = useCallback(
    (newTitle: string, newTemplate: TemplateKey, newPayload: CvPayload) => {
      if (!isHydratedRef.current || !id) return;

      setSaveStatus("saving");
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await updateCv(id, {
            title: newTitle.trim() || "Untitled CV",
            templateKey: newTemplate,
            payload: {
              ...newPayload,
              sectionOrder: normalizeSectionOrder(newPayload),
            },
          });
          setSaveStatus("saved");
        } catch {
          setSaveStatus("error");
          toast.error("Failed to auto-save changes. Will retry on next keystroke.");
        }
      }, 250);
    },
    [id]
  );

  // Handlers for top-level properties
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    triggerAutoSave(newTitle, templateKey, payload);
  };

  const handleTemplateChange = (newTemplate: string) => {
    const key = (newTemplate as TemplateKey) || "classic";
    setTemplateKey(key);
    triggerAutoSave(title, key, payload);
  };

  const handlePayloadChange = (updater: (prev: CvPayload) => CvPayload) => {
    setPayload((prev) => {
      const next = updater(prev);
      triggerAutoSave(title, templateKey, next);
      return next;
    });
  };

  // Section Reordering Logic (Task 3.10)
  const moveSectionSlot = (slotKey: string, direction: -1 | 1) => {
    handlePayloadChange((prev) => {
      const currentOrder = normalizeSectionOrder(prev);
      const currentIndex = currentOrder.indexOf(slotKey);
      const targetIndex = currentIndex + direction;

      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= currentOrder.length) {
        return prev;
      }

      const newOrder = [...currentOrder];
      const temp = newOrder[currentIndex];
      newOrder[currentIndex] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;

      return {
        ...prev,
        sectionOrder: newOrder,
      };
    });
  };

  // Add Custom Section (Task 3.9)
  const handleAddCustomSection = () => {
    const newSec = createEmptyCustomSection();
    handlePayloadChange((prev) => ({
      ...prev,
      customSections: [...(prev.customSections || []), newSec],
      sectionOrder: [...normalizeSectionOrder(prev), `custom:${newSec.id}`],
    }));
    toast.success("Custom section added");
  };

  // Remove Custom Section
  const handleRemoveCustomSection = (customId: string) => {
    handlePayloadChange((prev) => ({
      ...prev,
      customSections: (prev.customSections || []).filter((c) => c.id !== customId),
      sectionOrder: normalizeSectionOrder(prev).filter((s) => s !== `custom:${customId}`),
    }));
    toast.info("Custom section removed");
  };

  // Download ATS PDF (Task 4.5 / Action bar)
  const handleDownloadPdf = async () => {
    if (!id) return;
    setIsDownloading(true);
    const toastId = toast.loading("Generating ATS-compliant PDF via QuestPDF...");

    try {
      await downloadCvPdf(id, payload.personal?.fullName || title);
      toast.success("PDF downloaded successfully!", { id: toastId });
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate and download PDF.",
        { id: toastId }
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // "Improve with AI" Handler (Phase 3 placeholder & feedback)
  const handleImproveAi = (section: string, employerIdx?: number, engagementIdx?: number) => {
    let contextStr = section;
    if (employerIdx !== undefined) contextStr += ` (Employer ${employerIdx + 1})`;
    if (engagementIdx !== undefined) contextStr += ` - Engagement ${engagementIdx + 1}`;

    toast.info(`AI rewrite request initiated for ${contextStr}`, {
      description: "CvSectionWriterAgent is scheduled for integration in Phase 5.",
    });
  };

  // Ordered slots for left pane
  const activeSlots = normalizeSectionOrder(payload);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <RiLoader4Line className="size-8 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Loading CV editor...
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Card className="border-rose-200 bg-rose-50/50 p-6 text-center dark:border-rose-900/60 dark:bg-rose-950/20">
          <h2 className="text-base font-semibold text-rose-800 dark:text-rose-200">
            Unable to Open CV
          </h2>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{loadError}</p>
          <Button asChild variant="secondary" size="sm" className="mt-5">
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] bg-slate-100/60 dark:bg-slate-950">
      {/* ── Top Bar: Title, Template Selector, Save Status, Actions ───────── */}
      <div className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          {/* Left: Back button & Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button asChild variant="light" size="sm" className="shrink-0 p-1.5 sm:px-3">
              <Link href="/">
                <RiArrowLeftLine className="size-4 sm:mr-1" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

            <div className="flex items-center gap-2 min-w-0 flex-1 max-w-sm">
              <RiFileTextLine className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled CV"
                aria-label="CV Document Title"
                className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-colors truncate"
              />
            </div>
          </div>

          {/* Right: Template picker, Save badge, Download PDF */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Template Selector */}
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <RiPaletteLine className="size-3.5" />
                Theme:
              </span>
              <div className="w-28">
                <Select value={templateKey} onValueChange={handleTemplateChange}>
                  <SelectTrigger className="h-8 text-xs capitalize">
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic (Black)</SelectItem>
                    <SelectItem value="navy">Navy Accent</SelectItem>
                    <SelectItem value="teal">Teal Accent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Save Status Badge */}
            <div className="shrink-0">
              {saveStatus === "saving" && (
                <Badge variant="warning" size="sm" className="gap-1 animate-pulse">
                  <RiLoader4Line className="size-3 animate-spin" />
                  <span>Saving...</span>
                </Badge>
              )}
              {saveStatus === "saved" && (
                <Badge variant="success" size="sm" className="gap-1">
                  <RiCheckLine className="size-3" />
                  <span>Saved</span>
                </Badge>
              )}
              {saveStatus === "error" && (
                <Badge variant="error" size="sm">
                  Save Error
                </Badge>
              )}
            </div>

            {/* Download PDF button */}
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isDownloading}
              onClick={handleDownloadPdf}
              className="gap-1.5 text-xs shadow-xs"
            >
              {isDownloading ? (
                <RiLoader4Line className="size-3.5 animate-spin" />
              ) : (
                <RiDownloadLine className="size-3.5" />
              )}
              <span className="hidden sm:inline">Download PDF</span>
            </Button>
          </div>
        </div>

        {/* Mobile View Toggle */}
        <div className="flex sm:hidden mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 justify-between items-center">
          <div className="flex gap-1">
            <Button
              type="button"
              variant={mobileTab === "edit" ? "secondary" : "light"}
              size="sm"
              onClick={() => setMobileTab("edit")}
              className="text-xs h-7 gap-1"
            >
              <RiEditLine className="size-3.5" />
              <span>Edit Form</span>
            </Button>
            <Button
              type="button"
              variant={mobileTab === "preview" ? "secondary" : "light"}
              size="sm"
              onClick={() => setMobileTab("preview")}
              className="text-xs h-7 gap-1"
            >
              <RiEyeLine className="size-3.5" />
              <span>Live Preview</span>
            </Button>
          </div>

          <div className="w-24">
            <Select value={templateKey} onValueChange={handleTemplateChange}>
              <SelectTrigger className="h-7 text-[11px] capitalize">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="navy">Navy</SelectItem>
                <SelectItem value="teal">Teal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Main Split Pane Container ──────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 lg:px-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ──── Left Pane: Scrollable Form Sections (cols 12 -> 7) ───────── */}
          <div
            className={`space-y-4 lg:col-span-7 ${mobileTab === "preview" ? "hidden lg:block" : "block"
              }`}
          >
            {/* 1. Pinned Personal Details Section */}
            <PersonalSection
              personal={payload.personal}
              onChange={(updated) =>
                handlePayloadChange((prev) => ({
                  ...prev,
                  personal: updated,
                }))
              }
            />

            {/* 2. Dynamic Sections in user-chosen SectionOrder */}
            {activeSlots.map((slot, slotIdx) => {
              const canMoveUp = slotIdx > 0;
              const canMoveDown = slotIdx < activeSlots.length - 1;

              // Custom Section Card
              if (slot.startsWith("custom:")) {
                const customId = slot.substring("custom:".length);
                const customSec = (payload.customSections || []).find(
                  (c) => c.id === customId
                );
                if (!customSec) return null;

                return (
                  <CustomSectionCard
                    key={slot}
                    section={customSec}
                    canMoveUp={canMoveUp}
                    canMoveDown={canMoveDown}
                    onMoveUp={() => moveSectionSlot(slot, -1)}
                    onMoveDown={() => moveSectionSlot(slot, 1)}
                    onRemove={() => handleRemoveCustomSection(customId)}
                    onChange={(updated) =>
                      handlePayloadChange((prev) => ({
                        ...prev,
                        customSections: (prev.customSections || []).map((c) =>
                          c.id === customId ? updated : c
                        ),
                      }))
                    }
                  />
                );
              }

              // Built-in Sections
              switch (slot) {
                case "summary":
                  return (
                    <SummarySection
                      key="summary"
                      summary={payload.summary}
                      canMoveUp={canMoveUp}
                      canMoveDown={canMoveDown}
                      onMoveUp={() => moveSectionSlot("summary", -1)}
                      onMoveDown={() => moveSectionSlot("summary", 1)}
                      onImproveAi={() => handleImproveAi("summary")}
                      onChange={(updated) =>
                        handlePayloadChange((prev) => ({
                          ...prev,
                          summary: updated,
                        }))
                      }
                    />
                  );

                case "achievements":
                  return (
                    <KeyAchievementsSection
                      key="achievements"
                      achievements={payload.keyAchievements}
                      canMoveUp={canMoveUp}
                      canMoveDown={canMoveDown}
                      onMoveUp={() => moveSectionSlot("achievements", -1)}
                      onMoveDown={() => moveSectionSlot("achievements", 1)}
                      onImproveAi={() => handleImproveAi("achievements")}
                      onChange={(updated) =>
                        handlePayloadChange((prev) => ({
                          ...prev,
                          keyAchievements: updated,
                        }))
                      }
                    />
                  );

                case "skills":
                  return (
                    <SkillsSection
                      key="skills"
                      skills={payload.skills}
                      canMoveUp={canMoveUp}
                      canMoveDown={canMoveDown}
                      onMoveUp={() => moveSectionSlot("skills", -1)}
                      onMoveDown={() => moveSectionSlot("skills", 1)}
                      onChange={(updated) =>
                        handlePayloadChange((prev) => ({
                          ...prev,
                          skills: updated,
                        }))
                      }
                    />
                  );

                case "work":
                  return (
                    <ExperienceSection
                      key="work"
                      experience={payload.workExperience}
                      canMoveUp={canMoveUp}
                      canMoveDown={canMoveDown}
                      onMoveUp={() => moveSectionSlot("work", -1)}
                      onMoveDown={() => moveSectionSlot("work", 1)}
                      onImproveAi={(empIdx, engIdx) =>
                        handleImproveAi("work", empIdx, engIdx)
                      }
                      onChange={(updated) =>
                        handlePayloadChange((prev) => ({
                          ...prev,
                          workExperience: updated,
                        }))
                      }
                    />
                  );

                case "certifications":
                  return (
                    <CertificationsSection
                      key="certifications"
                      certifications={payload.certifications}
                      canMoveUp={canMoveUp}
                      canMoveDown={canMoveDown}
                      onMoveUp={() => moveSectionSlot("certifications", -1)}
                      onMoveDown={() => moveSectionSlot("certifications", 1)}
                      onChange={(updated) =>
                        handlePayloadChange((prev) => ({
                          ...prev,
                          certifications: updated,
                        }))
                      }
                    />
                  );

                case "education":
                  return (
                    <EducationSection
                      key="education"
                      education={payload.education}
                      canMoveUp={canMoveUp}
                      canMoveDown={canMoveDown}
                      onMoveUp={() => moveSectionSlot("education", -1)}
                      onMoveDown={() => moveSectionSlot("education", 1)}
                      onChange={(updated) =>
                        handlePayloadChange((prev) => ({
                          ...prev,
                          education: updated,
                        }))
                      }
                    />
                  );

                default:
                  return null;
              }
            })}

            {/* Bottom Actions: Add Custom Section */}
            <div className="pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddCustomSection}
                className="w-full text-xs py-2.5 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                <RiAddLine className="size-4 mr-1.5" />
                Add Custom Section (e.g. Publications, Patents, Languages)
              </Button>
            </div>
          </div>

          {/* ──── Right Pane: Sticky Live A4 Preview (cols 12 -> 5) ───────── */}
          <div
            className={`lg:col-span-5 lg:sticky lg:top-20 space-y-3 ${mobileTab === "edit" ? "hidden lg:block" : "block"
              }`}
          >
            {/* Preview Toolbar */}
            <div className="flex items-center justify-between px-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live A4 Preview</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={zoom <= 70}
                  onClick={() => setZoom((z) => Math.max(70, z - 10))}
                  title="Zoom out preview"
                  aria-label="Zoom out preview"
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                >
                  <RiZoomOutLine className="size-3.5" />
                </button>
                <span className="w-9 text-center font-mono text-[11px]">{zoom}%</span>
                <button
                  type="button"
                  disabled={zoom >= 130}
                  onClick={() => setZoom((z) => Math.min(130, z + 10))}
                  title="Zoom in preview"
                  aria-label="Zoom in preview"
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                >
                  <RiZoomInLine className="size-3.5" />
                </button>
              </div>
            </div>

            {/* A4 Container Wrapper */}
            <div className="w-full overflow-y-auto max-h-[calc(100vh-8rem)] rounded-xl border border-slate-200/90 bg-slate-200/50 p-2 sm:p-4 shadow-inner dark:border-slate-800 dark:bg-slate-900/50">
              <A4Preview
                payload={payload}
                templateKey={templateKey}
                zoom={zoom}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

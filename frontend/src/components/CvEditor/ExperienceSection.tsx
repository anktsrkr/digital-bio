"use client";

import React from "react";
import {
  RiSparklingLine,
  RiAddLine,
  RiDeleteBinLine,
  RiArrowUpSLine,
  RiArrowDownSLine,
  RiBriefcase2Line,
  RiBuildingLine,
  RiExchangeLine,
} from "@remixicon/react";
import { CvEmployer, CvClientEngagement } from "@/lib/types";
import { SectionCard } from "./SectionCard";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface ExperienceSectionProps {
  experience: CvEmployer[];
  onChange: (updated: CvEmployer[]) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onImproveAi?: (employerIndex: number, engagementIndex?: number) => void;
  isAiLoading?: boolean;
}

export function ExperienceSection({
  experience,
  onChange,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
  onImproveAi,
  isAiLoading = false,
}: ExperienceSectionProps) {
  const addEmployer = () => {
    const newEmp: CvEmployer = {
      name: "",
      role: "",
      dates: "",
      location: "",
      summary: "",
      engagements: [],
      bullets: [""],
    };
    onChange([...(experience || []), newEmp]);
  };

  const removeEmployer = (empIdx: number) => {
    onChange((experience || []).filter((_, i) => i !== empIdx));
  };

  const moveEmployer = (empIdx: number, direction: -1 | 1) => {
    const list = [...(experience || [])];
    const targetIdx = empIdx + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[empIdx];
    list[empIdx] = list[targetIdx];
    list[targetIdx] = temp;
    onChange(list);
  };

  const updateEmployerField = (
    empIdx: number,
    field: keyof CvEmployer,
    value: unknown
  ) => {
    const list = [...(experience || [])];
    list[empIdx] = {
      ...list[empIdx],
      [field]: value,
    };
    onChange(list);
  };

  // Switch between Case A (Consulting / Client Engagements) and Case B (Direct Role Bullets)
  const toggleCase = (empIdx: number) => {
    const list = [...(experience || [])];
    const current = list[empIdx];
    const isCurrentlyCaseA = (current.engagements || []).length > 0;

    if (isCurrentlyCaseA) {
      // Switch to Case B: clear engagements and ensure bullets array exists
      list[empIdx] = {
        ...current,
        engagements: [],
        bullets: current.bullets?.length ? current.bullets : [""],
      };
    } else {
      // Switch to Case A: initialize one engagement with default fields
      const initialEngagement: CvClientEngagement = {
        clientName: "",
        roleContext: "",
        achievements: [""],
      };
      list[empIdx] = {
        ...current,
        engagements: [initialEngagement],
      };
    }
    onChange(list);
  };

  // Case A: Client Engagements operations
  const addEngagement = (empIdx: number) => {
    const list = [...(experience || [])];
    const currentEngagements = list[empIdx].engagements || [];
    list[empIdx] = {
      ...list[empIdx],
      engagements: [
        ...currentEngagements,
        { clientName: "", roleContext: "", achievements: [""] },
      ],
    };
    onChange(list);
  };

  const removeEngagement = (empIdx: number, engIdx: number) => {
    const list = [...(experience || [])];
    list[empIdx] = {
      ...list[empIdx],
      engagements: (list[empIdx].engagements || []).filter((_, i) => i !== engIdx),
    };
    onChange(list);
  };

  const updateEngagementField = (
    empIdx: number,
    engIdx: number,
    field: keyof CvClientEngagement,
    value: unknown
  ) => {
    const list = [...(experience || [])];
    const engagements = [...(list[empIdx].engagements || [])];
    engagements[engIdx] = {
      ...engagements[engIdx],
      [field]: value,
    };
    list[empIdx] = {
      ...list[empIdx],
      engagements,
    };
    onChange(list);
  };

  // Engagement achievement bullets
  const addEngagementAchievement = (empIdx: number, engIdx: number) => {
    const list = [...(experience || [])];
    const engagements = [...(list[empIdx].engagements || [])];
    const currentAchievements = engagements[engIdx].achievements || [];
    engagements[engIdx] = {
      ...engagements[engIdx],
      achievements: [...currentAchievements, ""],
    };
    list[empIdx] = {
      ...list[empIdx],
      engagements,
    };
    onChange(list);
  };

  const updateEngagementAchievement = (
    empIdx: number,
    engIdx: number,
    achIdx: number,
    value: string
  ) => {
    const list = [...(experience || [])];
    const engagements = [...(list[empIdx].engagements || [])];
    const achievements = [...(engagements[engIdx].achievements || [])];
    achievements[achIdx] = value;
    engagements[engIdx] = {
      ...engagements[engIdx],
      achievements,
    };
    list[empIdx] = {
      ...list[empIdx],
      engagements,
    };
    onChange(list);
  };

  const removeEngagementAchievement = (
    empIdx: number,
    engIdx: number,
    achIdx: number
  ) => {
    const list = [...(experience || [])];
    const engagements = [...(list[empIdx].engagements || [])];
    engagements[engIdx] = {
      ...engagements[engIdx],
      achievements: (engagements[engIdx].achievements || []).filter((_, i) => i !== achIdx),
    };
    list[empIdx] = {
      ...list[empIdx],
      engagements,
    };
    onChange(list);
  };

  // Case B: Direct Bullets operations
  const addBullet = (empIdx: number) => {
    const list = [...(experience || [])];
    list[empIdx] = {
      ...list[empIdx],
      bullets: [...(list[empIdx].bullets || []), ""],
    };
    onChange(list);
  };

  const updateBullet = (empIdx: number, bulletIdx: number, value: string) => {
    const list = [...(experience || [])];
    const bullets = [...(list[empIdx].bullets || [])];
    bullets[bulletIdx] = value;
    list[empIdx] = {
      ...list[empIdx],
      bullets,
    };
    onChange(list);
  };

  const removeBullet = (empIdx: number, bulletIdx: number) => {
    const list = [...(experience || [])];
    list[empIdx] = {
      ...list[empIdx],
      bullets: (list[empIdx].bullets || []).filter((_, i) => i !== bulletIdx),
    };
    onChange(list);
  };

  return (
    <SectionCard
      title="Professional Experience"
      canMoveUp={canMoveUp}
      canMoveDown={canMoveDown}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      badge={
        <Badge variant="neutral" size="sm">
          {experience?.length || 0} {experience?.length === 1 ? "role" : "roles"}
        </Badge>
      }
    >
      <div className="space-y-6">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Reverse chronological career history. Supports standard in-house positions (Case B: Direct Bullets) and consulting/agency engagements (Case A: Client Engagements).
        </p>

        {(!experience || experience.length === 0) ? (
          <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
            <RiBriefcase2Line className="size-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No work experience listed</p>
            <p className="text-xs text-slate-500 mb-4">Add your current or previous employer roles.</p>
            <Button type="button" variant="primary" size="sm" onClick={addEmployer}>
              <RiAddLine className="size-4 mr-1" />
              Add Employer
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {experience.map((employer, empIdx) => {
              const isCaseA = (employer.engagements || []).length > 0;

              return (
                <div
                  key={empIdx}
                  className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900/60 transition-all"
                >
                  {/* Employer Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                        <RiBuildingLine className="size-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {employer.name || `Employer ${empIdx + 1}`}
                      </span>
                      <Badge variant={isCaseA ? "blue" : "neutral"} size="sm">
                        {isCaseA ? "Case A: Engagements" : "Case B: Standard"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="light"
                        size="sm"
                        onClick={() => toggleCase(empIdx)}
                        className="text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 gap-1"
                        title={isCaseA ? "Switch to direct bullets" : "Switch to client engagements"}
                      >
                        <RiExchangeLine className="size-3.5" />
                        <span>{isCaseA ? "Switch to Bullets" : "Add Client Engagements"}</span>
                      </Button>

                      <div className="flex items-center border-l border-slate-200 dark:border-slate-800 pl-1">
                        <Button
                          type="button"
                          variant="light"
                          size="sm"
                          disabled={empIdx === 0}
                          onClick={() => moveEmployer(empIdx, -1)}
                          title="Move employer up"
                          aria-label={`Move employer ${empIdx + 1} up`}
                          className="size-7 p-0"
                        >
                          <RiArrowUpSLine className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="light"
                          size="sm"
                          disabled={empIdx === experience.length - 1}
                          onClick={() => moveEmployer(empIdx, 1)}
                          title="Move employer down"
                          aria-label={`Move employer ${empIdx + 1} down`}
                          className="size-7 p-0"
                        >
                          <RiArrowDownSLine className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="light"
                          size="sm"
                          onClick={() => removeEmployer(empIdx)}
                          title="Remove employer"
                          aria-label={`Remove employer ${empIdx + 1}`}
                          className="size-7 p-0 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ml-1"
                        >
                          <RiDeleteBinLine className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Employer core fields */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Employer Name
                      </label>
                      <Input
                        placeholder="e.g. Acme Corporation"
                        value={employer.name || ""}
                        onChange={(e) => updateEmployerField(empIdx, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Location
                      </label>
                      <Input
                        placeholder="e.g. London, UK (Hybrid)"
                        value={employer.location || ""}
                        onChange={(e) => updateEmployerField(empIdx, "location", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Role / Title
                      </label>
                      <Input
                        placeholder="e.g. Lead Technical Architect"
                        value={employer.role || ""}
                        onChange={(e) => updateEmployerField(empIdx, "role", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Employment Dates
                      </label>
                      <Input
                        placeholder="e.g. Jan 2021 – Present"
                        value={employer.dates || ""}
                        onChange={(e) => updateEmployerField(empIdx, "dates", e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Company / Role Summary <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <Textarea
                        rows={2}
                        placeholder="e.g. Spearheaded core platform modernisation initiatives across distributed engineering pods..."
                        value={employer.summary || ""}
                        onChange={(e) => updateEmployerField(empIdx, "summary", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Case A: Client Engagements */}
                  {isCaseA && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          Client Engagements & Programmes
                        </span>
                        <Button
                          type="button"
                          variant="light"
                          size="sm"
                          onClick={() => addEngagement(empIdx)}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          <RiAddLine className="size-3.5 mr-1" />
                          Add Client Engagement
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {(employer.engagements || []).map((eng, engIdx) => (
                          <div
                            key={engIdx}
                            className="p-3.5 rounded-lg border border-slate-200/90 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Engagement {engIdx + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="light"
                                  size="sm"
                                  disabled={isAiLoading}
                                  onClick={() => onImproveAi?.(empIdx, engIdx)}
                                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                                >
                                  <RiSparklingLine className="size-3.5 mr-1" />
                                  Improve
                                </Button>
                                <Button
                                  type="button"
                                  variant="light"
                                  size="sm"
                                  onClick={() => removeEngagement(empIdx, engIdx)}
                                  aria-label={`Remove engagement ${engIdx + 1}`}
                                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1"
                                >
                                  <RiDeleteBinLine className="size-3.5" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  Client / Programme Name
                                </label>
                                <Input
                                  placeholder="e.g. Tier-1 Investment Bank"
                                  value={eng.clientName || ""}
                                  onChange={(e) =>
                                    updateEngagementField(empIdx, engIdx, "clientName", e.target.value)
                                  }
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  Role Context
                                </label>
                                <Input
                                  placeholder="e.g. Lead API Architect"
                                  value={eng.roleContext || ""}
                                  onChange={(e) =>
                                    updateEngagementField(empIdx, engIdx, "roleContext", e.target.value)
                                  }
                                />
                              </div>
                            </div>

                            {/* Engagement Achievement Bullets */}
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                  Achievements & Outcomes
                                </label>
                                <button
                                  type="button"
                                  onClick={() => addEngagementAchievement(empIdx, engIdx)}
                                  className="text-[11px] text-blue-600 hover:underline dark:text-blue-400 font-medium cursor-pointer"
                                >
                                  + Add bullet
                                </button>
                              </div>

                              {(eng.achievements || []).map((ach, achIdx) => (
                                <div key={achIdx} className="flex items-center gap-2">
                                  <Input
                                    placeholder="e.g. Redesigned ingestion engine reducing pipeline runtime from 4 hours to 18 minutes."
                                    value={ach}
                                    onChange={(e) =>
                                      updateEngagementAchievement(empIdx, engIdx, achIdx, e.target.value)
                                    }
                                  />
                                  <Button
                                    type="button"
                                    variant="light"
                                    size="sm"
                                    onClick={() => removeEngagementAchievement(empIdx, engIdx, achIdx)}
                                    aria-label={`Remove achievement bullet ${achIdx + 1}`}
                                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 shrink-0"
                                  >
                                    <RiDeleteBinLine className="size-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Case B: Direct Bullets */}
                  {!isCaseA && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          Role Responsibilities & Achievements
                        </label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="light"
                            size="sm"
                            disabled={isAiLoading}
                            onClick={() => onImproveAi?.(empIdx)}
                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                          >
                            <RiSparklingLine className="size-3.5 mr-1" />
                            Improve
                          </Button>
                          <Button
                            type="button"
                            variant="light"
                            size="sm"
                            onClick={() => addBullet(empIdx)}
                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <RiAddLine className="size-3.5 mr-1" />
                            Add Bullet
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {(!employer.bullets || employer.bullets.length === 0) ? (
                          <p className="text-xs text-slate-400 italic">No bullets added yet.</p>
                        ) : (
                          employer.bullets.map((bullet, bulletIdx) => (
                            <div key={bulletIdx} className="flex items-center gap-2">
                              <Input
                                placeholder="e.g. Delivered payment checkout redesign that improved conversion by 14%."
                                value={bullet}
                                onChange={(e) => updateBullet(empIdx, bulletIdx, e.target.value)}
                              />
                              <Button
                                type="button"
                                variant="light"
                                size="sm"
                                onClick={() => removeBullet(empIdx, bulletIdx)}
                                aria-label={`Remove role bullet ${bulletIdx + 1}`}
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 shrink-0"
                              >
                                <RiDeleteBinLine className="size-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addEmployer}
              className="w-full text-xs"
            >
              <RiAddLine className="size-4 mr-1" />
              Add Another Employer
            </Button>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

"use client";

import React, { useState } from "react";
import {
  RiSparklingLine,
  RiAddLine,
  RiDeleteBinLine,
  RiDraggable,
} from "@remixicon/react";
import { SectionCard } from "./SectionCard";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

interface KeyAchievementsSectionProps {
  achievements: string[];
  onChange: (updated: string[]) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onImproveAi?: () => void;
  isAiLoading?: boolean;
}

export function KeyAchievementsSection({
  achievements,
  onChange,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
  onImproveAi,
  isAiLoading = false,
}: KeyAchievementsSectionProps) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const updateAchievement = (index: number, value: string) => {
    const list = [...(achievements || [])];
    list[index] = value;
    onChange(list);
  };

  const addAchievement = () => {
    onChange([...(achievements || []), ""]);
  };

  const removeAchievement = (index: number) => {
    onChange((achievements || []).filter((_, i) => i !== index));
  };

  const reorderAchievements = (fromIdx: number, toIdx: number) => {
    if (
      fromIdx === toIdx ||
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= (achievements || []).length ||
      toIdx >= (achievements || []).length
    ) {
      return;
    }
    const list = [...(achievements || [])];
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    onChange(list);
  };

  return (
    <SectionCard
      title="Key Achievements"
      canMoveUp={canMoveUp}
      canMoveDown={canMoveDown}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      headerControls={
        <Button
          type="button"
          variant="light"
          size="sm"
          disabled={isAiLoading}
          onClick={onImproveAi}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 gap-1.5 font-medium"
        >
          <RiSparklingLine className={`size-3.5 ${isAiLoading ? "animate-spin text-blue-500" : ""}`} />
          <span>{isAiLoading ? "Improving..." : "Improve with AI"}</span>
        </Button>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Quantified career highlights and flagship results. Recommended: 2–5 strong outcome-focused bullet points. Drag items to reorder.
        </p>

        {(!achievements || achievements.length === 0) ? (
          <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center">
            <p className="text-xs text-slate-400 italic mb-2">No achievements added yet.</p>
            <Button type="button" variant="secondary" size="sm" onClick={addAchievement}>
              <RiAddLine className="size-3.5 mr-1" />
              Add First Achievement
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {achievements.map((item, idx) => {
              const isDragging = draggedIdx === idx;
              const isDragOver = dragOverIdx === idx && !isDragging;

              return (
                <div
                  key={idx}
                  draggable
                  onDragStart={(e) => {
                    setDraggedIdx(idx);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", String(idx));
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverIdx !== idx) {
                      setDragOverIdx(idx);
                    }
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    if (dragOverIdx === idx) {
                      setDragOverIdx(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedIdx !== null && draggedIdx !== idx) {
                      reorderAchievements(draggedIdx, idx);
                    }
                    setDraggedIdx(null);
                    setDragOverIdx(null);
                  }}
                  onDragEnd={() => {
                    setDraggedIdx(null);
                    setDragOverIdx(null);
                  }}
                  className={`group flex items-start gap-2 p-2.5 rounded-lg border transition-all duration-150 ${
                    isDragging
                      ? "opacity-40 border-dashed border-blue-400 bg-blue-50/30 dark:bg-blue-950/20"
                      : isDragOver
                      ? "border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-blue-950/30"
                      : "border-slate-200/80 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700"
                  }`}
                >
                  <div
                    className="cursor-grab active:cursor-grabbing pt-2 px-0.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 shrink-0 transition-colors"
                    title="Drag to reorder"
                  >
                    <RiDraggable className="size-4" />
                  </div>

                  <div
                    className="flex-1"
                    draggable={false}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Textarea
                      rows={2}
                      placeholder="e.g. Architected microservices migration that reduced system latency by 35% across 2M daily transactions."
                      value={item}
                      onChange={(e) => updateAchievement(idx, e.target.value)}
                      className="w-full text-xs"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="light"
                    size="sm"
                    draggable={false}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAchievement(idx);
                    }}
                    title="Remove achievement"
                    aria-label={`Remove achievement ${idx + 1}`}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 shrink-0 mt-1 cursor-pointer"
                  >
                    <RiDeleteBinLine className="size-4" />
                  </Button>
                </div>
              );
            })}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addAchievement}
              className="w-full text-xs mt-2"
            >
              <RiAddLine className="size-3.5 mr-1" />
              Add Key Achievement
            </Button>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

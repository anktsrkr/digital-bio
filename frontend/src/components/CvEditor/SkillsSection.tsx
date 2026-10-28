"use client";

import React, { useState } from "react";
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiCloseLine,
  RiDraggable,
  RiPriceTag3Line,
} from "@remixicon/react";
import { CvSkillItem } from "@/lib/types";
import { SectionCard } from "./SectionCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface SkillsSectionProps {
  skills: CvSkillItem[];
  onChange: (updated: CvSkillItem[]) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function SkillsSection({
  skills,
  onChange,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
}: SkillsSectionProps) {
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("");
  const [draggedGroupIdx, setDraggedGroupIdx] = useState<number | null>(null);
  const [dragOverGroupIdx, setDragOverGroupIdx] = useState<number | null>(null);

  const addSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = newSkillName.trim();
    if (!cleanName) return;

    onChange([
      ...(skills || []),
      {
        name: cleanName,
        category: newSkillCategory.trim() || undefined,
      },
    ]);

    setNewSkillName("");
  };

  const removeSkill = (index: number) => {
    onChange((skills || []).filter((_, i) => i !== index));
  };

  // Group skills by category for preview and ordering
  const groupedSkills = React.useMemo(() => {
    const map = new Map<string, { name: string; originalIndex: number }[]>();
    (skills || []).forEach((skill, idx) => {
      const cat = (skill.category || "").trim() || "Uncategorized";
      const list = map.get(cat) || [];
      list.push({ name: skill.name, originalIndex: idx });
      map.set(cat, list);
    });
    return Array.from(map.entries());
  }, [skills]);

  const reorderGroups = (fromIdx: number, toIdx: number) => {
    if (
      fromIdx === toIdx ||
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= groupedSkills.length ||
      toIdx >= groupedSkills.length
    ) {
      return;
    }

    const reorderedGroups = [...groupedSkills];
    const [moved] = reorderedGroups.splice(fromIdx, 1);
    reorderedGroups.splice(toIdx, 0, moved);

    const reorderedSkills: CvSkillItem[] = [];
    for (const [, items] of reorderedGroups) {
      for (const item of items) {
        if (skills[item.originalIndex]) {
          reorderedSkills.push(skills[item.originalIndex]);
        }
      }
    }
    onChange(reorderedSkills);
  };

  const moveGroupDirection = (groupIndex: number, direction: -1 | 1) => {
    reorderGroups(groupIndex, groupIndex + direction);
  };

  return (
    <SectionCard
      title="Core Skills"
      canMoveUp={canMoveUp}
      canMoveDown={canMoveDown}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          List your technical and domain competencies. Assigning an optional category (e.g. &quot;Languages&quot;, &quot;Frameworks&quot;, &quot;DevOps&quot;) groups skills cleanly in the PDF. Drag groups or use arrow buttons to reorder them.
        </p>

        {/* Input Form to add new skill */}
        <form onSubmit={addSkill} className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[160px]">
            <Input
              placeholder="Skill name (e.g. Next.js)"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
            />
          </div>
          <div className="w-44 min-w-[120px]">
            <Input
              icon={RiPriceTag3Line}
              placeholder="Category (optional)"
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="shrink-0">
            <RiAddLine className="size-4 mr-1" />
            Add
          </Button>
        </form>

        {/* Grouped Skills List */}
        {(!skills || skills.length === 0) ? (
          <p className="text-xs text-slate-400 italic">No skills added yet.</p>
        ) : (
          <div className="space-y-3 pt-2">
            {groupedSkills.map(([category, items], idx) => {
              const isDragging = draggedGroupIdx === idx;
              const isDragOver = dragOverGroupIdx === idx && !isDragging;

              return (
                <div
                  key={category}
                  draggable
                  onDragStart={(e) => {
                    setDraggedGroupIdx(idx);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", String(idx));
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverGroupIdx !== idx) {
                      setDragOverGroupIdx(idx);
                    }
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    if (dragOverGroupIdx === idx) {
                      setDragOverGroupIdx(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedGroupIdx !== null && draggedGroupIdx !== idx) {
                      reorderGroups(draggedGroupIdx, idx);
                    }
                    setDraggedGroupIdx(null);
                    setDragOverGroupIdx(null);
                  }}
                  onDragEnd={() => {
                    setDraggedGroupIdx(null);
                    setDragOverGroupIdx(null);
                  }}
                  className={`group rounded-lg border p-3 transition-all duration-150 ${
                    isDragging
                      ? "opacity-40 border-dashed border-blue-400 bg-blue-50/30 dark:bg-blue-950/20"
                      : isDragOver
                      ? "border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-blue-950/30"
                      : "border-slate-200/80 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60 mb-2">
                    <div
                      className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
                      title="Drag to reorder group"
                    >
                      <RiDraggable className="size-4 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 transition-colors" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        {category}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                        {items.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveGroupDirection(idx, -1);
                        }}
                        title="Move group up"
                        aria-label={`Move ${category} group up`}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <RiArrowUpSLine className="size-4" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === groupedSkills.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveGroupDirection(idx, 1);
                        }}
                        title="Move group down"
                        aria-label={`Move ${category} group down`}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <RiArrowDownSLine className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {items.map((item) => (
                      <span
                        key={item.originalIndex}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <span className="font-medium">{item.name}</span>
                        <button
                          type="button"
                          draggable={false}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSkill(item.originalIndex);
                          }}
                          aria-label={`Remove skill ${item.name}`}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                        >
                          <RiCloseLine className="size-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

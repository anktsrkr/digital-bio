"use client";

import React from "react";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiArrowUpSLine,
  RiArrowDownSLine,
  RiGraduationCapLine,
} from "@remixicon/react";
import { CvEducationItem } from "@/lib/types";
import { SectionCard } from "./SectionCard";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

interface EducationSectionProps {
  education: CvEducationItem[];
  onChange: (updated: CvEducationItem[]) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function EducationSection({
  education,
  onChange,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
}: EducationSectionProps) {
  const addEducation = () => {
    const newItem: CvEducationItem = {
      institution: "",
      qualification: "",
      location: "",
      start: "",
      end: "",
      details: "",
    };
    onChange([...(education || []), newItem]);
  };

  const removeEducation = (index: number) => {
    onChange((education || []).filter((_, i) => i !== index));
  };

  const moveEducation = (index: number, direction: -1 | 1) => {
    const list = [...(education || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    onChange(list);
  };

  const updateItem = (index: number, field: keyof CvEducationItem, value: string) => {
    const list = [...(education || [])];
    list[index] = {
      ...list[index],
      [field]: value,
    };
    onChange(list);
  };

  return (
    <SectionCard
      title="Education & Academic Qualifications"
      canMoveUp={canMoveUp}
      canMoveDown={canMoveDown}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Degrees, diplomas, and educational background.
        </p>

        {(!education || education.length === 0) ? (
          <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center">
            <RiGraduationCapLine className="size-7 mx-auto text-slate-400 mb-1.5" />
            <p className="text-xs text-slate-400 italic mb-3">No education entries added.</p>
            <Button type="button" variant="secondary" size="sm" onClick={addEducation}>
              <RiAddLine className="size-3.5 mr-1" />
              Add Education
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {education.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-200/90 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40 space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {item.qualification || `Entry ${idx + 1}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="light"
                      size="sm"
                      disabled={idx === 0}
                      onClick={() => moveEducation(idx, -1)}
                      title="Move education up"
                      aria-label={`Move education entry ${idx + 1} up`}
                      className="size-7 p-0"
                    >
                      <RiArrowUpSLine className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="light"
                      size="sm"
                      disabled={idx === education.length - 1}
                      onClick={() => moveEducation(idx, 1)}
                      title="Move education down"
                      aria-label={`Move education entry ${idx + 1} down`}
                      className="size-7 p-0"
                    >
                      <RiArrowDownSLine className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="light"
                      size="sm"
                      onClick={() => removeEducation(idx)}
                      title="Remove entry"
                      aria-label={`Remove education entry ${idx + 1}`}
                      className="size-7 p-0 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ml-1"
                    >
                      <RiDeleteBinLine className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Qualification / Degree
                    </label>
                    <Input
                      placeholder="e.g. BSc (Hons) Computer Science"
                      value={item.qualification || ""}
                      onChange={(e) => updateItem(idx, "qualification", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Institution / University
                    </label>
                    <Input
                      placeholder="e.g. Imperial College London"
                      value={item.institution || ""}
                      onChange={(e) => updateItem(idx, "institution", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Location
                    </label>
                    <Input
                      placeholder="e.g. London, UK"
                      value={item.location || ""}
                      onChange={(e) => updateItem(idx, "location", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Start Year
                      </label>
                      <Input
                        placeholder="e.g. 2016"
                        value={item.start || ""}
                        onChange={(e) => updateItem(idx, "start", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        End Year
                      </label>
                      <Input
                        placeholder="e.g. 2020"
                        value={item.end || ""}
                        onChange={(e) => updateItem(idx, "end", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Grade / Honors / Thesis Details <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <Textarea
                      rows={2}
                      placeholder="e.g. First Class Honours (1st), Dissertation: Distributed Consensus Protocols in Edge Networks."
                      value={item.details || ""}
                      onChange={(e) => updateItem(idx, "details", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addEducation}
              className="w-full text-xs"
            >
              <RiAddLine className="size-3.5 mr-1" />
              Add Another Degree or Qualification
            </Button>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

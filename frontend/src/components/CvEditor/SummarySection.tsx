"use client";

import React from "react";
import { RiSparklingLine } from "@remixicon/react";
import { SectionCard } from "./SectionCard";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

interface SummarySectionProps {
  summary: string;
  onChange: (updated: string) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onImproveAi?: () => void;
  isAiLoading?: boolean;
}

export function SummarySection({
  summary,
  onChange,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
  onImproveAi,
  isAiLoading = false,
}: SummarySectionProps) {
  return (
    <SectionCard
      title="Professional Summary"
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
      <div className="space-y-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          A concise overview of your background, technical expertise, and career value proposition. Recommended: 3–4 impactful sentences.
        </p>
        <Textarea
          rows={4}
          placeholder="e.g. Accomplished Senior Software Engineer with 8+ years experience architecting cloud native distributed systems..."
          value={summary || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full"
        />
      </div>
    </SectionCard>
  );
}

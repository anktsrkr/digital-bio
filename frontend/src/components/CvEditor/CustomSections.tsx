"use client";

import React from "react";
import { RiDeleteBinLine } from "@remixicon/react";
import { CvCustomSection } from "@/lib/types";
import { SectionCard } from "./SectionCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function createEmptyCustomSection(): CvCustomSection {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : "sec_" + Math.random().toString(36).substring(2, 10);

  return {
    id,
    title: "",
    items: [""],
  };
}

interface CustomSectionCardProps {
  section: CvCustomSection;
  onChange: (updated: CvCustomSection) => void;
  onRemove: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function CustomSectionCard({
  section,
  onChange,
  onRemove,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
}: CustomSectionCardProps) {
  const updateTitle = (title: string) => {
    onChange({
      ...section,
      title,
    });
  };

  const addItem = () => {
    onChange({
      ...section,
      items: [...(section.items || []), ""],
    });
  };

  const updateItem = (index: number, text: string) => {
    const list = [...(section.items || [])];
    list[index] = text;
    onChange({
      ...section,
      items: list,
    });
  };

  const removeItem = (index: number) => {
    onChange({
      ...section,
      items: (section.items || []).filter((_, i) => i !== index),
    });
  };

  return (
    <SectionCard
      title={section.title.trim() || "Custom Section"}
      canMoveUp={canMoveUp}
      canMoveDown={canMoveDown}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      headerControls={
        <Button
          type="button"
          variant="light"
          size="sm"
          onClick={onRemove}
          title="Delete this custom section"
          aria-label={`Delete custom section ${section.title || "Untitled"}`}
          className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 gap-1"
        >
          <RiDeleteBinLine className="size-3.5" />
          <span>Remove Section</span>
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Section Title
          </label>
          <Input
            placeholder="e.g. Publications, Patents, Volunteer Work, or Languages"
            value={section.title || ""}
            onChange={(e) => updateTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Bullet Points & Highlights
            </label>
            <button
              type="button"
              onClick={addItem}
              className="text-xs text-blue-600 hover:underline dark:text-blue-400 font-medium cursor-pointer"
            >
              + Add item
            </button>
          </div>

          {(!section.items || section.items.length === 0) ? (
            <p className="text-xs text-slate-400 italic">No items added to this section.</p>
          ) : (
            <div className="space-y-2">
              {section.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="e.g. Co-authored IEEE research paper on zero-knowledge proofs (2024)."
                    value={item}
                    onChange={(e) => updateItem(idx, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="light"
                    size="sm"
                    onClick={() => removeItem(idx)}
                    title="Remove item"
                    aria-label={`Remove custom item ${idx + 1}`}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 shrink-0"
                  >
                    <RiDeleteBinLine className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

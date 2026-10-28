"use client";

import React, { useState } from "react";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiDraggable,
  RiAwardLine,
} from "@remixicon/react";
import { CvCertificationItem } from "@/lib/types";
import { SectionCard } from "./SectionCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface CertificationsSectionProps {
  certifications: CvCertificationItem[];
  onChange: (updated: CvCertificationItem[]) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function CertificationsSection({
  certifications,
  onChange,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
}: CertificationsSectionProps) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const addCertification = () => {
    const newItem: CvCertificationItem = {
      name: "",
      issuer: "",
      date: "",
      url: "",
    };
    onChange([...(certifications || []), newItem]);
  };

  const removeCertification = (index: number) => {
    onChange((certifications || []).filter((_, i) => i !== index));
  };

  const reorderCertifications = (fromIdx: number, toIdx: number) => {
    if (
      fromIdx === toIdx ||
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= (certifications || []).length ||
      toIdx >= (certifications || []).length
    ) {
      return;
    }
    const list = [...(certifications || [])];
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    onChange(list);
  };

  const updateCertField = (
    index: number,
    field: keyof CvCertificationItem,
    value: string
  ) => {
    const list = [...(certifications || [])];
    const currentIssuer = (list[index].issuer || "").trim().toLowerCase();

    list[index] = {
      ...list[index],
      [field]: value,
    };

    // If updating issuer and there's already another cert with that issuer with a URL, auto-fill it
    if (field === "issuer") {
      const newIssuer = value.trim().toLowerCase();
      if (newIssuer) {
        const match = list.find((c, i) => i !== index && (c.issuer || "").trim().toLowerCase() === newIssuer && c.url);
        if (match?.url && !list[index].url) {
          list[index].url = match.url;
        }
      }
    }

    // If updating URL, sync to same issuer
    if (field === "url" && currentIssuer) {
      list.forEach((c, i) => {
        if (i !== index && (c.issuer || "").trim().toLowerCase() === currentIssuer) {
          list[i] = { ...list[i], url: value };
        }
      });
    }

    onChange(list);
  };

  return (
    <SectionCard
      title="Certifications & Accreditations"
      canMoveUp={canMoveUp}
      canMoveDown={canMoveDown}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Professional credentials, cloud certifications, and licenses. Drag items to reorder. In the PDF preview, certifications are cleanly grouped by issuer.
        </p>

        {(!certifications || certifications.length === 0) ? (
          <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center">
            <RiAwardLine className="size-7 mx-auto text-slate-400 mb-1.5" />
            <p className="text-xs text-slate-400 italic mb-3">No certifications listed.</p>
            <Button type="button" variant="secondary" size="sm" onClick={addCertification}>
              <RiAddLine className="size-3.5 mr-1" />
              Add Certification
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {certifications.map((cert, idx) => {
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
                      reorderCertifications(draggedIdx, idx);
                    }
                    setDraggedIdx(null);
                    setDragOverIdx(null);
                  }}
                  onDragEnd={() => {
                    setDraggedIdx(null);
                    setDragOverIdx(null);
                  }}
                  className={`group rounded-lg border p-3.5 space-y-3 transition-all duration-150 ${
                    isDragging
                      ? "opacity-40 border-dashed border-blue-400 bg-blue-50/30 dark:bg-blue-950/20"
                      : isDragOver
                      ? "border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-blue-950/30"
                      : "border-slate-200/90 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <div
                      className="flex items-center gap-2 cursor-grab active:cursor-grabbing text-slate-700 dark:text-slate-300"
                      title="Drag to reorder"
                    >
                      <RiDraggable className="size-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 transition-colors" />
                      <span className="text-xs font-semibold">
                        {cert.name || `Certification ${idx + 1}`}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="light"
                      size="sm"
                      draggable={false}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCertification(idx);
                      }}
                      title="Remove certification"
                      aria-label={`Remove certification ${idx + 1}`}
                      className="size-7 p-0 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                    >
                      <RiDeleteBinLine className="size-4" />
                    </Button>
                  </div>

                  <div
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
                    draggable={false}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Certification Name
                      </label>
                      <Input
                        placeholder="e.g. AWS Solutions Architect"
                        value={cert.name || ""}
                        onChange={(e) => updateCertField(idx, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Issuing Body / Authority
                      </label>
                      <Input
                        placeholder="e.g. Amazon Web Services"
                        value={cert.issuer || ""}
                        onChange={(e) => updateCertField(idx, "issuer", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Date Acquired
                      </label>
                      <Input
                        placeholder="e.g. 2023"
                        value={cert.date || ""}
                        onChange={(e) => updateCertField(idx, "date", e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Verification URL <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <Input
                        placeholder="https://credly.com/badges/..."
                        value={cert.url || ""}
                        onChange={(e) => updateCertField(idx, "url", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addCertification}
              className="w-full text-xs"
            >
              <RiAddLine className="size-3.5 mr-1" />
              Add Certification
            </Button>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

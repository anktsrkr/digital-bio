"use client";

import React from "react";
import {
  RiUserLine,
  RiBriefcaseLine,
  RiMailLine,
  RiPhoneLine,
  RiMapPinLine,
  RiAddLine,
  RiDeleteBinLine,
  RiGlobalLine,
} from "@remixicon/react";
import { CvPersonal } from "@/lib/types";
import { SectionCard } from "./SectionCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface PersonalSectionProps {
  personal: CvPersonal;
  onChange: (updated: CvPersonal) => void;
}

export function PersonalSection({ personal, onChange }: PersonalSectionProps) {
  const updateField = (field: keyof CvPersonal, value: string) => {
    onChange({
      ...personal,
      [field]: value,
    });
  };

  const parseLink = (link: string): { label: string; url: string } => {
    const trimmed = link.trim();
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx > 0) {
      const prefix = trimmed.substring(0, colonIdx).trim();
      const rest = trimmed.substring(colonIdx + 1).trim();
      if (prefix.toLowerCase() !== "http" && prefix.toLowerCase() !== "https") {
        return { label: prefix, url: rest };
      }
    }
    return { label: "", url: trimmed };
  };

  const updateLink = (index: number, label: string, url: string) => {
    const currentLinks = [...(personal.links || [])];
    const cleanLabel = label.trim();
    const cleanUrl = url.trim();
    const combined = cleanLabel ? `${cleanLabel}: ${cleanUrl}` : cleanUrl;
    currentLinks[index] = combined;
    onChange({
      ...personal,
      links: currentLinks,
    });
  };

  const addLink = () => {
    onChange({
      ...personal,
      links: [...(personal.links || []), ""],
    });
  };

  const removeLink = (index: number) => {
    onChange({
      ...personal,
      links: (personal.links || []).filter((_, i) => i !== index),
    });
  };

  return (
    <SectionCard title="Personal Details" defaultOpen={true}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <Input
              icon={RiUserLine}
              placeholder="e.g. Jane Doe"
              value={personal.fullName || ""}
              onChange={(e) => updateField("fullName", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Professional Headline
            </label>
            <Input
              icon={RiBriefcaseLine}
              placeholder="e.g. Senior Full Stack Engineer"
              value={personal.headline || ""}
              onChange={(e) => updateField("headline", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <Input
              icon={RiMailLine}
              type="email"
              placeholder="e.g. jane.doe@example.com"
              value={personal.email || ""}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <Input
              icon={RiPhoneLine}
              type="tel"
              placeholder="e.g. +44 7123 456789"
              value={personal.phone || ""}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Location
            </label>
            <Input
              icon={RiMapPinLine}
              placeholder="e.g. London, United Kingdom (Open to Remote)"
              value={personal.location || ""}
              onChange={(e) => updateField("location", e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Links Section */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <RiGlobalLine className="size-3.5 text-slate-400" />
              Links & Portfolio
            </span>
            <Button
              type="button"
              variant="light"
              size="sm"
              onClick={addLink}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 p-0 h-auto"
            >
              <RiAddLine className="size-3.5 mr-0.5" />
              Add Link
            </Button>
          </div>

          {(!personal.links || personal.links.length === 0) ? (
            <p className="text-xs text-slate-400 italic">No links added. Add LinkedIn, GitHub, or portfolio website.</p>
          ) : (
            <div className="space-y-2">
              {personal.links.map((link, idx) => {
                const { label, url } = parseLink(link);
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-1/3 min-w-[100px] max-w-[150px]">
                      <Input
                        placeholder="Label (e.g. LinkedIn)"
                        value={label}
                        onChange={(e) => updateLink(idx, e.target.value, url)}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="https://linkedin.com/in/username"
                        value={url}
                        onChange={(e) => updateLink(idx, label, e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="light"
                      size="sm"
                      onClick={() => removeLink(idx)}
                      title="Remove link"
                      aria-label="Remove link"
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-2 shrink-0"
                    >
                      <RiDeleteBinLine className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

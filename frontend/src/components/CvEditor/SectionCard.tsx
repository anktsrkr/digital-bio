"use client";

import React, { useState } from "react";
import { RiArrowDownSLine, RiArrowRightSLine, RiArrowUpSLine } from "@remixicon/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface SectionCardProps {
  id?: string;
  title: string;
  defaultOpen?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  headerControls?: React.ReactNode;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

export function SectionCard({
  id,
  title,
  defaultOpen = true,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
  headerControls,
  children,
  badge,
}: SectionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card id={id} className="p-4 sm:p-5 transition-all duration-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="flex flex-1 items-center gap-2.5 text-left group focus:outline-hidden cursor-pointer"
        >
          <div className="flex size-6 items-center justify-center rounded text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-700 dark:group-hover:bg-slate-800 dark:group-hover:text-slate-200 transition-colors">
            {isOpen ? (
              <RiArrowDownSLine className="size-4" aria-hidden="true" />
            ) : (
              <RiArrowRightSLine className="size-4" aria-hidden="true" />
            )}
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          {badge}
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {headerControls}

          {(onMoveUp || onMoveDown) && (
            <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="light"
                size="sm"
                disabled={!canMoveUp}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp?.();
                }}
                title="Move section up"
                aria-label={`Move ${title} section up`}
                className="size-7 p-0 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <RiArrowUpSLine className="size-4" />
              </Button>
              <Button
                type="button"
                variant="light"
                size="sm"
                disabled={!canMoveDown}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown?.();
                }}
                title="Move section down"
                aria-label={`Move ${title} section down`}
                className="size-7 p-0 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <RiArrowDownSLine className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {isOpen && <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">{children}</div>}
    </Card>
  );
}

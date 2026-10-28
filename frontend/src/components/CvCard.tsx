"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  RiStarFill,
  RiStarLine,
  RiEditLine,
  RiFileCopyLine,
  RiDownloadLine,
  RiDeleteBinLine,
  RiUser3Line,
  RiTimeLine,
} from "@remixicon/react";
import { CvListItemDto, TemplateKey } from "@/lib/types";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/Dialog";

export interface CvCardProps {
  cv: CvListItemDto;
  onSetBase: (id: string) => Promise<void>;
  onCopy: (cv: CvListItemDto) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDownload: (id: string, title: string) => Promise<void>;
}

export function CvCard({
  cv,
  onSetBase,
  onCopy,
  onDelete,
  onDownload,
}: CvCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingBase, setIsSettingBase] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const candidateName =
    cv.candidateName || cv.payload?.personal?.fullName || "UNTITLED CANDIDATE";

  const updatedTimeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(cv.updatedAt), { addSuffix: true });
    } catch {
      return "recently";
    }
  })();

  const templateKey = (cv.templateKey || "classic").toLowerCase() as TemplateKey;
  const templateBadgeVariant =
    templateKey === "navy" ? "navy" : templateKey === "teal" ? "teal" : "classic";

  const handleSetBase = async () => {
    if (cv.isBase || isSettingBase) return;
    setIsSettingBase(true);
    try {
      await onSetBase(cv.id);
    } finally {
      setIsSettingBase(false);
    }
  };

  const handleCopy = async () => {
    if (isCopying) return;
    setIsCopying(true);
    try {
      await onCopy(cv);
    } finally {
      setIsCopying(false);
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await onDownload(cv.id, cv.title);
    } finally {
      setIsDownloading(false);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(cv.id);
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card
        id={`cv-card-${cv.id}`}
        className={`group flex flex-col justify-between transition-all duration-150 hover:shadow-md ${
          cv.isBase
            ? "border-amber-400 dark:border-amber-500/80 ring-1 ring-amber-400/30 bg-gradient-to-b from-amber-50/20 to-transparent dark:from-amber-950/10"
            : "hover:border-slate-300 dark:hover:border-slate-700"
        }`}
      >
        <div>
          {/* Header row: Title & Badges */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <Link href={`/cv-builder/${cv.id}`} className="hover:underline">
                  {cv.title || "Untitled CV"}
                </Link>
              </h3>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant={templateBadgeVariant} size="sm" className="capitalize">
                {templateKey}
              </Badge>
              {cv.isBase && (
                <Badge
                  variant="amber"
                  size="sm"
                  icon={RiStarFill}
                  className="shadow-2xs"
                >
                  Base CV
                </Badge>
              )}
            </div>
          </div>

          {/* Candidate Name & Metadata */}
          <div className="mt-2.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-slate-700 dark:text-slate-300">
              <RiUser3Line className="size-3.5 text-slate-400 shrink-0" />
              <span className="uppercase truncate">{candidateName}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <RiTimeLine className="size-3.5 shrink-0" />
              <span>Updated {updatedTimeAgo}</span>
            </div>
          </div>

          {/* Summary snippet preview */}
          {cv.summary && (
            <p className="mt-3 line-clamp-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
              {cv.summary}
            </p>
          )}
        </div>

        {/* Action buttons footer */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
          <div className="flex items-center gap-1">
            {!cv.isBase ? (
              <Button
                variant="light"
                size="xs"
                onClick={handleSetBase}
                isLoading={isSettingBase}
                title="Mark as Base CV"
                id={`btn-setbase-${cv.id}`}
              >
                <RiStarLine className="size-3.5" />
                <span className="hidden sm:inline">Set as Base</span>
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 px-2 py-1 font-medium">
                <RiStarFill className="size-3.5" />
                <span>Primary</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              asChild
              variant="secondary"
              size="xs"
              id={`btn-edit-${cv.id}`}
              title="Edit CV in builder"
            >
              <Link href={`/cv-builder/${cv.id}`}>
                <RiEditLine className="size-3.5" />
                <span>Edit</span>
              </Link>
            </Button>

            <Button
              variant="light"
              size="xs"
              onClick={handleCopy}
              isLoading={isCopying}
              title="Duplicate this CV"
              id={`btn-copy-${cv.id}`}
            >
              <RiFileCopyLine className="size-3.5" />
              <span className="sr-only sm:not-sr-only">Copy</span>
            </Button>

            <Button
              variant="light"
              size="xs"
              onClick={handleDownload}
              isLoading={isDownloading}
              title="Download ATS PDF"
              id={`btn-download-${cv.id}`}
            >
              <RiDownloadLine className="size-3.5" />
              <span className="sr-only sm:not-sr-only">PDF</span>
            </Button>

            <Button
              variant="ghostDestructive"
              size="xs"
              onClick={() => setShowDeleteModal(true)}
              title="Delete CV draft"
              id={`btn-delete-${cv.id}`}
            >
              <RiDeleteBinLine className="size-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Confirmation Dialog for Deletion */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent id={`delete-modal-${cv.id}`}>
          <DialogHeader>
            <DialogTitle>Delete CV Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{cv.title || "this CV"}&rdquo;?
              This action permanently removes the draft from your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDelete}
              isLoading={isDeleting}
              id={`confirm-delete-${cv.id}`}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

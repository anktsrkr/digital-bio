"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  RiAddLine,
  RiSearchLine,
  RiRefreshLine,
  RiSparklingLine,
  RiFileAddLine,
} from "@remixicon/react";
import { CvListItemDto, TemplateKey, createDefaultCvPayload } from "@/lib/types";
import { listCvs, createCv, deleteCv, setBaseCv, downloadCvPdf } from "@/lib/api";
import { CvCard } from "@/components/CvCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

export default function DashboardPage() {
  const router = useRouter();

  const [cvs, setCvs] = useState<CvListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "title">("updated");

  // New CV modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("My Professional CV");
  const [newTemplate, setNewTemplate] = useState<TemplateKey>("classic");
  const [candidateName, setCandidateName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Load CVs from backend API (invoked on refresh or after mutations)
  const loadCvs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listCvs("me");
      setCvs(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load CVs from backend API.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load on component mount
  useEffect(() => {
    let isSubscribed = true;
    listCvs("me")
      .then((data) => {
        if (isSubscribed) {
          setCvs(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isSubscribed) {
          const msg = err instanceof Error ? err.message : "Failed to load CVs from backend API.";
          setError(msg);
          toast.error(msg);
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Handle creating a new CV
  const handleCreateCv = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isCreating) return;

    setIsCreating(true);
    try {
      const payload = createDefaultCvPayload(candidateName.trim());
      const newCv = await createCv({
        title: newTitle.trim() || "Untitled CV",
        templateKey: newTemplate,
        payload,
      });

      toast.success("CV draft created successfully!");
      setIsCreateModalOpen(false);
      router.push(`/cv-builder/?id=${newCv.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create CV.";
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle setting a CV as base
  const handleSetBase = async (id: string) => {
    try {
      await setBaseCv(id);
      setCvs((prev) =>
        prev.map((item) => ({
          ...item,
          isBase: item.id === id,
          updatedAt: item.id === id ? new Date().toISOString() : item.updatedAt,
        }))
      );
      toast.success("Primary Base CV updated.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set Base CV.";
      toast.error(msg);
    }
  };

  // Handle duplicating an existing CV
  const handleCopyCv = async (cv: CvListItemDto) => {
    try {
      const copyTitle = `${cv.title || "Untitled CV"} (Copy)`;
      const newCv = await createCv({
        title: copyTitle,
        templateKey: cv.templateKey,
        payload: cv.payload || createDefaultCvPayload(cv.candidateName || ""),
      });

      // Add new copy to list
      setCvs((prev) => [
        {
          id: newCv.id,
          userId: newCv.userId,
          title: newCv.title,
          templateKey: newCv.templateKey,
          createdAt: newCv.createdAt,
          updatedAt: newCv.updatedAt,
          isBase: false,
          candidateName: newCv.payload?.personal?.fullName,
          summary: newCv.payload?.summary,
          payload: newCv.payload,
        },
        ...prev,
      ]);

      toast.success(`Created duplicate: "${copyTitle}"`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to duplicate CV.";
      toast.error(msg);
    }
  };

  // Handle deleting a CV
  const handleDeleteCv = async (id: string) => {
    try {
      await deleteCv(id);
      setCvs((prev) => prev.filter((item) => item.id !== id));
      toast.success("CV draft deleted.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete CV.";
      toast.error(msg);
    }
  };

  // Handle downloading PDF
  const handleDownloadPdf = async (id: string, title: string) => {
    const toastId = toast.loading("Generating ATS-compliant PDF via QuestPDF...");
    try {
      const targetCv = cvs.find((c) => c.id === id);
      const name = targetCv?.candidateName || title;
      await downloadCvPdf(id, name);
      toast.success("PDF downloaded successfully.", { id: toastId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to download PDF.";
      toast.error(msg, { id: toastId });
    }
  };

  // Filtered and sorted CV list
  const filteredCvs = useMemo(() => {
    return cvs
      .filter((item) => {
        const matchesSearch =
          !searchQuery.trim() ||
          item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.candidateName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.summary?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTemplate =
          selectedTemplate === "all" ||
          item.templateKey?.toLowerCase() === selectedTemplate.toLowerCase();

        return matchesSearch && matchesTemplate;
      })
      .sort((a, b) => {
        // Base CV always appears first if sorting by update/create
        if (a.isBase && !b.isBase) return -1;
        if (!a.isBase && b.isBase) return 1;

        if (sortBy === "title") {
          return (a.title || "").localeCompare(b.title || "");
        }
        if (sortBy === "created") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // default: updated
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [cvs, searchQuery, selectedTemplate, sortBy]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Banner / Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              CV Dashboard
            </h1>
            {!isLoading && (
              <Badge variant="neutral" size="sm">
                {cvs.length} {cvs.length === 1 ? "document" : "documents"}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tailor, manage, and download high-impact ATS-optimized CVs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={loadCvs}
            isLoading={isLoading}
            title="Refresh list"
            id="refresh-cvs-button"
          >
            <RiRefreshLine className="size-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            id="create-new-cv-button"
          >
            <RiAddLine className="size-4" />
            <span>New CV</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="w-full md:w-96">
          <Input
            id="search-cvs-input"
            type="search"
            placeholder="Search by title, candidate name, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={RiSearchLine}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Template filter */}
          <div className="w-36">
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
            >
              <SelectTrigger id="template-filter-trigger">
                <SelectValue placeholder="All Templates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="navy">Navy</SelectItem>
                <SelectItem value="teal">Teal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort order */}
          <div className="w-44">
            <Select
              value={sortBy}
              onValueChange={(val) => setSortBy(val as "updated" | "created" | "title")}
            >
              <SelectTrigger id="sort-order-trigger">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Recently Updated</SelectItem>
                <SelectItem value="created">Recently Created</SelectItem>
                <SelectItem value="title">Title (A – Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-6">
        {/* Error State */}
        {error && !isLoading && (
          <Card className="border-rose-200 bg-rose-50/50 p-6 dark:border-rose-900/60 dark:bg-rose-950/20">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-rose-800 dark:text-rose-200">
                {error}
              </p>
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                Ensure the backend API service is running on `:5139` with MongoDB connected.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={loadCvs}
              >
                Retry Connection
              </Button>
            </div>
          </Card>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            id="cv-loading-skeletons"
          >
            {[1, 2, 3].map((idx) => (
              <Card
                key={idx}
                className="flex flex-col justify-between animate-pulse p-6"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="mt-1.5 h-3 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  </div>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State (No CVs found) */}
        {!isLoading && !error && filteredCvs.length === 0 && (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <RiFileAddLine className="size-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {cvs.length === 0 ? "No CV documents found" : "No matches for your query"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {cvs.length === 0
                ? "Get started by generating your first ATS-friendly CV draft with customized sections and live preview."
                : "Try adjusting your search keywords or clearing template filters."}
            </p>
            {cvs.length === 0 ? (
              <Button
                variant="primary"
                size="md"
                className="mt-6"
                onClick={() => setIsCreateModalOpen(true)}
                id="empty-state-create-button"
              >
                <RiAddLine className="size-4" />
                <span>Create Your First CV</span>
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTemplate("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </Card>
        )}

        {/* Grid of CV Cards */}
        {!isLoading && !error && filteredCvs.length > 0 && (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            id="cv-cards-grid"
          >
            {filteredCvs.map((cv) => (
              <CvCard
                key={cv.id}
                cv={cv}
                onSetBase={handleSetBase}
                onCopy={handleCopyCv}
                onDelete={handleDeleteCv}
                onDownload={handleDownloadPdf}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create New CV Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent id="create-cv-modal">
          <form onSubmit={handleCreateCv}>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <RiSparklingLine className="size-4" />
                </div>
                <DialogTitle>Create New CV Draft</DialogTitle>
              </div>
              <DialogDescription>
                Choose an initial title, candidate name, and template accent to initialize your ATS document.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label
                  htmlFor="cv-title-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  CV Document Title
                </label>
                <Input
                  id="cv-title-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Lead Full-Stack Architect — FinTech"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="candidate-name-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Candidate Full Name (Optional)
                </label>
                <Input
                  id="candidate-name-input"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label
                  htmlFor="template-select-trigger"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Template Style
                </label>
                <Select
                  value={newTemplate}
                  onValueChange={(val) => setNewTemplate(val as TemplateKey)}
                >
                  <SelectTrigger id="template-select-trigger">
                    <SelectValue placeholder="Select Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">
                      Classic (Executive Black & White ATS standard)
                    </SelectItem>
                    <SelectItem value="navy">
                      Navy (Modern Corporate Accent #1F3A5F)
                    </SelectItem>
                    <SelectItem value="teal">
                      Teal (Creative & Tech Accent #0F766E)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isCreating}
                id="submit-create-cv-button"
              >
                Create & Open Editor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

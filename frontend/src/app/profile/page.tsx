"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { RiUserLine, RiCheckLine, RiAddLine, RiCloseLine } from "@remixicon/react";
import { UserProfileDto } from "@/lib/types";
import { getProfile, updateProfile } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [newPref, setNewPref] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    getProfile()
      .then((data) => {
        if (isSubscribed) {
          setProfile(data);
          setName(data.name || "");
          setEmail(data.email || "");
          setPreferences(data.preferences || []);
          setHighlights(data.coverLetterHighlights || []);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isSubscribed) {
          const msg = err instanceof Error ? err.message : "Failed to load profile.";
          toast.error(msg);
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    try {
      const updated = await updateProfile({
        name,
        email,
        preferences,
        coverLetterHighlights: highlights,
      });
      setProfile(updated);
      toast.success("Profile saved successfully.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const addPreference = () => {
    if (!newPref.trim()) return;
    setPreferences((prev) => [...prev, newPref.trim()]);
    setNewPref("");
  };

  const removePreference = (index: number) => {
    setPreferences((prev) => prev.filter((_, i) => i !== index));
  };

  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    setHighlights((prev) => [...prev, newHighlight.trim()]);
    setNewHighlight("");
  };

  const removeHighlight = (index: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <RiUserLine className="size-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              User Profile
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your personal details, career preferences, and cover letter highlights.
          </p>
        </div>

        {profile && (
          <Badge variant="neutral" size="sm">
            ID: {profile.clerkUserId.slice(0, 12)}...
          </Badge>
        )}
      </div>

      <div className="mt-8">
        {isLoading ? (
          <Card className="p-8 space-y-4 animate-pulse">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-md" />
          </Card>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="p-6 space-y-5">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Contact Information
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="profile-name"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Display Name
                  </label>
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-email"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Email Address
                  </label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. user@example.com"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Career Preferences
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add target roles, working arrangements, or relocation preferences.
              </p>

              <div className="flex gap-2">
                <Input
                  value={newPref}
                  onChange={(e) => setNewPref(e.target.value)}
                  placeholder="e.g. Remote UK, Senior Architect, Full-time"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPreference();
                    }
                  }}
                />
                <Button type="button" variant="secondary" size="md" onClick={addPreference}>
                  <RiAddLine className="size-4" />
                  <span>Add</span>
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {preferences.map((pref, i) => (
                  <Badge key={i} variant="blue" size="md" className="gap-1.5">
                    <span>{pref}</span>
                    <button
                      type="button"
                      onClick={() => removePreference(i)}
                      className="hover:opacity-75"
                    >
                      <RiCloseLine className="size-3.5" />
                    </button>
                  </Badge>
                ))}
                {preferences.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No preferences added yet.</p>
                )}
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Cover Letter Highlights
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Key achievements and strengths to prioritize during cover letter drafting.
              </p>

              <div className="flex gap-2">
                <Input
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  placeholder="e.g. 10+ years scaling distributed systems in FinTech"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addHighlight();
                    }
                  }}
                />
                <Button type="button" variant="secondary" size="md" onClick={addHighlight}>
                  <RiAddLine className="size-4" />
                  <span>Add</span>
                </Button>
              </div>

              <ul className="space-y-2 pt-2">
                {highlights.map((h, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <span>{h}</span>
                    <button
                      type="button"
                      onClick={() => removeHighlight(i)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <RiCloseLine className="size-4" />
                    </button>
                  </li>
                ))}
                {highlights.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No highlights added yet.</p>
                )}
              </ul>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
                <RiCheckLine className="size-4" />
                <span>Save Profile</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

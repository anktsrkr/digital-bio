"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { RiSettings3Line, RiCheckLine, RiSparklingLine } from "@remixicon/react";
import { AgentSettingDto } from "@/lib/types";
import { getAgentSettings, updateAgentSetting } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AgentSettingDto[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("CvSectionWriter");
  const [endpoint, setEndpoint] = useState("https://api.openai.com/v1");
  const [model, setModel] = useState("gpt-4o");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    getAgentSettings()
      .then((data) => {
        if (isSubscribed) {
          setSettings(data);
          const current = data.find((s) => s.agentName === selectedAgent) || data[0];
          if (current) {
            setSelectedAgent(current.agentName);
            setEndpoint(current.endpoint);
            setModel(current.model);
            setApiKey(current.hasApiKey ? "********" : "");
          }
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isSubscribed) {
          toast.error(err instanceof Error ? err.message : "Failed to load agent settings.");
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [selectedAgent]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    try {
      const updated = await updateAgentSetting(selectedAgent, {
        endpoint: endpoint.trim(),
        model: model.trim(),
        apiKey: apiKey.trim() === "********" ? null : apiKey.trim() || null,
      });

      setSettings((prev) =>
        prev.map((s) => (s.agentName === updated.agentName ? updated : s))
      );
      toast.success(`Settings saved for agent "${selectedAgent}".`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <RiSettings3Line className="size-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            AI Agent Settings
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Configure model parameters and endpoints for the CV AI generation services.
        </p>
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
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <RiSparklingLine className="size-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {selectedAgent} Agent
                  </h3>
                </div>
                <Badge variant="blue" size="sm">
                  {settings.length > 0 ? "Configured Agent" : "Active Agent"}
                </Badge>
              </div>

              <div>
                <label
                  htmlFor="endpoint-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  AI API Endpoint
                </label>
                <Input
                  id="endpoint-input"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="model-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Model Identifier
                </label>
                <Input
                  id="model-input"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="gpt-4o"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="api-key-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  API Key (Optional override)
                </label>
                <Input
                  id="api-key-input"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Leave blank to inherit the backend system default from appsettings.
                </p>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
                <RiCheckLine className="size-4" />
                <span>Save Agent Settings</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

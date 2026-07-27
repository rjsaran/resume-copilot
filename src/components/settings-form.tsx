"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  saveGeminiKeyAction,
  removeGeminiKeyAction,
  saveOpenRouterKeyAction,
  removeOpenRouterKeyAction,
  setActiveProviderAction,
  type SettingsActionResult,
} from "@/app/settings/actions";
import { IMPLEMENTED_PROVIDERS } from "@/services/llm/types";
import type { LlmProvider } from "@/lib/db/schema";

const PROVIDER_LABELS: Record<LlmProvider, string> = {
  GEMINI: "Google Gemini",
  CLAUDE: "Claude",
  OPENAI: "OpenAI",
  OPENROUTER: "OpenRouter",
};

interface SettingsFormProps {
  activeProvider: LlmProvider;
  hasGeminiKey: boolean;
  hasOpenRouterKey: boolean;
}

export function SettingsForm({
  activeProvider: initialActiveProvider,
  hasGeminiKey,
  hasOpenRouterKey,
}: SettingsFormProps) {
  const [activeProvider, setActiveProviderState] = useState(initialActiveProvider);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [isSwitching, startSwitching] = useTransition();

  function handleProviderChange(value: LlmProvider | null) {
    if (!value) return;
    const provider = value;
    setProviderError(null);
    startSwitching(async () => {
      const result = await setActiveProviderAction(provider);
      if (result.success) {
        setActiveProviderState(provider);
      } else {
        setProviderError(result.error ?? "Failed to switch provider.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Active provider</CardTitle>
          <CardDescription>
            Choose which LLM provider runs your job analysis and resume tailoring. Make sure
            you&apos;ve saved an API key for whichever provider you pick below.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Select
            value={activeProvider}
            onValueChange={handleProviderChange}
            disabled={isSwitching}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue>
                {(value: LlmProvider) => PROVIDER_LABELS[value]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {IMPLEMENTED_PROVIDERS.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {PROVIDER_LABELS[provider]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {providerError && <p className="text-sm text-destructive">{providerError}</p>}
        </CardContent>
      </Card>

      <ProviderKeyCard
        title="Google Gemini"
        description="Your key is encrypted at rest and never shared — every request runs against your own Gemini quota."
        placeholder="AIza..."
        hasKey={hasGeminiKey}
        onSave={saveGeminiKeyAction}
        onRemove={removeGeminiKeyAction}
      />
      <ProviderKeyCard
        title="OpenRouter"
        description="Your key is encrypted at rest and never shared — every request runs against your own OpenRouter quota."
        placeholder="sk-or-..."
        hasKey={hasOpenRouterKey}
        onSave={saveOpenRouterKeyAction}
        onRemove={removeOpenRouterKeyAction}
      />
    </div>
  );
}

interface ProviderKeyCardProps {
  title: string;
  description: string;
  placeholder: string;
  hasKey: boolean;
  onSave: (apiKey: string) => Promise<SettingsActionResult>;
  onRemove: () => Promise<SettingsActionResult>;
}

function ProviderKeyCard({
  title,
  description,
  placeholder,
  hasKey: initialHasKey,
  onSave,
  onRemove,
}: ProviderKeyCardProps) {
  const [hasKey, setHasKey] = useState(initialHasKey);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isRemoving, startRemoving] = useTransition();
  const inputId = `${title.toLowerCase().replace(/\s+/g, "-")}-key`;

  function handleSave() {
    setError(null);
    setSaved(false);
    startSaving(async () => {
      const result = await onSave(apiKey);
      if (result.success) {
        setHasKey(true);
        setApiKey("");
        setSaved(true);
      } else {
        setError(result.error ?? "Failed to save.");
      }
    });
  }

  function handleRemove() {
    setError(null);
    setSaved(false);
    startRemoving(async () => {
      const result = await onRemove();
      if (result.success) {
        setHasKey(false);
      } else {
        setError(result.error ?? "Failed to remove.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{title}</CardTitle>
          {hasKey ? (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              Key saved
            </Badge>
          ) : (
            <Badge variant="outline">No key saved</Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={inputId}>{hasKey ? "Replace API key" : "API key"}</Label>
          <Input
            id={inputId}
            type="password"
            autoComplete="off"
            placeholder={placeholder}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving || !apiKey.trim()}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
          {hasKey && (
            <Button variant="outline" onClick={handleRemove} disabled={isRemoving}>
              {isRemoving ? "Removing…" : "Remove key"}
            </Button>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && !error && <p className="text-sm text-emerald-600">Saved.</p>}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  saveGeminiKeyAction,
  removeGeminiKeyAction,
  saveOpenRouterKeyAction,
  removeOpenRouterKeyAction,
  setActiveProviderAction,
  setProviderModelAction,
  type SettingsActionResult,
} from "@/app/settings/actions";
import { IMPLEMENTED_PROVIDERS } from "@/services/llm/types";
import { DEFAULT_MODEL_BY_PROVIDER } from "@/services/llm/defaultModels";
import type { LlmProvider } from "@/lib/db/schema";

const PROVIDER_LABELS: Record<LlmProvider, string> = {
  GEMINI: "Google Gemini",
  CLAUDE: "Claude",
  OPENAI: "OpenAI",
  OPENROUTER: "OpenRouter",
};

const PROVIDER_KEY_PLACEHOLDER: Partial<Record<LlmProvider, string>> = {
  GEMINI: "AIza...",
  OPENROUTER: "sk-or-...",
};

const KEY_ACTIONS: Partial<
  Record<
    LlmProvider,
    {
      save: (apiKey: string) => Promise<SettingsActionResult>;
      remove: () => Promise<SettingsActionResult>;
    }
  >
> = {
  GEMINI: { save: saveGeminiKeyAction, remove: removeGeminiKeyAction },
  OPENROUTER: { save: saveOpenRouterKeyAction, remove: removeOpenRouterKeyAction },
};

interface SettingsFormProps {
  activeProvider: LlmProvider;
  hasGeminiKey: boolean;
  hasOpenRouterKey: boolean;
  geminiModel: string | null;
  openRouterModel: string | null;
}

export function SettingsForm({
  activeProvider: initialActiveProvider,
  hasGeminiKey,
  hasOpenRouterKey,
  geminiModel,
  openRouterModel,
}: SettingsFormProps) {
  const [activeProvider, setActiveProviderState] = useState(initialActiveProvider);
  // Accordion: only one provider's details are open at a time, starting
  // with whichever is active, so the page doesn't dump every field for
  // every provider on screen at once.
  const [expanded, setExpanded] = useState<LlmProvider | null>(initialActiveProvider);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [isSwitching, startSwitching] = useTransition();

  const hasKeyByProvider: Partial<Record<LlmProvider, boolean>> = {
    GEMINI: hasGeminiKey,
    OPENROUTER: hasOpenRouterKey,
  };
  const modelByProvider: Partial<Record<LlmProvider, string | null>> = {
    GEMINI: geminiModel,
    OPENROUTER: openRouterModel,
  };

  function handleUseProvider(provider: LlmProvider) {
    setSwitchError(null);
    startSwitching(async () => {
      const result = await setActiveProviderAction(provider);
      if (result.success) {
        setActiveProviderState(provider);
      } else {
        setSwitchError(result.error ?? "Failed to switch provider.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {switchError && <p className="text-sm text-destructive">{switchError}</p>}
      {IMPLEMENTED_PROVIDERS.map((provider) => {
        const keyActions = KEY_ACTIONS[provider];
        if (!keyActions) return null;
        return (
          <ProviderCard
            key={provider}
            provider={provider}
            isActive={provider === activeProvider}
            isExpanded={expanded === provider}
            onOpenChange={(open) => setExpanded(open ? provider : null)}
            onUseProvider={() => handleUseProvider(provider)}
            isSwitching={isSwitching}
            hasKey={hasKeyByProvider[provider] ?? false}
            model={modelByProvider[provider] ?? null}
            onSaveKey={keyActions.save}
            onRemoveKey={keyActions.remove}
          />
        );
      })}
    </div>
  );
}

interface ProviderCardProps {
  provider: LlmProvider;
  isActive: boolean;
  isExpanded: boolean;
  onOpenChange: (open: boolean) => void;
  onUseProvider: () => void;
  isSwitching: boolean;
  hasKey: boolean;
  model: string | null;
  onSaveKey: (apiKey: string) => Promise<SettingsActionResult>;
  onRemoveKey: () => Promise<SettingsActionResult>;
}

function ProviderCard({
  provider,
  isActive,
  isExpanded,
  onOpenChange,
  onUseProvider,
  isSwitching,
  hasKey: initialHasKey,
  model: initialModel,
  onSaveKey,
  onRemoveKey,
}: ProviderCardProps) {
  const [hasKey, setHasKey] = useState(initialHasKey);
  const [apiKey, setApiKey] = useState("");
  const [modelInput, setModelInput] = useState(initialModel ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isRemoving, startRemoving] = useTransition();

  const title = PROVIDER_LABELS[provider];
  const defaultModel = DEFAULT_MODEL_BY_PROVIDER[provider] ?? "provider default";
  const slug = provider.toLowerCase();

  function handleSave() {
    setError(null);
    setSaved(false);
    startSaving(async () => {
      if (apiKey.trim()) {
        const keyResult = await onSaveKey(apiKey);
        if (!keyResult.success) {
          setError(keyResult.error ?? "Failed to save API key.");
          return;
        }
        setHasKey(true);
        setApiKey("");
      }

      const modelResult = await setProviderModelAction(provider, modelInput);
      if (!modelResult.success) {
        setError(modelResult.error ?? "Failed to save model.");
        return;
      }
      setSaved(true);
    });
  }

  function handleRemove() {
    setError(null);
    setSaved(false);
    startRemoving(async () => {
      const result = await onRemoveKey();
      if (result.success) {
        setHasKey(false);
      } else {
        setError(result.error ?? "Failed to remove key.");
      }
    });
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={onOpenChange}>
      <Card>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CardTitle>{title}</CardTitle>
                {isActive && (
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Active
                  </Badge>
                )}
                <Badge variant="outline">{hasKey ? "Key saved" : "No key"}</Badge>
              </div>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${slug}-key`}>{hasKey ? "Replace API key" : "API key"}</Label>
              <Input
                id={`${slug}-key`}
                type="password"
                autoComplete="off"
                placeholder={PROVIDER_KEY_PLACEHOLDER[provider] ?? "..."}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setSaved(false);
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${slug}-model`}>Model</Label>
              <Input
                id={`${slug}-model`}
                type="text"
                autoComplete="off"
                placeholder={defaultModel}
                value={modelInput}
                onChange={(e) => {
                  setModelInput(e.target.value);
                  setSaved(false);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use the default ({defaultModel}).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save"}
              </Button>
              {hasKey && (
                <Button variant="outline" onClick={handleRemove} disabled={isRemoving}>
                  {isRemoving ? "Removing…" : "Remove key"}
                </Button>
              )}
              {!isActive && (
                <Button
                  variant="ghost"
                  onClick={onUseProvider}
                  disabled={isSwitching || !hasKey}
                >
                  Use this provider
                </Button>
              )}
            </div>
            {!isActive && !hasKey && (
              <p className="text-xs text-muted-foreground">
                Add an API key above to switch to {title}.
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {saved && !error && <p className="text-sm text-emerald-600">Saved.</p>}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { saveGeminiKeyAction, removeGeminiKeyAction } from "@/app/settings/actions";

interface SettingsFormProps {
  hasGeminiKey: boolean;
}

export function SettingsForm({ hasGeminiKey: initialHasKey }: SettingsFormProps) {
  const [hasKey, setHasKey] = useState(initialHasKey);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isRemoving, startRemoving] = useTransition();

  function handleSave() {
    setError(null);
    setSaved(false);
    startSaving(async () => {
      const result = await saveGeminiKeyAction(apiKey);
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
      const result = await removeGeminiKeyAction();
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
          <CardTitle>Google Gemini</CardTitle>
          {hasKey ? (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              Key saved
            </Badge>
          ) : (
            <Badge variant="outline">No key saved</Badge>
          )}
        </div>
        <CardDescription>
          Used for job analysis and resume tailoring. Your key is encrypted at rest and never
          shared — every request runs against your own Gemini quota.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gemini-key">{hasKey ? "Replace API key" : "Gemini API key"}</Label>
          <Input
            id="gemini-key"
            type="password"
            autoComplete="off"
            placeholder="AIza..."
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

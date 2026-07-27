"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { isCareerKnowledgeBase, type CareerKnowledgeBase } from "@/types/careerKnowledgeBase";
import {
  saveKnowledgeBaseAction,
  importKnowledgeBaseFromFileAction,
} from "@/app/knowledge-base/actions";

interface KnowledgeBaseEditorProps {
  initialData: CareerKnowledgeBase;
  hasSeedFile: boolean;
}

export function KnowledgeBaseEditor({ initialData, hasSeedFile }: KnowledgeBaseEditorProps) {
  const [text, setText] = useState(() => JSON.stringify(initialData, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isImporting, startImporting] = useTransition();

  function handleSave() {
    setSaved(false);
    setError(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("That isn't valid JSON — fix the syntax error and try again.");
      return;
    }

    if (!isCareerKnowledgeBase(parsed)) {
      setError("That JSON doesn't match the expected knowledge base schema.");
      return;
    }

    startSaving(async () => {
      const result = await saveKnowledgeBaseAction(parsed as CareerKnowledgeBase);
      if (result.success) {
        setSaved(true);
      } else {
        setError(result.error ?? "Failed to save.");
      }
    });
  }

  function handleImport() {
    setError(null);
    setSaved(false);
    startImporting(async () => {
      const result = await importKnowledgeBaseFromFileAction();
      if (result.success && result.data) {
        setText(JSON.stringify(result.data, null, 2));
      } else {
        setError(result.error ?? "Failed to import.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Career Knowledge Base</CardTitle>
          <CardDescription>
            Every job, project, skill, and education fact you have — the source tailored resumes
            are built from. Edit the JSON directly and save.
          </CardDescription>
        </div>
        <div className="flex shrink-0 gap-2">
          {hasSeedFile && (
            <Button variant="outline" size="sm" onClick={handleImport} disabled={isImporting}>
              {isImporting ? "Importing…" : "Import from file"}
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setSaved(false);
          }}
          spellCheck={false}
          className="min-h-[60vh] font-mono text-xs"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && !error && <p className="text-sm text-emerald-600">Saved.</p>}
      </CardContent>
    </Card>
  );
}

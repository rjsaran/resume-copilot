"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  isCareerKnowledgeBase,
  type CareerKnowledgeBase,
} from "@/types/careerKnowledgeBase";
import { saveKnowledgeBaseAction } from "@/app/knowledge-base/actions";

interface KnowledgeBaseEditorProps {
  initialData: CareerKnowledgeBase;
}

export function KnowledgeBaseEditor({ initialData }: KnowledgeBaseEditorProps) {
  const [text, setText] = useState(() => JSON.stringify(initialData, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, startSaving] = useTransition();

  function handleSave() {
    setSaved(false);
    setError(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("That isn't valid JSON - fix the syntax error and try again.");
      return;
    }

    if (!isCareerKnowledgeBase(parsed)) {
      setError("That JSON doesn't match the expected knowledge base schema.");
      return;
    }

    startSaving(async () => {
      const result = await saveKnowledgeBaseAction(
        parsed as CareerKnowledgeBase,
      );
      if (result.success) {
        setSaved(true);
      } else {
        setError(result.error ?? "Failed to save.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Edit as JSON</CardTitle>
          <CardDescription>
            Edit the structured data directly, then save.
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="shrink-0"
        >
          {isSaving ? "Saving…" : "Save"}
        </Button>
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

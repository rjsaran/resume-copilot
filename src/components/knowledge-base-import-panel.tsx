"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { importKnowledgeBaseAction } from "@/app/knowledge-base/actions";
import type { CareerKnowledgeBase } from "@/types/careerKnowledgeBase";

const ACCEPTED_FILE_PATTERN = /\.(txt|md)$/i;

export function KnowledgeBaseImportPanel({
  onImported,
}: {
  onImported: (knowledgeBase: CareerKnowledgeBase) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isImporting, startImporting] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_FILE_PATTERN.test(file.name)) {
      setError(
        "Only .txt or .md files can be read directly — for a PDF (e.g. a LinkedIn " +
          "profile export), open it and paste the text below instead."
      );
      return;
    }

    setError(null);
    file.text().then(setText);
  }

  function handleImport() {
    setError(null);
    startImporting(async () => {
      const result = await importKnowledgeBaseAction(text);
      if (!result.success || !result.knowledgeBase) {
        setError(result.error ?? "Failed to import.");
        return;
      }
      onImported(result.knowledgeBase);
      setOpen(false);
      setText("");
    });
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="self-start">
        <Upload className="size-4" />
        Import from resume / LinkedIn
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import from resume / LinkedIn</CardTitle>
        <CardDescription>
          Paste your resume text, or your LinkedIn profile text (open your profile — or a
          LinkedIn PDF export — and copy the text). AI will structure it into the knowledge
          base below for you to review and edit before saving; nothing is saved until you
          click Save down there. Uses one AI call.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your resume or LinkedIn profile text here..."
          spellCheck={false}
          className="min-h-[220px] font-mono text-xs"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleImport} disabled={isImporting || !text.trim()}>
            {isImporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {isImporting ? "Importing…" : "Parse with AI"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            Upload .txt file
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
            disabled={isImporting}
          >
            Cancel
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

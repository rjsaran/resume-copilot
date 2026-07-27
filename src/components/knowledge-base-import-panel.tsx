"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { importKnowledgeBaseAction } from "@/app/knowledge-base/actions";
import type { CareerKnowledgeBase } from "@/types/careerKnowledgeBase";

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function KnowledgeBaseImportPanel({
  onImported,
}: {
  onImported: (knowledgeBase: CareerKnowledgeBase) => void;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, startImporting] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;

    if (!isPdfFile(selected)) {
      setError("Please choose a PDF file.");
      return;
    }

    setError(null);
    setFile(selected);
  }

  function handleImport() {
    if (!file) return;
    setError(null);
    startImporting(async () => {
      const result = await importKnowledgeBaseAction(file);
      if (!result.success || !result.knowledgeBase) {
        setError(result.error ?? "Failed to import.");
        return;
      }
      onImported(result.knowledgeBase);
      setOpen(false);
      setFile(null);
    });
  }

  function handleCancel() {
    setOpen(false);
    setFile(null);
    setError(null);
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="self-start">
        <Upload className="size-4" />
        Import from resume PDF
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import from resume PDF</CardTitle>
        <CardDescription>
          Upload a PDF of your resume. AI will extract and structure it into the knowledge
          base below for you to review and edit before saving; nothing is saved until you
          click Save down there. Uses one AI call.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {file ? "Choose a different PDF" : "Choose PDF"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          {file && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <FileText className="size-3.5" />
              {file.name}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleImport} disabled={isImporting || !file}>
            {isImporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {isImporting ? "Importing…" : "Parse with AI"}
          </Button>
          <Button type="button" variant="ghost" onClick={handleCancel} disabled={isImporting}>
            Cancel
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

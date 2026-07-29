"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { importResumeDraftAction } from "@/app/resumes/actions";
import type { ResumeData } from "@/types/resume";

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function ImportResumeDialog({
  description,
  onImported,
}: {
  description: string;
  onImported: (resume: ResumeData) => void;
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
      const result = await importResumeDraftAction(file);
      if (!result.success || !result.resume) {
        setError(result.error ?? "Failed to import.");
        return;
      }
      onImported(result.resume);
      setOpen(false);
      setFile(null);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setFile(null);
          setError(null);
        }
      }}
    >
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="size-4" />
        Import from PDF
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from resume PDF</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
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
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleImport} disabled={isImporting || !file}>
            {isImporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {isImporting ? "Importing…" : "Parse with AI"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

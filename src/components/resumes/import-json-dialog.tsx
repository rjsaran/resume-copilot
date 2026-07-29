"use client";

import { useRef, useState } from "react";
import { FileJson, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { isResumeData, type ResumeData } from "@/types/resume";

function isJsonFile(file: File): boolean {
  return file.type === "application/json" || file.name.toLowerCase().endsWith(".json");
}

/**
 * Loads a resume from raw JSON - paste or upload a .json file exported
 * elsewhere (e.g. downloaded from another resume's "Download JSON" button).
 * Purely client-side: no LLM call, no server round trip, just parse and
 * validate against the same ResumeData shape everything else uses.
 */
export function ImportJsonDialog({
  description,
  onImported,
}: {
  description: string;
  onImported: (resume: ResumeData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    if (!isJsonFile(selected)) {
      setError("Please choose a .json file.");
      return;
    }
    setError(null);
    selected.text().then(setText);
  }

  function handleUse() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setError(e instanceof Error ? `Invalid JSON: ${e.message}` : "Invalid JSON.");
      return;
    }
    if (!isResumeData(parsed)) {
      setError(
        "That JSON doesn't match the expected resume shape - check required fields (basics.name/title/email/phone/summary, experience[], etc).",
      );
      return;
    }
    onImported(parsed);
    setOpen(false);
    setText("");
    setError(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setText("");
          setError(null);
        }
      }}
    >
      <Button variant="outline" onClick={() => setOpen(true)}>
        <FileJson className="size-4" />
        Import from JSON
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from JSON</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-3.5" />
              Choose .json file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="text-xs text-muted-foreground">or paste below</span>
          </div>
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            placeholder="Paste resume JSON here..."
            spellCheck={false}
            className="min-h-64 font-mono text-xs"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleUse} disabled={!text.trim()}>
            Use this JSON
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

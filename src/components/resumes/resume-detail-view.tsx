"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Loader2,
  Rows3,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResumeDiffViewer } from "@/components/resume-diff-viewer";
import { Resume } from "@/components/resume/Resume";
import { ResumeContentEditor } from "@/components/resume/editor/resume-content-editor";
import { resumeToPlainText } from "@/lib/resume/text";
import { cn } from "@/lib/utils";
import { updateResumeAction } from "@/app/resumes/actions";
import type { ResumeVersionType } from "@/lib/db/schema";
import type { ResumeData } from "@/types/resume";

type ViewMode = "edit" | "diff";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function typeLabel(type: ResumeVersionType): string {
  switch (type) {
    case "BASE":
      return "Base Resume";
    case "PUBLIC":
      return "Public Resume";
    case "MANUAL":
      return "Manual";
    default:
      return "AI";
  }
}

export function ResumeDetailView({
  resumeId,
  name,
  type,
  applicationId,
  cameFromResumes,
  initialResume,
  baseResume,
}: {
  resumeId: string;
  name: string;
  type: ResumeVersionType;
  applicationId: string | null;
  cameFromResumes: boolean;
  initialResume: ResumeData;
  baseResume: ResumeData | null;
}) {
  const [savedResume, setSavedResume] = useState(initialResume);
  const [draft, setDraft] = useState<ResumeData | null>(null);
  const [view, setView] = useState<ViewMode>("edit");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaving, startSave] = useTransition();
  const [isExporting, startExport] = useTransition();

  const activeResume = draft ?? savedResume;
  const hasUnsavedChanges = draft !== null;
  const canDiff = type !== "BASE" && baseResume !== null;

  // Prefer where the user actually came from (the Resumes hub) over the
  // resume's own applicationId - a tailored resume opened from its hub card
  // should return to the hub, not force a detour through its application.
  const backHref =
    cameFromResumes || !applicationId
      ? "/resumes"
      : `/applications/${applicationId}`;
  const backLabel =
    backHref === "/resumes" ? "Back to Resumes" : "Back to application";

  function handleSave() {
    if (!draft) return;
    setError(null);
    startSave(async () => {
      const result = await updateResumeAction(resumeId, draft);
      if (!result.success || !result.resumeVersion) {
        setError(result.error ?? "Failed to save changes.");
        return;
      }
      setSavedResume(JSON.parse(result.resumeVersion.resumeJson) as ResumeData);
      setDraft(null);
    });
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(JSON.stringify(activeResume, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadPdf() {
    setError(null);
    startExport(async () => {
      // Always exports whatever is currently on screen, saved or not - this
      // is what lets "Download PDF" work on unsaved edits without forcing a
      // save first (see /api/resume/render/pdf).
      const response = await fetch("/api/resume/render/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: activeResume }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "Failed to generate PDF.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slugify(name)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-16 dark:bg-black sm:px-8">
      <main className="flex w-full max-w-[90rem] flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
              <Badge variant="outline">{typeLabel(type)}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                Save changes
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "Copied" : "Copy JSON"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                PDF
              </Button>
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {canDiff && (
            <div className="flex gap-1 self-start rounded-md border p-0.5">
              <ViewTab
                active={view === "edit"}
                onClick={() => setView("edit")}
                label="Edit"
              />
              <ViewTab
                active={view === "diff"}
                onClick={() => setView("diff")}
                label="Diff"
              />
            </div>
          )}
        </div>

        {view === "diff" && canDiff && baseResume ? (
          <ResumeDiffViewer
            beforeTitle="Base Resume"
            afterTitle={name}
            before={resumeToPlainText(baseResume)}
            after={resumeToPlainText(activeResume)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-md border p-4">
              <ResumeContentEditor resume={activeResume} onChange={setDraft} />
            </div>
            <div className="xl:sticky xl:top-20 xl:self-start">
              <div className="flex justify-center overflow-x-auto rounded-md bg-neutral-100 py-6 dark:bg-neutral-900">
                <Resume data={activeResume} theme="classic" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ViewTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Rows3 className="size-3.5" />
      {label}
    </button>
  );
}

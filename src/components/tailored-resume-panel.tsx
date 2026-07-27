"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Check,
  Copy,
  Download,
  FileOutput,
  Loader2,
  Pencil,
  Rows3,
  Save,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResumeDiffViewer } from "@/components/resume-diff-viewer";
import { Resume } from "@/components/resume/Resume";
import { ResumeEditor } from "@/components/resume/resume-editor";
import { resumeToPlainText } from "@/lib/resume/text";
import { cn } from "@/lib/utils";
import {
  generateTailoredResumeAction,
  updateResumeVersionAction,
} from "@/app/applications/[id]/actions";
import type { ResumeVersionType } from "@/lib/db/schema";
import type { ResumeData } from "@/types/resume";

export interface ResumeVersionDTO {
  id: string;
  name: string;
  type: ResumeVersionType;
  resume: ResumeData;
}

type ViewMode = "preview" | "edit" | "diff";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function TailoredResumePanel({
  applicationId,
  initialVersions,
}: {
  applicationId: string;
  initialVersions: ResumeVersionDTO[];
}) {
  const [versions, setVersions] = useState<ResumeVersionDTO[]>(initialVersions);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    () => initialVersions.find((v) => v.type === "TAILORED")?.id ?? null
  );
  const [view, setView] = useState<ViewMode>("preview");
  const [draft, setDraft] = useState<ResumeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, startGenerate] = useTransition();
  const [isSaving, startSave] = useTransition();

  const masterVersion = useMemo(
    () => versions.find((v) => v.type === "MASTER"),
    [versions]
  );
  const tailoredVersions = useMemo(
    () => versions.filter((v) => v.type === "TAILORED"),
    [versions]
  );
  const selectedVersion = useMemo(
    () => tailoredVersions.find((v) => v.id === selectedVersionId) ?? null,
    [tailoredVersions, selectedVersionId]
  );

  // Discard any in-progress edit draft whenever the selected version changes,
  // so editing always starts from that version's true saved content.
  useEffect(() => {
    setDraft(null);
  }, [selectedVersionId]);

  const activeResume = draft ?? selectedVersion?.resume ?? null;
  const hasUnsavedChanges = draft !== null;

  function handleGenerate() {
    if (isGenerating) return; // guard against a double-click firing twice

    // The first generation is always intentional; regenerating (which spends
    // another AI call and adds yet another version to keep around) is easy
    // to trigger by accident with nothing actually changed since last time,
    // so ask before spending it.
    if (
      tailoredVersions.length > 0 &&
      !window.confirm(
        "Regenerate the tailored resume? This uses another AI call and adds a new version."
      )
    ) {
      return;
    }

    setError(null);
    startGenerate(async () => {
      const result = await generateTailoredResumeAction(applicationId);

      if (!result.success || !result.resumeVersion) {
        setError(result.error ?? "Failed to generate tailored resume.");
        return;
      }

      const tailored = result.resumeVersion;
      const tailoredDto: ResumeVersionDTO = {
        id: tailored.id,
        name: tailored.name,
        type: tailored.type,
        resume: JSON.parse(tailored.resumeJson) as ResumeData,
      };

      setVersions((prev) => {
        // The very first generation for an application also creates a
        // MASTER snapshot server-side; make sure the client picks it up
        // too instead of only ever seeing the TAILORED version.
        const withoutStale = prev.filter((v) => v.id !== tailoredDto.id);
        if (result.masterVersion && !withoutStale.some((v) => v.id === result.masterVersion!.id)) {
          const masterDto: ResumeVersionDTO = {
            id: result.masterVersion.id,
            name: result.masterVersion.name,
            type: result.masterVersion.type,
            resume: JSON.parse(result.masterVersion.resumeJson) as ResumeData,
          };
          return [tailoredDto, masterDto, ...withoutStale];
        }
        return [tailoredDto, ...withoutStale];
      });

      // Don't yank the user away from an in-progress, unsaved edit of a
      // different version just because a background generation finished —
      // that would silently discard their draft. The new version is still
      // added above; they can switch to it from the selector.
      if (hasUnsavedChanges) return;

      setSelectedVersionId(tailoredDto.id);
      setView("preview");
    });
  }

  function handleSave() {
    if (!selectedVersion || !draft) return;
    setError(null);
    startSave(async () => {
      const result = await updateResumeVersionAction(
        applicationId,
        selectedVersion.id,
        draft
      );

      if (!result.success || !result.resumeVersion) {
        setError(result.error ?? "Failed to save changes.");
        return;
      }

      const updated = result.resumeVersion;
      const resume = JSON.parse(updated.resumeJson) as ResumeData;
      setVersions((prev) =>
        prev.map((v) => (v.id === updated.id ? { ...v, resume } : v))
      );
      setDraft(null);
    });
  }

  async function handleCopy() {
    if (!activeResume) return;
    await navigator.clipboard.writeText(JSON.stringify(activeResume, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadJson() {
    if (!activeResume || !selectedVersion) return;
    const blob = new Blob([JSON.stringify(activeResume, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(selectedVersion.name)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleExportPdf() {
    if (!selectedVersion) return;
    window.open(`/api/resume/${selectedVersion.id}/pdf`, "_blank");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Tailored Resume</CardTitle>
            <CardDescription>
              AI-tailored version for this job, rendered from structured resume
              data — not Markdown.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tailoredVersions.length > 0 && (
              <Select
                value={selectedVersionId ?? undefined}
                onValueChange={setSelectedVersionId}
              >
                <SelectTrigger className="w-40">
                  <SelectValue>
                    {(id: string) =>
                      tailoredVersions.find((version) => version.id === id)?.name ?? ""
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tailoredVersions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      {version.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={handleGenerate} disabled={isGenerating} size="sm">
              {isGenerating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {tailoredVersions.length === 0 ? "Generate Resume" : "Regenerate"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <p className="rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {!masterVersion || !selectedVersion || !activeResume ? (
          <p className="text-sm text-muted-foreground">
            {isGenerating
              ? "Tailoring your resume to this job — this can take a little while..."
              : "No tailored resume yet. Click “Generate Resume” to create one from your master resume, this job's description, and its analysis."}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1 rounded-md border p-0.5">
                <ViewTab
                  active={view === "preview"}
                  onClick={() => setView("preview")}
                  icon={Rows3}
                  label="Preview"
                />
                <ViewTab
                  active={view === "edit"}
                  onClick={() => setView("edit")}
                  icon={Pencil}
                  label="Edit"
                />
                <ViewTab
                  active={view === "diff"}
                  onClick={() => setView("diff")}
                  icon={Rows3}
                  label="Diff"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {view === "edit" && (
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
                )}
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copied ? "Copied" : "Copy JSON"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadJson}>
                  <Download className="size-3.5" />
                  Download JSON
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPdf}>
                  <FileOutput className="size-3.5" />
                  Export PDF
                </Button>
              </div>
            </div>

            {hasUnsavedChanges && view !== "edit" && (
              <p className="text-xs text-muted-foreground">
                You have unsaved edits. Switch to Edit and save them to include in
                the exported PDF.
              </p>
            )}

            {view === "preview" && (
              <div className="flex justify-center overflow-x-auto rounded-md bg-neutral-100 py-6 dark:bg-neutral-900">
                <Resume data={activeResume} theme="classic" />
              </div>
            )}

            {view === "edit" && (
              <div className="rounded-md border p-4">
                <ResumeEditor resume={activeResume} onChange={setDraft} />
              </div>
            )}

            {view === "diff" && (
              <ResumeDiffViewer
                beforeTitle="Master Resume"
                afterTitle={selectedVersion.name}
                before={resumeToPlainText(masterVersion.resume)}
                after={resumeToPlainText(activeResume)}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ViewTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Rows3;
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
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

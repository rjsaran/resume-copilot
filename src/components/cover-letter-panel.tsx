"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Check,
  ChevronDown,
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
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CoverLetter } from "@/components/coverLetter/CoverLetter";
import { CoverLetterEditor } from "@/components/coverLetter/cover-letter-editor";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import {
  generateCoverLetterAction,
  updateCoverLetterVersionAction,
} from "@/app/applications/[id]/actions";
import type { CoverLetterData } from "@/types/coverLetter";

export interface CoverLetterVersionDTO {
  id: string;
  name: string;
  coverLetter: CoverLetterData;
}

type ViewMode = "preview" | "edit";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CoverLetterPanel({
  applicationId,
  initialVersions,
}: {
  applicationId: string;
  initialVersions: CoverLetterVersionDTO[];
}) {
  const [versions, setVersions] =
    useState<CoverLetterVersionDTO[]>(initialVersions);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    () => initialVersions[0]?.id ?? null,
  );
  // Collapsed by default once a version already exists - see the matching
  // note on TailoredResumePanel.
  const [open, setOpen] = useState(() => initialVersions.length === 0);
  const [view, setView] = useState<ViewMode>("preview");
  const [draft, setDraft] = useState<CoverLetterData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, startGenerate] = useTransition();
  const [isSaving, startSave] = useTransition();
  const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);

  const selectedVersion = useMemo(
    () => versions.find((v) => v.id === selectedVersionId) ?? null,
    [versions, selectedVersionId],
  );

  // Discard any in-progress edit draft whenever the selected version changes,
  // so editing always starts from that version's true saved content.
  useEffect(() => {
    setDraft(null);
  }, [selectedVersionId]);

  const activeCoverLetter = draft ?? selectedVersion?.coverLetter ?? null;
  const hasUnsavedChanges = draft !== null;

  function handleGenerate() {
    if (isGenerating) return; // guard against a double-click firing twice

    // The first generation is always intentional; regenerating (which spends
    // another AI call and adds yet another version to keep around) is easy
    // to trigger by accident with nothing actually changed since last time,
    // so ask before spending it.
    if (versions.length > 0) {
      setConfirmRegenerateOpen(true);
      return;
    }
    runGenerate();
  }

  function runGenerate() {
    setError(null);
    startGenerate(async () => {
      const result = await generateCoverLetterAction(applicationId);

      if (!result.success || !result.coverLetterVersion) {
        setError(result.error ?? "Failed to generate cover letter.");
        return;
      }

      const generated = result.coverLetterVersion;
      const dto: CoverLetterVersionDTO = {
        id: generated.id,
        name: generated.name,
        coverLetter: JSON.parse(generated.coverLetterJson) as CoverLetterData,
      };

      setVersions((prev) => [dto, ...prev.filter((v) => v.id !== dto.id)]);

      // A freshly generated version should never land inside a collapsed
      // panel the user can't see.
      setOpen(true);

      // Don't yank the user away from an in-progress, unsaved edit of a
      // different version just because a background generation finished -
      // that would silently discard their draft. The new version is still
      // added above; they can switch to it from the selector.
      if (hasUnsavedChanges) return;

      setSelectedVersionId(dto.id);
      setView("preview");
    });
  }

  function handleSave() {
    if (!selectedVersion || !draft) return;
    setError(null);
    startSave(async () => {
      const result = await updateCoverLetterVersionAction(
        applicationId,
        selectedVersion.id,
        draft,
      );

      if (!result.success || !result.coverLetterVersion) {
        setError(result.error ?? "Failed to save changes.");
        return;
      }

      const updated = result.coverLetterVersion;
      const coverLetter = JSON.parse(
        updated.coverLetterJson,
      ) as CoverLetterData;
      setVersions((prev) =>
        prev.map((v) => (v.id === updated.id ? { ...v, coverLetter } : v)),
      );
      setDraft(null);
    });
  }

  async function handleCopy() {
    if (!activeCoverLetter) return;
    await navigator.clipboard.writeText(
      JSON.stringify(activeCoverLetter, null, 2),
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadJson() {
    if (!activeCoverLetter || !selectedVersion) return;
    const blob = new Blob([JSON.stringify(activeCoverLetter, null, 2)], {
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
    window.open(`/api/cover-letter/${selectedVersion.id}/pdf`, "_blank");
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CollapsibleTrigger className="flex items-start gap-2 text-left">
              <ChevronDown
                className={cn(
                  "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
              <div>
                <CardTitle>Cover Letter</CardTitle>
                <CardDescription>
                  AI-generated cover letter for this job, rendered from
                  structured data.
                </CardDescription>
              </div>
            </CollapsibleTrigger>
            <div className="flex flex-wrap items-center gap-2">
              {versions.length > 0 && (
                <Select
                  value={selectedVersionId ?? undefined}
                  onValueChange={setSelectedVersionId}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue>
                      {(id: string) =>
                        versions.find((version) => version.id === id)
                          ?.name ?? ""
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((version) => (
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
                {versions.length === 0 ? "Generate Cover Letter" : "Regenerate"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-4">
            {error && (
              <p className="rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {!selectedVersion || !activeCoverLetter ? (
              <p className="text-sm text-muted-foreground">
                {isGenerating
                  ? "Writing your cover letter for this job - this can take a little while..."
                  : "No cover letter yet. Click “Generate Cover Letter” to create one from your career knowledge base, this job's description, and its analysis."}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadJson}
                    >
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
                    You have unsaved edits. Switch to Edit and save them to
                    include in the exported PDF.
                  </p>
                )}

                {view === "preview" && (
                  <div className="flex justify-center overflow-x-auto rounded-md bg-neutral-100 py-6 dark:bg-neutral-900">
                    <CoverLetter data={activeCoverLetter} />
                  </div>
                )}

                {view === "edit" && (
                  <div className="rounded-md border p-4">
                    <CoverLetterEditor
                      coverLetter={activeCoverLetter}
                      onChange={setDraft}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>

      <ConfirmDialog
        open={confirmRegenerateOpen}
        onOpenChange={setConfirmRegenerateOpen}
        title="Regenerate the cover letter?"
        description="This uses another AI call and adds a new version."
        confirmLabel="Regenerate"
        isLoading={isGenerating}
        onConfirm={() => {
          setConfirmRegenerateOpen(false);
          runGenerate();
        }}
      />
    </Collapsible>
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
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

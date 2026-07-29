"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FilePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImportResumeDialog } from "@/components/resumes/import-resume-dialog";
import { ImportJsonDialog } from "@/components/resumes/import-json-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ResumeCard,
  type ResumeCardSummary,
} from "@/components/resumes/resume-card";
import {
  saveBaseResumeAction,
  cloneResumeAction,
  deleteResumeAction,
} from "@/app/resumes/actions";
import { createEmptyResume } from "@/lib/resume/emptyResume";
import type { ResumeData } from "@/types/resume";

export function BaseResumePanel({
  resume,
  clones,
}: {
  resume: ResumeCardSummary | null;
  clones: ResumeCardSummary[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCloning, startCloneTransition] = useTransition();
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleCreateBlank() {
    setError(null);
    startTransition(async () => {
      const result = await saveBaseResumeAction(createEmptyResume());
      if (!result.success || !result.resumeVersion) {
        setError(result.error ?? "Failed to create.");
        return;
      }
      router.push(`/resumes/${result.resumeVersion.id}`);
    });
  }

  function handleImported(imported: ResumeData) {
    setError(null);
    startTransition(async () => {
      const result = await saveBaseResumeAction(imported);
      if (!result.success || !result.resumeVersion) {
        setError(result.error ?? "Failed to save the imported resume.");
        return;
      }
      router.push(`/resumes/${result.resumeVersion.id}`);
    });
  }

  function handleClone(id: string) {
    setError(null);
    setCloningId(id);
    startCloneTransition(async () => {
      const result = await cloneResumeAction(id);
      if (!result.success || !result.resumeVersion) {
        setError(result.error ?? "Failed to clone.");
        setCloningId(null);
        return;
      }
      router.push(`/resumes/${result.resumeVersion.id}`);
    });
  }

  function handleDelete(id: string) {
    setConfirmDeleteId(id);
  }

  function confirmDelete() {
    const id = confirmDeleteId;
    if (!id) return;
    setError(null);
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteResumeAction(id);
      if (!result.success) {
        setError(result.error ?? "Failed to delete.");
        setDeletingId(null);
        setConfirmDeleteId(null);
        return;
      }
      setConfirmDeleteId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!resume ? (
        <Card>
          <CardHeader>
            <CardTitle>Base Resume</CardTitle>
            <CardDescription>
              The one rich, detailed source everything else is tailored from -
              exactly one per account, and required before you can analyze a
              job or generate a tailored resume. No page limit - keep every
              job, every bullet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleCreateBlank} disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FilePlus className="size-3.5" />
              )}
              Start blank
            </Button>
            <ImportResumeDialog
              description="Upload a PDF of your resume. AI will extract and structure it into your base resume for you to review and edit; nothing is saved until the import completes."
              onImported={handleImported}
            />
            <ImportJsonDialog
              description="Paste or upload resume JSON (e.g. downloaded from another resume's 'Download JSON' button) to use as your base resume directly - no AI call."
              onImported={handleImported}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <ResumeCard
            resume={resume}
            onDelete={handleDelete}
            isDeleting={deletingId === resume.id}
            onClone={handleClone}
            isCloning={isCloning && cloningId === resume.id}
          />
          {clones.map((clone) => (
            <ResumeCard
              key={clone.id}
              resume={clone}
              onDelete={handleDelete}
              isDeleting={deletingId === clone.id}
              onClone={handleClone}
              isCloning={isCloning && cloningId === clone.id}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(next) => {
          if (!next) setConfirmDeleteId(null);
        }}
        title={confirmDeleteId === resume?.id ? "Delete your base resume?" : "Delete this resume?"}
        description={
          confirmDeleteId === resume?.id
            ? "You'll need to create a new one before analyzing jobs or tailoring resumes again."
            : undefined
        }
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deletingId === confirmDeleteId && isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

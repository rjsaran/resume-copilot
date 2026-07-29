"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Copy, FilePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ResumeCard, type ResumeCardSummary } from "@/components/resumes/resume-card";
import {
  createPublicResumeAction,
  duplicateBaseToPublicAction,
  deleteResumeAction,
} from "@/app/resumes/actions";
import { createEmptyResume } from "@/lib/resume/emptyResume";

export function PublicResumesPanel({
  resumes,
  hasBaseResume,
}: {
  resumes: ResumeCardSummary[];
  hasBaseResume: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isCreating, startCreate] = useTransition();

  function handleCreateBlank() {
    setError(null);
    startCreate(async () => {
      const result = await createPublicResumeAction(createEmptyResume());
      if (!result.success || !result.resumeVersion) {
        setError(result.error ?? "Failed to create.");
        return;
      }
      router.push(`/resumes/${result.resumeVersion.id}`);
    });
  }

  function handleDuplicateFromBase() {
    setError(null);
    startCreate(async () => {
      const result = await duplicateBaseToPublicAction();
      if (!result.success || !result.resumeVersion) {
        setError(result.error ?? "Failed to duplicate.");
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
    startCreate(async () => {
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
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={handleCreateBlank} disabled={isCreating}>
          {isCreating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <FilePlus className="size-3.5" />
          )}
          Start blank
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDuplicateFromBase}
          disabled={isCreating || !hasBaseResume}
          title={!hasBaseResume ? "Create your base resume first" : undefined}
        >
          <Copy className="size-3.5" />
          Duplicate from Base Resume
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {resumes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No public resumes yet. Public resumes are short, polished resumes
          for job boards and recruiters - create one whenever you want, and
          keep as many as you like.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onDelete={handleDelete}
              isDeleting={deletingId === resume.id}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(next) => {
          if (!next) setConfirmDeleteId(null);
        }}
        title="Delete this public resume?"
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deletingId === confirmDeleteId && isCreating}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

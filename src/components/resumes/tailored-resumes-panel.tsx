"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ResumeCard, type ResumeCardSummary } from "@/components/resumes/resume-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteResumeAction } from "@/app/resumes/actions";

export function TailoredResumesPanel({ resumes }: { resumes: ResumeCardSummary[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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

      {resumes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tailored resumes yet. Generate one with AI, or create one
          manually, from an application to see it here.
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
        title="Delete this tailored resume?"
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}

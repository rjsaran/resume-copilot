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
  deleteResumeAction,
} from "@/app/resumes/actions";
import { createEmptyResume } from "@/lib/resume/emptyResume";
import type { ResumeData } from "@/types/resume";

export function BaseResumePanel({
  resume,
}: {
  resume: ResumeCardSummary | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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

  function handleDelete() {
    setConfirmDeleteOpen(true);
  }

  function confirmDelete() {
    if (!resume) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteResumeAction(resume.id);
      if (!result.success) {
        setError(result.error ?? "Failed to delete.");
        setConfirmDeleteOpen(false);
        return;
      }
      setConfirmDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Base Resume</CardTitle>
        <CardDescription>
          The one rich, detailed source everything else is tailored from. No
          page limit - keep every job, every bullet.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {resume ? (
          <ResumeCard
            resume={resume}
            onDelete={handleDelete}
            isDeleting={isPending}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
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
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete your base resume?"
        description="You'll need to create a new one before analyzing jobs or tailoring resumes again."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isPending}
        onConfirm={confirmDelete}
      />
    </Card>
  );
}

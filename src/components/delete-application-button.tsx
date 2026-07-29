"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteApplicationAction } from "@/app/applications/[id]/actions";

export function DeleteApplicationButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  function handleConfirm() {
    setError(null);
    startDelete(async () => {
      const result = await deleteApplicationAction(applicationId);
      if (!result.success) {
        setError(result.error ?? "Failed to delete.");
        return;
      }
      router.push("/applications");
    });
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setConfirmOpen(true)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
        Delete
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this application?"
        description={
          <>
            This permanently deletes its analysis, tailored resumes, cover
            letters, and outcome history. This can&apos;t be undone.
            {error && <span className="mt-2 block text-destructive">{error}</span>}
          </>
        }
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirm}
      />
    </>
  );
}

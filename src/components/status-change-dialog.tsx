"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_LABELS } from "@/lib/badge-meta";
import type { ApplicationStatus } from "@/lib/db/schema";
import type { PendingStatusChange } from "@/hooks/use-status-change-dialog";

const NOTES_PLACEHOLDER: Partial<Record<ApplicationStatus, string>> = {
  REJECTED: "e.g. paste the rejection email or the reason given",
  OFFER: "e.g. compensation, deadline to respond",
  NOT_APPLIED: "e.g. the reason you decided not to apply",
  WITHDRAWN: "e.g. why you withdrew",
  RECRUITER_CALL: "e.g. who you spoke with, what was discussed",
  INTERVIEW: "e.g. round, interviewer, how it went",
};

export function StatusChangeDialog({
  pendingChange,
  notes,
  onNotesChange,
  onSkip,
  onSave,
  onDismiss,
}: {
  pendingChange: PendingStatusChange | null;
  notes: string;
  onNotesChange: (value: string) => void;
  onSkip: () => void;
  onSave: () => void;
  onDismiss: () => void;
}) {
  return (
    <Dialog
      open={pendingChange !== null}
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
    >
      <DialogContent>
        {pendingChange && (
          <>
            <DialogHeader>
              <DialogTitle>
                Mark as &quot;{STATUS_LABELS[pendingChange.toStatus]}&quot;
              </DialogTitle>
              <DialogDescription>
                Add any notes worth keeping with this status change - they&apos;ll
                show up in this application&apos;s timeline. Optional.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              autoFocus
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder={
                NOTES_PLACEHOLDER[pendingChange.toStatus] ??
                "Add any relevant notes…"
              }
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={onSkip}>
                Skip
              </Button>
              <Button onClick={onSave}>Save</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

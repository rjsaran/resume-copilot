"use client";

import { useState, useTransition } from "react";
import { updateApplicationStatusAction } from "@/app/applications/[id]/actions";
import type { ApplicationStatus } from "@/lib/db/schema";

export interface PendingStatusChange {
  applicationId: string;
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
}

/**
 * Shared status-change flow: request a status change, confirm it (with
 * optional notes) in a dialog, then commit it. Used by both the status
 * dropdown on the application detail page and drag-and-drop on the board,
 * so a status change always goes through the same notes prompt.
 */
export function useStatusChangeDialog() {
  const [isPending, startTransition] = useTransition();
  const [pendingChange, setPendingChange] = useState<PendingStatusChange | null>(
    null,
  );
  const [notes, setNotes] = useState("");

  function requestChange(
    applicationId: string,
    fromStatus: ApplicationStatus,
    toStatus: ApplicationStatus,
  ) {
    if (fromStatus === toStatus) return;
    setPendingChange({ applicationId, fromStatus, toStatus });
  }

  function dismiss() {
    setPendingChange(null);
    setNotes("");
  }

  function commit(withNotes: boolean) {
    if (!pendingChange) return;
    const { applicationId, toStatus } = pendingChange;
    const notesValue = withNotes ? notes : undefined;
    startTransition(async () => {
      await updateApplicationStatusAction(applicationId, toStatus, notesValue);
    });
    dismiss();
  }

  return {
    pendingChange,
    notes,
    setNotes,
    isPending,
    requestChange,
    commit,
    dismiss,
  };
}

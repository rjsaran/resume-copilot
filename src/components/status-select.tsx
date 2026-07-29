"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusChangeDialog } from "@/components/status-change-dialog";
import { useStatusChangeDialog } from "@/hooks/use-status-change-dialog";
import { ALL_APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/badge-meta";
import type { ApplicationStatus } from "@/lib/db/schema";

export function StatusSelect({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const { pendingChange, notes, setNotes, isPending, requestChange, commit, dismiss } =
    useStatusChangeDialog();

  return (
    <>
      <Select
        value={status}
        disabled={isPending}
        onValueChange={(value) =>
          requestChange(applicationId, status, value as ApplicationStatus)
        }
      >
        <SelectTrigger>
          <SelectValue>
            {(value: ApplicationStatus) => STATUS_LABELS[value]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ALL_APPLICATION_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <StatusChangeDialog
        pendingChange={pendingChange}
        notes={notes}
        onNotesChange={setNotes}
        onSkip={() => commit(false)}
        onSave={() => commit(true)}
        onDismiss={dismiss}
      />
    </>
  );
}

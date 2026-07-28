"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ALL_APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/badge-meta";
import { updateApplicationStatusAction } from "@/app/applications/[id]/actions";
import type { ApplicationStatus } from "@/lib/db/schema";

const NOTES_PLACEHOLDER: Partial<Record<ApplicationStatus, string>> = {
  REJECTED: "e.g. paste the rejection email or the reason given",
  OFFER: "e.g. compensation, deadline to respond",
  NOT_APPLIED: "e.g. the reason you decided not to apply",
  WITHDRAWN: "e.g. why you withdrew",
  RECRUITER_CALL: "e.g. who you spoke with, what was discussed",
  INTERVIEW: "e.g. round, interviewer, how it went",
};

export function StatusSelect({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(
    null,
  );
  const [notes, setNotes] = useState("");

  function commit(newStatus: ApplicationStatus, notesValue?: string) {
    startTransition(async () => {
      await updateApplicationStatusAction(applicationId, newStatus, notesValue);
    });
    setPendingStatus(null);
    setNotes("");
  }

  return (
    <>
      <Select
        value={status}
        disabled={isPending}
        onValueChange={(value) => {
          const newStatus = value as ApplicationStatus;
          if (newStatus === status) return;
          setPendingStatus(newStatus);
        }}
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

      <Dialog
        open={pendingStatus !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingStatus(null);
            setNotes("");
          }
        }}
      >
        <DialogContent>
          {pendingStatus && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Mark as &quot;{STATUS_LABELS[pendingStatus]}&quot;
                </DialogTitle>
                <DialogDescription>
                  Add any notes worth keeping with this status change -
                  they&apos;ll show up in this application&apos;s timeline.
                  Optional.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                autoFocus
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  NOTES_PLACEHOLDER[pendingStatus] ?? "Add any relevant notes…"
                }
                rows={4}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => commit(pendingStatus)}>
                  Skip
                </Button>
                <Button onClick={() => commit(pendingStatus, notes)}>
                  Save
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

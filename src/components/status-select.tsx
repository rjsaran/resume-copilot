"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/badge-meta";
import { updateApplicationStatusAction } from "@/app/applications/[id]/actions";
import type { ApplicationStatus } from "@/generated/prisma/client";

export function StatusSelect({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={isPending}
      onValueChange={(value) => {
        startTransition(async () => {
          await updateApplicationStatusAction(
            applicationId,
            value as ApplicationStatus
          );
        });
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
  );
}

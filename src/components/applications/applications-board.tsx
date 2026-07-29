"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  RECOMMENDATION_META,
  isRecommendationStatus,
  ALL_APPLICATION_STATUSES,
  STATUS_LABELS,
} from "@/lib/badge-meta";
import { LocalDateTime } from "@/components/local-datetime";
import { StatusChangeDialog } from "@/components/status-change-dialog";
import { useStatusChangeDialog } from "@/hooks/use-status-change-dialog";
import { cn } from "@/lib/utils";
import type { Application, ApplicationStatus } from "@/lib/db/schema";

/**
 * One column per status, in the same fixed order as the status dropdown -
 * a card is a thin, clickable summary; the full detail (notes, tailoring,
 * analysis) lives one click away on the application page, not here. Cards
 * can also be dragged to a different column, which opens the same
 * notes-confirmation dialog as changing status from the detail page.
 */
export function ApplicationsBoard({
  applications,
}: {
  applications: Application[];
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<ApplicationStatus | null>(
    null,
  );
  const { pendingChange, notes, setNotes, requestChange, commit, dismiss } =
    useStatusChangeDialog();

  const byStatus = new Map<ApplicationStatus, Application[]>(
    ALL_APPLICATION_STATUSES.map((status) => [status, []]),
  );
  for (const application of applications) {
    byStatus.get(application.status)?.push(application);
  }

  function handleDrop(targetStatus: ApplicationStatus) {
    setDragOverStatus(null);
    const application = applications.find((a) => a.id === draggedId);
    setDraggedId(null);
    if (!application) return;
    requestChange(application.id, application.status, targetStatus);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {ALL_APPLICATION_STATUSES.map((status) => {
        const columnApplications = byStatus.get(status) ?? [];
        return (
          <div
            key={status}
            className="flex w-72 shrink-0 flex-col gap-3"
            onDragOver={(e) => {
              e.preventDefault();
              if (draggedId) setDragOverStatus(status);
            }}
            onDragLeave={() =>
              setDragOverStatus((prev) => (prev === status ? null : prev))
            }
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(status);
            }}
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-medium">{STATUS_LABELS[status]}</h2>
              <span className="text-xs text-muted-foreground">
                {columnApplications.length}
              </span>
            </div>
            <div
              className={cn(
                "flex flex-col gap-2 rounded-lg transition-colors",
                dragOverStatus === status &&
                  "outline outline-2 outline-dashed outline-primary/40",
              )}
            >
              {columnApplications.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                  No applications
                </div>
              ) : (
                columnApplications.map((application) => (
                  <Link
                    key={application.id}
                    href={`/applications/${application.id}`}
                    draggable
                    onDragStart={(e) => {
                      setDraggedId(application.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", application.id);
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDragOverStatus(null);
                    }}
                    onClick={(e) => {
                      if (draggedId) e.preventDefault();
                    }}
                    className={cn(
                      "flex cursor-grab flex-col gap-2 rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition-colors hover:border-foreground/20 hover:bg-accent/50 active:cursor-grabbing",
                      draggedId === application.id && "opacity-50",
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      <p className="truncate font-medium">
                        {application.company}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {application.jobTitle}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {isRecommendationStatus(application.verdict) ? (
                        <Badge
                          className={
                            RECOMMENDATION_META[application.verdict]
                              .badgeClassName
                          }
                        >
                          {application.verdict}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{application.verdict}</Badge>
                      )}
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {application.overallScore}/100
                      </span>
                    </div>
                    <LocalDateTime
                      date={application.createdAt}
                      className="text-xs text-muted-foreground"
                    />
                  </Link>
                ))
              )}
            </div>
          </div>
        );
      })}

      <StatusChangeDialog
        pendingChange={pendingChange}
        notes={notes}
        onNotesChange={setNotes}
        onSkip={() => commit(false)}
        onSave={() => commit(true)}
        onDismiss={dismiss}
      />
    </div>
  );
}

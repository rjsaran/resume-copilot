import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  RECOMMENDATION_META,
  isRecommendationStatus,
  ALL_APPLICATION_STATUSES,
  STATUS_LABELS,
} from "@/lib/badge-meta";
import { LocalDateTime } from "@/components/local-datetime";
import { cn } from "@/lib/utils";
import type { Application, ApplicationStatus } from "@/lib/db/schema";

/**
 * One column per status, in the same fixed order as the status dropdown -
 * a card is a thin, clickable summary; the full detail (notes, tailoring,
 * analysis) lives one click away on the application page, not here.
 */
export function ApplicationsBoard({
  applications,
}: {
  applications: Application[];
}) {
  const byStatus = new Map<ApplicationStatus, Application[]>(
    ALL_APPLICATION_STATUSES.map((status) => [status, []]),
  );
  for (const application of applications) {
    byStatus.get(application.status)?.push(application);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {ALL_APPLICATION_STATUSES.map((status) => {
        const columnApplications = byStatus.get(status) ?? [];
        return (
          <div key={status} className="flex w-72 shrink-0 flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-medium">{STATUS_LABELS[status]}</h2>
              <span className="text-xs text-muted-foreground">
                {columnApplications.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {columnApplications.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-3 text-center text-xs text-muted-foreground">
                  No applications
                </div>
              ) : (
                columnApplications.map((application) => (
                  <Link
                    key={application.id}
                    href={`/applications/${application.id}`}
                    className={cn(
                      "flex flex-col gap-2 rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition-colors hover:border-foreground/20 hover:bg-accent/50",
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
    </div>
  );
}

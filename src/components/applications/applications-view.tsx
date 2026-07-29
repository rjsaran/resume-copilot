"use client";

import { useMemo, useState } from "react";
import { List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationsTable } from "@/components/applications/applications-table";
import { ApplicationsBoard } from "@/components/applications/applications-board";
import { RECOMMENDATION_META, isRecommendationStatus } from "@/lib/badge-meta";
import { cn } from "@/lib/utils";
import type { Application } from "@/lib/db/schema";

type View = "list" | "board";

const VERDICT_ORDER = Object.keys(RECOMMENDATION_META);

export function ApplicationsView({
  applications,
}: {
  applications: Application[];
}) {
  const [view, setView] = useState<View>("board");
  const [activeVerdicts, setActiveVerdicts] = useState<Set<string>>(new Set());

  const verdictCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const application of applications) {
      counts.set(application.verdict, (counts.get(application.verdict) ?? 0) + 1);
    }
    return counts;
  }, [applications]);

  const availableVerdicts = useMemo(() => {
    const present = [...verdictCounts.keys()];
    const known = VERDICT_ORDER.filter((v) => verdictCounts.has(v));
    const unknown = present.filter((v) => !isRecommendationStatus(v)).sort();
    return [...known, ...unknown];
  }, [verdictCounts]);

  const filteredApplications = useMemo(() => {
    if (activeVerdicts.size === 0) return applications;
    return applications.filter((application) =>
      activeVerdicts.has(application.verdict),
    );
  }, [applications, activeVerdicts]);

  function toggleVerdict(verdict: string) {
    setActiveVerdicts((prev) => {
      const next = new Set(prev);
      if (next.has(verdict)) {
        next.delete(verdict);
      } else {
        next.add(verdict);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {availableVerdicts.map((verdict) => {
            const active = activeVerdicts.has(verdict);
            const meta = isRecommendationStatus(verdict)
              ? RECOMMENDATION_META[verdict]
              : null;
            return (
              <Badge
                key={verdict}
                render={<button type="button" />}
                variant={meta ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-opacity",
                  meta?.badgeClassName,
                  active
                    ? "opacity-100 ring-2 ring-foreground/30"
                    : "opacity-50 hover:opacity-80",
                )}
                onClick={() => toggleVerdict(verdict)}
              >
                {verdict}
                <span className="opacity-70">{verdictCounts.get(verdict)}</span>
              </Badge>
            );
          })}
          {activeVerdicts.size > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-5 px-2 text-xs text-muted-foreground"
              onClick={() => setActiveVerdicts(new Set())}
            >
              Clear
            </Button>
          )}
        </div>

        <div className="flex gap-1">
          <Button
            size="sm"
            variant={view === "list" ? "secondary" : "ghost"}
            className={cn(view === "list" && "pointer-events-none")}
            onClick={() => setView("list")}
          >
            <List className="size-3.5" /> List
          </Button>
          <Button
            size="sm"
            variant={view === "board" ? "secondary" : "ghost"}
            className={cn(view === "board" && "pointer-events-none")}
            onClick={() => setView("board")}
          >
            <LayoutGrid className="size-3.5" /> Board
          </Button>
        </div>
      </div>

      {view === "list" ? (
        <Card>
          <CardContent className="p-0">
            <ApplicationsTable applications={filteredApplications} />
          </CardContent>
        </Card>
      ) : (
        <ApplicationsBoard applications={filteredApplications} />
      )}
    </div>
  );
}

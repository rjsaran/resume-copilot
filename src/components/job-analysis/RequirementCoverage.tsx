"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, CircleDot, ListChecks, XCircle } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { SEVERITY_META } from "@/components/job-analysis/severity";
import type { CoverageItem, GapSeverity } from "@/types/analysis";

const STATUS_ORDER: Record<"missing" | "partial", number> = { missing: 0, partial: 1 };
const SEVERITY_ORDER: Record<GapSeverity, number> = { high: 0, medium: 1, low: 2 };

function sortIssues(items: CoverageItem[]): CoverageItem[] {
  return [...items].sort((a, b) => {
    const statusDiff =
      STATUS_ORDER[a.status as "missing" | "partial"] - STATUS_ORDER[b.status as "missing" | "partial"];
    if (statusDiff !== 0) return statusDiff;
    const aSeverity = a.severity ? SEVERITY_ORDER[a.severity] : 3;
    const bSeverity = b.severity ? SEVERITY_ORDER[b.severity] : 3;
    return aSeverity - bSeverity;
  });
}

function IssueCard({ item }: { item: CoverageItem }) {
  const [open, setOpen] = useState(false);
  const Icon = item.status === "missing" ? XCircle : CircleDot;
  const hasDetail = Boolean(item.whyItMatters || item.reason || item.aiFixNote);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger className="w-full text-left" disabled={!hasDetail}>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    item.status === "missing"
                      ? "text-red-600 dark:text-red-500"
                      : "text-amber-600 dark:text-amber-400"
                  )}
                />
                <CardTitle className="text-base">{item.requirement}</CardTitle>
                {item.severity && (
                  <Badge className={SEVERITY_META[item.severity].badgeClassName}>
                    {SEVERITY_META[item.severity].label}
                  </Badge>
                )}
              </div>
              {hasDetail && (
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    open && "rotate-180"
                  )}
                />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        {hasDetail && (
          <CollapsibleContent>
            <CardContent className="flex flex-col gap-3 text-sm">
              {item.whyItMatters && (
                <div>
                  <p className="font-medium text-muted-foreground">Why it matters</p>
                  <p>{item.whyItMatters}</p>
                </div>
              )}
              {item.reason && (
                <div>
                  <p className="font-medium text-muted-foreground">Why we flagged this</p>
                  <p>{item.reason}</p>
                </div>
              )}
              {item.aiFixNote && (
                <div className="flex items-start gap-2">
                  {item.aiCanFix ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">
                      {item.aiCanFix ? "AI can help with this" : "AI can't fix this"}
                    </p>
                    <p className="text-muted-foreground">{item.aiFixNote}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        )}
      </Card>
    </Collapsible>
  );
}

/**
 * The single, canonical requirement-by-requirement view. Covered items are a
 * flat confirmed list (nothing more to say about them); missing/partial
 * items get the same detail cards that used to live in a separate "Gap
 * details" section further down the page. Every requirement from the JD
 * appears exactly once, not once here and again in two other sections.
 */
export function RequirementCoverage({ coverage }: { coverage: CoverageItem[] }) {
  if (coverage.length === 0) return null;

  const covered = coverage.filter((item) => item.status === "covered");
  const issues = sortIssues(coverage.filter((item) => item.status !== "covered"));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListChecks className="size-4 text-muted-foreground" />
          <CardTitle>Requirement Coverage</CardTitle>
        </div>
        <CardDescription>
          Every requirement from the job description, checked against your career history.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {issues.length > 0 && (
          <div className="flex flex-col gap-3">
            {issues.map((item, i) => (
              <IssueCard key={i} item={item} />
            ))}
          </div>
        )}

        {covered.length > 0 && (
          <div className="flex flex-col gap-2">
            {issues.length > 0 && <p className="text-sm font-medium text-muted-foreground">Covered</p>}
            <div className="flex flex-wrap gap-2">
              {covered.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                >
                  <CheckCircle2 className="size-3.5 shrink-0" />
                  {item.requirement}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

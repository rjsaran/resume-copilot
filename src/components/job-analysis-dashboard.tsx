"use client";

import { useState } from "react";
import { ChevronDown, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DECISION_META } from "@/lib/badge-meta";
import type { JobAnalysis } from "@/types/analysis";

function scoreColor(value: number) {
  if (value >= 75) return "bg-emerald-500";
  if (value >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground tabular-nums">
          {clamped}/100
        </span>
      </div>
      <Progress
        value={clamped}
        indicatorClassName={cn("transition-all", scoreColor(clamped))}
      />
    </div>
  );
}

function VerdictCard({ analysis }: { analysis: JobAnalysis }) {
  const meta = DECISION_META[analysis.decision];
  const Icon = meta.icon;

  return (
    <Card className={cn("border-2", meta.cardClassName)}>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardDescription>Verdict</CardDescription>
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl">{analysis.decision}</CardTitle>
              <Badge className={meta.badgeClassName}>{analysis.decision}</Badge>
            </div>
          </div>
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-full",
              meta.iconWrapClassName
            )}
          >
            <Icon className={cn("size-6", meta.iconClassName)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-3">
        <ScoreBar label="Match Score" value={analysis.matchScore} />
        <ScoreBar label="ATS Score" value={analysis.atsScore} />
        <ScoreBar
          label="Interview Probability"
          value={analysis.interviewProbability}
        />
      </CardContent>
    </Card>
  );
}

function SeverityList({
  items,
  emptyText,
  badgeLabel,
  badgeClassName,
}: {
  items: string[];
  emptyText: string;
  badgeLabel: string;
  badgeClassName: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <Badge className={cn("mt-0.5 shrink-0", badgeClassName)}>
            {badgeLabel}
          </Badge>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SuggestionSection({
  title,
  description,
  items,
  emptyText,
}: {
  title: string;
  description: string;
  items: string[];
  emptyText: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger className="w-full text-left" disabled={items.length === 0}>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{items.length}</Badge>
                {items.length > 0 && (
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      open && "rotate-180"
                    )}
                  />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {items.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-muted-foreground">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function JobAnalysisDashboard({ analysis }: { analysis: JobAnalysis }) {
  return (
    <div className="flex flex-col gap-5">
      <VerdictCard analysis={analysis} />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-red-500" />
            <CardTitle>Hard Blockers</CardTitle>
          </div>
          <CardDescription>
            Dealbreaker requirements the candidate does not meet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SeverityList
            items={analysis.hardBlockers}
            emptyText="No hard blockers found."
            badgeLabel="Blocker"
            badgeClassName="bg-red-500/10 text-red-600 dark:text-red-500"
          />
        </CardContent>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Missing Technologies</CardTitle>
            <CardDescription>
              Required by the posting, absent from the resume.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SeverityList
              items={analysis.missingTechnologies}
              emptyText="No missing technologies found."
              badgeLabel="Missing"
              badgeClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Missing Domain Knowledge</CardTitle>
            <CardDescription>
              Domain expertise the posting expects but the resume lacks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SeverityList
              items={analysis.missingDomainKnowledge}
              emptyText="No domain gaps found."
              badgeLabel="Gap"
              badgeClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
          </CardContent>
        </Card>
      </div>

      <SuggestionSection
        title="Resume Wording Improvements"
        description="Click to expand suggested phrasing edits."
        items={analysis.resumeWordingImprovements}
        emptyText="No wording improvements suggested."
      />

      <SuggestionSection
        title="Resume Sections to Rewrite"
        description="Click to expand sections that need a rewrite."
        items={analysis.resumeSectionsToRewrite}
        emptyText="No sections need rewriting."
      />
    </div>
  );
}

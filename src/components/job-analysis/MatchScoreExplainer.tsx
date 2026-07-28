import { Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { JobAnalysis, ScoreBreakdown, FitSummary } from "@/types/analysis";

function scoreColor(value: number) {
  if (value >= 75) return "bg-emerald-500";
  if (value >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function scoreTextColor(value: number) {
  if (value >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (value >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-500";
}

const SCORE_DIMENSIONS: { key: keyof ScoreBreakdown; label: string }[] = [
  { key: "domain", label: "Domain" },
  { key: "responsibilities", label: "Responsibilities" },
  { key: "seniority", label: "Seniority" },
  { key: "technology", label: "Technology" },
  { key: "leadership", label: "Leadership" },
  { key: "culture", label: "Culture" },
];

function ScoreMeterTile({
  label,
  value,
  fitLevel,
}: {
  label: string;
  value: number;
  fitLevel: FitSummary[keyof Omit<FitSummary, "overall">];
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("text-xs font-medium", scoreTextColor(clamped))}>{fitLevel}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="w-7 shrink-0 text-lg font-semibold tabular-nums">{clamped}</span>
        <Progress value={clamped} className="flex-1" indicatorClassName={scoreColor(clamped)} />
      </div>
    </div>
  );
}

/**
 * Purely the quantitative view of fit - what strengths/gaps drive the score
 * lives in Requirement Coverage below, so this card doesn't re-list them; it
 * only owns the number and its six-dimension breakdown. Each dimension gets
 * its own tile (label / value+level / meter, stacked) instead of a single
 * cramped row of label+bar+value - that layout broke onto multiple lines
 * and read as noise rather than a scannable breakdown.
 */
export function MatchScoreExplainer({ analysis }: { analysis: JobAnalysis }) {
  const clamped = Math.max(0, Math.min(100, analysis.matchScore));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gauge className="size-4 text-muted-foreground" />
          <CardTitle>Match Score</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tabular-nums">{clamped}</span>
          <span className="text-sm text-muted-foreground">/ 100 — {analysis.fitSummary.overall}</span>
        </div>
        <Progress
          value={clamped}
          indicatorClassName={cn("transition-all", scoreColor(clamped))}
        />

        <div className="grid gap-2 pt-1 sm:grid-cols-2">
          {SCORE_DIMENSIONS.map(({ key, label }) => (
            <ScoreMeterTile
              key={key}
              label={label}
              value={analysis.scoreBreakdown[key]}
              fitLevel={analysis.fitSummary[key]}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

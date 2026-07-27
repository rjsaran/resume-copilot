import { Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { sortBySeverity } from "@/components/job-analysis/severity";
import type { JobAnalysis, ScoreBreakdown } from "@/types/analysis";

function scoreColor(value: number) {
  if (value >= 75) return "bg-emerald-500";
  if (value >= 50) return "bg-amber-500";
  return "bg-red-500";
}

const TOP_STRENGTHS = 4;
const TOP_GAPS = 3;

const SCORE_DIMENSIONS: { key: keyof ScoreBreakdown; label: string }[] = [
  { key: "domain", label: "Domain" },
  { key: "responsibilities", label: "Responsibilities" },
  { key: "seniority", label: "Seniority" },
  { key: "technology", label: "Technology" },
  { key: "leadership", label: "Leadership" },
  { key: "culture", label: "Culture" },
];

function ScoreBreakdownRow({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
      <Progress value={clamped} indicatorClassName={scoreColor(clamped)} />
      <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {clamped}
      </span>
    </div>
  );
}

/**
 * Explains the number instead of just showing it - the same strengths/gaps
 * data used by the sections below, just the top few of each, so this isn't
 * a separate AI-generated field to keep in sync or pay tokens for.
 */
export function MatchScoreExplainer({ analysis }: { analysis: JobAnalysis }) {
  const clamped = Math.max(0, Math.min(100, analysis.matchScore));
  const topStrengths = analysis.strengths.slice(0, TOP_STRENGTHS);
  const topGaps = sortBySeverity(analysis.gaps).slice(0, TOP_GAPS);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tabular-nums">{clamped}</span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
        <Progress
          value={clamped}
          indicatorClassName={cn("transition-all", scoreColor(clamped))}
        />

        <div className="flex flex-col gap-1.5 pt-1">
          {SCORE_DIMENSIONS.map(({ key, label }) => (
            <ScoreBreakdownRow key={key} label={label} value={analysis.scoreBreakdown[key]} />
          ))}
        </div>

        {(topStrengths.length > 0 || topGaps.length > 0) && (
          <div className="flex flex-col gap-2 pt-1">
            <p className="text-sm font-medium text-muted-foreground">Because</p>
            <ul className="flex flex-col gap-1.5 text-sm">
              {topStrengths.map((item, i) => (
                <li key={`s-${i}`} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {item.title}
                    {item.evidence[0] && (
                      <span className="text-muted-foreground"> — {item.evidence[0]}</span>
                    )}
                  </span>
                </li>
              ))}
              {topGaps.map((gap, i) => (
                <li key={`g-${i}`} className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Missing {gap.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

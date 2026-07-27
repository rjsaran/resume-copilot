import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  sortBySeverity,
  SEVERITY_META,
} from "@/components/job-analysis/severity";
import type { JobAnalysis } from "@/types/analysis";

/**
 * Quick, scannable overview - strengths first, then risks sorted by
 * severity. Deliberately just titles/tags here; the full reasoning per gap
 * lives in GapCardList below for whoever wants to dig in.
 */
export function StrengthsAndRisks({ analysis }: { analysis: JobAnalysis }) {
  const sortedGaps = sortBySeverity(analysis.gaps);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Your Strengths</CardTitle>
        </CardHeader>
        <CardContent>
          {analysis.strengths.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No standout strengths identified.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {analysis.strengths.map((strength, i) => (
                <Badge
                  key={i}
                  title={strength.evidence.join(" · ")}
                  className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                >
                  {strength.title}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Potential Risks</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedGaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No notable gaps found.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sortedGaps.map((gap, i) => (
                <Badge
                  key={i}
                  className={SEVERITY_META[gap.severity].badgeClassName}
                >
                  {gap.title}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

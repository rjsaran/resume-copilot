import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { QuickWin, QuickWinImpact } from "@/types/analysis";

const IMPACT_BADGE_CLASSNAME: Record<QuickWinImpact, string> = {
  High: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Low: "bg-muted text-muted-foreground",
};

/**
 * The highest-ROI resume edits for this job — wording/emphasis changes
 * using experience the candidate already has, ranked by impact so the
 * cheapest, highest-value edits surface first.
 */
export function QuickWins({ quickWins }: { quickWins: QuickWin[] }) {
  if (quickWins.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-muted-foreground" />
          <CardTitle>Quick Wins</CardTitle>
        </div>
        <CardDescription>The highest-ROI resume edits for this job.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {quickWins.map((win, i) => (
          <div key={i} className="flex items-start justify-between gap-3 text-sm">
            <span>{win.title}</span>
            <div className="flex shrink-0 items-center gap-1.5">
              <Badge className={IMPACT_BADGE_CLASSNAME[win.impact]}>{win.impact}</Badge>
              <span className="text-xs text-muted-foreground">{win.effort}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

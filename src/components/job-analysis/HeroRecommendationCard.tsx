import { AlertTriangle, MessageSquareQuote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RECOMMENDATION_META } from "@/lib/badge-meta";
import type { JobAnalysis } from "@/types/analysis";

const DECISION_BADGE_CLASSNAME: Record<
  JobAnalysis["applicationRecommendation"]["decision"],
  string
> = {
  Apply: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "Apply After Tailoring":
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "Consider Applying": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "Probably Skip": "bg-muted text-muted-foreground",
};

/**
 * The first thing on the page - answers "should I apply?" before anything
 * else. Shows exactly two pieces of prose, each a genuinely different kind
 * of content rather than the same verdict paraphrased twice: reason is the
 * analytical fit judgment (strength/risk/tailoring worth it), and the
 * recruiter's-read quote is the gut-reaction/presentation impression - see
 * the prompt for how those are kept distinct at generation time.
 */
export function HeroRecommendationCard({
  analysis,
}: {
  analysis: JobAnalysis;
}) {
  const meta = RECOMMENDATION_META[analysis.recommendationStatus];
  const Icon = meta.icon;

  return (
    <Card className={cn("border-2", meta.cardClassName)}>
      <CardContent className="flex flex-col gap-5 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full",
                meta.iconWrapClassName,
              )}
            >
              <Icon className={cn("size-6", meta.iconClassName)} />
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Recommendation
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                {analysis.recommendationStatus}
              </h2>
            </div>
          </div>
          <Badge
            className={
              DECISION_BADGE_CLASSNAME[
                analysis.applicationRecommendation.decision
              ]
            }
          >
            {analysis.applicationRecommendation.decision}
          </Badge>
        </div>

        <p className="text-base leading-relaxed text-foreground/90">
          {analysis.applicationRecommendation.reason}
        </p>

        {analysis.hardBlockers.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{analysis.hardBlockers.join(" ")}</span>
          </div>
        )}

        {analysis.recruiterFirstImpression && (
          <div className="flex items-start gap-2 border-t pt-4">
            <MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-medium text-muted-foreground">
                Recruiter&apos;s first read
              </p>
              <blockquote className="text-sm leading-relaxed text-foreground/80 italic">
                {analysis.recruiterFirstImpression}
              </blockquote>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

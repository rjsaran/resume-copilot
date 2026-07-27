import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RECOMMENDATION_META } from "@/lib/badge-meta";
import type { JobAnalysis } from "@/types/analysis";

const CONFIDENCE_LABEL: Record<JobAnalysis["interviewConfidence"], string> = {
  High: "High interview confidence",
  Medium: "Medium interview confidence",
  Low: "Low interview confidence",
};

/**
 * The first thing on the page — answers "should I apply?" before anything
 * else. ctaHref is computed by the caller: an anchor to the tailoring panel
 * on the application detail page, or a link to it from the standalone
 * analyze page — this card never triggers generation itself, so there's
 * only one place (TailoredResumePanel) that owns that state machine.
 */
export function HeroRecommendationCard({
  analysis,
  ctaHref,
}: {
  analysis: JobAnalysis;
  ctaHref: string;
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
                meta.iconWrapClassName
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
          <Badge className={meta.badgeClassName}>
            {CONFIDENCE_LABEL[analysis.interviewConfidence]}
          </Badge>
        </div>

        <p className="text-base leading-relaxed text-foreground/90">{analysis.summary}</p>

        {analysis.hardBlockers.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{analysis.hardBlockers.join(" ")}</span>
          </div>
        )}

        <Button size="lg" className="w-fit" nativeButton={false} render={<Link href={ctaHref} />}>
          Generate Tailored Resume
          <ArrowRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

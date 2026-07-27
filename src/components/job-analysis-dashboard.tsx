import { HeroRecommendationCard } from "@/components/job-analysis/HeroRecommendationCard";
import { MatchScoreExplainer } from "@/components/job-analysis/MatchScoreExplainer";
import { StrengthsAndRisks } from "@/components/job-analysis/StrengthsAndRisks";
import { GapCardList } from "@/components/job-analysis/GapCardList";
import { RecruiterReviewCard } from "@/components/job-analysis/RecruiterReviewCard";
import { NextStepsChecklist } from "@/components/job-analysis/NextStepsChecklist";
import { SecondaryDetails } from "@/components/job-analysis/SecondaryDetails";
import type { JobAnalysis } from "@/types/analysis";
import type { ApplicationStatus } from "@/lib/db/schema";

interface JobAnalysisDashboardProps {
  analysis: JobAnalysis;
  /** Where the hero CTA and "Generate a tailored resume" step should send the user — an anchor on this page, or a link to the application detail page if this is the standalone analyze page. */
  tailoredResumeHref: string;
  hasTailoredVersion: boolean;
  applicationStatus: ApplicationStatus;
}

/**
 * Answers, in order: should I apply? why? what are my strengths? what are
 * my biggest risks? what should I do next? — a decision flow, not a flat
 * grid of independent metric cards.
 */
export function JobAnalysisDashboard({
  analysis,
  tailoredResumeHref,
  hasTailoredVersion,
  applicationStatus,
}: JobAnalysisDashboardProps) {
  return (
    <div className="flex flex-col gap-5">
      <HeroRecommendationCard analysis={analysis} ctaHref={tailoredResumeHref} />
      <MatchScoreExplainer analysis={analysis} />
      <StrengthsAndRisks analysis={analysis} />
      <GapCardList gaps={analysis.gaps} />
      <RecruiterReviewCard recruiterFirstImpression={analysis.recruiterFirstImpression} />
      <NextStepsChecklist
        tailoredResumeHref={tailoredResumeHref}
        hasTailoredVersion={hasTailoredVersion}
        applicationStatus={applicationStatus}
      />
      <SecondaryDetails analysis={analysis} />
    </div>
  );
}

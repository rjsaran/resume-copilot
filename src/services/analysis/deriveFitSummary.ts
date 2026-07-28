import type { FitLevel, FitSummary, OverallFitLevel, ScoreBreakdown } from "@/types/analysis";

function toFitLevel(score: number): FitLevel {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}

function toOverallFitLevel(score: number): OverallFitLevel {
  if (score >= 90) return "Excellent Fit";
  if (score >= 75) return "Good Fit";
  if (score >= 50) return "Fair Fit";
  return "Poor Fit";
}

/**
 * Computes fitSummary from scoreBreakdown/matchScore instead of asking the
 * LLM to generate both — two independently-generated fields can disagree
 * (e.g. a matchScore of 0 paired with fitSummary.overall: "Excellent Fit"),
 * so the qualitative labels are always kept consistent with the numbers by
 * deriving them, never generated as a second, separate judgment.
 */
export function deriveFitSummary(scoreBreakdown: ScoreBreakdown, matchScore: number): FitSummary {
  return {
    domain: toFitLevel(scoreBreakdown.domain),
    responsibilities: toFitLevel(scoreBreakdown.responsibilities),
    seniority: toFitLevel(scoreBreakdown.seniority),
    technology: toFitLevel(scoreBreakdown.technology),
    leadership: toFitLevel(scoreBreakdown.leadership),
    culture: toFitLevel(scoreBreakdown.culture),
    overall: toOverallFitLevel(matchScore),
  };
}

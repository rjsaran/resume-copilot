import type { CoverageItem, ModelJobAnalysis, Strength } from "@/types/analysis";

function clamp(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function clampStrength(strength: Strength): Strength {
  return {
    title: clamp(strength.title, 40),
    evidence: strength.evidence.slice(0, 3).map((item) => clamp(item, 100)),
  };
}

function clampCoverageItem(item: CoverageItem): CoverageItem {
  return {
    ...item,
    requirement: clamp(item.requirement, 40),
    whyItMatters: item.whyItMatters !== undefined ? clamp(item.whyItMatters, 100) : undefined,
    reason: item.reason !== undefined ? clamp(item.reason, 140) : undefined,
    aiFixNote: item.aiFixNote !== undefined ? clamp(item.aiFixNote, 140) : undefined,
  };
}

/**
 * Defensive clamp against a real production failure mode: a model can get
 * stuck in a repetition loop and return a single string field thousands of
 * characters long (e.g. "requirement location surfaces maps" repeated
 * hundreds of times, sometimes trailing off into what looks like leaked
 * content from other fields) instead of the one-sentence field it was
 * asked for. JSON Schema's `maxLength` in JOB_ANALYSIS_SCHEMA is advisory
 * for most providers' structured output - it is not a constraint the API
 * actually enforces - so this is the only place the limit is guaranteed,
 * independent of provider, model, or how well the prompt/sampling
 * mitigations (see the providers) happen to work on any given call.
 */
export function clampJobAnalysisStrings(analysis: ModelJobAnalysis): ModelJobAnalysis {
  return {
    ...analysis,
    applicationRecommendation: {
      ...analysis.applicationRecommendation,
      reason: clamp(analysis.applicationRecommendation.reason, 500),
    },
    strengths: analysis.strengths.slice(0, 6).map(clampStrength),
    hardBlockers: analysis.hardBlockers.slice(0, 3).map((item) => clamp(item, 100)),
    coverage: analysis.coverage.map(clampCoverageItem),
    recruiterFirstImpression: clamp(analysis.recruiterFirstImpression, 800),
  };
}

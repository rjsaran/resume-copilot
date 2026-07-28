import { JOB_ANALYSIS_SCHEMA, isModelJobAnalysis, type JobAnalysis } from "@/types/analysis";
import {
  buildJobAnalysisPrompt,
  type JobAnalysisPromptInput,
} from "@/services/analysis/prompts/jobAnalysisPrompt";
import { deriveFitSummary } from "@/services/analysis/deriveFitSummary";
import { LLMProviderError, type LLMProvider } from "@/services/llm/types";
import { logger } from "@/lib/logger";

export type AnalyzeJobInput = JobAnalysisPromptInput;

export class JobAnalysisError extends Error {}

/**
 * Calls the user's configured LLM provider to compare a job description
 * against their career knowledge base and return a structured match
 * analysis. Never persists anything; that's the caller's job.
 */
export async function analyzeJob(
  input: AnalyzeJobInput,
  provider: LLMProvider
): Promise<JobAnalysis> {
  const prompt = buildJobAnalysisPrompt(input);

  let outputText: string;
  try {
    outputText = await provider.generateStructuredJson({
      systemInstruction: prompt.systemInstruction,
      input: prompt.input,
      schema: JOB_ANALYSIS_SCHEMA,
    });
  } catch (error) {
    throw new JobAnalysisError(
      error instanceof LLMProviderError ? error.message : "Failed to analyze the job posting."
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    logger.warn("Job analysis: model output was not valid JSON", { module: "jobAnalyzer" });
    throw new JobAnalysisError("The model did not return valid JSON.");
  }

  if (!isModelJobAnalysis(parsed)) {
    logger.warn("Job analysis: model JSON did not match expected shape", { module: "jobAnalyzer" });
    throw new JobAnalysisError("The model's JSON did not match the expected shape.");
  }

  return {
    ...parsed,
    fitSummary: deriveFitSummary(parsed.scoreBreakdown, parsed.matchScore),
  };
}

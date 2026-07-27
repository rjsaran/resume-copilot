import { RESUME_JSON_SCHEMA, isResumeData, type ResumeData } from "@/types/resume";
import {
  buildResumeTailorPrompt,
  type ResumeTailorPromptInput,
} from "@/services/resume/prompts/resumeTailorPrompt";
import { sanitizeResumeData } from "@/lib/resume/sanitize";
import { LLMProviderError, type LLMProvider } from "@/services/llm/types";
import { logger } from "@/lib/logger";

export type GenerateTailoredResumeInput = ResumeTailorPromptInput;

export class ResumeTailorError extends Error {}

/**
 * Calls the user's configured LLM provider to produce a tailored resume as
 * structured JSON, given the full career knowledge base JSON, job
 * description, and analysis for one application. The model selects and
 * rewords a subset of the knowledge base into a resume; it never sees or
 * produces Markdown/HTML — only JSON in, ResumeData JSON out. Never
 * persists anything; that's the caller's job.
 */
export async function generateTailoredResume(
  input: GenerateTailoredResumeInput,
  provider: LLMProvider
): Promise<ResumeData> {
  const prompt = buildResumeTailorPrompt(input);

  let outputText: string;
  try {
    outputText = await provider.generateStructuredJson({
      systemInstruction: prompt.systemInstruction,
      input: prompt.input,
      schema: RESUME_JSON_SCHEMA,
    });
  } catch (error) {
    throw new ResumeTailorError(
      error instanceof LLMProviderError ? error.message : "Failed to generate tailored resume."
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    logger.warn("Resume tailoring: model output was not valid JSON", { module: "resumeTailor" });
    throw new ResumeTailorError("The model did not return valid JSON.");
  }

  if (!isResumeData(parsed)) {
    logger.warn("Resume tailoring: model JSON did not match expected resume schema", {
      module: "resumeTailor",
    });
    throw new ResumeTailorError(
      "The model's JSON did not match the expected resume schema."
    );
  }

  return sanitizeResumeData(parsed);
}

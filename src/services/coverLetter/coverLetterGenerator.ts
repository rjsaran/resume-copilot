import {
  COVER_LETTER_JSON_SCHEMA,
  isCoverLetterData,
  type CoverLetterData,
} from "@/types/coverLetter";
import {
  buildCoverLetterPrompt,
  type CoverLetterPromptInput,
} from "@/services/coverLetter/prompts/coverLetterPrompt";
import { LLMProviderError, type LLMProvider } from "@/services/llm/types";
import { logger } from "@/lib/logger";

export type GenerateCoverLetterInput = CoverLetterPromptInput;

export class CoverLetterGeneratorError extends Error {}

/**
 * Calls the user's configured LLM provider to produce a tailored cover
 * letter as structured JSON, given the full career knowledge base JSON, job
 * description, and analysis for one application. The model never sees or
 * produces Markdown/HTML - only JSON in, CoverLetterData JSON out. Never
 * persists anything; that's the caller's job.
 */
export async function generateCoverLetter(
  input: GenerateCoverLetterInput,
  provider: LLMProvider,
): Promise<CoverLetterData> {
  const prompt = buildCoverLetterPrompt(input);

  let outputText: string;
  try {
    outputText = await provider.generateStructuredJson({
      systemInstruction: prompt.systemInstruction,
      input: prompt.input,
      schema: COVER_LETTER_JSON_SCHEMA,
    });
  } catch (error) {
    throw new CoverLetterGeneratorError(
      error instanceof LLMProviderError
        ? error.message
        : "Failed to generate cover letter.",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    logger.warn("Cover letter generation: model output was not valid JSON", {
      module: "coverLetterGenerator",
    });
    throw new CoverLetterGeneratorError("The model did not return valid JSON.");
  }

  if (!isCoverLetterData(parsed)) {
    logger.warn(
      "Cover letter generation: model JSON did not match expected schema",
      { module: "coverLetterGenerator" },
    );
    throw new CoverLetterGeneratorError(
      "The model's JSON did not match the expected cover letter schema.",
    );
  }

  return parsed;
}

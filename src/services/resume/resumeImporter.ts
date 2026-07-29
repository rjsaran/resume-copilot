import { RESUME_JSON_SCHEMA, isResumeData, type ResumeData } from "@/types/resume";
import {
  buildResumeImportPrompt,
  type ResumeImportPromptInput,
} from "@/services/resume/prompts/resumeImportPrompt";
import { LLMProviderError, type LLMProvider } from "@/services/llm/types";
import { logger } from "@/lib/logger";

export type ImportResumeInput = ResumeImportPromptInput;

export class ResumeImportError extends Error {}

/**
 * Calls the user's configured LLM provider to transcribe text extracted
 * from a resume PDF into a ResumeData JSON draft, for bootstrapping the
 * user's Base Resume. Never persists anything - the caller is expected to
 * let the user review/edit the result before saving it (see the Resumes
 * hub's import flow).
 */
export async function importResumeFromText(
  input: ImportResumeInput,
  provider: LLMProvider,
): Promise<ResumeData> {
  const prompt = buildResumeImportPrompt(input);

  let outputText: string;
  try {
    outputText = await provider.generateStructuredJson({
      systemInstruction: prompt.systemInstruction,
      input: prompt.input,
      schema: RESUME_JSON_SCHEMA,
    });
  } catch (error) {
    throw new ResumeImportError(
      error instanceof LLMProviderError
        ? error.message
        : "Failed to import the resume.",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    logger.warn("Resume import: model output was not valid JSON", {
      module: "resumeImporter",
    });
    throw new ResumeImportError("The model did not return valid JSON.");
  }

  if (!isResumeData(parsed)) {
    logger.warn("Resume import: model JSON did not match expected schema", {
      module: "resumeImporter",
    });
    throw new ResumeImportError(
      "The model's JSON did not match the expected resume schema.",
    );
  }

  return parsed;
}

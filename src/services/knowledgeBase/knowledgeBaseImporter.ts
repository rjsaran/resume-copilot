import {
  CAREER_KNOWLEDGE_BASE_JSON_SCHEMA,
  isCareerKnowledgeBase,
  type CareerKnowledgeBase,
} from "@/types/careerKnowledgeBase";
import {
  buildKnowledgeBaseImportPrompt,
  type KnowledgeBaseImportPromptInput,
} from "@/services/knowledgeBase/prompts/knowledgeBaseImportPrompt";
import { LLMProviderError, type LLMProvider } from "@/services/llm/types";

export type ImportKnowledgeBaseInput = KnowledgeBaseImportPromptInput;

export class KnowledgeBaseImportError extends Error {}

/**
 * Calls the user's configured LLM provider to transcribe pasted resume or
 * LinkedIn text into a CareerKnowledgeBase JSON draft. Never persists
 * anything — the caller is expected to let the user review/edit the result
 * before saving it (see knowledge-base-workspace.tsx).
 */
export async function importKnowledgeBaseFromText(
  input: ImportKnowledgeBaseInput,
  provider: LLMProvider
): Promise<CareerKnowledgeBase> {
  const prompt = buildKnowledgeBaseImportPrompt(input);

  let outputText: string;
  try {
    outputText = await provider.generateStructuredJson({
      systemInstruction: prompt.systemInstruction,
      input: prompt.input,
      schema: CAREER_KNOWLEDGE_BASE_JSON_SCHEMA,
    });
  } catch (error) {
    throw new KnowledgeBaseImportError(
      error instanceof LLMProviderError ? error.message : "Failed to import the knowledge base."
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new KnowledgeBaseImportError("The model did not return valid JSON.");
  }

  if (!isCareerKnowledgeBase(parsed)) {
    throw new KnowledgeBaseImportError(
      "The model's JSON did not match the expected knowledge base schema."
    );
  }

  return parsed;
}

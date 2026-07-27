import type { LlmProvider } from "@/lib/db/schema";

export interface StructuredJsonRequest {
  systemInstruction: string;
  input: string;
  /** JSON Schema the model's output must conform to. */
  schema: Record<string, unknown>;
}

export class LLMProviderError extends Error {}

/**
 * Common interface every LLM provider implements, so callers (resume
 * tailoring, job analysis) never need to know which provider is behind it.
 * Add a new provider by implementing this interface in
 * services/llm/providers/, then wire it into userProvider.ts,
 * userSettingsRepository.ts, and (if it's ready for real use) IMPLEMENTED_PROVIDERS below.
 */
export interface LLMProvider {
  /** e.g. "gemini-3.6-flash" - recorded alongside generated analyses/resumes. */
  readonly modelName: string;
  generateStructuredJson(request: StructuredJsonRequest): Promise<string>;
}

/**
 * Providers with a real API implementation behind them - the only ones
 * selectable as the active provider from Settings. CLAUDE/OPENAI are
 * registered in the schema/UI groundwork but still throw "not implemented".
 */
export const IMPLEMENTED_PROVIDERS: readonly LlmProvider[] = [
  "GEMINI",
  "OPENROUTER",
];

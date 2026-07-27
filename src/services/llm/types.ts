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
 * Add a new provider by implementing this interface and registering it in
 * services/llm/registry.ts — no changes needed anywhere else.
 */
export interface LLMProvider {
  /** e.g. "gemini-3.6-flash" — recorded alongside generated analyses/resumes. */
  readonly modelName: string;
  generateStructuredJson(request: StructuredJsonRequest): Promise<string>;
}

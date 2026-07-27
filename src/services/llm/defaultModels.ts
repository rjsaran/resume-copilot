import type { LlmProvider } from "@/lib/db/schema";

export const GEMINI_MODEL = "gemini-3.6-flash";
// Free-tier model (":free" suffix) so OpenRouter usage doesn't consume paid credits.
export const OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

/**
 * Model used when a user hasn't set their own override for a provider.
 * Only covers providers with a real implementation — see IMPLEMENTED_PROVIDERS.
 */
export const DEFAULT_MODEL_BY_PROVIDER: Partial<Record<LlmProvider, string>> = {
  GEMINI: GEMINI_MODEL,
  OPENROUTER: OPENROUTER_MODEL,
};

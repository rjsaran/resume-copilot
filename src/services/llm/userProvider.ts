import { getUserSettings } from "@/lib/repositories/userSettingsRepository";
import { decryptSecret } from "@/lib/crypto";
import { GeminiProvider } from "@/services/llm/providers/gemini";
import { ClaudeProvider } from "@/services/llm/providers/claude";
import { OpenAIProvider } from "@/services/llm/providers/openai";
import { OpenRouterProvider } from "@/services/llm/providers/openrouter";
import { LLMProviderError, type LLMProvider } from "@/services/llm/types";
import type { LlmProvider as LlmProviderName } from "@/lib/db/schema";

export const ENCRYPTED_KEY_BY_PROVIDER: Record<
  LlmProviderName,
  keyof {
    encryptedGeminiKey: string | null;
    encryptedClaudeKey: string | null;
    encryptedOpenAiKey: string | null;
    encryptedOpenRouterKey: string | null;
  }
> = {
  GEMINI: "encryptedGeminiKey",
  CLAUDE: "encryptedClaudeKey",
  OPENAI: "encryptedOpenAiKey",
  OPENROUTER: "encryptedOpenRouterKey",
};

/**
 * Resolves the signed-in user's active LLM provider using their own stored,
 * encrypted API key - every analysis/tailoring call runs against the
 * user's own quota, never a shared app-level key.
 */
export async function getUserLlmProvider(userId: string): Promise<LLMProvider> {
  const settings = await getUserSettings(userId);
  if (!settings) {
    throw new LLMProviderError(
      "Add your Gemini API key in Settings before analyzing or tailoring.",
    );
  }

  const encryptedKey =
    settings[ENCRYPTED_KEY_BY_PROVIDER[settings.activeProvider]];
  if (!encryptedKey) {
    throw new LLMProviderError(
      `Add your ${settings.activeProvider} API key in Settings before analyzing or tailoring.`,
    );
  }

  const apiKey = decryptSecret(encryptedKey);

  switch (settings.activeProvider) {
    case "GEMINI":
      return new GeminiProvider(apiKey, settings.geminiModel ?? undefined);
    case "CLAUDE":
      return new ClaudeProvider(apiKey);
    case "OPENAI":
      return new OpenAIProvider(apiKey);
    case "OPENROUTER":
      return new OpenRouterProvider(
        apiKey,
        settings.openRouterModel ?? undefined,
      );
  }
}

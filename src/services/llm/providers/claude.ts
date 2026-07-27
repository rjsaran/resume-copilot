import {
  LLMProviderError,
  type LLMProvider,
  type StructuredJsonRequest,
} from "@/services/llm/types";

/**
 * Not implemented yet - registered now so the provider registry and
 * settings UI can offer "Claude" as a choice, with the real Messages API
 * call slotted in here later without touching any caller.
 */
export class ClaudeProvider implements LLMProvider {
  readonly modelName = "claude";

  constructor(private readonly apiKey: string) {}

  async generateStructuredJson(
    _request: StructuredJsonRequest,
  ): Promise<string> {
    void this.apiKey;
    void _request;
    throw new LLMProviderError("Claude support is not implemented yet.");
  }
}

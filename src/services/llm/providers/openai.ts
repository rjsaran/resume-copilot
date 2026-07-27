import { LLMProviderError, type LLMProvider, type StructuredJsonRequest } from "@/services/llm/types";

/**
 * Not implemented yet — registered now so the provider registry and
 * settings UI can offer "OpenAI" as a choice, with the real API call
 * slotted in here later without touching any caller.
 */
export class OpenAIProvider implements LLMProvider {
  readonly modelName = "openai";

  constructor(private readonly apiKey: string) {}

  async generateStructuredJson(_request: StructuredJsonRequest): Promise<string> {
    void this.apiKey;
    void _request;
    throw new LLMProviderError("OpenAI support is not implemented yet.");
  }
}

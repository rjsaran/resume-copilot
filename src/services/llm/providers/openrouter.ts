import { LLMProviderError, type LLMProvider, type StructuredJsonRequest } from "@/services/llm/types";
import { logger, errorContext } from "@/lib/logger";

export const OPENROUTER_MODEL = "openai/gpt-4o-mini";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterChatCompletion {
  choices?: { message?: { content?: string | null } }[];
}

export class OpenRouterProvider implements LLMProvider {
  readonly modelName: string;

  constructor(
    private readonly apiKey: string,
    private readonly model: string = OPENROUTER_MODEL
  ) {
    this.modelName = model;
  }

  async generateStructuredJson({
    systemInstruction,
    input,
    schema,
  }: StructuredJsonRequest): Promise<string> {
    const log = logger.child({ provider: "openrouter", model: this.model });
    const startedAt = Date.now();

    log.debug("LLM call started", { inputLength: input.length });

    let response: Response;
    try {
      response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: input },
          ],
          response_format: {
            type: "json_schema",
            // Non-strict: our schemas (shared with other providers) mark
            // fields optional by omitting them from `required` rather than
            // using nullable types, which strict mode's `additionalProperties:
            // false` + "every property required" rule doesn't allow.
            json_schema: { name: "structured_response", strict: false, schema },
          },
        }),
      });
    } catch (error) {
      log.error("LLM call failed", { ...errorContext(error), durationMs: Date.now() - startedAt });
      throw new LLMProviderError(
        error instanceof Error ? error.message : "Failed to reach OpenRouter."
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      log.error("LLM call failed", { status: response.status, durationMs: Date.now() - startedAt });
      throw new LLMProviderError(
        `OpenRouter request failed (${response.status}): ${body.slice(0, 300) || response.statusText}`
      );
    }

    const data = (await response.json()) as OpenRouterChatCompletion;
    const outputText = data.choices?.[0]?.message?.content ?? undefined;

    if (!outputText) {
      log.error("LLM call returned no output", { durationMs: Date.now() - startedAt });
      throw new LLMProviderError("The model did not return a text response.");
    }

    log.info("LLM call succeeded", {
      durationMs: Date.now() - startedAt,
      outputLength: outputText.length,
    });

    return outputText;
  }
}

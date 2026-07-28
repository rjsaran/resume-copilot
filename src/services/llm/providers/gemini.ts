import { GoogleGenAI } from "@google/genai";
import {
  LLMProviderError,
  type LLMProvider,
  type StructuredJsonRequest,
} from "@/services/llm/types";
import { logger, errorContext } from "@/lib/logger";
import { GEMINI_MODEL } from "@/services/llm/defaultModels";

export class GeminiProvider implements LLMProvider {
  readonly modelName: string;

  constructor(
    private readonly apiKey: string,
    private readonly model: string = GEMINI_MODEL,
  ) {
    this.modelName = model;
  }

  async generateStructuredJson({
    systemInstruction,
    input,
    schema,
  }: StructuredJsonRequest): Promise<string> {
    const client = new GoogleGenAI({ apiKey: this.apiKey });
    const log = logger.child({ provider: "gemini", model: this.model });
    const startedAt = Date.now();

    log.debug("LLM call started", { inputLength: input.length });

    let outputText: string | undefined;
    try {
      const interaction = await client.interactions.create({
        model: this.model,
        system_instruction: systemInstruction,
        input,
        // Extraction/transcription tasks want deterministic, on-task output
        // - the default temperature (~1.0) is what lets the model drift into
        // repetitive filler text instead of finishing the extraction
        // faithfully. But near-zero temperature has the opposite failure
        // mode too: it makes the decoder greedy, and greedy decoding is
        // exactly what locks a model into a repetition loop once it starts
        // one (repeating the same token is often the single most likely
        // next token) - seen in production as a single field ballooning
        // into the same 3-4 words repeated hundreds of times. 0.3 is a
        // compromise, not a proven fix (untested against a real recurrence);
        // clampJobAnalysisStrings in jobAnalyzer.ts is the actual
        // guarantee - it hard-truncates every free-text field server-side
        // regardless of what any model/temperature produces, since JSON
        // Schema's maxLength is advisory for most providers' structured
        // output, not an enforced constraint. max_output_tokens is set
        // explicitly since the model's own default can be too low for this
        // schema's size, silently truncating the JSON mid-object.
        generation_config: { temperature: 0.3, max_output_tokens: 8192 },
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema,
        },
      });
      outputText = interaction.output_text;
    } catch (error) {
      log.error("LLM call failed", {
        ...errorContext(error),
        durationMs: Date.now() - startedAt,
      });
      throw new LLMProviderError(
        error instanceof Error ? error.message : "Failed to reach Gemini.",
      );
    }

    if (!outputText) {
      log.error("LLM call returned no output", {
        durationMs: Date.now() - startedAt,
      });
      throw new LLMProviderError("The model did not return a text response.");
    }

    log.info("LLM call succeeded", {
      durationMs: Date.now() - startedAt,
      outputLength: outputText.length,
    });

    return outputText;
  }
}

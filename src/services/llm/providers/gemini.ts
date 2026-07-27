import { GoogleGenAI } from "@google/genai";
import { LLMProviderError, type LLMProvider, type StructuredJsonRequest } from "@/services/llm/types";

export const GEMINI_MODEL = "gemini-3.6-flash";

export class GeminiProvider implements LLMProvider {
  readonly modelName: string;

  constructor(
    private readonly apiKey: string,
    private readonly model: string = GEMINI_MODEL
  ) {
    this.modelName = model;
  }

  async generateStructuredJson({
    systemInstruction,
    input,
    schema,
  }: StructuredJsonRequest): Promise<string> {
    const client = new GoogleGenAI({ apiKey: this.apiKey });

    let outputText: string | undefined;
    try {
      const interaction = await client.interactions.create({
        model: this.model,
        system_instruction: systemInstruction,
        input,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema,
        },
      });
      outputText = interaction.output_text;
    } catch (error) {
      throw new LLMProviderError(
        error instanceof Error ? error.message : "Failed to reach Gemini."
      );
    }

    if (!outputText) {
      throw new LLMProviderError("The model did not return a text response.");
    }

    return outputText;
  }
}

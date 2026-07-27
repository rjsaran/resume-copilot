"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { upsertKnowledgeBase } from "@/lib/repositories/knowledgeBaseRepository";
import { isCareerKnowledgeBase, type CareerKnowledgeBase } from "@/types/careerKnowledgeBase";
import {
  importKnowledgeBaseFromText,
  KnowledgeBaseImportError,
} from "@/services/knowledgeBase/knowledgeBaseImporter";
import { extractResumeTextFromPdf, PdfTextExtractionError } from "@/lib/pdf/extractResumeText";
import { getUserLlmProvider } from "@/services/llm/userProvider";
import { LLMProviderError } from "@/services/llm/types";
import { logger, errorContext } from "@/lib/logger";

export interface SaveKnowledgeBaseResult {
  success: boolean;
  error?: string;
}

export async function saveKnowledgeBaseAction(
  data: CareerKnowledgeBase
): Promise<SaveKnowledgeBaseResult> {
  const user = await requireUser();
  const log = logger.child({ action: "saveKnowledgeBaseAction", userId: user.id });

  if (!isCareerKnowledgeBase(data)) {
    log.warn("Knowledge base save blocked: payload did not match expected schema");
    return { success: false, error: "Knowledge base did not match the expected schema." };
  }

  await upsertKnowledgeBase(user.id, data);
  log.info("Knowledge base saved");
  revalidatePath("/knowledge-base");

  return { success: true };
}

export interface ImportKnowledgeBaseResult {
  success: boolean;
  error?: string;
  knowledgeBase?: CareerKnowledgeBase;
}

const MAX_IMPORT_TEXT_LENGTH = 20_000;

/**
 * Extracts text from an uploaded resume PDF and parses it into a
 * CareerKnowledgeBase draft via the user's LLM provider. Does NOT save it —
 * the caller (the knowledge base editor) loads the draft for review/editing,
 * and only saveKnowledgeBaseAction persists it, so a bad or unwanted import
 * never touches the user's stored data.
 */
export async function importKnowledgeBaseAction(file: File): Promise<ImportKnowledgeBaseResult> {
  const user = await requireUser();
  const log = logger.child({ action: "importKnowledgeBaseAction", userId: user.id });
  const startedAt = Date.now();

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    log.warn("Import blocked: uploaded file is not a PDF", { fileType: file.type });
    return { success: false, error: "Please upload a PDF file." };
  }

  let sourceText: string;
  try {
    sourceText = await extractResumeTextFromPdf(await file.arrayBuffer());
  } catch (error) {
    log.error("PDF text extraction failed", errorContext(error));
    return {
      success: false,
      error: error instanceof PdfTextExtractionError ? error.message : "Failed to read that PDF.",
    };
  }

  if (sourceText.length > MAX_IMPORT_TEXT_LENGTH) {
    log.warn("Import blocked: extracted text too long", { textLength: sourceText.length });
    return {
      success: false,
      error: `That PDF has too much extractable text (${sourceText.length.toLocaleString()} characters, max ${MAX_IMPORT_TEXT_LENGTH.toLocaleString()}) — trim it to the relevant pages and try again.`,
    };
  }

  let provider;
  try {
    provider = await getUserLlmProvider(user.id);
  } catch (error) {
    log.warn("Import blocked: no LLM provider configured", errorContext(error));
    return {
      success: false,
      error: error instanceof LLMProviderError ? error.message : "No LLM provider configured.",
    };
  }

  try {
    const knowledgeBase = await importKnowledgeBaseFromText({ sourceText }, provider);
    log.info("Knowledge base imported from PDF", {
      textLength: sourceText.length,
      durationMs: Date.now() - startedAt,
    });
    return { success: true, knowledgeBase };
  } catch (error) {
    log.error("Knowledge base import failed", { ...errorContext(error), durationMs: Date.now() - startedAt });
    return {
      success: false,
      error:
        error instanceof KnowledgeBaseImportError
          ? error.message
          : "Failed to import the knowledge base.",
    };
  }
}

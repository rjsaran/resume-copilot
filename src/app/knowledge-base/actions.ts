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

export interface SaveKnowledgeBaseResult {
  success: boolean;
  error?: string;
}

export async function saveKnowledgeBaseAction(
  data: CareerKnowledgeBase
): Promise<SaveKnowledgeBaseResult> {
  const user = await requireUser();

  if (!isCareerKnowledgeBase(data)) {
    return { success: false, error: "Knowledge base did not match the expected schema." };
  }

  await upsertKnowledgeBase(user.id, data);
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

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { success: false, error: "Please upload a PDF file." };
  }

  let sourceText: string;
  try {
    sourceText = await extractResumeTextFromPdf(await file.arrayBuffer());
  } catch (error) {
    return {
      success: false,
      error: error instanceof PdfTextExtractionError ? error.message : "Failed to read that PDF.",
    };
  }

  if (sourceText.length > MAX_IMPORT_TEXT_LENGTH) {
    return {
      success: false,
      error: `That PDF has too much extractable text (${sourceText.length.toLocaleString()} characters, max ${MAX_IMPORT_TEXT_LENGTH.toLocaleString()}) — trim it to the relevant pages and try again.`,
    };
  }

  let provider;
  try {
    provider = await getUserLlmProvider(user.id);
  } catch (error) {
    return {
      success: false,
      error: error instanceof LLMProviderError ? error.message : "No LLM provider configured.",
    };
  }

  try {
    const knowledgeBase = await importKnowledgeBaseFromText({ sourceText }, provider);
    return { success: true, knowledgeBase };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof KnowledgeBaseImportError
          ? error.message
          : "Failed to import the knowledge base.",
    };
  }
}

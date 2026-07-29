"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  getBaseResume,
  getResumeVersion,
  upsertBaseResume,
  createPublicResume,
  updateResumeVersion,
  renameResumeVersion,
  deleteResumeVersion,
} from "@/lib/repositories/resumeRepository";
import {
  extractResumeTextFromPdf,
  PdfTextExtractionError,
} from "@/lib/pdf/extractResumeText";
import {
  importResumeFromText,
  ResumeImportError,
} from "@/services/resume/resumeImporter";
import { getUserLlmProvider } from "@/services/llm/userProvider";
import { LLMProviderError } from "@/services/llm/types";
import { isResumeData, type ResumeData } from "@/types/resume";
import type { ResumeVersion } from "@/lib/db/schema";
import { logger, errorContext } from "@/lib/logger";

export interface SaveResumeResult {
  success: boolean;
  error?: string;
  resumeVersion?: ResumeVersion;
}

/** Creates the user's base resume if none exists yet, or overwrites it - at most one BASE row can exist per user. */
export async function saveBaseResumeAction(resume: ResumeData): Promise<SaveResumeResult> {
  const user = await requireUser();
  const log = logger.child({ action: "saveBaseResumeAction", userId: user.id });

  if (!isResumeData(resume)) {
    log.warn("Base resume save blocked: payload did not match expected shape");
    return { success: false, error: "Resume data did not match the expected shape." };
  }

  const resumeVersion = await upsertBaseResume(user.id, resume);
  log.info("Base resume saved");
  revalidatePath("/resumes");
  revalidatePath(`/resumes/${resumeVersion.id}`);

  return { success: true, resumeVersion };
}

/** Creates a new public resume - a user can have any number of these, so this never overwrites an existing one. */
export async function createPublicResumeAction(resume: ResumeData): Promise<SaveResumeResult> {
  const user = await requireUser();
  const log = logger.child({ action: "createPublicResumeAction", userId: user.id });

  if (!isResumeData(resume)) {
    log.warn("Public resume creation blocked: payload did not match expected shape");
    return { success: false, error: "Resume data did not match the expected shape." };
  }

  const resumeVersion = await createPublicResume(user.id, resume);
  log.info("Public resume created");
  revalidatePath("/resumes");

  return { success: true, resumeVersion };
}

/** Creates a new public resume seeded from the current base resume - a starting point the user then trims down by hand. */
export async function duplicateBaseToPublicAction(): Promise<SaveResumeResult> {
  const user = await requireUser();
  const log = logger.child({ action: "duplicateBaseToPublicAction", userId: user.id });

  const base = await getBaseResume(user.id);
  if (!base) {
    log.warn("Duplicate-to-public blocked: no base resume");
    return { success: false, error: "Create your base resume first." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(base.resumeJson);
  } catch {
    return { success: false, error: "Your stored base resume JSON is invalid." };
  }
  if (!isResumeData(parsed)) {
    return { success: false, error: "Your stored base resume did not match the expected shape." };
  }

  const resumeVersion = await createPublicResume(user.id, parsed);
  log.info("Public resume seeded from base resume");
  revalidatePath("/resumes");

  return { success: true, resumeVersion };
}

export interface ImportResumeDraftResult {
  success: boolean;
  error?: string;
  resume?: ResumeData;
}

/**
 * Extracts text from an uploaded resume PDF and parses it into a ResumeData
 * draft via the user's LLM provider. Does NOT save it - the caller (the
 * Resumes hub) loads the draft for review/editing, and only
 * saveBaseResumeAction persists it, so a bad or unwanted import never
 * touches the user's stored base resume.
 */
export async function importResumeDraftAction(file: File): Promise<ImportResumeDraftResult> {
  const user = await requireUser();
  const log = logger.child({ action: "importResumeDraftAction", userId: user.id });
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

  const MAX_IMPORT_TEXT_LENGTH = 20_000;
  if (sourceText.length > MAX_IMPORT_TEXT_LENGTH) {
    log.warn("Import blocked: extracted text too long", { textLength: sourceText.length });
    return {
      success: false,
      error: `That PDF has too much extractable text (${sourceText.length.toLocaleString()} characters, max ${MAX_IMPORT_TEXT_LENGTH.toLocaleString()}) - trim it to the relevant pages and try again.`,
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
    const resume = await importResumeFromText({ sourceText }, provider);
    log.info("Resume imported from PDF", {
      textLength: sourceText.length,
      durationMs: Date.now() - startedAt,
    });
    return { success: true, resume };
  } catch (error) {
    log.error("Resume import failed", {
      ...errorContext(error),
      durationMs: Date.now() - startedAt,
    });
    return {
      success: false,
      error: error instanceof ResumeImportError ? error.message : "Failed to import the resume.",
    };
  }
}

export interface UpdateAnyResumeResult {
  success: boolean;
  error?: string;
  resumeVersion?: ResumeVersion;
}

/**
 * Edits any existing resume in place by id - base, public, or tailored
 * alike. This is what the /resumes/[id] detail page's editor saves through;
 * creating a new base or public resume goes through
 * saveBaseResumeAction/createPublicResumeAction instead, since those don't
 * have an id yet the first time.
 */
export async function updateResumeAction(
  id: string,
  resume: ResumeData,
): Promise<UpdateAnyResumeResult> {
  const user = await requireUser();
  const log = logger.child({ action: "updateResumeAction", userId: user.id, resumeId: id });

  const existing = await getResumeVersion(id);
  if (!existing || existing.userId !== user.id) {
    log.warn("Resume edit blocked: not found or not owned by user");
    return { success: false, error: "Resume not found." };
  }

  if (!isResumeData(resume)) {
    log.warn("Resume edit blocked: payload did not match expected shape");
    return { success: false, error: "Resume data did not match the expected shape." };
  }

  const resumeVersion = await updateResumeVersion({ id, resume });
  log.info("Resume edited");
  revalidatePath("/resumes");
  revalidatePath(`/resumes/${id}`);
  if (existing.applicationId) {
    revalidatePath(`/applications/${existing.applicationId}`);
  }

  return { success: true, resumeVersion };
}

/** Renames any resume by id - base, public, or tailored alike, ownership-checked. Content is untouched. */
export async function renameResumeAction(
  id: string,
  name: string,
): Promise<UpdateAnyResumeResult> {
  const user = await requireUser();
  const log = logger.child({ action: "renameResumeAction", userId: user.id, resumeId: id });

  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, error: "Name can't be empty." };
  }

  const existing = await getResumeVersion(id);
  if (!existing || existing.userId !== user.id) {
    log.warn("Resume rename blocked: not found or not owned by user");
    return { success: false, error: "Resume not found." };
  }

  const resumeVersion = await renameResumeVersion(id, trimmed);
  log.info("Resume renamed");
  revalidatePath("/resumes");
  revalidatePath(`/resumes/${id}`);
  if (existing.applicationId) {
    revalidatePath(`/applications/${existing.applicationId}`);
  }

  return { success: true, resumeVersion };
}

export interface DeleteResumeResult {
  success: boolean;
  error?: string;
}

/** Deletes any resume by id - base, public, or tailored alike, ownership-checked. */
export async function deleteResumeAction(id: string): Promise<DeleteResumeResult> {
  const user = await requireUser();
  const log = logger.child({ action: "deleteResumeAction", userId: user.id, resumeId: id });

  const existing = await getResumeVersion(id);
  if (!existing || existing.userId !== user.id) {
    log.warn("Resume delete blocked: not found or not owned by user");
    return { success: false, error: "Resume not found." };
  }

  await deleteResumeVersion(id);
  log.info("Resume deleted", { type: existing.type });
  revalidatePath("/resumes");
  if (existing.applicationId) {
    revalidatePath(`/applications/${existing.applicationId}`);
  }

  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  getApplication,
  saveOutcome,
  updateStatus,
  deleteApplication,
} from "@/lib/repositories/applicationRepository";
import { STATUS_LABELS } from "@/lib/badge-meta";
import {
  countResumeVersionsForApplication,
  createResumeVersion,
} from "@/lib/repositories/resumeRepository";
import {
  generateTailoredResume,
  ResumeTailorError,
} from "@/services/resume/resumeTailor";
import {
  countCoverLetterVersions,
  createCoverLetterVersion,
  getCoverLetterVersion,
  updateCoverLetterVersion,
} from "@/lib/repositories/coverLetterRepository";
import {
  generateCoverLetter,
  CoverLetterGeneratorError,
} from "@/services/coverLetter/coverLetterGenerator";
import {
  requireBaseResumeData,
  BaseResumeError,
} from "@/lib/repositories/resumeRepository";
import { getUserLlmProvider } from "@/services/llm/userProvider";
import { LLMProviderError } from "@/services/llm/types";
import { isJobAnalysis } from "@/types/analysis";
import type { ResumeData } from "@/types/resume";
import { isCoverLetterData, type CoverLetterData } from "@/types/coverLetter";
import type {
  ApplicationStatus,
  CoverLetterVersion,
  ResumeVersion,
} from "@/lib/db/schema";
import { logger, errorContext } from "@/lib/logger";

export async function updateApplicationStatusAction(
  applicationId: string,
  status: ApplicationStatus,
  notes?: string,
) {
  const user = await requireUser();
  const log = logger.child({
    action: "updateApplicationStatusAction",
    userId: user.id,
    applicationId,
  });

  const application = await getApplication(applicationId, user.id);
  if (!application) {
    log.warn("Status update blocked: application not found");
    return;
  }

  if (application.status !== status) {
    await updateStatus(applicationId, user.id, status);
    const trimmedNotes = notes?.trim();
    await saveOutcome({
      applicationId,
      stage: STATUS_LABELS[status],
      notes: trimmedNotes
        ? trimmedNotes
        : `Status changed from ${STATUS_LABELS[application.status]} to ${STATUS_LABELS[status]}.`,
    });
    log.info("Application status changed", {
      from: application.status,
      to: status,
      hasNotes: Boolean(trimmedNotes),
    });
  }

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/applications");
}

export interface DeleteApplicationResult {
  success: boolean;
  error?: string;
}

/**
 * Deletes an application and, via DB-level cascade (see schema.ts), its
 * analysis, AI/MANUAL resume versions, cover letter versions, and outcomes
 * along with it. Irreversible.
 */
export async function deleteApplicationAction(
  applicationId: string,
): Promise<DeleteApplicationResult> {
  const user = await requireUser();
  const log = logger.child({
    action: "deleteApplicationAction",
    userId: user.id,
    applicationId,
  });

  const deleted = await deleteApplication(applicationId, user.id);
  if (!deleted) {
    log.warn("Application delete blocked: not found or not owned by user");
    return { success: false, error: "Application not found." };
  }

  log.info("Application deleted");
  revalidatePath("/applications");

  return { success: true };
}

export interface GenerateTailoredResumeResult {
  success: boolean;
  error?: string;
  resumeVersion?: ResumeVersion;
}

/**
 * Generates a new AI-tailored resume version for an application:
 *
 *   Base Resume (full JSON, per user)
 *     + Job Description + Analysis JSON
 *   -> user's LLM provider selects & rewords a subset -> tailored_resume.json -> new ResumeVersion row
 *
 * The model only ever sees/produces ResumeData JSON - never Markdown or
 * HTML. Always creates a new version; never overwrites a previous one.
 * Each regeneration is independent - no prior tailored versions are sent
 * back to the model, which keeps token cost flat regardless of how many
 * times a resume has been regenerated for this application.
 */
export async function generateTailoredResumeAction(
  applicationId: string,
  message?: string,
): Promise<GenerateTailoredResumeResult> {
  const user = await requireUser();
  const log = logger.child({
    action: "generateTailoredResumeAction",
    userId: user.id,
    applicationId,
    hasMessage: Boolean(message?.trim()),
  });
  const startedAt = Date.now();

  const application = await getApplication(applicationId, user.id);

  if (!application) {
    log.warn("Tailoring blocked: application not found");
    return { success: false, error: "Application not found." };
  }

  if (!application.analysis) {
    log.warn("Tailoring blocked: no analysis for application");
    return { success: false, error: "No analysis found for this application." };
  }

  let analysisData: unknown;
  try {
    analysisData = JSON.parse(application.analysis.analysisJson);
  } catch {
    log.error("Tailoring blocked: stored analysis JSON is invalid");
    return { success: false, error: "Stored analysis JSON is invalid." };
  }

  if (!isJobAnalysis(analysisData)) {
    log.error(
      "Tailoring blocked: stored analysis JSON did not match expected shape",
    );
    return {
      success: false,
      error: "Stored analysis JSON did not match the expected shape.",
    };
  }

  let baseResume;
  try {
    baseResume = await requireBaseResumeData(user.id);
  } catch (error) {
    log.warn("Tailoring blocked: no base resume", errorContext(error));
    return {
      success: false,
      error:
        error instanceof BaseResumeError
          ? error.message
          : "Failed to load your base resume.",
    };
  }

  let provider;
  try {
    provider = await getUserLlmProvider(user.id);
  } catch (error) {
    log.warn(
      "Tailoring blocked: no LLM provider configured",
      errorContext(error),
    );
    return {
      success: false,
      error:
        error instanceof LLMProviderError
          ? error.message
          : "No LLM provider configured.",
    };
  }

  let tailoredResume: ResumeData;
  try {
    tailoredResume = await generateTailoredResume(
      {
        baseResume,
        jobDescription: application.analysis.jdMarkdown,
        analysis: analysisData,
        additionalContext: message,
      },
      provider,
    );
  } catch (error) {
    log.error("Tailored resume generation failed", {
      ...errorContext(error),
      durationMs: Date.now() - startedAt,
    });
    return {
      success: false,
      error:
        error instanceof ResumeTailorError
          ? error.message
          : "Failed to generate tailored resume.",
    };
  }

  const versionCount = await countResumeVersionsForApplication(applicationId);
  const resumeVersion = await createResumeVersion({
    userId: user.id,
    applicationId,
    name: `${application.company} V${versionCount + 1}`,
    type: "AI",
    resume: tailoredResume,
    note: message,
  });

  log.info("Tailored resume generated", {
    resumeVersionId: resumeVersion.id,
    durationMs: Date.now() - startedAt,
  });

  revalidatePath(`/applications/${applicationId}`);

  return { success: true, resumeVersion };
}

export interface CreateManualResumeVersionResult {
  success: boolean;
  error?: string;
  resumeVersion?: ResumeVersion;
}

/**
 * Creates a new manual (non-AI) resume version for an application, seeded
 * from the user's current base resume - the non-AI counterpart to
 * generateTailoredResumeAction. Trimming/reordering/rewording it by hand
 * happens afterward on the resume's own detail page (/resumes/[id]), not
 * here; this action only creates the starting point and hands back its id
 * so the caller can navigate there.
 */
export async function createManualResumeVersionAction(
  applicationId: string,
): Promise<CreateManualResumeVersionResult> {
  const user = await requireUser();
  const log = logger.child({
    action: "createManualResumeVersionAction",
    userId: user.id,
    applicationId,
  });

  const application = await getApplication(applicationId, user.id);
  if (!application) {
    log.warn("Manual resume creation blocked: application not found");
    return { success: false, error: "Application not found." };
  }

  let baseResume;
  try {
    baseResume = await requireBaseResumeData(user.id);
  } catch (error) {
    log.warn("Manual resume creation blocked: no base resume", errorContext(error));
    return {
      success: false,
      error: error instanceof BaseResumeError ? error.message : "Failed to load your base resume.",
    };
  }

  const versionCount = await countResumeVersionsForApplication(applicationId);
  const resumeVersion = await createResumeVersion({
    userId: user.id,
    applicationId,
    name: `${application.company} V${versionCount + 1}`,
    type: "MANUAL",
    resume: baseResume,
  });

  log.info("Manual resume version created", { resumeVersionId: resumeVersion.id });
  revalidatePath(`/applications/${applicationId}`);

  return { success: true, resumeVersion };
}

export interface GenerateCoverLetterResult {
  success: boolean;
  error?: string;
  coverLetterVersion?: CoverLetterVersion;
}

/**
 * Generates a new cover letter version for an application:
 *
 *   Base Resume (full JSON, per user)
 *     + Job Description + Analysis JSON
 *   -> user's LLM provider writes a tailored letter -> cover_letter.json -> new CoverLetterVersion row
 *
 * The model only ever sees/produces CoverLetterData JSON - never Markdown or
 * HTML. Always creates a new version; never overwrites a previous one.
 */
export async function generateCoverLetterAction(
  applicationId: string,
): Promise<GenerateCoverLetterResult> {
  const user = await requireUser();
  const log = logger.child({
    action: "generateCoverLetterAction",
    userId: user.id,
    applicationId,
  });
  const startedAt = Date.now();

  const application = await getApplication(applicationId, user.id);

  if (!application) {
    log.warn("Cover letter generation blocked: application not found");
    return { success: false, error: "Application not found." };
  }

  if (!application.analysis) {
    log.warn("Cover letter generation blocked: no analysis for application");
    return { success: false, error: "No analysis found for this application." };
  }

  let analysisData: unknown;
  try {
    analysisData = JSON.parse(application.analysis.analysisJson);
  } catch {
    log.error("Cover letter generation blocked: stored analysis JSON is invalid");
    return { success: false, error: "Stored analysis JSON is invalid." };
  }

  if (!isJobAnalysis(analysisData)) {
    log.error(
      "Cover letter generation blocked: stored analysis JSON did not match expected shape",
    );
    return {
      success: false,
      error: "Stored analysis JSON did not match the expected shape.",
    };
  }

  let baseResume;
  try {
    baseResume = await requireBaseResumeData(user.id);
  } catch (error) {
    log.warn(
      "Cover letter generation blocked: no base resume",
      errorContext(error),
    );
    return {
      success: false,
      error:
        error instanceof BaseResumeError
          ? error.message
          : "Failed to load your base resume.",
    };
  }

  let provider;
  try {
    provider = await getUserLlmProvider(user.id);
  } catch (error) {
    log.warn(
      "Cover letter generation blocked: no LLM provider configured",
      errorContext(error),
    );
    return {
      success: false,
      error:
        error instanceof LLMProviderError
          ? error.message
          : "No LLM provider configured.",
    };
  }

  let coverLetter: CoverLetterData;
  try {
    coverLetter = await generateCoverLetter(
      {
        baseResume,
        jobDescription: application.analysis.jdMarkdown,
        analysis: analysisData,
        company: application.company,
        jobTitle: application.jobTitle,
      },
      provider,
    );
  } catch (error) {
    log.error("Cover letter generation failed", {
      ...errorContext(error),
      durationMs: Date.now() - startedAt,
    });
    return {
      success: false,
      error:
        error instanceof CoverLetterGeneratorError
          ? error.message
          : "Failed to generate cover letter.",
    };
  }

  const existingCount = await countCoverLetterVersions(applicationId);
  const coverLetterVersion = await createCoverLetterVersion({
    applicationId,
    name: `Cover Letter v${existingCount + 1}`,
    coverLetter,
  });

  log.info("Cover letter generated", {
    coverLetterVersionId: coverLetterVersion.id,
    durationMs: Date.now() - startedAt,
  });

  revalidatePath(`/applications/${applicationId}`);

  return { success: true, coverLetterVersion };
}

export interface UpdateCoverLetterVersionResult {
  success: boolean;
  error?: string;
  coverLetterVersion?: CoverLetterVersion;
}

/**
 * Persists a direct user edit to a cover letter version's content. Mutates
 * that version in place (it is not a new generation), and the preview
 * reflects the edit immediately on the client before this even resolves.
 */
export async function updateCoverLetterVersionAction(
  applicationId: string,
  versionId: string,
  coverLetter: CoverLetterData,
): Promise<UpdateCoverLetterVersionResult> {
  const user = await requireUser();
  const log = logger.child({
    action: "updateCoverLetterVersionAction",
    userId: user.id,
    applicationId,
    versionId,
  });

  const existing = await getCoverLetterVersion(versionId);
  if (!existing || existing.application.userId !== user.id) {
    log.warn(
      "Cover letter version edit blocked: version not found or not owned by user",
    );
    return { success: false, error: "Cover letter version not found." };
  }

  if (!isCoverLetterData(coverLetter)) {
    log.warn(
      "Cover letter version edit blocked: payload did not match expected shape",
    );
    return {
      success: false,
      error: "Cover letter data did not match the expected shape.",
    };
  }

  const coverLetterVersion = await updateCoverLetterVersion({
    id: versionId,
    coverLetter,
  });
  log.info("Cover letter version edited");
  revalidatePath(`/applications/${applicationId}`);

  return { success: true, coverLetterVersion };
}

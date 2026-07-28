"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  getApplication,
  saveOutcome,
  updateStatus,
} from "@/lib/repositories/applicationRepository";
import { STATUS_LABELS } from "@/lib/badge-meta";
import {
  countResumeVersionsByType,
  createResumeVersion,
  getLatestResumeVersionByType,
  getResumeVersion,
  updateResumeVersion,
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
  requireKnowledgeBase,
  KnowledgeBaseError,
} from "@/lib/repositories/knowledgeBaseRepository";
import { careerKnowledgeBaseToResumeData } from "@/lib/resume/knowledgeBaseToResumeData";
import { getUserLlmProvider } from "@/services/llm/userProvider";
import { LLMProviderError } from "@/services/llm/types";
import { isJobAnalysis } from "@/types/analysis";
import { isResumeData, type ResumeData } from "@/types/resume";
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
    await saveOutcome({
      applicationId,
      stage: STATUS_LABELS[status],
      notes: `Status changed from ${STATUS_LABELS[application.status]} to ${STATUS_LABELS[status]}.`,
    });
    log.info("Application status changed", {
      from: application.status,
      to: status,
    });
  }

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/applications");
}

export interface GenerateTailoredResumeResult {
  success: boolean;
  error?: string;
  resumeVersion?: ResumeVersion;
  masterVersion?: ResumeVersion;
}

/**
 * Generates a new tailored resume version for an application:
 *
 *   Career Knowledge Base (full JSON, per user)
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
): Promise<GenerateTailoredResumeResult> {
  const user = await requireUser();
  const log = logger.child({
    action: "generateTailoredResumeAction",
    userId: user.id,
    applicationId,
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

  let careerKnowledgeBase;
  try {
    careerKnowledgeBase = await requireKnowledgeBase(user.id);
  } catch (error) {
    log.warn("Tailoring blocked: no knowledge base", errorContext(error));
    return {
      success: false,
      error:
        error instanceof KnowledgeBaseError
          ? error.message
          : "Failed to load your career knowledge base.",
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

  // A full, untailored projection of the knowledge base is snapshotted once
  // per application as a MASTER version, purely for reference/diffing - the
  // knowledge base itself (not this snapshot) is what tailoring reads from.
  let masterVersion = await getLatestResumeVersionByType(
    applicationId,
    "MASTER",
  );
  if (!masterVersion) {
    masterVersion = await createResumeVersion({
      applicationId,
      name: "Master Resume",
      type: "MASTER",
      resume: careerKnowledgeBaseToResumeData(careerKnowledgeBase),
    });
  }

  let tailoredResume: ResumeData;
  try {
    tailoredResume = await generateTailoredResume(
      {
        careerKnowledgeBase,
        jobDescription: application.analysis.jdMarkdown,
        analysis: analysisData,
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

  const tailoredCount = await countResumeVersionsByType(
    applicationId,
    "TAILORED",
  );
  const resumeVersion = await createResumeVersion({
    applicationId,
    name: `Tailored v${tailoredCount + 1}`,
    type: "TAILORED",
    resume: tailoredResume,
  });

  log.info("Tailored resume generated", {
    resumeVersionId: resumeVersion.id,
    durationMs: Date.now() - startedAt,
  });

  revalidatePath(`/applications/${applicationId}`);

  return { success: true, resumeVersion, masterVersion };
}

export interface UpdateResumeVersionResult {
  success: boolean;
  error?: string;
  resumeVersion?: ResumeVersion;
}

/**
 * Persists a direct user edit to a resume version's content. Mutates that
 * version in place (it is not a new generation), and the preview reflects
 * the edit immediately on the client before this even resolves.
 */
export async function updateResumeVersionAction(
  applicationId: string,
  versionId: string,
  resume: ResumeData,
): Promise<UpdateResumeVersionResult> {
  const user = await requireUser();
  const log = logger.child({
    action: "updateResumeVersionAction",
    userId: user.id,
    applicationId,
    versionId,
  });

  const existing = await getResumeVersion(versionId);
  if (!existing || existing.application.userId !== user.id) {
    log.warn(
      "Resume version edit blocked: version not found or not owned by user",
    );
    return { success: false, error: "Resume version not found." };
  }

  if (!isResumeData(resume)) {
    log.warn(
      "Resume version edit blocked: payload did not match expected shape",
    );
    return {
      success: false,
      error: "Resume data did not match the expected shape.",
    };
  }

  const resumeVersion = await updateResumeVersion({ id: versionId, resume });
  log.info("Resume version edited");
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
 *   Career Knowledge Base (full JSON, per user)
 *     + Job Description + Analysis JSON
 *   -> user's LLM provider writes a tailored letter -> cover_letter.json -> new CoverLetterVersion row
 *
 * The model only ever sees/produces CoverLetterData JSON - never Markdown or
 * HTML. Always creates a new version; never overwrites a previous one.
 * Unlike resumes, there is no MASTER snapshot - a cover letter has no
 * untailored baseline to diff against.
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

  let careerKnowledgeBase;
  try {
    careerKnowledgeBase = await requireKnowledgeBase(user.id);
  } catch (error) {
    log.warn(
      "Cover letter generation blocked: no knowledge base",
      errorContext(error),
    );
    return {
      success: false,
      error:
        error instanceof KnowledgeBaseError
          ? error.message
          : "Failed to load your career knowledge base.",
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
        careerKnowledgeBase,
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

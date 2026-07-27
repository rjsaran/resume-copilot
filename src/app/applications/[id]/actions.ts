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
  getResumeVersions,
  updateResumeVersion,
} from "@/lib/repositories/resumeRepository";
import { generateTailoredResume, ResumeTailorError } from "@/services/resume/resumeTailor";
import { requireKnowledgeBase, KnowledgeBaseError } from "@/lib/repositories/knowledgeBaseRepository";
import { careerKnowledgeBaseToResumeData } from "@/lib/resume/knowledgeBaseToResumeData";
import { getUserLlmProvider } from "@/services/llm/userProvider";
import { LLMProviderError } from "@/services/llm/types";
import { isJobAnalysis } from "@/types/analysis";
import { isResumeData, type ResumeData } from "@/types/resume";
import type { ApplicationStatus, ResumeVersion } from "@/lib/db/schema";

export async function updateApplicationStatusAction(
  applicationId: string,
  status: ApplicationStatus
) {
  const user = await requireUser();
  const application = await getApplication(applicationId, user.id);
  if (!application) return;

  if (application.status !== status) {
    await updateStatus(applicationId, user.id, status);
    await saveOutcome({
      applicationId,
      stage: STATUS_LABELS[status],
      notes: `Status changed from ${STATUS_LABELS[application.status]} to ${STATUS_LABELS[status]}.`,
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
 *     + Job Description + Analysis JSON (+ prior tailored JSON versions)
 *   -> user's LLM provider selects & rewords a subset -> tailored_resume.json -> new ResumeVersion row
 *
 * The model only ever sees/produces ResumeData JSON — never Markdown or
 * HTML. Always creates a new version; never overwrites a previous one.
 */
export async function generateTailoredResumeAction(
  applicationId: string
): Promise<GenerateTailoredResumeResult> {
  const user = await requireUser();
  const application = await getApplication(applicationId, user.id);

  if (!application) {
    return { success: false, error: "Application not found." };
  }

  if (!application.analysis) {
    return { success: false, error: "No analysis found for this application." };
  }

  let analysisData: unknown;
  try {
    analysisData = JSON.parse(application.analysis.analysisJson);
  } catch {
    return { success: false, error: "Stored analysis JSON is invalid." };
  }

  if (!isJobAnalysis(analysisData)) {
    return {
      success: false,
      error: "Stored analysis JSON did not match the expected shape.",
    };
  }

  let careerKnowledgeBase;
  try {
    careerKnowledgeBase = await requireKnowledgeBase(user.id);
  } catch (error) {
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
    return {
      success: false,
      error: error instanceof LLMProviderError ? error.message : "No LLM provider configured.",
    };
  }

  // A full, untailored projection of the knowledge base is snapshotted once
  // per application as a MASTER version, purely for reference/diffing — the
  // knowledge base itself (not this snapshot) is what tailoring reads from.
  let masterVersion = await getLatestResumeVersionByType(applicationId, "MASTER");
  if (!masterVersion) {
    masterVersion = await createResumeVersion({
      applicationId,
      name: "Master Resume",
      type: "MASTER",
      resume: careerKnowledgeBaseToResumeData(careerKnowledgeBase),
    });
  }

  const historicalTailored = (await getResumeVersions(applicationId))
    .filter((version) => version.type === "TAILORED")
    .slice(0, 2)
    .map((version) => {
      try {
        const parsed = JSON.parse(version.resumeJson);
        return isResumeData(parsed) ? { name: version.name, resume: parsed } : null;
      } catch {
        return null;
      }
    })
    .filter((v): v is { name: string; resume: ResumeData } => v !== null);

  let tailoredResume: ResumeData;
  try {
    tailoredResume = await generateTailoredResume(
      {
        careerKnowledgeBase,
        jobDescription: application.analysis.jdMarkdown,
        analysis: analysisData,
        historicalResumeVersions: historicalTailored,
      },
      provider
    );
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof ResumeTailorError
          ? error.message
          : "Failed to generate tailored resume.",
    };
  }

  const tailoredCount = await countResumeVersionsByType(applicationId, "TAILORED");
  const resumeVersion = await createResumeVersion({
    applicationId,
    name: `Tailored v${tailoredCount + 1}`,
    type: "TAILORED",
    resume: tailoredResume,
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
  resume: ResumeData
): Promise<UpdateResumeVersionResult> {
  const user = await requireUser();

  const existing = await getResumeVersion(versionId);
  if (!existing || existing.application.userId !== user.id) {
    return { success: false, error: "Resume version not found." };
  }

  if (!isResumeData(resume)) {
    return { success: false, error: "Resume data did not match the expected shape." };
  }

  const resumeVersion = await updateResumeVersion({ id: versionId, resume });
  revalidatePath(`/applications/${applicationId}`);

  return { success: true, resumeVersion };
}

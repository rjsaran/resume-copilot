import { createHash } from "crypto";
import { db } from "@/lib/db";
import type { Application, ApplicationStatus } from "@/generated/prisma/client";
import type { JobAnalysis } from "@/types/analysis";

export function hashJobUrl(jobUrl: string): string {
  return createHash("sha256").update(jobUrl).digest("hex");
}

export interface SaveAnalysisInput {
  userId: string;
  jobUrl: string;
  jdMarkdown: string;
  analysis: JobAnalysis;
  model: string;
}

/**
 * Persists an analysis result, scoped to one user. If this user already has
 * an Application for this job URL (matched by userId + jobHash), its
 * scores/verdict and Analysis row are updated in place rather than creating
 * a duplicate — two different users analyzing the same job posting each get
 * their own Application row.
 */
export async function saveAnalysis(
  input: SaveAnalysisInput
): Promise<Application> {
  const jobHash = hashJobUrl(input.jobUrl);
  const { company, jobTitle, matchScore, atsScore, interviewProbability, decision } =
    input.analysis;
  const analysisJson = JSON.stringify(input.analysis);

  return db.application.upsert({
    where: { userId_jobHash: { userId: input.userId, jobHash } },
    create: {
      userId: input.userId,
      company,
      jobTitle,
      jobUrl: input.jobUrl,
      jobHash,
      overallScore: matchScore,
      atsScore,
      interviewProbability,
      verdict: decision,
      analysis: {
        create: {
          jdMarkdown: input.jdMarkdown,
          analysisJson,
          model: input.model,
        },
      },
    },
    update: {
      company,
      jobTitle,
      overallScore: matchScore,
      atsScore,
      interviewProbability,
      verdict: decision,
      analysis: {
        upsert: {
          create: {
            jdMarkdown: input.jdMarkdown,
            analysisJson,
            model: input.model,
          },
          update: {
            jdMarkdown: input.jdMarkdown,
            analysisJson,
            model: input.model,
          },
        },
      },
    },
  });
}

export function getApplications(userId: string) {
  return db.application.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export function getApplication(id: string, userId: string) {
  return db.application.findFirst({
    where: { id, userId },
    include: {
      analysis: true,
      resumeVersions: { orderBy: { createdAt: "desc" } },
      outcomes: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function updateStatus(
  id: string,
  userId: string,
  status: ApplicationStatus
): Promise<void> {
  await db.application.updateMany({
    where: { id, userId },
    data: { status },
  });
}

export interface SaveOutcomeInput {
  applicationId: string;
  stage: string;
  notes?: string;
}

export function saveOutcome(input: SaveOutcomeInput) {
  return db.outcome.create({ data: input });
}

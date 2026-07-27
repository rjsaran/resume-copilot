import { createHash } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { analyses, applications, outcomes, resumeVersions } from "@/lib/db/schema";
import type { Application, ApplicationStatus } from "@/lib/db/schema";
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
export async function saveAnalysis(input: SaveAnalysisInput): Promise<Application> {
  const jobHash = hashJobUrl(input.jobUrl);
  const { company, jobTitle, matchScore, atsScore, interviewProbability, decision } =
    input.analysis;
  const analysisJson = JSON.stringify(input.analysis);

  return db.transaction(async (tx) => {
    const [application] = await tx
      .insert(applications)
      .values({
        userId: input.userId,
        company,
        jobTitle,
        jobUrl: input.jobUrl,
        jobHash,
        overallScore: matchScore,
        atsScore,
        interviewProbability,
        verdict: decision,
      })
      .onConflictDoUpdate({
        target: [applications.userId, applications.jobHash],
        set: {
          company,
          jobTitle,
          overallScore: matchScore,
          atsScore,
          interviewProbability,
          verdict: decision,
          updatedAt: new Date(),
        },
      })
      .returning();

    await tx
      .insert(analyses)
      .values({
        applicationId: application.id,
        jdMarkdown: input.jdMarkdown,
        analysisJson,
        model: input.model,
      })
      .onConflictDoUpdate({
        target: analyses.applicationId,
        set: { jdMarkdown: input.jdMarkdown, analysisJson, model: input.model },
      });

    return application;
  });
}

export function getApplications(userId: string) {
  return db.query.applications.findMany({
    where: eq(applications.userId, userId),
    orderBy: [desc(applications.createdAt)],
  });
}

export function getApplication(id: string, userId: string) {
  return db.query.applications.findFirst({
    where: and(eq(applications.id, id), eq(applications.userId, userId)),
    with: {
      analysis: true,
      resumeVersions: { orderBy: [desc(resumeVersions.createdAt)] },
      outcomes: { orderBy: [desc(outcomes.createdAt)] },
    },
  });
}

export async function updateStatus(
  id: string,
  userId: string,
  status: ApplicationStatus
): Promise<void> {
  await db
    .update(applications)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(applications.id, id), eq(applications.userId, userId)));
}

export interface SaveOutcomeInput {
  applicationId: string;
  stage: string;
  notes?: string;
}

export async function saveOutcome(input: SaveOutcomeInput) {
  const [outcome] = await db.insert(outcomes).values(input).returning();
  return outcome;
}

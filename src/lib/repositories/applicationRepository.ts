import { createHash } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  analyses,
  applications,
  coverLetterVersions,
  outcomes,
  resumeVersions,
  scrapedJobDescriptions,
} from "@/lib/db/schema";
import type { Application, ApplicationStatus, ScrapedJobDescription } from "@/lib/db/schema";
import type { JobAnalysis } from "@/types/analysis";

export function hashJobUrl(jobUrl: string): string {
  return createHash("sha256").update(jobUrl).digest("hex");
}

/**
 * Saves the raw scraped job posting the moment it's fetched, before the LLM
 * analysis step runs - so a scrape is never lost just because the analysis
 * that was going to follow it failed. Call this right after a successful
 * fetch, independent of whether analysis succeeds afterward.
 */
export async function upsertScrapedJobDescription(
  userId: string,
  jobUrl: string,
  jdMarkdown: string,
): Promise<ScrapedJobDescription> {
  const jobHash = hashJobUrl(jobUrl);
  const [row] = await db
    .insert(scrapedJobDescriptions)
    .values({ userId, jobUrl, jobHash, jdMarkdown })
    .onConflictDoUpdate({
      target: [scrapedJobDescriptions.userId, scrapedJobDescriptions.jobHash],
      set: { jobUrl, jdMarkdown, updatedAt: new Date() },
    })
    .returning();
  return row;
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
 * a duplicate - two different users analyzing the same job posting each get
 * their own Application row.
 */
export async function saveAnalysis(
  input: SaveAnalysisInput,
): Promise<Application> {
  const jobHash = hashJobUrl(input.jobUrl);
  const { company, jobTitle, matchScore, recommendationStatus } = input.analysis;
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
        verdict: recommendationStatus,
      })
      .onConflictDoUpdate({
        target: [applications.userId, applications.jobHash],
        set: {
          company,
          jobTitle,
          overallScore: matchScore,
          verdict: recommendationStatus,
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

/**
 * Looks up an existing application by the same (userId, jobHash) key
 * `saveAnalysis` dedupes on, with its analysis attached. Used to detect
 * "this exact posting was already analyzed" before spending an LLM call.
 */
export function getApplicationByJobHash(userId: string, jobHash: string) {
  return db.query.applications.findFirst({
    where: and(
      eq(applications.userId, userId),
      eq(applications.jobHash, jobHash),
    ),
    with: { analysis: true },
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
      coverLetterVersions: { orderBy: [desc(coverLetterVersions.createdAt)] },
      outcomes: { orderBy: [desc(outcomes.createdAt)] },
    },
  });
}

export async function updateStatus(
  id: string,
  userId: string,
  status: ApplicationStatus,
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

/**
 * Deletes an application, ownership-checked. Its analysis, AI/MANUAL resume
 * versions, cover letter versions, and outcomes all cascade at the DB level
 * (see the onDelete: "cascade" foreign keys in schema.ts) - nothing else to
 * delete here. Returns whether a row actually matched, so the caller can
 * tell "already gone / not yours" apart from a real deletion.
 */
export async function deleteApplication(
  id: string,
  userId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .returning({ id: applications.id });
  return deleted.length > 0;
}

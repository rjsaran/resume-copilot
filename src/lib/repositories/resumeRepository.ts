import { and, count, desc, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { resumeVersions } from "@/lib/db/schema";
import type {
  Application,
  ResumeVersion,
  ResumeVersionType,
} from "@/lib/db/schema";
import { isResumeData, type ResumeData } from "@/types/resume";

export class BaseResumeError extends Error {}

export interface CreateResumeVersionInput {
  userId: string;
  applicationId: string;
  name: string;
  type: Extract<ResumeVersionType, "AI" | "MANUAL">;
  resume: ResumeData;
}

/**
 * Always creates a new row - resume versions are never overwritten by
 * generation, so every AI run is preserved and users can switch between
 * them. Direct edits to a version's content go through updateResumeVersion
 * instead, which mutates in place. Only for AI/MANUAL (application-scoped)
 * resumes - BASE goes through upsertBaseResume (which mutates its single
 * row in place instead of appending), and PUBLIC goes through
 * createPublicResume (always a new row, since public resumes aren't
 * singletons).
 */
export async function createResumeVersion(
  input: CreateResumeVersionInput,
): Promise<ResumeVersion> {
  const [version] = await db
    .insert(resumeVersions)
    .values({
      userId: input.userId,
      applicationId: input.applicationId,
      name: input.name,
      type: input.type,
      resumeJson: JSON.stringify(input.resume),
    })
    .returning();
  return version;
}

export function getResumeVersions(
  applicationId: string,
): Promise<ResumeVersion[]> {
  return db.query.resumeVersions.findMany({
    where: eq(resumeVersions.applicationId, applicationId),
    orderBy: [desc(resumeVersions.createdAt)],
  });
}

/**
 * Looks up any resume by id - base, public, or tailored alike, which is
 * what lets /resumes/[id] be one generic detail route for all three kinds.
 * Ownership is checked directly via `userId` (present on every row), not
 * via the parent Application - `application` is only joined in for display
 * context (e.g. linking a tailored resume back to its job) and is null for
 * BASE/PUBLIC rows, which have none.
 */
export function getResumeVersion(
  id: string,
): Promise<(ResumeVersion & { application: Application | null }) | undefined> {
  return db.query.resumeVersions.findFirst({
    where: eq(resumeVersions.id, id),
    with: { application: true },
  });
}

/**
 * Counts AI + MANUAL versions together (the only types ever scoped to an
 * application) so naming a new one as "{Company} V{n}" never collides
 * between an AI-generated and a manually-built version for the same job.
 */
export async function countResumeVersionsForApplication(
  applicationId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(resumeVersions)
    .where(eq(resumeVersions.applicationId, applicationId));
  return row?.count ?? 0;
}

export interface UpdateResumeVersionInput {
  id: string;
  name?: string;
  resume: ResumeData;
}

/**
 * Mutates an existing version's content in place - used for direct user
 * edits (not generation), and for every save to a BASE/PUBLIC resume. A
 * version being edited is still the same version; this does not create a
 * new row.
 */
export async function updateResumeVersion(
  input: UpdateResumeVersionInput,
): Promise<ResumeVersion> {
  const [version] = await db
    .update(resumeVersions)
    .set({
      ...(input.name ? { name: input.name } : {}),
      resumeJson: JSON.stringify(input.resume),
      updatedAt: new Date(),
    })
    .where(eq(resumeVersions.id, input.id))
    .returning();
  return version;
}

/** Renames a resume version without touching its content - e.g. giving a public resume a descriptive name like "Fintech Resume" instead of the auto-generated "Public Resume 2". */
export async function renameResumeVersion(
  id: string,
  name: string,
): Promise<ResumeVersion> {
  const [version] = await db
    .update(resumeVersions)
    .set({ name, updatedAt: new Date() })
    .where(eq(resumeVersions.id, id))
    .returning();
  return version;
}

/** Null when the user hasn't created their base resume yet. */
export function getBaseResume(userId: string): Promise<ResumeVersion | undefined> {
  return db.query.resumeVersions.findFirst({
    where: and(eq(resumeVersions.userId, userId), eq(resumeVersions.type, "BASE")),
  });
}

/**
 * Like getBaseResume, but parses/validates the JSON and throws a clear,
 * actionable error instead of returning undefined - for callers (analysis,
 * tailoring, cover letters) that can't proceed without one.
 */
export async function requireBaseResumeData(userId: string): Promise<ResumeData> {
  const row = await getBaseResume(userId);
  if (!row) {
    throw new BaseResumeError(
      "Create your base resume before analyzing or tailoring - see the Resumes page.",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(row.resumeJson);
  } catch {
    throw new BaseResumeError("Stored base resume JSON is invalid.");
  }
  if (!isResumeData(parsed)) {
    throw new BaseResumeError("Stored base resume did not match the expected schema.");
  }
  return parsed;
}

/** Every public resume for a user, newest first - unlike the base resume, a user can have any number of these (or none). */
export function getPublicResumes(userId: string): Promise<ResumeVersion[]> {
  return db.query.resumeVersions.findMany({
    where: and(eq(resumeVersions.userId, userId), eq(resumeVersions.type, "PUBLIC")),
    orderBy: [desc(resumeVersions.createdAt)],
  });
}

/**
 * Creates or overwrites the user's single base resume. At most one BASE row
 * per user exists (enforced by a partial unique index), so this is an
 * upsert on (userId, type) rather than createResumeVersion's always-append
 * behavior.
 */
export async function upsertBaseResume(
  userId: string,
  resume: ResumeData,
): Promise<ResumeVersion> {
  const existing = await getBaseResume(userId);
  if (existing) {
    return updateResumeVersion({ id: existing.id, resume });
  }
  const [version] = await db
    .insert(resumeVersions)
    .values({
      userId,
      applicationId: null,
      name: "Base Resume",
      type: "BASE",
      resumeJson: JSON.stringify(resume),
    })
    .returning();
  return version;
}

/**
 * Always creates a new PUBLIC row - unlike the base resume, public resumes
 * are not a singleton, so this never overwrites an existing one. Auto-names
 * it "Public Resume N" (next unused number) when no name is given.
 */
export async function createPublicResume(
  userId: string,
  resume: ResumeData,
  name?: string,
): Promise<ResumeVersion> {
  const resolvedName = name ?? `Public Resume ${(await getPublicResumes(userId)).length + 1}`;
  const [version] = await db
    .insert(resumeVersions)
    .values({
      userId,
      applicationId: null,
      name: resolvedName,
      type: "PUBLIC",
      resumeJson: JSON.stringify(resume),
    })
    .returning();
  return version;
}

export async function deleteResumeVersion(id: string): Promise<void> {
  await db.delete(resumeVersions).where(eq(resumeVersions.id, id));
}

export interface TailoredResumeSummary extends ResumeVersion {
  application: Pick<Application, "id" | "company" | "jobTitle"> | null;
}

/**
 * Every AI/MANUAL resume across all of a user's applications, newest first
 * - the "Tailored Resumes" list on the Resumes hub. Joins in just enough of
 * the parent Application to link back to it and show which job it's for.
 */
export function getTailoredResumes(userId: string): Promise<TailoredResumeSummary[]> {
  return db.query.resumeVersions.findMany({
    where: and(
      eq(resumeVersions.userId, userId),
      // AI/MANUAL only - excludes this user's own BASE/PUBLIC rows.
      // (Legacy MASTER/TAILORED rows no longer exist post-migration.)
      or(eq(resumeVersions.type, "AI"), eq(resumeVersions.type, "MANUAL")),
    ),
    orderBy: [desc(resumeVersions.createdAt)],
    with: {
      application: { columns: { id: true, company: true, jobTitle: true } },
    },
  });
}

import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { resumeVersions } from "@/lib/db/schema";
import type {
  Application,
  ResumeVersion,
  ResumeVersionType,
} from "@/lib/db/schema";
import type { ResumeData } from "@/types/resume";

export interface CreateResumeVersionInput {
  applicationId: string;
  name: string;
  type: ResumeVersionType;
  resume: ResumeData;
}

/**
 * Always creates a new row - resume versions are never overwritten by
 * generation, so every AI run is preserved and users can switch between
 * them. Direct edits to a version's content go through updateResumeVersion
 * instead, which mutates in place.
 */
export async function createResumeVersion(
  input: CreateResumeVersionInput,
): Promise<ResumeVersion> {
  const [version] = await db
    .insert(resumeVersions)
    .values({
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
 * Includes the parent Application so callers that look up a version
 * directly by id (the preview page, the PDF export route) can verify
 * `application.userId` matches the signed-in user before rendering or
 * exporting anything - resume versions have no userId column of their own,
 * ownership flows through the Application they belong to.
 */
export function getResumeVersion(
  id: string,
): Promise<(ResumeVersion & { application: Application }) | undefined> {
  return db.query.resumeVersions.findFirst({
    where: eq(resumeVersions.id, id),
    with: { application: true },
  });
}

export function getLatestResumeVersionByType(
  applicationId: string,
  type: ResumeVersionType,
): Promise<ResumeVersion | undefined> {
  return db.query.resumeVersions.findFirst({
    where: and(
      eq(resumeVersions.applicationId, applicationId),
      eq(resumeVersions.type, type),
    ),
    orderBy: [desc(resumeVersions.createdAt)],
  });
}

export async function countResumeVersionsByType(
  applicationId: string,
  type: ResumeVersionType,
): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(resumeVersions)
    .where(
      and(
        eq(resumeVersions.applicationId, applicationId),
        eq(resumeVersions.type, type),
      ),
    );
  return row?.count ?? 0;
}

export interface UpdateResumeVersionInput {
  id: string;
  name?: string;
  resume: ResumeData;
}

/**
 * Mutates an existing version's content in place - used for direct user
 * edits (not generation). A version being edited is still the same version;
 * this does not create a new row.
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

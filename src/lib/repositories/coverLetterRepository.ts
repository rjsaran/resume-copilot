import { count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { coverLetterVersions } from "@/lib/db/schema";
import type { Application, CoverLetterVersion } from "@/lib/db/schema";
import type { CoverLetterData } from "@/types/coverLetter";

export interface CreateCoverLetterVersionInput {
  applicationId: string;
  name: string;
  coverLetter: CoverLetterData;
}

/**
 * Always creates a new row - like resume versions, cover letter versions are
 * never overwritten by generation, so every AI run is preserved and users
 * can switch between them. Direct edits go through updateCoverLetterVersion
 * instead, which mutates in place.
 */
export async function createCoverLetterVersion(
  input: CreateCoverLetterVersionInput,
): Promise<CoverLetterVersion> {
  const [version] = await db
    .insert(coverLetterVersions)
    .values({
      applicationId: input.applicationId,
      name: input.name,
      coverLetterJson: JSON.stringify(input.coverLetter),
    })
    .returning();
  return version;
}

export function getCoverLetterVersions(
  applicationId: string,
): Promise<CoverLetterVersion[]> {
  return db.query.coverLetterVersions.findMany({
    where: eq(coverLetterVersions.applicationId, applicationId),
    orderBy: [desc(coverLetterVersions.createdAt)],
  });
}

/**
 * Includes the parent Application so callers that look up a version
 * directly by id (the preview page, the PDF export route) can verify
 * `application.userId` matches the signed-in user before rendering or
 * exporting anything - cover letter versions have no userId column of their
 * own, ownership flows through the Application they belong to.
 */
export function getCoverLetterVersion(
  id: string,
): Promise<(CoverLetterVersion & { application: Application }) | undefined> {
  return db.query.coverLetterVersions.findFirst({
    where: eq(coverLetterVersions.id, id),
    with: { application: true },
  });
}

export async function countCoverLetterVersions(
  applicationId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(coverLetterVersions)
    .where(eq(coverLetterVersions.applicationId, applicationId));
  return row?.count ?? 0;
}

export interface UpdateCoverLetterVersionInput {
  id: string;
  name?: string;
  coverLetter: CoverLetterData;
}

/**
 * Mutates an existing version's content in place - used for direct user
 * edits (not generation). A version being edited is still the same version;
 * this does not create a new row.
 */
export async function updateCoverLetterVersion(
  input: UpdateCoverLetterVersionInput,
): Promise<CoverLetterVersion> {
  const [version] = await db
    .update(coverLetterVersions)
    .set({
      ...(input.name ? { name: input.name } : {}),
      coverLetterJson: JSON.stringify(input.coverLetter),
      updatedAt: new Date(),
    })
    .where(eq(coverLetterVersions.id, input.id))
    .returning();
  return version;
}

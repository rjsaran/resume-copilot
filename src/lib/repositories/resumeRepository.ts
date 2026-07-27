import { db } from "@/lib/db";
import type { Application, ResumeVersion, ResumeVersionType } from "@/generated/prisma/client";
import type { ResumeData } from "@/types/resume";

export interface CreateResumeVersionInput {
  applicationId: string;
  name: string;
  type: ResumeVersionType;
  resume: ResumeData;
}

/**
 * Always creates a new row — resume versions are never overwritten by
 * generation, so every AI run is preserved and users can switch between
 * them. Direct edits to a version's content go through updateResumeVersion
 * instead, which mutates in place.
 */
export function createResumeVersion(
  input: CreateResumeVersionInput
): Promise<ResumeVersion> {
  return db.resumeVersion.create({
    data: {
      applicationId: input.applicationId,
      name: input.name,
      type: input.type,
      resumeJson: JSON.stringify(input.resume),
    },
  });
}

export function getResumeVersions(
  applicationId: string
): Promise<ResumeVersion[]> {
  return db.resumeVersion.findMany({
    where: { applicationId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Includes the parent Application so callers that look up a version
 * directly by id (the preview page, the PDF export route) can verify
 * `application.userId` matches the signed-in user before rendering or
 * exporting anything — resume versions have no userId column of their own,
 * ownership flows through the Application they belong to.
 */
export function getResumeVersion(
  id: string
): Promise<(ResumeVersion & { application: Application }) | null> {
  return db.resumeVersion.findUnique({ where: { id }, include: { application: true } });
}

export function getLatestResumeVersionByType(
  applicationId: string,
  type: ResumeVersionType
): Promise<ResumeVersion | null> {
  return db.resumeVersion.findFirst({
    where: { applicationId, type },
    orderBy: { createdAt: "desc" },
  });
}

export function countResumeVersionsByType(
  applicationId: string,
  type: ResumeVersionType
): Promise<number> {
  return db.resumeVersion.count({ where: { applicationId, type } });
}

export interface UpdateResumeVersionInput {
  id: string;
  name?: string;
  resume: ResumeData;
}

/**
 * Mutates an existing version's content in place — used for direct user
 * edits (not generation). A version being edited is still the same version;
 * this does not create a new row.
 */
export function updateResumeVersion(
  input: UpdateResumeVersionInput
): Promise<ResumeVersion> {
  return db.resumeVersion.update({
    where: { id: input.id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      resumeJson: JSON.stringify(input.resume),
    },
  });
}

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { resumeRenderCache } from "@/lib/db/schema";
import type { ResumeData } from "@/types/resume";

/**
 * Stashes a resume draft just long enough for Playwright to load the
 * matching render route and produce a PDF from it - see
 * /api/resume/render/pdf. Callers must delete the row once the PDF is
 * generated (success or failure); this is not a durable resume, just a
 * hand-off mechanism for content that was never saved.
 */
export async function createRenderCacheEntry(
  userId: string,
  resume: ResumeData,
): Promise<string> {
  const [row] = await db
    .insert(resumeRenderCache)
    .values({ userId, resumeJson: JSON.stringify(resume) })
    .returning({ id: resumeRenderCache.id });
  return row.id;
}

export function getRenderCacheEntry(id: string) {
  return db.query.resumeRenderCache.findFirst({
    where: eq(resumeRenderCache.id, id),
  });
}

export async function deleteRenderCacheEntry(id: string): Promise<void> {
  await db.delete(resumeRenderCache).where(eq(resumeRenderCache.id, id));
}

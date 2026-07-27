import { db } from "@/lib/db";
import { isCareerKnowledgeBase, type CareerKnowledgeBase } from "@/types/careerKnowledgeBase";

export class KnowledgeBaseError extends Error {}

/** Null when the user hasn't created a knowledge base yet. */
export async function getKnowledgeBase(userId: string): Promise<CareerKnowledgeBase | null> {
  const row = await db.knowledgeBase.findUnique({ where: { userId } });
  if (!row) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(row.dataJson);
  } catch {
    throw new KnowledgeBaseError("Stored knowledge base JSON is invalid.");
  }

  if (!isCareerKnowledgeBase(parsed)) {
    throw new KnowledgeBaseError("Stored knowledge base did not match the expected schema.");
  }

  return parsed;
}

/**
 * Like getKnowledgeBase, but throws a clear, actionable error instead of
 * returning null — for callers (analysis, tailoring) that can't proceed
 * without one.
 */
export async function requireKnowledgeBase(userId: string): Promise<CareerKnowledgeBase> {
  const kb = await getKnowledgeBase(userId);
  if (!kb) {
    throw new KnowledgeBaseError(
      "Add your career knowledge base before analyzing or tailoring — see the Knowledge Base page."
    );
  }
  return kb;
}

export async function upsertKnowledgeBase(
  userId: string,
  data: CareerKnowledgeBase
): Promise<void> {
  const dataJson = JSON.stringify(data);
  await db.knowledgeBase.upsert({
    where: { userId },
    create: { userId, dataJson },
    update: { dataJson },
  });
}

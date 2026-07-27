"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { upsertKnowledgeBase } from "@/lib/repositories/knowledgeBaseRepository";
import { getCareerKnowledgeBaseFromDisk } from "@/lib/resume/careerKnowledgeBase";
import { isCareerKnowledgeBase, type CareerKnowledgeBase } from "@/types/careerKnowledgeBase";

export interface SaveKnowledgeBaseResult {
  success: boolean;
  error?: string;
}

export async function saveKnowledgeBaseAction(
  data: CareerKnowledgeBase
): Promise<SaveKnowledgeBaseResult> {
  const user = await requireUser();

  if (!isCareerKnowledgeBase(data)) {
    return { success: false, error: "Knowledge base did not match the expected schema." };
  }

  await upsertKnowledgeBase(user.id, data);
  revalidatePath("/knowledge-base");

  return { success: true };
}

export interface ImportKnowledgeBaseResult {
  success: boolean;
  error?: string;
  data?: CareerKnowledgeBase;
}

/**
 * One-time convenience for bootstrapping a knowledge base from the repo's
 * local resume/career_knowledge_base.json seed file, instead of typing
 * everything into the editor from scratch. Does not save automatically —
 * it loads the file's content into the editor so the user can review before
 * saving.
 */
export async function importKnowledgeBaseFromFileAction(): Promise<ImportKnowledgeBaseResult> {
  await requireUser();

  try {
    const data = await getCareerKnowledgeBaseFromDisk();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import the seed file.",
    };
  }
}

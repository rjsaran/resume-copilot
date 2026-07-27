"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { upsertKnowledgeBase } from "@/lib/repositories/knowledgeBaseRepository";
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

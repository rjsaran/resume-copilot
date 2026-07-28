"use server";

import { requireUser } from "@/lib/auth";
import { getUserSettings } from "@/lib/repositories/userSettingsRepository";
import { getKnowledgeBase } from "@/lib/repositories/knowledgeBaseRepository";
import { ENCRYPTED_KEY_BY_PROVIDER } from "@/services/llm/userProvider";

export interface AnalyzeReadiness {
  hasApiKey: boolean;
  hasKnowledgeBase: boolean;
}

/**
 * Checked fresh every time the analyze launcher opens, rather than once at
 * layout load - the launcher lives in the root layout so it's available on
 * every page, but a layout's data fetch doesn't automatically re-run on
 * client-side navigation, so a stale "not ready" from before the user added
 * their API key or knowledge base would otherwise stick around all session.
 */
export async function getAnalyzeReadinessAction(): Promise<AnalyzeReadiness> {
  const user = await requireUser();
  const settings = await getUserSettings(user.id);

  let hasKnowledgeBase = false;
  try {
    hasKnowledgeBase = Boolean(await getKnowledgeBase(user.id));
  } catch {
    hasKnowledgeBase = false;
  }

  const hasApiKey = Boolean(
    settings && settings[ENCRYPTED_KEY_BY_PROVIDER[settings.activeProvider]],
  );

  return { hasApiKey, hasKnowledgeBase };
}

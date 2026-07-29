"use server";

import { requireUser } from "@/lib/auth";
import { getUserSettings } from "@/lib/repositories/userSettingsRepository";
import { getBaseResume } from "@/lib/repositories/resumeRepository";
import { ENCRYPTED_KEY_BY_PROVIDER } from "@/services/llm/userProvider";

export interface AnalyzeReadiness {
  hasApiKey: boolean;
  hasBaseResume: boolean;
}

/**
 * Checked fresh every time the analyze launcher opens, rather than once at
 * layout load - the launcher lives in the root layout so it's available on
 * every page, but a layout's data fetch doesn't automatically re-run on
 * client-side navigation, so a stale "not ready" from before the user added
 * their API key or base resume would otherwise stick around all session.
 */
export async function getAnalyzeReadinessAction(): Promise<AnalyzeReadiness> {
  const user = await requireUser();
  const settings = await getUserSettings(user.id);

  const hasBaseResume = Boolean(await getBaseResume(user.id));

  const hasApiKey = Boolean(
    settings && settings[ENCRYPTED_KEY_BY_PROVIDER[settings.activeProvider]],
  );

  return { hasApiKey, hasBaseResume };
}

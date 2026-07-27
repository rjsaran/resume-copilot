"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { upsertProviderKey, clearProviderKey } from "@/lib/repositories/userSettingsRepository";
import { logger } from "@/lib/logger";

export interface SettingsActionResult {
  success: boolean;
  error?: string;
}

export async function saveGeminiKeyAction(apiKey: string): Promise<SettingsActionResult> {
  const user = await requireUser();
  const log = logger.child({ action: "saveGeminiKeyAction", userId: user.id });
  const trimmed = apiKey.trim();

  if (!trimmed) {
    log.warn("Gemini key save blocked: empty key");
    return { success: false, error: "API key cannot be empty." };
  }

  // Never log the key itself, encrypted or not — only that one was saved.
  await upsertProviderKey(user.id, "GEMINI", encryptSecret(trimmed));
  log.info("Gemini API key saved");
  revalidatePath("/settings");

  return { success: true };
}

export async function removeGeminiKeyAction(): Promise<SettingsActionResult> {
  const user = await requireUser();
  const log = logger.child({ action: "removeGeminiKeyAction", userId: user.id });

  await clearProviderKey(user.id, "GEMINI");
  log.info("Gemini API key removed");
  revalidatePath("/settings");

  return { success: true };
}

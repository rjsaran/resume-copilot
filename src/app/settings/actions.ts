"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { upsertProviderKey, clearProviderKey } from "@/lib/repositories/userSettingsRepository";

export interface SettingsActionResult {
  success: boolean;
  error?: string;
}

export async function saveGeminiKeyAction(apiKey: string): Promise<SettingsActionResult> {
  const user = await requireUser();
  const trimmed = apiKey.trim();

  if (!trimmed) {
    return { success: false, error: "API key cannot be empty." };
  }

  await upsertProviderKey(user.id, "GEMINI", encryptSecret(trimmed));
  revalidatePath("/settings");

  return { success: true };
}

export async function removeGeminiKeyAction(): Promise<SettingsActionResult> {
  const user = await requireUser();
  await clearProviderKey(user.id, "GEMINI");
  revalidatePath("/settings");

  return { success: true };
}

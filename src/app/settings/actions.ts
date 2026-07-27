"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import {
  upsertProviderKey,
  clearProviderKey,
  setActiveProvider,
  upsertProviderModel,
} from "@/lib/repositories/userSettingsRepository";
import { IMPLEMENTED_PROVIDERS } from "@/services/llm/types";
import { logger } from "@/lib/logger";
import type { LlmProvider } from "@/lib/db/schema";

export interface SettingsActionResult {
  success: boolean;
  error?: string;
}

export async function saveGeminiKeyAction(
  apiKey: string,
): Promise<SettingsActionResult> {
  const user = await requireUser();
  const log = logger.child({ action: "saveGeminiKeyAction", userId: user.id });
  const trimmed = apiKey.trim();

  if (!trimmed) {
    log.warn("Gemini key save blocked: empty key");
    return { success: false, error: "API key cannot be empty." };
  }

  // Never log the key itself, encrypted or not - only that one was saved.
  await upsertProviderKey(user.id, "GEMINI", encryptSecret(trimmed));
  log.info("Gemini API key saved");
  revalidatePath("/settings");

  return { success: true };
}

export async function removeGeminiKeyAction(): Promise<SettingsActionResult> {
  const user = await requireUser();
  const log = logger.child({
    action: "removeGeminiKeyAction",
    userId: user.id,
  });

  await clearProviderKey(user.id, "GEMINI");
  log.info("Gemini API key removed");
  revalidatePath("/settings");

  return { success: true };
}

export async function saveOpenRouterKeyAction(
  apiKey: string,
): Promise<SettingsActionResult> {
  const user = await requireUser();
  const log = logger.child({
    action: "saveOpenRouterKeyAction",
    userId: user.id,
  });
  const trimmed = apiKey.trim();

  if (!trimmed) {
    log.warn("OpenRouter key save blocked: empty key");
    return { success: false, error: "API key cannot be empty." };
  }

  // Never log the key itself, encrypted or not - only that one was saved.
  await upsertProviderKey(user.id, "OPENROUTER", encryptSecret(trimmed));
  log.info("OpenRouter API key saved");
  revalidatePath("/settings");

  return { success: true };
}

export async function removeOpenRouterKeyAction(): Promise<SettingsActionResult> {
  const user = await requireUser();
  const log = logger.child({
    action: "removeOpenRouterKeyAction",
    userId: user.id,
  });

  await clearProviderKey(user.id, "OPENROUTER");
  log.info("OpenRouter API key removed");
  revalidatePath("/settings");

  return { success: true };
}

export async function setProviderModelAction(
  provider: LlmProvider,
  model: string,
): Promise<SettingsActionResult> {
  const user = await requireUser();
  const log = logger.child({
    action: "setProviderModelAction",
    userId: user.id,
  });

  if (!IMPLEMENTED_PROVIDERS.includes(provider)) {
    log.warn("Model override blocked: provider not implemented", { provider });
    return { success: false, error: `${provider} is not available yet.` };
  }

  const trimmed = model.trim();
  await upsertProviderModel(user.id, provider, trimmed || null);
  log.info("Provider model updated", { provider, model: trimmed || null });
  revalidatePath("/settings");

  return { success: true };
}

export async function setActiveProviderAction(
  provider: LlmProvider,
): Promise<SettingsActionResult> {
  const user = await requireUser();
  const log = logger.child({
    action: "setActiveProviderAction",
    userId: user.id,
  });

  if (!IMPLEMENTED_PROVIDERS.includes(provider)) {
    log.warn("Active provider switch blocked: not implemented", { provider });
    return { success: false, error: `${provider} is not available yet.` };
  }

  await setActiveProvider(user.id, provider);
  log.info("Active provider switched", { provider });
  revalidatePath("/settings");

  return { success: true };
}

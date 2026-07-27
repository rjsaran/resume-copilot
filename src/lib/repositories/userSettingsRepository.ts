import { db } from "@/lib/db";
import type { LlmProvider, UserSettings } from "@prisma/client";

export function getUserSettings(userId: string): Promise<UserSettings | null> {
  return db.userSettings.findUnique({ where: { userId } });
}

const PROVIDER_KEY_FIELD = {
  GEMINI: "encryptedGeminiKey",
  CLAUDE: "encryptedClaudeKey",
  OPENAI: "encryptedOpenAiKey",
} as const;

export async function upsertProviderKey(
  userId: string,
  provider: LlmProvider,
  encryptedKey: string
): Promise<UserSettings> {
  const field = PROVIDER_KEY_FIELD[provider];
  return db.userSettings.upsert({
    where: { userId },
    create: { userId, activeProvider: provider, [field]: encryptedKey },
    update: { [field]: encryptedKey },
  });
}

export async function clearProviderKey(userId: string, provider: LlmProvider): Promise<UserSettings> {
  const field = PROVIDER_KEY_FIELD[provider];
  return db.userSettings.update({
    where: { userId },
    data: { [field]: null },
  });
}

export async function setActiveProvider(userId: string, provider: LlmProvider): Promise<UserSettings> {
  return db.userSettings.upsert({
    where: { userId },
    create: { userId, activeProvider: provider },
    update: { activeProvider: provider },
  });
}

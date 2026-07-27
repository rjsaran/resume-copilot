import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import type { LlmProvider, UserSettings } from "@/lib/db/schema";

export function getUserSettings(userId: string): Promise<UserSettings | undefined> {
  return db.query.userSettings.findFirst({ where: eq(userSettings.userId, userId) });
}

const PROVIDER_KEY_FIELD = {
  GEMINI: "encryptedGeminiKey",
  CLAUDE: "encryptedClaudeKey",
  OPENAI: "encryptedOpenAiKey",
  OPENROUTER: "encryptedOpenRouterKey",
} as const;

export async function upsertProviderKey(
  userId: string,
  provider: LlmProvider,
  encryptedKey: string
): Promise<UserSettings> {
  const field = PROVIDER_KEY_FIELD[provider];
  const [row] = await db
    .insert(userSettings)
    .values({ userId, activeProvider: provider, [field]: encryptedKey })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { [field]: encryptedKey, updatedAt: new Date() },
    })
    .returning();
  return row;
}

export async function clearProviderKey(userId: string, provider: LlmProvider): Promise<UserSettings> {
  const field = PROVIDER_KEY_FIELD[provider];
  const [row] = await db
    .update(userSettings)
    .set({ [field]: null, updatedAt: new Date() })
    .where(eq(userSettings.userId, userId))
    .returning();
  return row;
}

const PROVIDER_MODEL_FIELD = {
  GEMINI: "geminiModel",
  OPENROUTER: "openRouterModel",
} as const satisfies Partial<Record<LlmProvider, string>>;

export async function upsertProviderModel(
  userId: string,
  provider: LlmProvider,
  model: string | null
): Promise<UserSettings> {
  const field = PROVIDER_MODEL_FIELD[provider as keyof typeof PROVIDER_MODEL_FIELD];
  if (!field) {
    throw new Error(`Provider ${provider} does not support a model override.`);
  }
  const [row] = await db
    .insert(userSettings)
    .values({ userId, activeProvider: provider, [field]: model })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { [field]: model, updatedAt: new Date() },
    })
    .returning();
  return row;
}

export async function setActiveProvider(userId: string, provider: LlmProvider): Promise<UserSettings> {
  const [row] = await db
    .insert(userSettings)
    .values({ userId, activeProvider: provider })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { activeProvider: provider, updatedAt: new Date() },
    })
    .returning();
  return row;
}

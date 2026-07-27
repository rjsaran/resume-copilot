import { requireUser } from "@/lib/auth";
import { getUserSettings } from "@/lib/repositories/userSettingsRepository";
import { getKnowledgeBase } from "@/lib/repositories/knowledgeBaseRepository";
import { AnalyzeForm } from "@/components/analyze-form";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();

  const settings = await getUserSettings(user.id);

  let hasKnowledgeBase = false;
  try {
    hasKnowledgeBase = Boolean(await getKnowledgeBase(user.id));
  } catch {
    hasKnowledgeBase = false;
  }

  return (
    <AnalyzeForm
      hasApiKey={Boolean(settings?.encryptedGeminiKey)}
      hasKnowledgeBase={hasKnowledgeBase}
    />
  );
}

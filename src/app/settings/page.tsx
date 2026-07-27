import { requireUser } from "@/lib/auth";
import { getUserSettings } from "@/lib/repositories/userSettingsRepository";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await getUserSettings(user.id);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage the LLM provider used for job analysis and resume tailoring.
        </p>
      </div>
      <SettingsForm
        activeProvider={settings?.activeProvider ?? "GEMINI"}
        hasGeminiKey={Boolean(settings?.encryptedGeminiKey)}
        hasOpenRouterKey={Boolean(settings?.encryptedOpenRouterKey)}
      />
    </main>
  );
}

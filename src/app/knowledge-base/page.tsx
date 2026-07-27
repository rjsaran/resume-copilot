import { requireUser } from "@/lib/auth";
import { getKnowledgeBase } from "@/lib/repositories/knowledgeBaseRepository";
import { createEmptyKnowledgeBase } from "@/lib/resume/emptyKnowledgeBase";
import { KnowledgeBaseWorkspace } from "@/components/knowledge-base-workspace";

export default async function KnowledgeBasePage() {
  const user = await requireUser();
  const knowledgeBase = await getKnowledgeBase(user.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
        <p className="text-sm text-muted-foreground">
          Every job, project, skill, and education fact you have — the source tailored resumes
          and analyses are built from.
        </p>
      </div>
      <KnowledgeBaseWorkspace initialData={knowledgeBase ?? createEmptyKnowledgeBase()} />
    </main>
  );
}

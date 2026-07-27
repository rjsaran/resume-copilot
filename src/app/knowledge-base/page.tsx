import { requireUser } from "@/lib/auth";
import { getKnowledgeBase } from "@/lib/repositories/knowledgeBaseRepository";
import { createEmptyKnowledgeBase } from "@/lib/resume/emptyKnowledgeBase";
import { KnowledgeBaseWorkspace } from "@/components/knowledge-base-workspace";

export default async function KnowledgeBasePage() {
  const user = await requireUser();
  const knowledgeBase = await getKnowledgeBase(user.id);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
      <KnowledgeBaseWorkspace initialData={knowledgeBase ?? createEmptyKnowledgeBase()} />
    </main>
  );
}

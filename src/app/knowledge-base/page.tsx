import { requireUser } from "@/lib/auth";
import { getKnowledgeBase } from "@/lib/repositories/knowledgeBaseRepository";
import { createEmptyKnowledgeBase } from "@/lib/resume/emptyKnowledgeBase";
import { KnowledgeBaseEditor } from "@/components/knowledge-base-editor";
import { getCareerKnowledgeBaseFromDisk } from "@/lib/resume/careerKnowledgeBase";

export default async function KnowledgeBasePage() {
  const user = await requireUser();
  const knowledgeBase = await getKnowledgeBase(user.id);

  let hasSeedFile = false;
  try {
    await getCareerKnowledgeBaseFromDisk();
    hasSeedFile = true;
  } catch {
    hasSeedFile = false;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
      <KnowledgeBaseEditor
        initialData={knowledgeBase ?? createEmptyKnowledgeBase()}
        hasSeedFile={hasSeedFile}
      />
    </main>
  );
}

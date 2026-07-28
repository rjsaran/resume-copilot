import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getKnowledgeBase } from "@/lib/repositories/knowledgeBaseRepository";
import { createEmptyKnowledgeBase } from "@/lib/resume/emptyKnowledgeBase";
import { careerKnowledgeBaseToResumeData } from "@/lib/resume/knowledgeBaseToResumeData";
import { Resume } from "@/components/resume/Resume";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Master Resume" };

/**
 * The generic, non-tailored resume built straight from the knowledge base -
 * for job boards (LinkedIn, Instahyre, Wellfound, ...) that want one static
 * resume rather than a per-application tailored one. Rendered on the fly
 * from the knowledge base every time; nothing is persisted as a
 * ResumeVersion, since there's no application to attach one to and no
 * history/diffing need here. This is also the exact URL Playwright loads
 * for /api/resume/knowledge-base/pdf - see that route.
 */
export default async function KnowledgeBaseResumePreviewPage() {
  const user = await requireUser();
  const knowledgeBase = (await getKnowledgeBase(user.id)) ?? createEmptyKnowledgeBase();
  const data = careerKnowledgeBaseToResumeData(knowledgeBase);

  return (
    <div className="flex justify-center bg-neutral-200 py-6 print:bg-white print:py-0 dark:bg-neutral-950">
      <Resume data={data} theme="classic" />
    </div>
  );
}

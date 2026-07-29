import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getRenderCacheEntry } from "@/lib/repositories/resumeRenderCacheRepository";
import { Resume } from "@/components/resume/Resume";
import { isResumeData } from "@/types/resume";

export const dynamic = "force-dynamic";

/**
 * Renders an unsaved resume draft for PDF export - the ephemeral
 * counterpart to /resumes/[id]/preview. Playwright loads this exact URL
 * (see /api/resume/render/pdf), which is what lets "download PDF" work on
 * a draft that was never saved as a real resume version.
 */
export default async function ResumeRenderPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const entry = await getRenderCacheEntry(id);

  if (!entry || entry.userId !== user.id) {
    notFound();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(entry.resumeJson);
  } catch {
    parsed = null;
  }

  if (!isResumeData(parsed)) {
    notFound();
  }

  return (
    <div className="flex justify-center bg-neutral-200 py-6 print:bg-white print:py-0 dark:bg-neutral-950">
      <Resume data={parsed} theme="classic" />
    </div>
  );
}

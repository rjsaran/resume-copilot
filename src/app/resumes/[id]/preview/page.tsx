import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getResumeVersion } from "@/lib/repositories/resumeRepository";
import { Resume } from "@/components/resume/Resume";
import { isResumeData } from "@/types/resume";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const version = await getResumeVersion(id);
  return { title: version?.name ?? "Resume" };
}

/**
 * The single source of truth for what any resume looks like - base, public,
 * or tailored alike. This is what a user sees when previewing a resume, and
 * it's the exact URL Playwright loads to produce the exported PDF (see
 * /api/resume/[versionId]/pdf). There is no separate "print" rendering path.
 */
export default async function ResumePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const version = await getResumeVersion(id);

  if (!version || version.userId !== user.id) {
    notFound();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(version.resumeJson);
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

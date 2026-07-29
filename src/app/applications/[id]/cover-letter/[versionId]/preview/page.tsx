import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCoverLetterVersion } from "@/lib/repositories/coverLetterRepository";
import { CoverLetter } from "@/components/coverLetter/CoverLetter";
import { isCoverLetterData } from "@/types/coverLetter";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ versionId: string }>;
}): Promise<Metadata> {
  const { versionId } = await params;
  const version = await getCoverLetterVersion(versionId);
  return { title: version?.name ?? "Cover Letter" };
}

/**
 * This route is the single source of truth for what the cover letter looks
 * like: it's what the user sees when previewing a version, and it's the
 * exact URL Playwright loads to produce the exported PDF (see
 * /api/cover-letter/[versionId]/pdf). There is no separate "print" rendering
 * path.
 */
export default async function CoverLetterPreviewPage({
  params,
}: {
  params: Promise<{ id: string; versionId: string }>;
}) {
  const { id, versionId } = await params;
  const user = await requireUser();
  const version = await getCoverLetterVersion(versionId);

  if (!version || version.applicationId !== id || version.application.userId !== user.id) {
    notFound();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(version.coverLetterJson);
  } catch {
    parsed = null;
  }

  if (!isCoverLetterData(parsed)) {
    notFound();
  }

  return (
    <div className="flex justify-center bg-muted py-6 print:bg-white print:py-0">
      <CoverLetter data={parsed} />
    </div>
  );
}

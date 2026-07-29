import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getResumeVersion, getBaseResume } from "@/lib/repositories/resumeRepository";
import { isResumeData } from "@/types/resume";
import { ResumeDetailView } from "@/components/resumes/resume-detail-view";

export const dynamic = "force-dynamic";

export default async function ResumeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
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

  // The Diff view compares against the live base resume - never meaningful
  // for the base resume's own page (nothing to diff it against).
  let baseResume = null;
  if (version.type !== "BASE") {
    const baseRow = await getBaseResume(user.id);
    if (baseRow) {
      try {
        const baseParsed = JSON.parse(baseRow.resumeJson);
        if (isResumeData(baseParsed)) baseResume = baseParsed;
      } catch {
        // Ignore a corrupt base resume here - the diff tab just won't be available.
      }
    }
  }

  return (
    <ResumeDetailView
      resumeId={version.id}
      name={version.name}
      type={version.type}
      applicationId={version.applicationId}
      cameFromResumes={from === "resumes"}
      initialResume={parsed}
      baseResume={baseResume}
    />
  );
}

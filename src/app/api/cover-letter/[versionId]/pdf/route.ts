import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCoverLetterVersion } from "@/lib/repositories/coverLetterRepository";
import { generateResumePdf, ResumePdfError } from "@/lib/pdf/generateResumePdf";
import { logger, errorContext } from "@/lib/logger";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { versionId } = await params;
  const log = logger.child({ route: "/api/cover-letter/[versionId]/pdf", userId: user.id, versionId });

  const version = await getCoverLetterVersion(versionId);

  if (!version || version.application.userId !== user.id) {
    log.warn("PDF export blocked: cover letter version not found or not owned by user");
    return NextResponse.json({ error: "Cover letter version not found." }, { status: 404 });
  }

  const previewUrl = new URL(
    `/applications/${version.applicationId}/cover-letter/${version.id}/preview`,
    request.nextUrl.origin
  );

  // Forward the caller's own session cookies so Playwright's internal
  // request to the (auth-gated) preview route is authenticated as the same
  // user, instead of getting redirected to /sign-in.
  const cookies = request.cookies.getAll().map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    domain: previewUrl.hostname,
    path: "/",
  }));

  const startedAt = Date.now();
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateResumePdf(previewUrl.toString(), cookies);
  } catch (error) {
    log.error("PDF generation failed", { ...errorContext(error), durationMs: Date.now() - startedAt });
    const message =
      error instanceof ResumePdfError ? error.message : "Failed to generate PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  log.info("PDF generated", { durationMs: Date.now() - startedAt, bytes: pdfBuffer.length });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slugify(version.name)}.pdf"`,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getKnowledgeBase } from "@/lib/repositories/knowledgeBaseRepository";
import { generateResumePdf, ResumePdfError } from "@/lib/pdf/generateResumePdf";
import { logger, errorContext } from "@/lib/logger";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const log = logger.child({
    route: "/api/resume/knowledge-base/pdf",
    userId: user.id,
  });

  const knowledgeBase = await getKnowledgeBase(user.id);
  const filenameBase = knowledgeBase?.personal.fullName
    ? `${slugify(knowledgeBase.personal.fullName)}-resume`
    : "master-resume";

  const previewUrl = new URL(
    "/knowledge-base/resume/preview",
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
      "Content-Disposition": `attachment; filename="${filenameBase}.pdf"`,
    },
  });
}

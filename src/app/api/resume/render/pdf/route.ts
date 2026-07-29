import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  createRenderCacheEntry,
  deleteRenderCacheEntry,
} from "@/lib/repositories/resumeRenderCacheRepository";
import { generateResumePdf, ResumePdfError } from "@/lib/pdf/generateResumePdf";
import { isResumeData } from "@/types/resume";
import { logger, errorContext } from "@/lib/logger";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Exports a resume draft to PDF without requiring it to be saved first.
 * The draft is stashed in a short-lived render-cache row just long enough
 * for Playwright to load the matching preview route (reusing the same
 * page-navigation pipeline as saved resumes, so fonts/print CSS behave
 * identically) - the row is always deleted afterward, saved or not.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const log = logger.child({ route: "/api/resume/render/pdf", userId: user.id });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const resume =
    body && typeof body === "object" && "resume" in body
      ? (body as { resume: unknown }).resume
      : null;
  if (!isResumeData(resume)) {
    return NextResponse.json(
      { error: "Resume data did not match the expected shape." },
      { status: 400 },
    );
  }

  const cacheId = await createRenderCacheEntry(user.id, resume);
  const previewUrl = new URL(`/resumes/render/${cacheId}/preview`, request.nextUrl.origin);

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
  try {
    const pdfBuffer = await generateResumePdf(previewUrl.toString(), cookies);
    log.info("Draft PDF generated", {
      durationMs: Date.now() - startedAt,
      bytes: pdfBuffer.length,
    });
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${slugify(resume.basics.name || "resume")}.pdf"`,
      },
    });
  } catch (error) {
    log.error("Draft PDF generation failed", {
      ...errorContext(error),
      durationMs: Date.now() - startedAt,
    });
    const message = error instanceof ResumePdfError ? error.message : "Failed to generate PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await deleteRenderCacheEntry(cacheId);
  }
}

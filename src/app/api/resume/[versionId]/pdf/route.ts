import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getResumeVersion } from "@/lib/repositories/resumeRepository";
import { generateResumePdf, ResumePdfError } from "@/lib/pdf/generateResumePdf";

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
  const version = await getResumeVersion(versionId);

  if (!version || version.application.userId !== user.id) {
    return NextResponse.json({ error: "Resume version not found." }, { status: 404 });
  }

  const previewUrl = new URL(
    `/applications/${version.applicationId}/resume/${version.id}/preview`,
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

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateResumePdf(previewUrl.toString(), cookies);
  } catch (error) {
    const message =
      error instanceof ResumePdfError ? error.message : "Failed to generate PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slugify(version.name)}.pdf"`,
    },
  });
}

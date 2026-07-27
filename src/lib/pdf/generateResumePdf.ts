import type { Browser } from "playwright-core";
import { logger, errorContext } from "@/lib/logger";

export class ResumePdfError extends Error {}

export interface PdfCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
}

const log = logger.child({ module: "generateResumePdf" });

/**
 * The preview route sits behind auth middleware (it's also a real page a
 * signed-in user can open directly), so Playwright's internal request needs
 * the same session cookie or it gets redirected to /sign-in and "renders"
 * that instead of the resume.
 */
async function launchBrowser(): Promise<Browser> {
  // Vercel's serverless runtime can't run full Playwright (no bundled
  // browser download at build time fits the function size limit), so it
  // uses playwright-core driving @sparticuz/chromium's Lambda-compatible
  // binary. Locally, that same binary doesn't run on macOS/Windows, so dev
  // uses the full `playwright` package's own bundled Chromium instead.
  if (process.env.VERCEL) {
    log.debug("Launching @sparticuz/chromium (Vercel runtime)");
    const [{ chromium }, chromiumBinary] = await Promise.all([
      import("playwright-core"),
      import("@sparticuz/chromium").then((m) => m.default),
    ]);
    return chromium.launch({
      args: chromiumBinary.args,
      executablePath: await chromiumBinary.executablePath(),
      headless: true,
    });
  }

  log.debug("Launching local Playwright Chromium (dev runtime)");
  const { chromium } = await import("playwright");
  return chromium.launch();
}

/**
 * Renders a URL (the resume preview route) to a pixel-perfect A4 PDF using
 * a headless Chromium instance. `preferCSSPageSize` makes Chromium honor
 * the page's own `@page` CSS (size + margins) instead of Playwright's JS
 * options, which is what guarantees the exported PDF matches the on-screen
 * preview exactly — both are governed by the same stylesheet.
 */
export async function generateResumePdf(url: string, cookies: PdfCookie[] = []): Promise<Buffer> {
  let browser: Browser;
  try {
    browser = await launchBrowser();
  } catch (error) {
    log.error("Browser launch failed", errorContext(error));
    throw new ResumePdfError(
      error instanceof Error
        ? `Failed to launch the PDF renderer: ${error.message}`
        : "Failed to launch the PDF renderer."
    );
  }

  try {
    const context = await browser.newContext();
    if (cookies.length > 0) {
      await context.addCookies(cookies);
    }

    const page = await context.newPage();
    const response = await page.goto(url, { waitUntil: "networkidle" });

    if (!response || !response.ok()) {
      log.error("Preview page failed to load", { status: response?.status() ?? null });
      throw new ResumePdfError(
        `Could not load the resume preview (status ${response?.status() ?? "unknown"}).`
      );
    }

    // Ensure the self-hosted resume font has finished loading before we
    // snapshot the page — otherwise a fallback font can get baked into the PDF.
    await page.evaluate(() => document.fonts.ready);

    const pdfBuffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

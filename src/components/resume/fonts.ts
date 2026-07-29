import { Carlito } from "next/font/google";

/**
 * The resume renderer uses its own self-hosted font (via next/font), rather
 * than the app UI's font - this guarantees the exact same glyphs render
 * whether the page is viewed on screen or captured by Playwright for PDF
 * export, regardless of what fonts happen to be installed on the host OS.
 *
 * Carlito is a metric-compatible clone of Calibri - the default Microsoft
 * Word resume font for over a decade and still the most common resume font
 * in practice, so it reads as familiar and safely ATS-friendly.
 */
export const resumeFont = Carlito({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

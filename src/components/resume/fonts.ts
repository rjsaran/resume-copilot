import { Inter } from "next/font/google";

/**
 * The resume renderer uses its own self-hosted font (via next/font), rather
 * than the app UI's font — this guarantees the exact same glyphs render
 * whether the page is viewed on screen or captured by Playwright for PDF
 * export, regardless of what fonts happen to be installed on the host OS.
 */
export const resumeFont = Inter({
  subsets: ["latin"],
  display: "swap",
});

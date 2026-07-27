import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const nextConfig: NextConfig = {
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  // playwright-core + @sparticuz/chromium are only ever require()'d at
  // runtime inside the PDF export route (see lib/pdf/generateResumePdf.ts),
  // never imported statically — keep them out of the webpack bundle so
  // Next.js instead traces and ships their files as-is for the serverless
  // function, which is what @sparticuz/chromium's binary needs.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
};

export default nextConfig;

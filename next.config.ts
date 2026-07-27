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
  // Prisma's generated client (custom output path, not the default
  // node_modules/.prisma/client) confuses Next.js's file tracing on
  // Vercel — the query engine .so.node binary gets pruned from the
  // deployed function bundle even though `prisma generate` produced it
  // at build time. Force-include the whole generated directory so the
  // engine binary always ships. See https://pris.ly/engine-not-found-tooling-investigation
  outputFileTracingIncludes: {
    "/**": ["./src/generated/prisma/**/*"],
  },
};

export default nextConfig;

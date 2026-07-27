import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const nextConfig: NextConfig = {
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  // playwright-core + @sparticuz/chromium are only ever require()'d at
  // runtime inside the PDF export route (see lib/pdf/generateResumePdf.ts),
  // never imported statically - keep them out of the webpack bundle so
  // Next.js instead traces and ships their files as-is for the serverless
  // function, which is what @sparticuz/chromium's binary needs.
  //
  // ws (via @neondatabase/serverless's neon-serverless driver, see
  // lib/db/index.ts) conditionally requires the optional native
  // `bufferutil` package with a try/catch fallback to a pure-JS
  // implementation when it's not installed (it isn't, here). Webpack
  // bundling that conditional require breaks the fallback - it resolves
  // to something that isn't a real error, so the catch never fires, but
  // the result also isn't a working bufferutil, causing
  // "bufferUtil.mask is not a function". Excluding ws keeps the require
  // native so the try/catch behaves correctly.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium", "ws"],
};

export default nextConfig;

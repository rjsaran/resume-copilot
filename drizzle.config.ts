import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Only fall back to the local dotenv files when DATABASE_URL isn't already
// set - db:push:prod injects it beforehand (via `dotenv -e .env.production`),
// and .env.local's `override: true` would otherwise clobber that with the
// local Postgres URL.
if (!process.env.DATABASE_URL) {
  config({ path: ".env" });
  config({ path: ".env.local", override: true });
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});

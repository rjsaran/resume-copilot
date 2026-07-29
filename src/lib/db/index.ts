import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool as PgPool } from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof createDb> | undefined;
};

/**
 * @neondatabase/serverless's Pool speaks Neon's own WebSocket proxy
 * protocol - it can't reach a plain Postgres server. Local dev points
 * DATABASE_URL at a local Postgres instead of Neon (see .env.local), so the
 * driver is picked by connection string: Neon in production, plain
 * node-postgres (`pg`) everywhere else. Both expose the same drizzle query
 * interface, so nothing downstream needs to know which one is active.
 */
function createDb() {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString?.includes(".neon.tech")) {
    return drizzleNeon({ client: new NeonPool({ connectionString }), schema });
  }
  return drizzlePg({ client: new PgPool({ connectionString }), schema });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}

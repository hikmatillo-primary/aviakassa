import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "./schema";

let _db: any = null;

export function getDb() {
  // 1. Cloudflare Workers muhitida (D1 bazasi bilan)
  try {
    const ctx = getCloudflareContext() as any;
    if (ctx && ctx.env && ctx.env.DB) {
      return drizzleD1(ctx.env.DB, { schema });
    }
  } catch {
    // Cloudflare konteksti yo'q bo'lsa (masalan local dev)
  }

  if (_db) return _db;

  // 2. Mahalliy kompyuterda (Local dev - LibSQL / SQLite)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require("@libsql/client");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle: drizzleLibsql } = require("drizzle-orm/libsql");

    const url = process.env.DATABASE_URL || "file:local.db";
    const authToken = process.env.DATABASE_AUTH_TOKEN;

    const client = createClient({
      url,
      authToken,
    });

    _db = drizzleLibsql(client, { schema });
    return _db;
  } catch (err) {
    console.error("Local DB client error:", err);
    return null;
  }
}

export { schema };

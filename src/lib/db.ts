import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  try {
    const ctx = getCloudflareContext() as any;
    if (ctx && ctx.env && ctx.env.DB) {
      return drizzle(ctx.env.DB, { schema });
    }
  } catch {
    // Cloudflare konteksti yo'q bo'lsa (masalan build yoki SSR vaqti)
  }

  return null as any;
}

export { schema };

import { createClient } from "@libsql/client";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import * as schema from "./schema";

let _db: any = null;

// Avtomatik jadvallarni yaratish (CREATE TABLE IF NOT EXISTS)
async function ensureTables(client: any) {
  const initSql = `
    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      phone TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_number TEXT NOT NULL,
      route TEXT NOT NULL,
      flight_date TEXT NOT NULL,
      flight_number TEXT,
      supplier_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
      total_qty INTEGER NOT NULL,
      remaining_qty INTEGER NOT NULL,
      buy_price REAL NOT NULL,
      total_cost REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
      client_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
      qty INTEGER NOT NULL,
      sell_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      profit REAL NOT NULL,
      passenger_names TEXT,
      sale_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'CASH',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    if (client.batch) {
      const statements = initSql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      for (const statement of statements) {
        await client.execute(statement);
      }
    }
  } catch (err) {
    console.error("ensureTables error:", err);
  }
}

let initialized = false;

export function getDb() {
  if (_db) return _db;

  // 1. Agar Cloudflare D1 mavjud bo'lsa (OpenNext orqali)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    if (ctx && ctx.env && ctx.env.DB) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { drizzle: drizzleD1 } = require("drizzle-orm/d1");
      _db = drizzleD1(ctx.env.DB, { schema });
      return _db;
    }
  } catch {
    // Cloudflare konteksti yo'q bo'lsa (masalan local dev)
  }

  // 2. Mahalliy yoki Turso bazasi (LibSQL / SQLite)
  const url = process.env.DATABASE_URL || "file:local.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  const client = createClient({
    url,
    authToken,
  });

  if (!initialized) {
    initialized = true;
    ensureTables(client).catch((e) => console.error("DB init error:", e));
  }

  _db = drizzleLibsql(client, { schema });
  return _db;
}

export const db = getDb();
export { schema };

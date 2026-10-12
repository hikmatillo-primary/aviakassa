import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const partners = sqliteTable("partners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: ["SUPPLIER", "CLIENT"] }).notNull(),
  phone: text("phone"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const batches = sqliteTable("batches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  batchNumber: text("batch_number").notNull(),
  route: text("route").notNull(), // masalan: TAS - DXB
  flightDate: text("flight_date").notNull(), // 2026-10-25
  flightNumber: text("flight_number"), // masalan: HY-333
  supplierId: integer("supplier_id")
    .notNull()
    .references(() => partners.id, { onDelete: "cascade" }),
  totalQty: integer("total_qty").notNull(),
  remainingQty: integer("remaining_qty").notNull(),
  buyPrice: real("buy_price").notNull(), // 1 ta chipta tannarxi (USD)
  totalCost: real("total_cost").notNull(), // Jami tannarx (USD)
  status: text("status", { enum: ["ACTIVE", "COMPLETED", "CANCELLED"] })
    .notNull()
    .default("ACTIVE"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  batchId: integer("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  clientId: integer("client_id")
    .notNull()
    .references(() => partners.id, { onDelete: "cascade" }),
  qty: integer("qty").notNull(),
  sellPrice: real("sell_price").notNull(), // 1 ta chipta sotish narxi (USD)
  totalAmount: real("total_amount").notNull(), // Jami sotuv (USD)
  profit: real("profit").notNull(), // Sof foyda: (sellPrice - buyPrice) * qty
  passengerNames: text("passenger_names"), // Yo'lovchilar ismi yoki PNR
  saleDate: text("sale_date").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  partnerId: integer("partner_id")
    .notNull()
    .references(() => partners.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["INCOME", "EXPENSE"] }).notNull(), 
  // INCOME = Mijozdan qarz to'lovi keldi (Bizning kassa ko'paydi)
  // EXPENSE = Ta'minotchiga qarz to'landi (Bizning kassa kamaydi)
  amount: real("amount").notNull(), // USD
  paymentDate: text("payment_date").notNull(),
  paymentMethod: text("payment_method").default("CASH"), // CASH, BANK, CARD
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

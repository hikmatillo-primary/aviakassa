const { createClient } = require("@libsql/client");

async function seed() {
  const client = createClient({ url: "file:local.db" });

  console.log("Creating tables if not exist...");
  await client.execute(`
    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      phone TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.execute(`
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
  `);

  await client.execute(`
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
  `);

  await client.execute(`
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
  `);

  const existing = await client.execute("SELECT count(*) as cnt FROM partners");
  if (existing.rows[0].cnt > 0) {
    console.log("Data already exists in local.db");
    return;
  }

  console.log("Seeding realistic sample data...");

  // Partners
  await client.execute({
    sql: "INSERT INTO partners (name, type, phone, notes) VALUES (?, ?, ?, ?)",
    args: ["FlyDubai Bosh Diler", "SUPPLIER", "+998 90 111-22-33", "Dubay yo'nalishlari asosiy ta'minotchisi"],
  });
  await client.execute({
    sql: "INSERT INTO partners (name, type, phone, notes) VALUES (?, ?, ?, ?)",
    args: ["Air Arabia Blok Hamkor", "SUPPLIER", "+998 93 444-55-66", "Sharja va Jidda yo'nalishlari"],
  });
  await client.execute({
    sql: "INSERT INTO partners (name, type, phone, notes) VALUES (?, ?, ?, ?)",
    args: ["Samarqand Turizm Agentligi", "CLIENT", "+998 97 777-88-99", "Sub-agent (Har partiyadan 10-15 talab oladi)"],
  });
  await client.execute({
    sql: "INSERT INTO partners (name, type, phone, notes) VALUES (?, ?, ?, ?)",
    args: ["Aliyev Sherzod", "CLIENT", "+998 99 123-45-67", "Chakana mijoz (Oilaviy sayohat)"],
  });

  // Batches
  await client.execute({
    sql: `INSERT INTO batches (batch_number, route, flight_date, flight_number, supplier_id, total_qty, remaining_qty, buy_price, total_cost, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["P-DXB-101", "Toshkent - Dubay (TAS-DXB)", "2026-10-25", "FZ-780", 1, 40, 25, 320, 12800, "ACTIVE", "Ertalabki qulay reys"],
  });

  await client.execute({
    sql: `INSERT INTO batches (batch_number, route, flight_date, flight_number, supplier_id, total_qty, remaining_qty, buy_price, total_cost, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["P-JED-202", "Toshkent - Jidda (TAS-JED)", "2026-11-05", "G9-551", 2, 50, 40, 380, 19000, "ACTIVE", "Umra mavsumi bloki"],
  });

  // Sales
  // 10 tickets to Samarqand Turizm
  await client.execute({
    sql: `INSERT INTO sales (batch_id, client_id, qty, sell_price, total_amount, profit, passenger_names, sale_date, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [1, 3, 10, 370, 3700, 500, "10 kishilik guruh (Samarqand)", "2026-10-10", "Sub-agentga sotildi"],
  });

  // 10 tickets to Samarqand Turizm (Jidda)
  await client.execute({
    sql: `INSERT INTO sales (batch_id, client_id, qty, sell_price, total_amount, profit, passenger_names, sale_date, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [2, 3, 10, 440, 4400, 600, "Umra ziyoratchilari (10 kishi)", "2026-10-11", "Umra guruhi"],
  });

  // 5 tickets to Aliyev Sherzod
  await client.execute({
    sql: `INSERT INTO sales (batch_id, client_id, qty, sell_price, total_amount, profit, passenger_names, sale_date, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [1, 4, 5, 400, 2000, 400, "Aliyev Sherzod + 4 oila a'zosi", "2026-10-12", "Chakana sotuv"],
  });

  // Payments
  // Samarqand Turizm 5000 $ to'ladi
  await client.execute({
    sql: `INSERT INTO payments (partner_id, type, amount, payment_date, payment_method, notes)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [3, "INCOME", 5000, "2026-10-11", "BANK", "Qisman qarz to'lovi"],
  });

  // FlyDubai ga 8000 $ to'ladik
  await client.execute({
    sql: `INSERT INTO payments (partner_id, type, amount, payment_date, payment_method, notes)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [1, "EXPENSE", 8000, "2026-10-10", "BANK", "Partiya P-DXB-101 uchun avans to'lov"],
  });

  console.log("Seeding completed successfully!");
}

seed().catch(console.error);

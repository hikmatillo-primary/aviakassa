"use server";

import { revalidatePath } from "next/cache";
import { getDb, schema } from "./db";
import { eq, desc, sql } from "drizzle-orm";

const { partners, batches, sales, payments } = schema;

// ==========================================
// 1. STATISTIKA VA DASHBOARD HISOB-KITOBLARI
// ==========================================
export async function getDashboardStats() {
  const db = getDb();

  // Hamkorlar ro'yxati
  const allPartners = await db.select().from(partners);
  const allBatches = await db.select().from(batches);
  const allSales = await db.select().from(sales);
  const allPayments = await db.select().from(payments);

  // 1. Jami sof foyda
  const totalProfit = allSales.reduce((acc: number, item: any) => acc + (item.profit || 0), 0);

  // 2. Partiyalardagi jami bo'sh joylar (qoldiq chiptalar)
  const totalRemainingTickets = allBatches.reduce(
    (acc: number, item: any) => (item.status === "ACTIVE" ? acc + (item.remainingQty || 0) : acc),
    0
  );

  // 3. Jami faol partiyalar soni
  const activeBatchesCount = allBatches.filter((b: any) => b.status === "ACTIVE").length;

  // 4. Kreditorlik (Bizning ta'minotchilarga qarzimiz):
  // Ta'minotchi qarz = Jami ta'minotchi partiyalari qiymati (totalCost) - Biz to'lagan to'lovlar (EXPENSE)
  let ourDebtToSuppliers = 0;
  const suppliers = allPartners.filter((p: any) => p.type === "SUPPLIER");
  for (const sup of suppliers) {
    const supBatchesCost = allBatches
      .filter((b: any) => b.supplierId === sup.id)
      .reduce((sum: number, b: any) => sum + (b.totalCost || 0), 0);
    const supPaid = allPayments
      .filter((p: any) => p.partnerId === sup.id && p.type === "EXPENSE")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const balance = supBatchesCost - supPaid;
    if (balance > 0) {
      ourDebtToSuppliers += balance;
    }
  }

  // 5. Debitorlik (Mijozlar/Agentlarning bizdan qarzi - Bizning haqimiz):
  // Mijoz qarz = Jami unga qilingan sotuvlar (totalAmount) - Mijoz to'lagan to'lovlar (INCOME)
  let clientDebtToUs = 0;
  const clients = allPartners.filter((p: any) => p.type === "CLIENT");
  for (const client of clients) {
    const clientSalesAmount = allSales
      .filter((s: any) => s.clientId === client.id)
      .reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
    const clientPaid = allPayments
      .filter((p: any) => p.partnerId === client.id && p.type === "INCOME")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const balance = clientSalesAmount - clientPaid;
    if (balance > 0) {
      clientDebtToUs += balance;
    }
  }

  // 6. Kassa sof harakati (Tushgan pul - Chiqqan to'lov)
  const totalIncome = allPayments
    .filter((p: any) => p.type === "INCOME")
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const totalExpense = allPayments
    .filter((p: any) => p.type === "EXPENSE")
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const cashBalance = totalIncome - totalExpense;

  return {
    totalProfit,
    totalRemainingTickets,
    activeBatchesCount,
    ourDebtToSuppliers, // Bizning qarzimiz
    clientDebtToUs,     // Bizning haqimiz
    totalIncome,
    totalExpense,
    cashBalance,
    totalSalesCount: allSales.length,
  };
}

// ==========================================
// 2. HAMKORLAR (PARTNERS)
// ==========================================
export async function getPartnersWithBalances() {
  const db = getDb();
  const allPartners = await db.select().from(partners).orderBy(desc(partners.id));
  const allBatches = await db.select().from(batches);
  const allSales = await db.select().from(sales);
  const allPayments = await db.select().from(payments);

  return allPartners.map((partner: any) => {
    let totalDeal = 0;
    let totalPaid = 0;

    if (partner.type === "SUPPLIER") {
      // Ta'minotchi uchun: jami partiya qiymati va biz to'lagan summa
      totalDeal = allBatches
        .filter((b: any) => b.supplierId === partner.id)
        .reduce((sum: number, b: any) => sum + (b.totalCost || 0), 0);
      totalPaid = allPayments
        .filter((p: any) => p.partnerId === partner.id && p.type === "EXPENSE")
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    } else {
      // Mijoz uchun: jami sotuv summasi va u to'lagan summa
      totalDeal = allSales
        .filter((s: any) => s.clientId === partner.id)
        .reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
      totalPaid = allPayments
        .filter((p: any) => p.partnerId === partner.id && p.type === "INCOME")
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    }

    const balance = totalDeal - totalPaid; 
    // SUPPLIER: balance > 0 -> biz qarzdormiz
    // CLIENT: balance > 0 -> mijoz qarzdor (bizning haqimiz)

    return {
      ...partner,
      totalDeal,
      totalPaid,
      balance,
    };
  });
}

export async function createPartner(formData: FormData) {
  const db = getDb();
  const name = formData.get("name") as string;
  const type = formData.get("type") as "SUPPLIER" | "CLIENT";
  const phone = formData.get("phone") as string;
  const notes = formData.get("notes") as string;

  if (!name || !type) {
    throw new Error("Nom va tur majburiy!");
  }

  await db.insert(partners).values({
    name,
    type,
    phone: phone || null,
    notes: notes || null,
  });

  revalidatePath("/");
  return { success: true };
}

// Hamkorning to'liq tarixi (Sverka)
export async function getPartnerHistory(partnerId: number) {
  const db = getDb();
  const partner = await db.select().from(partners).where(eq(partners.id, partnerId)).get();
  if (!partner) return null;

  const partnerPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.partnerId, partnerId))
    .orderBy(desc(payments.id));

  let deals: any[] = [];
  if (partner.type === "SUPPLIER") {
    deals = await db
      .select()
      .from(batches)
      .where(eq(batches.supplierId, partnerId))
      .orderBy(desc(batches.id));
  } else {
    deals = await db
      .select({
        id: sales.id,
        batchId: sales.batchId,
        qty: sales.qty,
        sellPrice: sales.sellPrice,
        totalAmount: sales.totalAmount,
        profit: sales.profit,
        passengerNames: sales.passengerNames,
        saleDate: sales.saleDate,
        notes: sales.notes,
        route: batches.route,
        flightDate: batches.flightDate,
      })
      .from(sales)
      .leftJoin(batches, eq(sales.batchId, batches.id))
      .where(eq(sales.clientId, partnerId))
      .orderBy(desc(sales.id));
  }

  return {
    partner,
    deals,
    payments: partnerPayments,
  };
}

// ==========================================
// 3. PARTIYALAR (BATCHES / BLOKLAR)
// ==========================================
export async function getBatchesWithDetails() {
  const db = getDb();
  const allBatches = await db
    .select({
      id: batches.id,
      batchNumber: batches.batchNumber,
      route: batches.route,
      flightDate: batches.flightDate,
      flightNumber: batches.flightNumber,
      supplierId: batches.supplierId,
      supplierName: partners.name,
      totalQty: batches.totalQty,
      remainingQty: batches.remainingQty,
      buyPrice: batches.buyPrice,
      totalCost: batches.totalCost,
      status: batches.status,
      notes: batches.notes,
      createdAt: batches.createdAt,
    })
    .from(batches)
    .leftJoin(partners, eq(batches.supplierId, partners.id))
    .orderBy(desc(batches.id));

  return allBatches;
}

export async function createBatch(formData: FormData) {
  const db = getDb();
  const batchNumber = (formData.get("batchNumber") as string) || `P-${Date.now().toString().slice(-4)}`;
  const route = formData.get("route") as string;
  const flightDate = formData.get("flightDate") as string;
  const flightNumber = formData.get("flightNumber") as string;
  const supplierId = Number(formData.get("supplierId"));
  const totalQty = Number(formData.get("totalQty"));
  const buyPrice = Number(formData.get("buyPrice"));
  const notes = formData.get("notes") as string;

  if (!route || !flightDate || !supplierId || !totalQty || !buyPrice) {
    throw new Error("Barcha maydonlarni to'ldiring!");
  }

  const totalCost = totalQty * buyPrice;

  await db.insert(batches).values({
    batchNumber,
    route,
    flightDate,
    flightNumber: flightNumber || null,
    supplierId,
    totalQty,
    remainingQty: totalQty,
    buyPrice,
    totalCost,
    status: "ACTIVE",
    notes: notes || null,
  });

  revalidatePath("/");
  return { success: true };
}

export async function toggleBatchStatus(batchId: number, currentStatus: string) {
  const db = getDb();
  const newStatus = currentStatus === "ACTIVE" ? "COMPLETED" : "ACTIVE";
  await db.update(batches).set({ status: newStatus as any }).where(eq(batches.id, batchId));
  revalidatePath("/");
  return { success: true };
}

// ==========================================
// 4. SOTUVLAR (SALES)
// ==========================================
export async function getSalesWithDetails() {
  const db = getDb();
  const allSales = await db
    .select({
      id: sales.id,
      batchId: sales.batchId,
      clientId: sales.clientId,
      clientName: partners.name,
      qty: sales.qty,
      sellPrice: sales.sellPrice,
      totalAmount: sales.totalAmount,
      profit: sales.profit,
      passengerNames: sales.passengerNames,
      saleDate: sales.saleDate,
      notes: sales.notes,
      route: batches.route,
      flightDate: batches.flightDate,
      flightNumber: batches.flightNumber,
      buyPrice: batches.buyPrice,
    })
    .from(sales)
    .leftJoin(partners, eq(sales.clientId, partners.id))
    .leftJoin(batches, eq(sales.batchId, batches.id))
    .orderBy(desc(sales.id));

  return allSales;
}

export async function createSale(formData: FormData) {
  const db = getDb();
  const batchId = Number(formData.get("batchId"));
  const clientId = Number(formData.get("clientId"));
  const qty = Number(formData.get("qty"));
  const sellPrice = Number(formData.get("sellPrice"));
  const passengerNames = formData.get("passengerNames") as string;
  const saleDate = (formData.get("saleDate") as string) || new Date().toISOString().split("T")[0];
  const notes = formData.get("notes") as string;

  if (!batchId || !clientId || !qty || !sellPrice) {
    throw new Error("Ma'lumotlar to'liq emas!");
  }

  // Partiyani tekshirish
  const batch = await db.select().from(batches).where(eq(batches.id, batchId)).get();
  if (!batch) {
    throw new Error("Partiya topilmadi!");
  }

  if (batch.remainingQty < qty) {
    throw new Error(`Partiyada yetarli chipta yo'q! Mavjud: ${batch.remainingQty} ta`);
  }

  const totalAmount = qty * sellPrice;
  const profit = (sellPrice - batch.buyPrice) * qty;
  const newRemaining = batch.remainingQty - qty;

  // 1. Sotuvni saqlash
  await db.insert(sales).values({
    batchId,
    clientId,
    qty,
    sellPrice,
    totalAmount,
    profit,
    passengerNames: passengerNames || null,
    saleDate,
    notes: notes || null,
  });

  // 2. Partiya qoldig'ini yangilash
  await db
    .update(batches)
    .set({
      remainingQty: newRemaining,
      status: newRemaining === 0 ? "COMPLETED" : batch.status,
    })
    .where(eq(batches.id, batchId));

  // Agar darhol to'lov kiritilgan bo'lsa (ixtiyoriy)
  const paidNow = Number(formData.get("paidNow") || 0);
  if (paidNow > 0) {
    await db.insert(payments).values({
      partnerId: clientId,
      type: "INCOME",
      amount: paidNow,
      paymentDate: saleDate,
      paymentMethod: (formData.get("paymentMethod") as string) || "CASH",
      notes: `Sotuv uchun to'lov (${qty} ta chipta)`,
    });
  }

  revalidatePath("/");
  return { success: true };
}

// ==========================================
// 5. TO'LOVLAR (KASSA - PAYMENTS)
// ==========================================
export async function getPaymentsWithDetails() {
  const db = getDb();
  const allPayments = await db
    .select({
      id: payments.id,
      partnerId: payments.partnerId,
      partnerName: partners.name,
      partnerType: partners.type,
      type: payments.type,
      amount: payments.amount,
      paymentDate: payments.paymentDate,
      paymentMethod: payments.paymentMethod,
      notes: payments.notes,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .leftJoin(partners, eq(payments.partnerId, partners.id))
    .orderBy(desc(payments.id));

  return allPayments;
}

export async function createPayment(formData: FormData) {
  const db = getDb();
  const partnerId = Number(formData.get("partnerId"));
  const type = formData.get("type") as "INCOME" | "EXPENSE";
  const amount = Number(formData.get("amount"));
  const paymentDate = (formData.get("paymentDate") as string) || new Date().toISOString().split("T")[0];
  const paymentMethod = (formData.get("paymentMethod") as string) || "CASH";
  const notes = formData.get("notes") as string;

  if (!partnerId || !type || !amount) {
    throw new Error("Hamkor, to'lov turi va miqdori ko'rsatilishi shart!");
  }

  await db.insert(payments).values({
    partnerId,
    type,
    amount,
    paymentDate,
    paymentMethod,
    notes: notes || null,
  });

  revalidatePath("/");
  return { success: true };
}

// ==========================================
// 6. INITIAL DEMO SEED
// ==========================================
export async function seedInitialDemoData() {
  const db = getDb();
  const existingPartners = await db.select().from(partners);
  if (existingPartners.length > 0) {
    return { success: false, message: "Bazada ma'lumotlar allaqachon mavjud." };
  }

  // 1. Ta'minotchilar
  const [sup1] = await db
    .insert(partners)
    .values({
      name: "FlyDubai Bosh Diler",
      type: "SUPPLIER",
      phone: "+998 90 111-22-33",
      notes: "Dubay yo'nalishlari bo'yicha asosiy hamkor",
    })
    .returning();

  const [sup2] = await db
    .insert(partners)
    .values({
      name: "Air Arabia Blok Hamkor",
      type: "SUPPLIER",
      phone: "+998 93 444-55-66",
      notes: "Sharja va Jidda yo'nalishlari",
    })
    .returning();

  // 2. Mijozlar / Sub-agentlar
  const [client1] = await db
    .insert(partners)
    .values({
      name: "Samarqand Turizm Agentligi (Sub-agent)",
      type: "CLIENT",
      phone: "+998 97 777-88-99",
      notes: "Har partiyadan 10-15 talab oladi",
    })
    .returning();

  const [client2] = await db
    .insert(partners)
    .values({
      name: "Aliyev Sherzod (Chakana mijoz)",
      type: "CLIENT",
      phone: "+998 99 123-45-67",
      notes: "Oilaviy sayohat",
    })
    .returning();

  // 3. Partiyalar
  const [batch1] = await db
    .insert(batches)
    .values({
      batchNumber: "P-DXB-101",
      route: "Toshkent - Dubay (TAS-DXB)",
      flightDate: "2026-10-25",
      flightNumber: "FZ-780",
      supplierId: sup1.id,
      totalQty: 40,
      remainingQty: 25, // 15 tasi sotildi
      buyPrice: 320,
      totalCost: 12800, // 40 * 320
      status: "ACTIVE",
      notes: "Ertalabki qulay reys",
    })
    .returning();

  const [batch2] = await db
    .insert(batches)
    .values({
      batchNumber: "P-JED-202",
      route: "Toshkent - Jidda (TAS-JED)",
      flightDate: "2026-11-05",
      flightNumber: "G9-551",
      supplierId: sup2.id,
      totalQty: 50,
      remainingQty: 40, // 10 tasi sotildi
      buyPrice: 380,
      totalCost: 19000, // 50 * 380
      status: "ACTIVE",
      notes: "Umra mavsumi bloki",
    })
    .returning();

  // 4. Sotuvlar
  // 1-sotuv: Samarqand turizmga 10 ta Toshkent-Dubay
  await db.insert(sales).values({
    batchId: batch1.id,
    clientId: client1.id,
    qty: 10,
    sellPrice: 370,
    totalAmount: 3700,
    profit: (370 - 320) * 10, // 500 $
    passengerNames: "10 kishilik guruh (Samarqand)",
    saleDate: "2026-10-10",
  });

  // 2-sotuv: Samarqand turizmga 10 ta Jidda
  await db.insert(sales).values({
    batchId: batch2.id,
    clientId: client1.id,
    qty: 10,
    sellPrice: 440,
    totalAmount: 4400,
    profit: (440 - 380) * 10, // 600 $
    passengerNames: "Umra ziyoratchilari (10 kishi)",
    saleDate: "2026-10-11",
  });

  // 3-sotuv: Aliyev Sherzodga 5 ta Dubay (donalab)
  await db.insert(sales).values({
    batchId: batch1.id,
    clientId: client2.id,
    qty: 5,
    sellPrice: 400,
    totalAmount: 2000,
    profit: (400 - 320) * 5, // 400 $
    passengerNames: "Aliyev Sherzod + 4 oila a'zosi",
    saleDate: "2026-10-12",
  });

  // 5. To'lovlar
  // Samarqand turizm 5000 $ to'ladi (Jami olgani 3700 + 4400 = 8100 $, qarzi 3100 $ qoldi)
  await db.insert(payments).values({
    partnerId: client1.id,
    type: "INCOME",
    amount: 5000,
    paymentDate: "2026-10-11",
    paymentMethod: "BANK",
    notes: "Qisman to'lov",
  });

  // Biz FlyDubai ga 8000 $ to'ladik (Jami olganimiz 12800 $, qarzimiz 4800 $ qoldi)
  await db.insert(payments).values({
    partnerId: sup1.id,
    type: "EXPENSE",
    amount: 8000,
    paymentDate: "2026-10-10",
    paymentMethod: "BANK",
    notes: "Partiya P-DXB-101 uchun avans to'lov",
  });

  revalidatePath("/");
  return { success: true, message: "Demo ma'lumotlar muvaffaqiyatli yuklandi!" };
}

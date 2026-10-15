import assert from "node:assert/strict";
import { calculateEnrichedData } from "./src/lib/storage";
import type {
  AviakassaData,
  Partner,
  Batch,
  Sale,
  Payment,
  DebtOffset,
} from "./src/lib/storage";

console.log("==========================================");
console.log("   AVIAKASSA BIZNES-MANTIQ TESTLARI       ");
console.log("==========================================\n");

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Xato: ${err.message}`);
    failed++;
  }
}

// ----------------------------------------------------
// 1. Partiya hisob-kitobi (Tannarx, qoldiq, jami qiymat)
// ----------------------------------------------------
test("1. Partiya xaridi va tannarx hisob-kitobi", () => {
  const partners: Partner[] = [
    { id: 1, name: "FlyDubai", createdAt: "2026-10-01" },
  ];
  const batches: Batch[] = [
    {
      id: 101,
      batchNumber: "P-DXB-01",
      route: "TAS - DXB",
      flightDate: "2026-11-01",
      supplierId: 1,
      totalQty: 50,
      remainingQty: 50,
      buyPrice: 300,
      totalCost: 15000,
      status: "ACTIVE",
      createdAt: "2026-10-01",
    },
  ];

  const data: AviakassaData = {
    partners,
    batches,
    sales: [],
    payments: [],
    debtOffsets: [],
  };

  const enriched = calculateEnrichedData(data);
  const b = enriched.batches[0];

  assert.equal(b.totalCost, 15000, "Jami tannarx 50 * 300 = 15000 bo'lishi kerak");
  assert.equal(b.supplierName, "FlyDubai", "Ta'minotchi nomi to'g'ri birikishi kerak");
  assert.equal(b.remainingQty, 50, "Qoldiq 50 ta bo'lishi kerak");
  assert.equal(enriched.stats.activeBatchesCount, 1, "Faol partiyalar soni 1 ta");
  assert.equal(enriched.stats.totalRemainingTickets, 50, "Qoldiq chiptalar 50 ta");
});

// ----------------------------------------------------
// 2. Chipta sotish, foyda va qoldiq kamayishi
// ----------------------------------------------------
test("2. Sotuv: qoldiq kamayishi, jami summa va foyda hisobi", () => {
  const partners: Partner[] = [
    { id: 1, name: "Centrum Air", createdAt: "2026-10-01" },
    { id: 2, name: "Ali Sayohat", createdAt: "2026-10-01" },
  ];
  const batches: Batch[] = [
    {
      id: 10,
      batchNumber: "P-JED-10",
      route: "TAS - JED",
      flightDate: "2026-11-10",
      supplierId: 1,
      totalQty: 20,
      remainingQty: 12, // 8 ta sotilgan
      buyPrice: 400,
      totalCost: 8000,
      status: "ACTIVE",
      createdAt: "2026-10-01",
    },
  ];
  const sales: Sale[] = [
    {
      id: 1,
      batchId: 10,
      clientId: 2,
      qty: 8,
      sellPrice: 500,
      totalAmount: 4000,
      profit: 800, // (500 - 400) * 8 = 800
      saleDate: "2026-10-05",
      createdAt: "2026-10-05",
    },
  ];

  const enriched = calculateEnrichedData({
    partners,
    batches,
    sales,
    payments: [],
    debtOffsets: [],
  });

  const s = enriched.sales[0];
  assert.equal(s.totalAmount, 4000, "Jami sotuv summasi 8 * 500 = 4000");
  assert.equal(s.profit, 800, "Sof foyda: (500 - 400) * 8 = 800");
  assert.equal(enriched.stats.totalProfit, 800, "Dashboard jami foyda 800");
  assert.equal(enriched.stats.totalRemainingTickets, 12, "Qoldiq 12 ta");
});

// ----------------------------------------------------
// 3. Hamkor balansi: Sotib olish va Qisman to'lov
// ----------------------------------------------------
test("3. Hamkor balansi (Mijoz sifatida chipta olib qisman to'laganda)", () => {
  const partners: Partner[] = [
    { id: 5, name: "Olim Turizm", createdAt: "2026-10-01" },
  ];
  const batches: Batch[] = [
    {
      id: 1,
      batchNumber: "P-IST-01",
      route: "TAS - IST",
      flightDate: "2026-11-01",
      supplierId: 999,
      totalQty: 10,
      remainingQty: 6,
      buyPrice: 300,
      totalCost: 3000,
      status: "ACTIVE",
      createdAt: "2026-10-01",
    },
  ];
  const sales: Sale[] = [
    {
      id: 1,
      batchId: 1,
      clientId: 5,
      qty: 4,
      sellPrice: 380,
      totalAmount: 1520, // $1520 ga sotib oldi
      profit: 320,
      saleDate: "2026-10-02",
      createdAt: "2026-10-02",
    },
  ];
  const payments: Payment[] = [
    {
      id: 1,
      partnerId: 5,
      type: "INCOME",
      amount: 520, // $520 to'ladi
      paymentDate: "2026-10-02",
      paymentMethod: "CASH",
      createdAt: "2026-10-02",
    },
  ];

  const enriched = calculateEnrichedData({
    partners,
    batches,
    sales,
    payments,
    debtOffsets: [],
  });

  const p = enriched.partners[0];
  assert.equal(p.totalBoughtFromUs, 1520, "Bizdan olgani: 1520");
  assert.equal(p.totalPaidToUs, 520, "Bizga to'lagani: 520");
  assert.equal(p.theyOweUs, 1000, "Uning qarzi: 1520 - 520 = 1000");
  assert.equal(p.balance, -1000, "Balans manfiy (-1000): Hamkor bizdan qarzdor");
  assert.equal(enriched.stats.clientDebtToUs, 1000, "Dashboard: Hamkorlar qarzi = 1000");
});

// ----------------------------------------------------
// 4. Ta'minotchi balansi (Partiya sotib olib qisman to'laganda)
// ----------------------------------------------------
test("4. Ta'minotchi balansi (Biz partiya olib qisman to'laganimizda)", () => {
  const partners: Partner[] = [
    { id: 1, name: "Air Samarkand", createdAt: "2026-10-01" },
  ];
  const batches: Batch[] = [
    {
      id: 1,
      batchNumber: "P-AYT-01",
      route: "SKD - AYT",
      flightDate: "2026-11-01",
      supplierId: 1,
      totalQty: 20,
      remainingQty: 20,
      buyPrice: 350,
      totalCost: 7000, // $7000 ga partiya oldik
      status: "ACTIVE",
      createdAt: "2026-10-01",
    },
  ];
  const payments: Payment[] = [
    {
      id: 1,
      partnerId: 1,
      type: "EXPENSE",
      amount: 4000, // $4000 to'ladik
      paymentDate: "2026-10-01",
      paymentMethod: "BANK",
      createdAt: "2026-10-01",
    },
  ];

  const enriched = calculateEnrichedData({
    partners,
    batches,
    sales: [],
    payments,
    debtOffsets: [],
  });

  const p = enriched.partners[0];
  assert.equal(p.totalSoldToUs, 7000, "Bizga sotgani: 7000");
  assert.equal(p.totalPaidByUs, 4000, "Biz to'lagan: 4000");
  assert.equal(p.weOweThem, 3000, "Bizning qarzimiz: 7000 - 4000 = 3000");
  assert.equal(p.balance, 3000, "Balans musbat (+3000): Ta'minotchi haqi bor");
  assert.equal(enriched.stats.ourDebtToSuppliers, 3000, "Dashboard: Bizning qarzimiz = 3000");
});

// ----------------------------------------------------
// 5. Yagona universal Hamkor (Bir vaqtda xaridor va sotuvchi)
// ----------------------------------------------------
test("5. Yagona Hamkor (Ikkala rolda: partiya sotgan va chipta olgan)", () => {
  const partners: Partner[] = [
    { id: 10, name: "Universal Partner LLC", createdAt: "2026-10-01" },
  ];
  // 1. Biz undan $5000 lik partiya oldik
  const batches: Batch[] = [
    {
      id: 1,
      batchNumber: "P-1",
      route: "TAS - MED",
      flightDate: "2026-11-01",
      supplierId: 10,
      totalQty: 10,
      remainingQty: 10,
      buyPrice: 500,
      totalCost: 5000,
      status: "ACTIVE",
      createdAt: "2026-10-01",
    },
  ];
  // 2. U bizdan boshqa reysga $3500 lik chipta sotib oldi
  const sales: Sale[] = [
    {
      id: 1,
      batchId: 999,
      clientId: 10,
      qty: 7,
      sellPrice: 500,
      totalAmount: 3500,
      profit: 700,
      saleDate: "2026-10-05",
      createdAt: "2026-10-05",
    },
  ];

  // Hech kim naqd to'lamadi, hisob-kitob avtomatik to'qnashadi:
  // Biz unga qarzdormiz: 5000
  // U bizga qarzdor: 3500
  // Sof balans: 5000 - 3500 = +1500 (Uning haqi bor $1500)
  const enriched = calculateEnrichedData({
    partners,
    batches,
    sales,
    payments: [],
    debtOffsets: [],
  });

  const p = enriched.partners[0];
  assert.equal(p.totalSoldToUs, 5000);
  assert.equal(p.totalBoughtFromUs, 3500);
  assert.equal(p.theyOweUs, 0, "Net: Ular bizdan qarzdor emas");
  assert.equal(p.weOweThem, 1500, "Net: Biz ularga $1500 qarzdormiz");
  assert.equal(p.balance, 1500, "Sof balans +1500 bo'lishi kerak");
  assert.equal(enriched.stats.ourDebtToSuppliers, 1500, "Kompaniyamiz sof qarzi 1500");
  assert.equal(enriched.stats.clientDebtToUs, 0, "Boshqa qarzdor yo'q");
});

// ----------------------------------------------------
// 6. O'zaro qarz surish (DebtOffset / Vzaimozachet)
// ----------------------------------------------------
test("6. O'zaro qarz surish (DebtOffset / Vzaimozachet mantig'i)", () => {
  const partners: Partner[] = [
    { id: 1, name: "Ta'minotchi Aviakompaniya", createdAt: "2026-10-01" },
    { id: 2, name: "Qarzdor Sub-Agent", createdAt: "2026-10-01" },
  ];
  // Biz Ta'minotchidan $2000 lik partiya oldik (Biz qarzdormiz: $2000)
  const batches: Batch[] = [
    {
      id: 1,
      batchNumber: "P-1",
      route: "TAS - DEL",
      flightDate: "2026-11-01",
      supplierId: 1,
      totalQty: 10,
      remainingQty: 10,
      buyPrice: 200,
      totalCost: 2000,
      status: "ACTIVE",
      createdAt: "2026-10-01",
    },
  ];
  // Sub-Agent bizdan $1200 lik chipta oldi (Sub-Agent qarzdor: $1200)
  const sales: Sale[] = [
    {
      id: 1,
      batchId: 1,
      clientId: 2,
      qty: 4,
      sellPrice: 300,
      totalAmount: 1200,
      profit: 400,
      saleDate: "2026-10-05",
      createdAt: "2026-10-05",
    },
  ];

  // O'zaro hisob-kitob: Sub-agentning butun $1200 qarzini Ta'minotchi qarzimiz hisobiga suramiz
  const debtOffsets: DebtOffset[] = [
    {
      id: 1,
      fromPartnerId: 2, // Sub-agent
      toPartnerId: 1,   // Ta'minotchi
      amount: 1200,
      date: "2026-10-06",
      notes: "Sub-agent qarzini ta'minotchi hisobiga surish",
      createdAt: "2026-10-06",
    },
  ];

  const enriched = calculateEnrichedData({
    partners,
    batches,
    sales,
    payments: [],
    debtOffsets,
  });

  const subAgent = enriched.partners.find((p) => p.id === 2)!;
  const supplier = enriched.partners.find((p) => p.id === 1)!;

  // Sub-agent qarzi 0 ga aylanishi kerak!
  assert.equal(subAgent.theyOweUs, 0, "Sub-agentning qarzi 0 bo'ldi");
  assert.equal(subAgent.balance, 0, "Sub-agent balansi 0");

  // Ta'minotchi oldidagi qarzimiz $2000 dan $800 ga tushishi kerak!
  assert.equal(supplier.weOweThem, 800, "Ta'minotchi oldidagi qarzimiz $800 qoldi");
  assert.equal(supplier.balance, 800, "Ta'minotchi balansi +800 (haqi bor)");

  // Dashboard statistikasi
  assert.equal(enriched.stats.clientDebtToUs, 0, "Mijozlardan qarz yo'q");
  assert.equal(enriched.stats.ourDebtToSuppliers, 800, "Bizning qarzimiz 800");
  assert.equal(enriched.stats.totalDebtOffsets, 1200, "Jami surilgan qarz 1200");
});

// ----------------------------------------------------
// 7. Kassa qoldig'i (Kirish - Chiqish)
// ----------------------------------------------------
test("7. Kassa balansi va to'lovlar oqimi", () => {
  const payments: Payment[] = [
    {
      id: 1,
      partnerId: 1,
      type: "INCOME",
      amount: 2500,
      paymentDate: "2026-10-01",
      paymentMethod: "CASH",
      createdAt: "2026-10-01",
    },
    {
      id: 2,
      partnerId: 2,
      type: "INCOME",
      amount: 1500,
      paymentDate: "2026-10-02",
      paymentMethod: "BANK",
      createdAt: "2026-10-02",
    },
    {
      id: 3,
      partnerId: 3,
      type: "EXPENSE",
      amount: 1800,
      paymentDate: "2026-10-03",
      paymentMethod: "BANK",
      createdAt: "2026-10-03",
    },
  ];

  const enriched = calculateEnrichedData({
    partners: [],
    batches: [],
    sales: [],
    payments,
    debtOffsets: [],
  });

  assert.equal(enriched.stats.totalIncome, 4000, "Jami kirim: 2500 + 1500 = 4000");
  assert.equal(enriched.stats.totalExpense, 1800, "Jami chiqim: 1800");
  assert.equal(enriched.stats.cashBalance, 2200, "Kassa qoldig'i: 4000 - 1800 = 2200");
});

// ----------------------------------------------------
// 8. Chekka holatlar: 0 qiymatlar va bo'sh massivlar
// ----------------------------------------------------
test("8. Chekka holatlar: Bo'sh ma'lumotlar bilan xatosiz ishlash", () => {
  const enriched = calculateEnrichedData({
    partners: [],
    batches: [],
    sales: [],
    payments: [],
    debtOffsets: [],
  });

  assert.equal(enriched.stats.totalProfit, 0);
  assert.equal(enriched.stats.cashBalance, 0);
  assert.equal(enriched.stats.activeBatchesCount, 0);
  assert.equal(enriched.stats.ourDebtToSuppliers, 0);
  assert.equal(enriched.stats.clientDebtToUs, 0);
  assert.equal(enriched.partners.length, 0);
});

// ----------------------------------------------------
// 9. Ko'p bosqichli murakkab tranzaksiyalar (Yagona Hamkor)
// ----------------------------------------------------
test("9. Murakkab kombinatsiyalashgan tranzaksiyalar va qarz surish", () => {
  const partners: Partner[] = [
    { id: 77, name: "Mega Hamkor MCHJ", createdAt: "2026-10-01" },
  ];
  // 1. Bizdan 2 ta sotuv oldi: 4000 + 1500 = 5500
  const sales: Sale[] = [
    {
      id: 1,
      batchId: 1,
      clientId: 77,
      qty: 10,
      sellPrice: 400,
      totalAmount: 4000,
      profit: 1000,
      saleDate: "2026-10-01",
      createdAt: "2026-10-01",
    },
    {
      id: 2,
      batchId: 2,
      clientId: 77,
      qty: 5,
      sellPrice: 300,
      totalAmount: 1500,
      profit: 500,
      saleDate: "2026-10-02",
      createdAt: "2026-10-02",
    },
  ];
  // 2. Bizga sotgan partiya: 2500
  const batches: Batch[] = [
    {
      id: 10,
      batchNumber: "P-77",
      route: "TAS - FRU",
      flightDate: "2026-11-01",
      supplierId: 77,
      totalQty: 10,
      remainingQty: 10,
      buyPrice: 250,
      totalCost: 2500,
      status: "ACTIVE",
      createdAt: "2026-10-01",
    },
  ];
  // 3. To'lovlar: Bizga to'lagan 3000 (INCOME), biz to'lagan 1500 (EXPENSE)
  const payments: Payment[] = [
    {
      id: 1,
      partnerId: 77,
      type: "INCOME",
      amount: 2000,
      paymentDate: "2026-10-03",
      paymentMethod: "BANK",
      createdAt: "2026-10-03",
    },
    {
      id: 2,
      partnerId: 77,
      type: "INCOME",
      amount: 1000,
      paymentDate: "2026-10-04",
      paymentMethod: "CASH",
      createdAt: "2026-10-04",
    },
    {
      id: 3,
      partnerId: 77,
      type: "EXPENSE",
      amount: 1500,
      paymentDate: "2026-10-05",
      paymentMethod: "BANK",
      createdAt: "2026-10-05",
    },
  ];
  // 4. Unga qarz surildi (+500 offsetTo)
  const debtOffsets: DebtOffset[] = [
    {
      id: 1,
      fromPartnerId: 999,
      toPartnerId: 77,
      amount: 500,
      date: "2026-10-06",
      notes: "Boshqa agentdan o'tkazilgan",
      createdAt: "2026-10-06",
    },
  ];

  const enriched = calculateEnrichedData({
    partners,
    batches,
    sales,
    payments,
    debtOffsets,
  });

  const p = enriched.partners[0];
  assert.equal(p.totalBoughtFromUs, 5500, "Jami xarid: 5500");
  assert.equal(p.totalPaidToUs, 3000, "Bizga to'lagani: 3000");
  assert.equal(p.totalSoldToUs, 2500, "Bizga sotgani: 2500");
  assert.equal(p.totalPaidByUs, 1500, "Biz to'lagan: 1500");
  // clientDebt = 5500 - 3000 = 2500
  // supplierDebt = 2500 - 1500 = 1000
  // balance = 1000 - 2500 - 500 = -2000
  assert.equal(p.balance, -2000, "Sof balans -2000 (Hamkor qarzdor)");
  assert.equal(p.theyOweUs, 2000, "Net qarz 2000");
  assert.equal(p.weOweThem, 0, "Biz qarzdor emasmiz");
});

// ----------------------------------------------------
// 10. Partiya tannarxi yangilanganda sotuv foydasining dinamik hisoblanishi
// ----------------------------------------------------
test("10. Partiya tannarxi yangilanganda foydaning dinamik hisoblanishi", () => {
  const batches: Batch[] = [
    {
      id: 50,
      batchNumber: "P-DOH-50",
      route: "TAS - DOH",
      flightDate: "2026-11-20",
      supplierId: 1,
      totalQty: 10,
      remainingQty: 6,
      buyPrice: 350, // Yangilangan tannarx: $350 (avval 300 edi)
      totalCost: 3500,
      status: "ACTIVE",
      createdAt: "2026-10-01",
    },
  ];
  const sales: Sale[] = [
    {
      id: 1,
      batchId: 50,
      clientId: 2,
      qty: 4,
      sellPrice: 450,
      totalAmount: 1800,
      buyPrice: 300, // Eski saqlangan buyPrice
      profit: 600,   // Eski foyda: (450 - 300) * 4 = 600
      saleDate: "2026-10-02",
      createdAt: "2026-10-02",
    },
  ];

  const enriched = calculateEnrichedData({
    partners: [],
    batches,
    sales,
    payments: [],
    debtOffsets: [],
  });

  const s = enriched.sales[0];
  // calculateEnrichedData batchning joriy buyPrice (350) ini olib foydani qayta hisoblashi kerak!
  assert.equal(s.buyPrice, 350, "Joriy partiya tannarxi olindi");
  assert.equal(s.profit, 400, "Yangi sof foyda: (450 - 350) * 4 = 400 bo'lishi kerak");
  assert.equal(enriched.stats.totalProfit, 400, "Dashboard foydasi ham yangilandi");
});

// ----------------------------------------------------
// 11. Tugagan partiyalar (status COMPLETED) statistikaga ta'siri
// ----------------------------------------------------
test("11. Tugagan (COMPLETED) partiyalarning faol partiyalar hisobiga kirmasligi", () => {
  const batches: Batch[] = [
    {
      id: 1,
      batchNumber: "P-ACT-1",
      route: "TAS - DXB",
      flightDate: "2026-11-01",
      supplierId: 1,
      totalQty: 20,
      remainingQty: 5,
      buyPrice: 300,
      totalCost: 6000,
      status: "ACTIVE",
      createdAt: "2026-10-01",
    },
    {
      id: 2,
      batchNumber: "P-CMP-2",
      route: "TAS - JED",
      flightDate: "2026-10-20",
      supplierId: 1,
      totalQty: 30,
      remainingQty: 0,
      buyPrice: 400,
      totalCost: 12000,
      status: "COMPLETED",
      createdAt: "2026-10-01",
    },
  ];

  const enriched = calculateEnrichedData({
    partners: [],
    batches,
    sales: [],
    payments: [],
    debtOffsets: [],
  });

  assert.equal(enriched.stats.activeBatchesCount, 1, "Faqat 1 ta faol partiya bor");
  assert.equal(enriched.stats.totalRemainingTickets, 5, "Faqat faol partiya qoldig'i (5 ta) sanaladi");
});

// ----------------------------------------------------
// 12. Kassa to'lov turlari va qoldiqlar
// ----------------------------------------------------
test("12. Kassa to'lovlarining aniqligi va metodlar", () => {
  const payments: Payment[] = [
    { id: 1, partnerId: 1, type: "INCOME", amount: 1000, paymentDate: "2026-10-01", paymentMethod: "CASH", createdAt: "2026-10-01" },
    { id: 2, partnerId: 1, type: "INCOME", amount: 2000, paymentDate: "2026-10-01", paymentMethod: "BANK", createdAt: "2026-10-01" },
    { id: 3, partnerId: 1, type: "EXPENSE", amount: 1500, paymentDate: "2026-10-01", paymentMethod: "CARD", createdAt: "2026-10-01" },
  ];

  const enriched = calculateEnrichedData({
    partners: [],
    batches: [],
    sales: [],
    payments,
    debtOffsets: [],
  });

  assert.equal(enriched.stats.totalIncome, 3000);
  assert.equal(enriched.stats.totalExpense, 1500);
  assert.equal(enriched.stats.cashBalance, 1500);
});

console.log("\n==========================================");
console.log(`NATIJA: ${passed} ta o'tdi, ${failed} ta xato`);
console.log("==========================================");

if (failed > 0) {
  process.exit(1);
}


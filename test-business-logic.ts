import assert from "node:assert/strict";
import { calculateEnrichedData, getNextBatchNumber } from "./src/lib/storage.ts";
import { sortByClosestFlightDate } from "./src/lib/format.ts";
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
// 10. Server — yagona haqiqat manbasi: frontend pulni qayta hisoblamaydi
// ----------------------------------------------------
test("10. Server qiymatlari ustuvor (frontend foydani o'zicha qayta hisoblamaydi)", () => {
  const batches: Batch[] = [
    {
      id: 50,
      batchNumber: "P-DOH-50",
      route: "TAS - DOH",
      flightDate: "2026-11-20",
      supplierId: 1,
      totalQty: 10,
      remainingQty: 6,
      buyPrice: 350,
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
      buyPrice: 350,
      profit: 400, // server hisoblagan: (450 - 350) * 4
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
  assert.equal(s.buyPrice, 350, "Server tannarxi o'zgartirilmaydi");
  assert.equal(s.profit, 400, "Server foydasi o'zgartirilmaydi");
  assert.equal(enriched.stats.totalProfit, 400, "Dashboard foydasi server qiymatidan olinadi");
});

// 10b. Eski zaxira nusxada server maydonlari bo'lmasa — sentgacha aniq zaxira hisob
// ----------------------------------------------------
test("10b. Server maydonlari yo'q bo'lsa ham sentgacha aniq hisoblanadi", () => {
  const batches: Batch[] = [
    {
      id: 60,
      batchNumber: "P-CENT-60",
      route: "TAS - IST",
      flightDate: "2026-11-21",
      supplierId: 1,
      totalQty: 10,
      remainingQty: 7,
      buyPrice: 90.05,
      totalCost: 900.5,
      status: "ACTIVE",
      createdAt: "2026-10-01",
    },
  ];
  const sales = [
    {
      id: 1,
      batchId: 60,
      clientId: 2,
      qty: 3,
      sellPrice: 100.1,
      saleDate: "2026-10-03",
      createdAt: "2026-10-03",
    },
  ] as unknown as Sale[];

  const enriched = calculateEnrichedData({
    partners: [],
    batches,
    sales,
    payments: [],
    debtOffsets: [],
  });

  const s = enriched.sales[0];
  assert.equal(s.totalAmount, 300.3, "Jami summa aniq: 100.10 * 3");
  assert.equal(s.profit, 30.15, "Foyda aniq: (100.10 - 90.05) * 3");
  assert.equal(enriched.stats.totalProfit, 30.15, "Yig'indi ham aniq");
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

// ----------------------------------------------------
// 13. Real foydalanuvchi ssenariysi ($3300 sotuv, $1300 to'lov -> -$2000 balans)
// ----------------------------------------------------
test("13. Real ssenariy: $3300 sotuv va $1300 qisman to'lov -> Balans qat'iy -$2000", () => {
  const partners: Partner[] = [
    { id: 100, name: "Hamkor Sayyoh", createdAt: "2026-10-15" },
  ];
  const batches: Batch[] = [
    {
      id: 1,
      batchNumber: "P-REAL-10",
      route: "TAS - JED",
      flightDate: "2026-11-01",
      supplierId: 999,
      totalQty: 10,
      remainingQty: 0,
      buyPrice: 300,
      totalCost: 3000,
      status: "COMPLETED",
      createdAt: "2026-10-15",
    },
  ];
  const sales: Sale[] = [
    {
      id: 1,
      batchId: 1,
      clientId: 100,
      qty: 10,
      sellPrice: 330,
      totalAmount: 3300,
      profit: 300,
      saleDate: "2026-10-15",
      createdAt: "2026-10-15",
    },
  ];
  const payments: Payment[] = [
    {
      id: 1,
      partnerId: 100,
      type: "INCOME",
      amount: 1300,
      paymentDate: "2026-10-15",
      paymentMethod: "CASH",
      createdAt: "2026-10-15",
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
  assert.equal(p.totalBoughtFromUs, 3300, "Jami xarid: $3300");
  assert.equal(p.totalPaidToUs, 1300, "To'langan summa: $1300");
  assert.equal(p.theyOweUs, 2000, "Qolgan qarz: $2000");
  assert.equal(p.weOweThem, 0, "Biz qarzdor emasmiz");
  assert.equal(p.balance, -2000, "Balans qat'iy manfiy (-2000) bo'lishi kerak");
  assert.equal(enriched.stats.clientDebtToUs, 2000, "Dashboard: Hamkorlar qarzi $2000");
});

// ----------------------------------------------------
// 14. Qarzdan ortiqcha to'lov (Overpayment / Avans)
// ----------------------------------------------------
test("14. Qarzdan ortiqcha to'lov (Mijoz qarzi $1000, to'ladi $1500 -> Balans +$500)", () => {
  const partners: Partner[] = [
    { id: 200, name: "Avanschi Agent", createdAt: "2026-10-15" },
  ];
  const sales: Sale[] = [
    {
      id: 1,
      batchId: 1,
      clientId: 200,
      qty: 2,
      sellPrice: 500,
      totalAmount: 1000,
      profit: 200,
      saleDate: "2026-10-15",
      createdAt: "2026-10-15",
    },
  ];
  const payments: Payment[] = [
    {
      id: 1,
      partnerId: 200,
      type: "INCOME",
      amount: 1500,
      paymentDate: "2026-10-15",
      paymentMethod: "BANK",
      createdAt: "2026-10-15",
    },
  ];

  const enriched = calculateEnrichedData({
    partners,
    batches: [],
    sales,
    payments,
    debtOffsets: [],
  });

  const p = enriched.partners[0];
  assert.equal(p.totalBoughtFromUs, 1000);
  assert.equal(p.totalPaidToUs, 1500);
  assert.equal(p.theyOweUs, 0, "Mijoz qarzdor emas");
  assert.equal(p.weOweThem, 500, "Mijozning haqi bor: $500");
  assert.equal(p.balance, 500, "Balans musbat (+500) bo'lishi kerak");
});

// ----------------------------------------------------
// 15. Bir nechta sotuv va bosqichma-bosqich to'lovlar
// ----------------------------------------------------
test("15. Ko'p martalik sotuvlar va bo'lib-bo'lib to'lash dinamikasi", () => {
  const partners: Partner[] = [
    { id: 300, name: "Doimiy Mijoz", createdAt: "2026-10-10" },
  ];
  const batches: Batch[] = [
    { id: 1, batchNumber: "B1", route: "R1", flightDate: "2026-11-01", supplierId: 99, totalQty: 10, remainingQty: 9, buyPrice: 300, totalCost: 3000, status: "ACTIVE", createdAt: "2026-10-10" },
    { id: 2, batchNumber: "B2", route: "R2", flightDate: "2026-11-02", supplierId: 99, totalQty: 10, remainingQty: 8, buyPrice: 350, totalCost: 3500, status: "ACTIVE", createdAt: "2026-10-10" },
    { id: 3, batchNumber: "B3", route: "R3", flightDate: "2026-11-03", supplierId: 99, totalQty: 10, remainingQty: 7, buyPrice: 400, totalCost: 4000, status: "ACTIVE", createdAt: "2026-10-10" },
  ];
  const sales: Sale[] = [
    { id: 1, batchId: 1, clientId: 300, qty: 1, sellPrice: 400, totalAmount: 400, profit: 100, saleDate: "2026-10-10", createdAt: "2026-10-10" },
    { id: 2, batchId: 2, clientId: 300, qty: 2, sellPrice: 450, totalAmount: 900, profit: 200, saleDate: "2026-10-11", createdAt: "2026-10-11" },
    { id: 3, batchId: 3, clientId: 300, qty: 3, sellPrice: 500, totalAmount: 1500, profit: 300, saleDate: "2026-10-12", createdAt: "2026-10-12" },
  ]; // Jami xarid: 400 + 900 + 1500 = 2800

  const payments: Payment[] = [
    { id: 1, partnerId: 300, type: "INCOME", amount: 1000, paymentDate: "2026-10-11", paymentMethod: "CASH", createdAt: "2026-10-11" },
    { id: 2, partnerId: 300, type: "INCOME", amount: 1000, paymentDate: "2026-10-13", paymentMethod: "BANK", createdAt: "2026-10-13" },
  ]; // Jami to'lov: 2000

  const enriched = calculateEnrichedData({
    partners,
    batches,
    sales,
    payments,
    debtOffsets: [],
  });

  const p = enriched.partners[0];
  assert.equal(p.totalBoughtFromUs, 2800);
  assert.equal(p.totalPaidToUs, 2000);
  assert.equal(p.theyOweUs, 800);
  assert.equal(p.balance, -800, "Qolgan qarz -$800");
  assert.equal(enriched.stats.totalProfit, 600, "Jami foyda 100 + 200 + 300 = 600");
});

// ----------------------------------------------------
// 16. To'liq yopilgan balans (Qarz va to'lov teng bo'lganda 0)
// ----------------------------------------------------
test("16. Nol balans: Sotuv va to'lov to'liq teng bo'lganda balans 0 bo'lishi", () => {
  const partners: Partner[] = [
    { id: 400, name: "Aniqlik LLC", createdAt: "2026-10-01" },
  ];
  const sales: Sale[] = [
    { id: 1, batchId: 1, clientId: 400, qty: 5, sellPrice: 500, totalAmount: 2500, profit: 500, saleDate: "2026-10-01", createdAt: "2026-10-01" },
  ];
  const payments: Payment[] = [
    { id: 1, partnerId: 400, type: "INCOME", amount: 2500, paymentDate: "2026-10-02", paymentMethod: "CASH", createdAt: "2026-10-02" },
  ];

  const enriched = calculateEnrichedData({
    partners,
    batches: [],
    sales,
    payments,
    debtOffsets: [],
  });

  const p = enriched.partners[0];
  assert.equal(p.balance, 0, "Balans aynan 0 bo'lishi kerak");
  assert.equal(p.theyOweUs, 0);
  assert.equal(p.weOweThem, 0);
  assert.equal(enriched.stats.clientDebtToUs, 0);
});

// ----------------------------------------------------
// 17. Uch tomonlama qarz surish (A agent qarzini B ta'minotchi orqali yopish)
// ----------------------------------------------------
test("17. Uch tomonlama qarz surish: Agent qarzi nollanib, ta'minotchi haqi kamayishi", () => {
  const partners: Partner[] = [
    { id: 1, name: "Ta'minotchi Airline", createdAt: "2026-10-01" },
    { id: 2, name: "Qarzdor Agent", createdAt: "2026-10-01" },
  ];
  // Ta'minotchidan $5000 lik partiya oldik
  const batches: Batch[] = [
    { id: 1, batchNumber: "B1", route: "T-D", flightDate: "2026-11-01", supplierId: 1, totalQty: 10, remainingQty: 10, buyPrice: 500, totalCost: 5000, status: "ACTIVE", createdAt: "2026-10-01" }
  ];
  // Agent bizdan $2000 lik chipta oldi
  const sales: Sale[] = [
    { id: 1, batchId: 1, clientId: 2, qty: 4, sellPrice: 500, totalAmount: 2000, profit: 0, saleDate: "2026-10-02", createdAt: "2026-10-02" }
  ];
  // Agent 500 to'ladi (qarz 1500 qoldi)
  const payments: Payment[] = [
    { id: 1, partnerId: 2, type: "INCOME", amount: 500, paymentDate: "2026-10-03", paymentMethod: "CASH", createdAt: "2026-10-03" }
  ];
  // Qolgan $1500 qarzni ta'minotchi qarzimizga suramiz
  const debtOffsets: DebtOffset[] = [
    { id: 1, fromPartnerId: 2, toPartnerId: 1, amount: 1500, date: "2026-10-04", notes: "Qarz surish", createdAt: "2026-10-04" }
  ];

  const enriched = calculateEnrichedData({
    partners,
    batches,
    sales,
    payments,
    debtOffsets,
  });

  const agent = enriched.partners.find(p => p.id === 2)!;
  const airline = enriched.partners.find(p => p.id === 1)!;

  assert.equal(agent.balance, 0, "Agent qarzi to'liq 0 bo'ldi");
  assert.equal(airline.balance, 3500, "Aviakompaniya haqi: 5000 - 1500 = 3500");
  assert.equal(enriched.stats.totalDebtOffsets, 1500);
});

// ----------------------------------------------------
// 18. Kassa statistikasi: Barcha to'lovlar turi bo'yicha jami tushum va xarajat
// ----------------------------------------------------
test("18. Kassa to'liq hisoboti: Kirim, Chiqim va Kassa sof balansi", () => {
  const payments: Payment[] = [
    { id: 1, partnerId: 1, type: "INCOME", amount: 5000, paymentDate: "2026-10-01", paymentMethod: "CASH", createdAt: "2026-10-01" },
    { id: 2, partnerId: 2, type: "INCOME", amount: 3500, paymentDate: "2026-10-02", paymentMethod: "BANK", createdAt: "2026-10-02" },
    { id: 3, partnerId: 3, type: "EXPENSE", amount: 2000, paymentDate: "2026-10-03", paymentMethod: "CASH", createdAt: "2026-10-03" },
    { id: 4, partnerId: 4, type: "EXPENSE", amount: 1500, paymentDate: "2026-10-04", paymentMethod: "BANK", createdAt: "2026-10-04" },
  ];

  const enriched = calculateEnrichedData({
    partners: [],
    batches: [],
    sales: [],
    payments,
    debtOffsets: [],
  });

  assert.equal(enriched.stats.totalIncome, 8500, "Jami kirim: 5000 + 3500 = 8500");
  assert.equal(enriched.stats.totalExpense, 3500, "Jami chiqim: 2000 + 1500 = 3500");
  assert.equal(enriched.stats.cashBalance, 5000, "Kassa qoldig'i: 8500 - 3500 = 5000");
});

// ----------------------------------------------------
// 19. Unikal partiya raqamini ketma-ket generatsiya qilish (P00001, P00002...)
// ----------------------------------------------------
test("19. Partiya raqamlari tartibli va unikal (P00001, P00002) generatsiya bo'lishi", () => {
  // Bo'sh ro'yxatda dastlabki partiya P00001 bo'lishi kerak
  const initial = getNextBatchNumber([]);
  assert.equal(initial, "P00001", "Dastlabki partiya P00001 bo'lishi kerak");

  // Mavjud partiyalar bo'lganda eng kattasidan keyingisini olishi kerak
  const existing = [
    { batchNumber: "P00001" },
    { batchNumber: "P00002" },
  ];
  const next = getNextBatchNumber(existing);
  assert.equal(next, "P00003", "Mavjud P00001 va P00002 dan keyin P00003 bo'lishi kerak");

  // Eski noan'anaviy formatlar aralashganda ham to'g'ri ishlashi
  const mixed = [
    { batchNumber: "P-DXB-101" },
    { batchNumber: "P00005" },
  ];
  const nextMixed = getNextBatchNumber(mixed);
  assert.equal(nextMixed, "P00006", "P00005 mavjud bo'lganda keyingisi P00006 bo'lishi kerak");
});

// ----------------------------------------------------
// 20. Bitta xaridda bir nechta partiya kiritilganda yoki turli ta'minotchilar uchun unikal partiya
// ----------------------------------------------------
test("20. Ko'p qatorli xaridda partiyalar takrorlanmasligi (offset va unikal raqamlar)", () => {
  const currentBatches = [{ batchNumber: "P00001" }];

  // 1-ta'minotchidan 3 ta partiya
  const batch1 = getNextBatchNumber(currentBatches, 0); // P00002
  const batch2 = getNextBatchNumber(currentBatches, 1); // P00003
  const batch3 = getNextBatchNumber(currentBatches, 2); // P00004

  assert.equal(batch1, "P00002");
  assert.equal(batch2, "P00003");
  assert.equal(batch3, "P00004");

  // Ular qo'shilgandan keyin yangi ta'minotchi xarid qilsa
  const updatedBatches = [
    ...currentBatches,
    { batchNumber: batch1 },
    { batchNumber: batch2 },
    { batchNumber: batch3 },
  ];

  const supplier2Batch = getNextBatchNumber(updatedBatches, 0);
  assert.equal(supplier2Batch, "P00005", "Yangi ta'minotchi uchun partiya P00005 bo'lib davom etishi kerak");
});

// ----------------------------------------------------
// 21. Eng yaqin uchish sanasi bo'yicha saralash
// ----------------------------------------------------
test("21. Partiyalarni eng yaqin uchish sanasi bo'yicha saralash (kelgusi reyslar avval)", () => {
  const today = "2026-10-19";
  const rawBatches = [
    { id: 1, batchNumber: "P00001", flightDate: "2026-09-21" }, // o'tgan
    { id: 2, batchNumber: "P00002", flightDate: "2026-10-05" }, // o'tgan
    { id: 3, batchNumber: "P00003", flightDate: "2026-10-25" }, // kelgusi (keyinroq)
    { id: 4, batchNumber: "P00004", flightDate: "2026-10-20" }, // kelgusi (eng yaqin ertaga)
    { id: 5, batchNumber: "P00005", flightDate: "2026-10-19" }, // bugun (eng yaqin!)
  ];

  const sorted = sortByClosestFlightDate(rawBatches, today);
  const order = sorted.map((b) => b.batchNumber);

  // Tartib: Bugun (P00005) -> Ertaga (P00004) -> Keyin (P00003) -> O'tgan eng yaqin (P00002) -> O'tgan eski (P00001)
  assert.deepEqual(
    order,
    ["P00005", "P00004", "P00003", "P00002", "P00001"],
    "Bugungi va kelgusi eng yaqin reyslar yuqorida turishi kerak"
  );
});

console.log("\n==========================================");
console.log(`NATIJA: ${passed} ta o'tdi, ${failed} ta xato`);
console.log("==========================================");

if (failed > 0) {
  process.exit(1);
}


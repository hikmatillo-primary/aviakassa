"use client";

export interface Partner {
  id: number;
  name: string;
  type: "SUPPLIER" | "CLIENT";
  phone?: string;
  notes?: string;
  createdAt: string;
  balance?: number;
  totalDeal?: number;
  totalPaid?: number;
}

export interface Batch {
  id: number;
  batchNumber: string;
  route: string;
  flightDate: string;
  flightNumber?: string;
  supplierId: number;
  supplierName?: string;
  totalQty: number;
  remainingQty: number;
  buyPrice: number;
  totalCost: number;
  status: "ACTIVE" | "COMPLETED";
  notes?: string;
  createdAt: string;
}

export interface Sale {
  id: number;
  batchId: number;
  clientId: number;
  clientName?: string;
  route?: string;
  flightDate?: string;
  flightNumber?: string;
  buyPrice?: number;
  qty: number;
  sellPrice: number;
  totalAmount: number;
  profit: number;
  passengerNames?: string;
  saleDate: string;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: number;
  partnerId: number;
  partnerName?: string;
  partnerType?: "SUPPLIER" | "CLIENT";
  type: "INCOME" | "EXPENSE";
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}

export interface AviakassaData {
  partners: Partner[];
  batches: Batch[];
  sales: Sale[];
  payments: Payment[];
}

const STORAGE_KEY = "aviakassa_pro_data_v1";

export const INITIAL_DEMO_DATA: AviakassaData = {
  partners: [
    {
      id: 1,
      name: "FlyDubai Bosh Diler",
      type: "SUPPLIER",
      phone: "+998 90 111-22-33",
      notes: "Dubay yo'nalishlari asosiy ta'minotchisi",
      createdAt: "2026-10-10",
    },
    {
      id: 2,
      name: "Air Arabia Blok Hamkor",
      type: "SUPPLIER",
      phone: "+998 93 444-55-66",
      notes: "Sharja va Jidda yo'nalishlari",
      createdAt: "2026-10-10",
    },
    {
      id: 3,
      name: "Samarqand Turizm Agentligi",
      type: "CLIENT",
      phone: "+998 97 777-88-99",
      notes: "Sub-agent (Har partiyadan 10-15 talab oladi)",
      createdAt: "2026-10-10",
    },
    {
      id: 4,
      name: "Aliyev Sherzod",
      type: "CLIENT",
      phone: "+998 99 123-45-67",
      notes: "Chakana mijoz (Oilaviy sayohat)",
      createdAt: "2026-10-10",
    },
  ],
  batches: [
    {
      id: 1,
      batchNumber: "P-DXB-101",
      route: "Toshkent - Dubay (TAS-DXB)",
      flightDate: "2026-10-25",
      flightNumber: "FZ-780",
      supplierId: 1,
      totalQty: 40,
      remainingQty: 25,
      buyPrice: 320,
      totalCost: 12800,
      status: "ACTIVE",
      notes: "Ertalabki qulay reys",
      createdAt: "2026-10-10",
    },
    {
      id: 2,
      batchNumber: "P-JED-202",
      route: "Toshkent - Jidda (TAS-JED)",
      flightDate: "2026-11-05",
      flightNumber: "G9-551",
      supplierId: 2,
      totalQty: 50,
      remainingQty: 40,
      buyPrice: 380,
      totalCost: 19000,
      status: "ACTIVE",
      notes: "Umra mavsumi bloki",
      createdAt: "2026-10-11",
    },
  ],
  sales: [
    {
      id: 1,
      batchId: 1,
      clientId: 3,
      qty: 10,
      sellPrice: 370,
      totalAmount: 3700,
      profit: 500,
      passengerNames: "10 kishilik guruh (Samarqand)",
      saleDate: "2026-10-10",
      notes: "Sub-agentga sotildi",
      createdAt: "2026-10-10",
    },
    {
      id: 2,
      batchId: 2,
      clientId: 3,
      qty: 10,
      sellPrice: 440,
      totalAmount: 4400,
      profit: 600,
      passengerNames: "Umra ziyoratchilari (10 kishi)",
      saleDate: "2026-10-11",
      notes: "Umra guruhi",
      createdAt: "2026-10-11",
    },
    {
      id: 3,
      batchId: 1,
      clientId: 4,
      qty: 5,
      sellPrice: 400,
      totalAmount: 2000,
      profit: 400,
      passengerNames: "Aliyev Sherzod + 4 oila a'zosi",
      saleDate: "2026-10-12",
      notes: "Chakana sotuv",
      createdAt: "2026-10-12",
    },
  ],
  payments: [
    {
      id: 1,
      partnerId: 3,
      type: "INCOME",
      amount: 5000,
      paymentDate: "2026-10-11",
      paymentMethod: "BANK",
      notes: "Qisman qarz to'lovi",
      createdAt: "2026-10-11",
    },
    {
      id: 2,
      partnerId: 1,
      type: "EXPENSE",
      amount: 8000,
      paymentDate: "2026-10-10",
      paymentMethod: "BANK",
      notes: "Partiya P-DXB-101 uchun avans to'lov",
      createdAt: "2026-10-10",
    },
  ],
};

export function loadData(): AviakassaData {
  if (typeof window === "undefined") {
    return INITIAL_DEMO_DATA;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveData(INITIAL_DEMO_DATA);
      return INITIAL_DEMO_DATA;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("loadData error:", err);
    return INITIAL_DEMO_DATA;
  }
}

export function saveData(data: AviakassaData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("saveData error:", err);
  }
}

export function calculateEnrichedData(data: AviakassaData) {
  const { partners, batches, sales, payments } = data;

  // Enrich batches with supplier names
  const enrichedBatches = batches.map((b) => {
    const supplier = partners.find((p) => p.id === b.supplierId);
    return {
      ...b,
      supplierName: supplier?.name || "Noma'lum",
    };
  });

  // Enrich sales with client & batch details
  const enrichedSales = sales.map((s) => {
    const client = partners.find((p) => p.id === s.clientId);
    const batch = batches.find((b) => b.id === s.batchId);
    return {
      ...s,
      clientName: client?.name || "Noma'lum",
      route: batch?.route || "-",
      flightDate: batch?.flightDate || "-",
      flightNumber: batch?.flightNumber || "-",
      buyPrice: batch?.buyPrice || 0,
    };
  });

  // Enrich payments with partner names & types
  const enrichedPayments = payments.map((p) => {
    const partner = partners.find((item) => item.id === p.partnerId);
    return {
      ...p,
      partnerName: partner?.name || "Noma'lum",
      partnerType: partner?.type || "CLIENT",
    };
  });

  // Enrich partners with balances
  const enrichedPartners = partners.map((partner) => {
    let totalDeal = 0;
    let totalPaid = 0;

    if (partner.type === "SUPPLIER") {
      totalDeal = batches
        .filter((b) => b.supplierId === partner.id)
        .reduce((sum, b) => sum + (b.totalCost || 0), 0);
      totalPaid = payments
        .filter((p) => p.partnerId === partner.id && p.type === "EXPENSE")
        .reduce((sum, p) => sum + (p.amount || 0), 0);
    } else {
      totalDeal = sales
        .filter((s) => s.clientId === partner.id)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      totalPaid = payments
        .filter((p) => p.partnerId === partner.id && p.type === "INCOME")
        .reduce((sum, p) => sum + (p.amount || 0), 0);
    }

    const balance = totalDeal - totalPaid;

    return {
      ...partner,
      totalDeal,
      totalPaid,
      balance,
    };
  });

  // Calculate Dashboard Stats
  const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0);
  const totalRemainingTickets = batches.reduce(
    (sum, b) => (b.status === "ACTIVE" ? sum + (b.remainingQty || 0) : sum),
    0
  );
  const activeBatchesCount = batches.filter((b) => b.status === "ACTIVE").length;

  let ourDebtToSuppliers = 0;
  for (const sup of enrichedPartners.filter((p) => p.type === "SUPPLIER")) {
    if ((sup.balance || 0) > 0) ourDebtToSuppliers += sup.balance || 0;
  }

  let clientDebtToUs = 0;
  for (const client of enrichedPartners.filter((p) => p.type === "CLIENT")) {
    if ((client.balance || 0) > 0) clientDebtToUs += client.balance || 0;
  }

  const totalIncome = payments
    .filter((p) => p.type === "INCOME")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExpense = payments
    .filter((p) => p.type === "EXPENSE")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const cashBalance = totalIncome - totalExpense;

  const stats = {
    totalProfit,
    totalRemainingTickets,
    activeBatchesCount,
    ourDebtToSuppliers,
    clientDebtToUs,
    totalIncome,
    totalExpense,
    cashBalance,
    totalSalesCount: sales.length,
  };

  return {
    stats,
    batches: enrichedBatches,
    sales: enrichedSales,
    payments: enrichedPayments,
    partners: enrichedPartners,
  };
}

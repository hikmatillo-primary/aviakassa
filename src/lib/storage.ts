"use client";

export interface Partner {
  id: number;
  name: string;
  type?: "SUPPLIER" | "CLIENT" | "BOTH";
  tags?: string[];
  phone?: string;
  notes?: string;
  createdAt: string;
  balance?: number;
  totalDeal?: number;
  totalPaid?: number;
  totalBoughtFromUs?: number;
  totalPaidToUs?: number;
  totalSoldToUs?: number;
  totalPaidByUs?: number;
  theyOweUs?: number;
  weOweThem?: number;
}

export interface Batch {
  id: number;
  batchNumber: string;
  route: string;
  flightDate: string;
  flightNumber?: string;
  departureTime?: string;
  arrivalTime?: string;
  isRoundTrip?: boolean;
  returnDate?: string;
  returnFlightNumber?: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  purchaseDate?: string;
  baggage?: string;
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
  departureTime?: string;
  arrivalTime?: string;
  isRoundTrip?: boolean;
  returnDate?: string;
  returnFlightNumber?: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
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

export interface DebtOffset {
  id: number;
  fromPartnerId: number;
  fromPartnerName?: string;
  toPartnerId: number;
  toPartnerName?: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface AviakassaData {
  partners: Partner[];
  batches: Batch[];
  sales: Sale[];
  payments: Payment[];
  debtOffsets?: DebtOffset[];
}

const STORAGE_KEY = "aviakassa_pro_data_v1";

export const INITIAL_DEMO_DATA: AviakassaData = {
  partners: [
    {
      id: 1,
      name: "FlyDubai Bosh Diler",
      type: "SUPPLIER",
      tags: ["Birinchi qo'l", "Konsolidator"],
      phone: "+998 90 111-22-33",
      notes: "Dubay yo'nalishlari asosiy ta'minotchisi",
      createdAt: "2026-10-10",
    },
    {
      id: 2,
      name: "Air Arabia Blok Hamkor",
      type: "SUPPLIER",
      tags: ["Birinchi qo'l", "Charter"],
      phone: "+998 93 444-55-66",
      notes: "Sharja va Jidda yo'nalishlari",
      createdAt: "2026-10-10",
    },
    {
      id: 3,
      name: "Samarqand Turizm Agentligi",
      type: "CLIENT",
      tags: ["Sub-agent", "Turfirma"],
      phone: "+998 97 777-88-99",
      notes: "Sub-agent (Har partiyadan 10-15 talab oladi)",
      createdAt: "2026-10-10",
    },
    {
      id: 4,
      name: "Aliyev Sherzod",
      type: "CLIENT",
      tags: ["Doimiy mijoz"],
      phone: "+998 99 123-45-67",
      notes: "Chakana mijoz (Oilaviy sayohat)",
      createdAt: "2026-10-10",
    },
  ],
  batches: [
    {
      id: 1,
      batchNumber: "P-DXB-101",
      route: "Toshkent — Dubay",
      flightDate: "2026-10-25",
      flightNumber: "FZ-780",
      departureTime: "08:30",
      arrivalTime: "12:15",
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
      route: "Toshkent — Jidda",
      flightDate: "2026-11-05",
      flightNumber: "G9-551",
      departureTime: "09:00",
      arrivalTime: "14:20",
      isRoundTrip: true,
      returnDate: "2026-11-19",
      returnFlightNumber: "G9-552",
      returnDepartureTime: "16:00",
      returnArrivalTime: "21:45",
      supplierId: 2,
      totalQty: 50,
      remainingQty: 40,
      buyPrice: 380,
      totalCost: 19000,
      status: "ACTIVE",
      notes: "Umra mavsumi bloki (Borish-qaytish)",
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
      isRoundTrip: true,
      returnDate: "2026-11-19",
      returnFlightNumber: "G9-552",
      returnDepartureTime: "16:00",
      returnArrivalTime: "21:45",
      passengerNames: "Umra ziyoratchilari (10 kishi)",
      saleDate: "2026-10-11",
      notes: "Umra guruhi (Obratno)",
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
  debtOffsets: [
    {
      id: 1,
      fromPartnerId: 3,
      toPartnerId: 1,
      amount: 500,
      date: "2026-10-12",
      notes: "Samarqand Turizm haqi FlyDubai bosh diler qarziga o'zaro hisoblandi",
      createdAt: "2026-10-12",
    },
  ],
};

export const EMPTY_AVIAKASSA_DATA: AviakassaData = {
  partners: [],
  batches: [],
  sales: [],
  payments: [],
  debtOffsets: [],
};

export function loadData(): AviakassaData {
  if (typeof window === "undefined") {
    return EMPTY_AVIAKASSA_DATA;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_AVIAKASSA_DATA;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("loadData error:", err);
    return EMPTY_AVIAKASSA_DATA;
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
  const debtOffsets = data.debtOffsets || [];

  // Enrich batches with supplier names & live totalCost
  const enrichedBatches = batches.map((b) => {
    const supplier = partners.find((p) => p.id === b.supplierId);
    const totalCost = (b.totalQty || 0) * (b.buyPrice || 0);
    return {
      ...b,
      purchaseDate: b.purchaseDate || b.createdAt?.split("T")[0] || "-",
      totalCost,
      supplierName: supplier?.name || "Noma'lum",
    };
  });

  // Enrich sales with client & batch details (live profit & totalAmount)
  const enrichedSales = sales.map((s) => {
    const client = partners.find((p) => p.id === s.clientId);
    const batch = batches.find((b) => b.id === s.batchId);
    const buyPrice = batch ? batch.buyPrice : s.buyPrice || 0;
    const totalAmount = (s.qty || 0) * (s.sellPrice || 0);
    const profit = totalAmount - (s.qty || 0) * buyPrice;
    return {
      ...s,
      clientName: client?.name || "Noma'lum",
      route: batch?.route || s.route || "-",
      flightDate: batch?.flightDate || s.flightDate || "-",
      flightNumber: batch?.flightNumber || s.flightNumber || "-",
      departureTime: s.departureTime || batch?.departureTime || "",
      arrivalTime: s.arrivalTime || batch?.arrivalTime || "",
      isRoundTrip: s.isRoundTrip ?? batch?.isRoundTrip ?? false,
      returnDate: s.returnDate || batch?.returnDate || "",
      returnFlightNumber: s.returnFlightNumber || batch?.returnFlightNumber || "",
      returnDepartureTime: s.returnDepartureTime || batch?.returnDepartureTime || "",
      returnArrivalTime: s.returnArrivalTime || batch?.returnArrivalTime || "",
      buyPrice,
      totalAmount,
      profit,
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

  // Enrich debt offsets with partner names
  const enrichedOffsets = debtOffsets.map((o) => {
    const fromP = partners.find((p) => p.id === o.fromPartnerId);
    const toP = partners.find((p) => p.id === o.toPartnerId);
    return {
      ...o,
      fromPartnerName: fromP?.name || "Noma'lum",
      toPartnerName: toP?.name || "Noma'lum",
    };
  });

  // Enrich partners with balances (including dual role: vendor + buyer)
  const enrichedPartners = partners.map((partner) => {
    // 1. Sales sold to this partner (Partner is buyer)
    const partnerSales = enrichedSales.filter((s) => s.clientId === partner.id);
    const totalBoughtFromUs = partnerSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    // 2. Batches bought from this partner (Partner is supplier/vendor)
    const partnerBatches = enrichedBatches.filter((b) => b.supplierId === partner.id);
    const totalSoldToUs = partnerBatches.reduce((sum, b) => sum + (b.totalCost || 0), 0);

    // 3. Payments received from this partner (Income)
    const totalPaidToUs = payments
      .filter((p) => p.partnerId === partner.id && p.type === "INCOME")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // 4. Payments paid by us to this partner (Expense)
    const totalPaidByUs = payments
      .filter((p) => p.partnerId === partner.id && p.type === "EXPENSE")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // 5. Debt offsets
    const offsetFrom = debtOffsets
      .filter((o) => o.fromPartnerId === partner.id)
      .reduce((sum, o) => sum + (o.amount || 0), 0);
    const offsetTo = debtOffsets
      .filter((o) => o.toPartnerId === partner.id)
      .reduce((sum, o) => sum + (o.amount || 0), 0);

    // Net calculations:
    // What partner owes us for tickets they bought:
    const theyOweUs = totalBoughtFromUs - totalPaidToUs - offsetFrom + offsetTo;
    // What we owe partner for batches we bought:
    const weOweThem = totalSoldToUs - totalPaidByUs - offsetTo + offsetFrom;

    // Net balance:
    // balance > 0: Partner owes us (Biz haqdormiz / Mijoz qarzdor)
    // balance < 0: We owe partner (Biz qarzdormiz / Ta'minotchi haqdor)
    // balance === 0: Closed / 0
    const balance = theyOweUs - weOweThem;

    const totalDeal = totalBoughtFromUs + totalSoldToUs;
    const totalPaid = totalPaidToUs + totalPaidByUs;

    // Infer tags if not set
    const defaultTags: string[] = [];
    if (partner.tags && partner.tags.length > 0) {
      defaultTags.push(...partner.tags);
    } else {
      if (totalSoldToUs > 0) defaultTags.push("Birinchi qo'l");
      if (totalBoughtFromUs > 0) defaultTags.push("Sub-agent");
      if (defaultTags.length === 0) {
        defaultTags.push(partner.type === "SUPPLIER" ? "Birinchi qo'l" : "Mijoz");
      }
    }

    return {
      ...partner,
      tags: Array.from(new Set(defaultTags)),
      totalBoughtFromUs,
      totalPaidToUs,
      totalSoldToUs,
      totalPaidByUs,
      theyOweUs,
      weOweThem,
      totalDeal,
      totalPaid,
      balance,
    };
  });

  // Calculate Dashboard Stats
  const totalProfit = enrichedSales.reduce((sum, s) => sum + (s.profit || 0), 0);
  const totalRemainingTickets = batches.reduce(
    (sum, b) => (b.status === "ACTIVE" ? sum + (b.remainingQty || 0) : sum),
    0
  );
  const activeBatchesCount = batches.filter((b) => b.status === "ACTIVE").length;

  let ourDebtToSuppliers = 0;
  let clientDebtToUs = 0;
  for (const p of enrichedPartners) {
    if ((p.balance || 0) < 0) {
      ourDebtToSuppliers += Math.abs(p.balance || 0);
    } else if ((p.balance || 0) > 0) {
      clientDebtToUs += p.balance || 0;
    }
  }

  const totalIncome = payments
    .filter((p) => p.type === "INCOME")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExpense = payments
    .filter((p) => p.type === "EXPENSE")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const cashBalance = totalIncome - totalExpense;

  const totalDebtOffsets = debtOffsets.reduce((sum, o) => sum + (o.amount || 0), 0);

  const stats = {
    totalProfit,
    totalRemainingTickets,
    activeBatchesCount,
    ourDebtToSuppliers,
    clientDebtToUs,
    totalIncome,
    totalExpense,
    cashBalance,
    totalDebtOffsets,
    totalSalesCount: sales.length,
  };

  return {
    stats,
    batches: enrichedBatches,
    sales: enrichedSales,
    payments: enrichedPayments,
    partners: enrichedPartners,
    debtOffsets: enrichedOffsets,
  };
}

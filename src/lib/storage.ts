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
  /** Borish-kelish partiyalarida kelish o'rinlari qoldig'i. */
  returnRemainingQty?: number;
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
  /** Borish-kelish partiyasida sotilgan qism: OUTBOUND | RETURN | BOTH (oddiy partiyada bo'sh). */
  segment?: string;
  saleDate: string;
  notes?: string;
  createdAt: string;
}

export interface CashAccount {
  id: number;
  name: string;
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
  accountId?: number | null;
  accountName?: string | null;
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
  accounts?: CashAccount[];
}

export const EMPTY_AVIAKASSA_DATA: AviakassaData = {
  partners: [],
  batches: [],
  sales: [],
  payments: [],
  debtOffsets: [],
};

/** Sentgacha yaxlitlash (float yig'indi xatosini tozalash uchun). */
export function roundCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

/** Pul yig'indisi — har bir qiymat sentga aylantirilib qo'shiladi. */
export function moneySum(values: Array<number | null | undefined>): number {
  let cents = 0;
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      cents += Math.round(value * 100);
    }
  }
  return cents / 100;
}

/**
 * Serverdan kelgan ma'lumotga faqat KO'RSATISH uchun maydonlar qo'shadi.
 *
 * Muhim: pul qiymatlari bu yerda qayta hisoblanmaydi — yagona haqiqat manbasi
 * backend. Agar server qiymati kelmagan bo'lsa (eski zaxira nusxa), zaxira
 * formula ishlatiladi, lekin u ham sentgacha yaxlitlanadi.
 */
export function calculateEnrichedData(data: AviakassaData) {
  const { partners, batches, sales, payments } = data;
  const debtOffsets = data.debtOffsets || [];

  const partnerById = new Map(partners.map((p) => [p.id, p]));
  const batchById = new Map(batches.map((b) => [b.id, b]));

  const enrichedBatches = batches.map((b) => {
    const supplier = partnerById.get(b.supplierId);
    const totalCost =
      typeof b.totalCost === "number"
        ? b.totalCost
        : roundCents((b.totalQty || 0) * (b.buyPrice || 0));
    return {
      ...b,
      purchaseDate: b.purchaseDate || b.createdAt?.split("T")[0] || "-",
      totalCost,
      supplierName: supplier?.name || "Noma'lum",
    };
  });

  const enrichedSales = sales.map((s) => {
    const client = partnerById.get(s.clientId);
    const batch = batchById.get(s.batchId);
    const buyPrice =
      typeof s.buyPrice === "number" ? s.buyPrice : batch ? batch.buyPrice : 0;
    const totalAmount =
      typeof s.totalAmount === "number"
        ? s.totalAmount
        : roundCents((s.qty || 0) * (s.sellPrice || 0));
    const profit =
      typeof s.profit === "number"
        ? s.profit
        : roundCents(totalAmount - (s.qty || 0) * buyPrice);

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

  const enrichedPayments = payments.map((p) => {
    const partner = partnerById.get(p.partnerId);
    return {
      ...p,
      partnerName: partner?.name || "Noma'lum",
      partnerType: partner?.type || "CLIENT",
    };
  });

  const enrichedOffsets = debtOffsets.map((o) => {
    const fromP = partnerById.get(o.fromPartnerId);
    const toP = partnerById.get(o.toPartnerId);
    return {
      ...o,
      fromPartnerName: fromP?.name || "Noma'lum",
      toPartnerName: toP?.name || "Noma'lum",
    };
  });

  // Hamkor ko'rsatkichlari: server hisoblagan qiymatlar ustuvor.
  const soldToUsByPartner = new Map<number, number[]>();
  for (const b of enrichedBatches) {
    const list = soldToUsByPartner.get(b.supplierId) || [];
    list.push(b.totalCost || 0);
    soldToUsByPartner.set(b.supplierId, list);
  }
  const boughtFromUsByPartner = new Map<number, number[]>();
  for (const s of enrichedSales) {
    const list = boughtFromUsByPartner.get(s.clientId) || [];
    list.push(s.totalAmount || 0);
    boughtFromUsByPartner.set(s.clientId, list);
  }
  const paidToUsByPartner = new Map<number, number[]>();
  const paidByUsByPartner = new Map<number, number[]>();
  for (const p of payments) {
    const bucket = p.type === "INCOME" ? paidToUsByPartner : paidByUsByPartner;
    const list = bucket.get(p.partnerId) || [];
    list.push(p.amount || 0);
    bucket.set(p.partnerId, list);
  }
  const offsetFromByPartner = new Map<number, number[]>();
  const offsetToByPartner = new Map<number, number[]>();
  for (const o of debtOffsets) {
    const from = offsetFromByPartner.get(o.fromPartnerId) || [];
    from.push(o.amount || 0);
    offsetFromByPartner.set(o.fromPartnerId, from);
    const to = offsetToByPartner.get(o.toPartnerId) || [];
    to.push(o.amount || 0);
    offsetToByPartner.set(o.toPartnerId, to);
  }

  const enrichedPartners = partners.map((partner) => {
    const totalBoughtFromUs =
      typeof partner.totalBoughtFromUs === "number"
        ? partner.totalBoughtFromUs
        : moneySum(boughtFromUsByPartner.get(partner.id) || []);
    const totalSoldToUs =
      typeof partner.totalSoldToUs === "number"
        ? partner.totalSoldToUs
        : moneySum(soldToUsByPartner.get(partner.id) || []);
    const totalPaidToUs =
      typeof partner.totalPaidToUs === "number"
        ? partner.totalPaidToUs
        : moneySum(paidToUsByPartner.get(partner.id) || []);
    const totalPaidByUs =
      typeof partner.totalPaidByUs === "number"
        ? partner.totalPaidByUs
        : moneySum(paidByUsByPartner.get(partner.id) || []);

    const offsetFrom = moneySum(offsetFromByPartner.get(partner.id) || []);
    const offsetTo = moneySum(offsetToByPartner.get(partner.id) || []);

    const clientDebt = roundCents(totalBoughtFromUs - totalPaidToUs);
    const supplierDebt = roundCents(totalSoldToUs - totalPaidByUs);
    // Hamkor bizdan qarzdor bo'lsa: manfiy (-); haqi bo'lsa: musbat (+).
    const balance =
      typeof partner.balance === "number"
        ? partner.balance
        : roundCents(supplierDebt - clientDebt + offsetFrom - offsetTo);

    const theyOweUs =
      typeof partner.theyOweUs === "number"
        ? partner.theyOweUs
        : balance < 0
          ? Math.abs(balance)
          : 0;
    const weOweThem =
      typeof partner.weOweThem === "number"
        ? partner.weOweThem
        : balance > 0
          ? balance
          : 0;

    return {
      ...partner,
      tags: partner.tags || [],
      totalBoughtFromUs,
      totalPaidToUs,
      totalSoldToUs,
      totalPaidByUs,
      theyOweUs,
      weOweThem,
      totalDeal: roundCents(totalBoughtFromUs + totalSoldToUs),
      totalPaid: roundCents(totalPaidToUs + totalPaidByUs),
      balance,
    };
  });

  // Dashboard ko'rsatkichlari — barchasi server qiymatlaridan.
  const totalProfit = moneySum(enrichedSales.map((s) => s.profit));
  // Borish-kelish partiyalarda borish va kelish o'rinlari alohida hisoblanadi.
  const totalRemainingTickets = batches.reduce((sum, b) => {
    if (b.status !== "ACTIVE") return sum;
    const outLeft = b.remainingQty || 0;
    if (b.isRoundTrip) {
      const retLeft =
        typeof b.returnRemainingQty === "number" ? b.returnRemainingQty : outLeft;
      return sum + outLeft + retLeft;
    }
    return sum + outLeft;
  }, 0);
  const activeBatchesCount = batches.filter((b) => b.status === "ACTIVE").length;

  let ourDebtToSuppliers = 0; // Hamkorlar haqi (+)
  let clientDebtToUs = 0; // Hamkorlar qarzi (-)
  for (const p of enrichedPartners) {
    if ((p.balance || 0) < 0) {
      clientDebtToUs = roundCents(clientDebtToUs + Math.abs(p.balance || 0));
    } else if ((p.balance || 0) > 0) {
      ourDebtToSuppliers = roundCents(ourDebtToSuppliers + (p.balance || 0));
    }
  }

  const totalIncome = moneySum(
    payments.filter((p) => p.type === "INCOME").map((p) => p.amount)
  );
  const totalExpense = moneySum(
    payments.filter((p) => p.type === "EXPENSE").map((p) => p.amount)
  );
  const cashBalance = roundCents(totalIncome - totalExpense);

  const totalDebtOffsets = moneySum(debtOffsets.map((o) => o.amount));

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

export function getNextBatchNumber(
  existingBatches?: Array<{ batchNumber?: string }>,
  offset = 0
): string {
  let maxNum = 0;
  if (existingBatches && existingBatches.length > 0) {
    for (const b of existingBatches) {
      if (b?.batchNumber) {
        const m = String(b.batchNumber).trim().match(/^P(\d+)$/i);
        if (m) {
          const n = parseInt(m[1], 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        }
      }
    }
  }
  const next = maxNum + 1 + offset;
  return `P${String(next).padStart(5, "0")}`;
}

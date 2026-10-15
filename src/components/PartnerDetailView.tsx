"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Search,
  Pencil,
  ShoppingBag,
  Package,
  Wallet,
  Calendar,
  Phone,
  Tag,
  FileText,
  ChevronRight,
} from "lucide-react";
import { formatUSD, formatDate } from "@/lib/format";

interface PartnerDetailViewProps {
  partnerId: number;
  partners: any[];
  batches: any[];
  sales: any[];
  payments: any[];
  debtOffsets?: any[];
  onBack: () => void;
  onOpenPaymentModal: (
    type: "INCOME" | "EXPENSE",
    partnerId: number,
    defaultNotes?: string,
    defaultAmount?: number
  ) => void;
  onOpenDebtOffsetModal?: (fromPartnerId?: number, toPartnerId?: number) => void;
  onEditBatch?: (batch: any) => void;
  onEditSale?: (sale: any) => void;
  onSelectBatch?: (batchId: number) => void;
}

export function PartnerDetailView({
  partnerId,
  partners,
  batches,
  sales,
  payments,
  debtOffsets = [],
  onBack,
  onOpenPaymentModal,
  onOpenDebtOffsetModal,
  onEditBatch,
  onEditSale,
  onSelectBatch,
}: PartnerDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"SALES" | "BATCHES" | "PAYMENTS" | "OFFSETS">("SALES");
  const [searchQuery, setSearchQuery] = useState("");

  const partner = partners.find((p) => p.id === partnerId);
  if (!partner) {
    return (
      <div className="bg-white dark:bg-[#111726] p-8 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] text-center space-y-3">
        <p className="text-slate-500">Hamkor topilmadi!</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Orqaga qaytish
        </button>
      </div>
    );
  }

  // Filter specific data for this partner
  const partnerBatches = batches.filter((b) => b.supplierId === partnerId);
  const partnerSales = sales.filter((s) => s.clientId === partnerId);
  const partnerPayments = payments.filter((p) => p.partnerId === partnerId);
  const partnerOffsets = debtOffsets.filter(
    (o) => o.fromPartnerId === partnerId || o.toPartnerId === partnerId
  );

  // Financial totals
  const totalSoldToUs = partnerBatches.reduce((sum, b) => sum + (b.totalCost || 0), 0);
  const totalBoughtFromUs = partnerSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const totalPaidToUs = partnerPayments
    .filter((p) => p.type === "INCOME")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPaidByUs = partnerPayments
    .filter((p) => p.type === "EXPENSE")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const offsetFrom = partnerOffsets
    .filter((o) => o.fromPartnerId === partnerId)
    .reduce((sum, o) => sum + (o.amount || 0), 0);
  const offsetTo = partnerOffsets
    .filter((o) => o.toPartnerId === partnerId)
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  // Net Balance (Sal'do):
  // (-) = Hamkor bizdan qarzdor
  // (+) = Hamkorning bizda haqi bor
  const clientDebt = totalBoughtFromUs - totalPaidToUs;
  const supplierDebt = totalSoldToUs - totalPaidByUs;
  const netBalance = supplierDebt - clientDebt + offsetFrom - offsetTo;

  // Search filters inside tabs
  const q = searchQuery.toLowerCase().trim();

  const filteredSales = partnerSales.filter((s) => {
    if (!q) return true;
    return (
      s.route?.toLowerCase().includes(q) ||
      s.flightNumber?.toLowerCase().includes(q) ||
      s.passengerNames?.toLowerCase().includes(q) ||
      s.saleDate?.toLowerCase().includes(q)
    );
  });

  const filteredBatches = partnerBatches.filter((b) => {
    if (!q) return true;
    return (
      b.batchNumber?.toLowerCase().includes(q) ||
      b.route?.toLowerCase().includes(q) ||
      b.flightNumber?.toLowerCase().includes(q) ||
      b.flightDate?.toLowerCase().includes(q)
    );
  });

  const filteredPayments = partnerPayments.filter((p) => {
    if (!q) return true;
    return (
      p.notes?.toLowerCase().includes(q) ||
      p.paymentDate?.toLowerCase().includes(q) ||
      p.paymentMethod?.toLowerCase().includes(q)
    );
  });

  const filteredOffsets = partnerOffsets.filter((o) => {
    if (!q) return true;
    return (
      o.fromPartnerName?.toLowerCase().includes(q) ||
      o.toPartnerName?.toLowerCase().includes(q) ||
      o.notes?.toLowerCase().includes(q) ||
      o.date?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* 1. TOP HEADER & NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-[#111726] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs transition-all cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          Orqaga qaytish
        </button>

        {/* Tezkor amallar */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenDebtOffsetModal && (
            <button
              onClick={() =>
                onOpenDebtOffsetModal(
                  netBalance > 0 ? partner.id : undefined,
                  netBalance < 0 ? partner.id : undefined
                )
              }
              className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-[#111726] hover:bg-slate-50 dark:hover:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" /> Qarzni surish
            </button>
          )}

          <button
            onClick={() => onOpenPaymentModal("INCOME", partner.id)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" /> Pul olish (Kirim)
          </button>

          <button
            onClick={() => onOpenPaymentModal("EXPENSE", partner.id)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs shadow-rose-500/20 cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Pul berish (Chiqim)
          </button>
        </div>
      </div>

      {/* 2. HAMKOR PROFILE & MOLIYAVIY HISOBOT KARTALARI */}
      <div className="bg-white dark:bg-[#111726] p-4 sm:p-6 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs space-y-5">
        {/* Profile info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20 uppercase">
              {partner.name?.charAt(0) || "H"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {partner.name}
                </h1>
                {partner.tags && partner.tags.length > 0 ? (
                  partner.tags.map((t: string) => (
                    <span
                      key={t}
                      className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                    >
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {partner.type === "SUPPLIER" ? "Birinchi qo'l" : "Hamkor"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 flex-wrap">
                {partner.phone && (
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {partner.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Qo‘shilgan: {formatDate(partner.createdAt)}
                </span>
                {partner.notes && (
                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 truncate max-w-sm">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    {partner.notes}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Financial Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 tabular-nums">
          {/* Card 1: Bizdan xarid (Chiptalar) */}
          <div className="bg-slate-50/70 dark:bg-white/[0.03] p-4 rounded-xl border border-slate-200/70 dark:border-white/[0.06]">
            <span className="text-xs text-slate-400 block font-medium">
              Bizdan xarid (Chiptalar)
            </span>
            <strong className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1 block">
              {formatUSD(totalBoughtFromUs)}
            </strong>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-200/50 dark:border-white/[0.06]">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                To‘lagan: +{formatUSD(totalPaidToUs)}
              </span>
              <span className="text-slate-400">
                {partnerSales.length} ta sotuv
              </span>
            </div>
          </div>

          {/* Card 2: Bizga sotgan (Partiyalar) */}
          <div className="bg-slate-50/70 dark:bg-white/[0.03] p-4 rounded-xl border border-slate-200/70 dark:border-white/[0.06]">
            <span className="text-xs text-slate-400 block font-medium">
              Bizga sotgan (Partiyalar)
            </span>
            <strong className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1 block">
              {formatUSD(totalSoldToUs)}
            </strong>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-200/50 dark:border-white/[0.06]">
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                To‘laganmiz: -{formatUSD(totalPaidByUs)}
              </span>
              <span className="text-slate-400">
                {partnerBatches.length} ta partiya
              </span>
            </div>
          </div>

          {/* Card 3: Umumiy Sof Balans */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between ${
              netBalance < 0
                ? "bg-rose-500/10 border-rose-500/20 text-rose-900 dark:text-rose-200"
                : netBalance > 0
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200"
                : "bg-slate-100/70 dark:bg-white/[0.04] border-slate-200/70 dark:border-white/[0.06] text-slate-800 dark:text-slate-200"
            }`}
          >
            <div>
              <span className="text-xs block font-bold uppercase tracking-wider">
                Umumiy Sal&apos;do (Balans)
              </span>
              <strong
                className={`text-xl sm:text-2xl font-black mt-1 block ${
                  netBalance < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : netBalance > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {netBalance < 0
                  ? `-${formatUSD(Math.abs(netBalance))}`
                  : netBalance > 0
                  ? `+${formatUSD(netBalance)}`
                  : "$0"}
              </strong>
            </div>
            <div className="text-[11px] font-medium pt-2 mt-2 border-t border-black/5 dark:border-white/5">
              {netBalance < 0 ? (
                <span className="text-rose-700 dark:text-rose-300">
                  ⚠️ Hamkor bizdan qarzdor
                </span>
              ) : netBalance > 0 ? (
                <span className="text-emerald-700 dark:text-emerald-300">
                  ✨ Hamkorning bizda haqi bor
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">
                  ✓ Hisob-kitob teng (Qarzsiz)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BATAFSIL OPERATSIYALAR RO'YXATI (TABS + JADVALLAR) */}
      <div className="bg-white dark:bg-[#111726] p-4 sm:p-6 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs space-y-4">
        {/* Tab switcher and internal search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          {/* Segmented control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/[0.05] rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("SALES")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "SALES"
                  ? "bg-white dark:bg-[#111726] text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Chiptalar sotuvi ({partnerSales.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("BATCHES")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "BATCHES"
                  ? "bg-white dark:bg-[#111726] text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Partiyalar xaridi ({partnerBatches.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("PAYMENTS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "PAYMENTS"
                  ? "bg-white dark:bg-[#111726] text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              Kassa to‘lovlari ({partnerPayments.length})
            </button>

            {partnerOffsets.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("OFFSETS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "OFFSETS"
                    ? "bg-white dark:bg-[#111726] text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Qarz surish ({partnerOffsets.length})
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className="relative sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* TAB CONTENT 1: CHIPTALAR SOTUVI */}
        {activeTab === "SALES" && (
          <div className="space-y-3">
            {filteredSales.map((s) => (
              <div
                key={s.id}
                className="bg-slate-50/60 dark:bg-white/[0.02] p-3.5 sm:p-4 rounded-xl border border-slate-200/70 dark:border-white/[0.06] flex flex-col sm:flex-row items-stretch justify-between gap-3 hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {s.route || "---"}
                    </span>
                    {s.flightNumber && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/[0.08] font-mono text-[11px] font-bold">
                        {s.flightNumber}
                      </span>
                    )}
                    <span className="text-slate-400">• Sotuv: {formatDate(s.saleDate)}</span>
                    {s.flightDate && (
                      <span className="text-slate-500 dark:text-slate-400">
                        • Parvoz: {formatDate(s.flightDate, false)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-0.5 tabular-nums">
                    <span>
                      Soni: <b className="text-blue-600 dark:text-blue-400 font-bold">{s.qty} ta</b>
                    </span>
                    {s.departureTime && (
                      <span>
                        Vaqti: <b className="font-mono text-slate-700 dark:text-slate-300">{s.departureTime}{s.arrivalTime ? `–${s.arrivalTime}` : ""}</b>
                      </span>
                    )}
                    {s.passengerNames && (
                      <span className="truncate max-w-[200px]">
                        Yo‘lovchi: <b className="text-slate-700 dark:text-slate-300">{s.passengerNames}</b>
                      </span>
                    )}
                  </div>
                </div>

                <div className="sm:w-52 p-3 sm:p-0 sm:pl-4 bg-white/70 dark:bg-white/[0.02] sm:bg-transparent border-t sm:border-t-0 sm:border-l border-slate-200/70 dark:border-white/[0.06] flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 tabular-nums">
                  <div className="sm:text-right">
                    <span className="text-xs text-slate-400 block">
                      1 dona: {formatUSD(s.sellPrice)}
                    </span>
                    <strong className="text-base font-black text-slate-900 dark:text-white block mt-0.5">
                      {formatUSD(s.totalAmount)}
                    </strong>
                    <span
                      className={`text-xs font-bold block ${
                        s.profit >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      Foyda: {s.profit >= 0 ? `+${formatUSD(s.profit)}` : `-${formatUSD(Math.abs(s.profit))}`}
                    </span>
                  </div>

                  {onEditSale && (
                    <button
                      type="button"
                      onClick={() => onEditSale(s)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-400" /> Narx
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredSales.length === 0 && (
              <div className="py-10 text-center text-xs text-slate-400">
                Ushbu hamkorga sotilgan chiptalar topilmadi
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT 2: PARTIYALAR XARIDI */}
        {activeTab === "BATCHES" && (
          <div className="space-y-3">
            {filteredBatches.map((b) => (
              <div
                key={b.id}
                className="bg-slate-50/60 dark:bg-white/[0.02] p-3.5 sm:p-4 rounded-xl border border-slate-200/70 dark:border-white/[0.06] flex flex-col sm:flex-row items-stretch justify-between gap-3 hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {b.batchNumber || "---"}
                    </span>
                    <strong className="text-slate-900 dark:text-white font-bold">
                      {b.route || "---"}
                    </strong>
                    <span className="text-slate-400">• Parvoz: {formatDate(b.flightDate, false)}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-0.5 tabular-nums">
                    <span>
                      Jami: <b className="text-slate-800 dark:text-slate-200 font-bold">{b.totalQty} ta</b>
                    </span>
                    <span>
                      Omborda qoldiq:{" "}
                      <b className={b.remainingQty > 0 ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-400"}>
                        {b.remainingQty} ta
                      </b>
                    </span>
                    {b.departureTime && (
                      <span>
                        Vaqti: <b className="font-mono text-slate-700 dark:text-slate-300">{b.departureTime}{b.arrivalTime ? `–${b.arrivalTime}` : ""}</b>
                      </span>
                    )}
                  </div>
                </div>

                <div className="sm:w-52 p-3 sm:p-0 sm:pl-4 bg-white/70 dark:bg-white/[0.02] sm:bg-transparent border-t sm:border-t-0 sm:border-l border-slate-200/70 dark:border-white/[0.06] flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 tabular-nums">
                  <div className="sm:text-right">
                    <span className="text-xs text-slate-400 block">
                      Tannarx: {formatUSD(b.buyPrice)}
                    </span>
                    <strong className="text-base font-black text-slate-900 dark:text-white block mt-0.5">
                      {formatUSD(b.totalCost)}
                    </strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onSelectBatch && (
                      <button
                        type="button"
                        onClick={() => onSelectBatch(b.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                      >
                        Ombor <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                    {onEditBatch && (
                      <button
                        type="button"
                        onClick={() => onEditBatch(b)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-400" /> Narx
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredBatches.length === 0 && (
              <div className="py-10 text-center text-xs text-slate-400">
                Ushbu hamkordan olingan partiyalar topilmadi
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT 3: KASSA TO'LOVLARI */}
        {activeTab === "PAYMENTS" && (
          <div className="space-y-3">
            {filteredPayments.map((p) => (
              <div
                key={p.id}
                className="bg-slate-50/60 dark:bg-white/[0.02] p-3.5 sm:p-4 rounded-xl border border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.type === "INCOME" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <ArrowDownLeft className="w-3 h-3" /> Kirim
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <ArrowUpRight className="w-3 h-3" /> Chiqim
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      • {formatDate(p.paymentDate)}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
                      {p.paymentMethod === "CASH"
                        ? "Naqd pul"
                        : p.paymentMethod === "CARD"
                        ? "Karta"
                        : "Bank"}
                    </span>
                  </div>
                  {p.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md pt-0.5">
                      {p.notes}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0 tabular-nums">
                  <span
                    className={`text-base sm:text-lg font-black ${
                      p.type === "INCOME"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {p.type === "INCOME" ? `+${formatUSD(p.amount)}` : `-${formatUSD(p.amount)}`}
                  </span>
                </div>
              </div>
            ))}

            {filteredPayments.length === 0 && (
              <div className="py-10 text-center text-xs text-slate-400">
                Ushbu hamkor bilan kassa to‘lovlari topilmadi
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT 4: QARZ SURISHLAR */}
        {activeTab === "OFFSETS" && (
          <div className="space-y-3">
            {filteredOffsets.map((o) => (
              <div
                key={o.id}
                className="bg-slate-50/60 dark:bg-white/[0.02] p-3.5 sm:p-4 rounded-xl border border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {o.fromPartnerName}
                    </span>
                    <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {o.toPartnerName}
                    </span>
                    <span className="text-slate-400">• {formatDate(o.date)}</span>
                  </div>
                  {o.notes && (
                    <p className="text-xs text-slate-400">{o.notes}</p>
                  )}
                </div>
                <div className="text-right shrink-0 tabular-nums font-bold text-sm text-blue-600 dark:text-blue-400">
                  {formatUSD(o.amount)}
                </div>
              </div>
            ))}

            {filteredOffsets.length === 0 && (
              <div className="py-10 text-center text-xs text-slate-400">
                O‘zaro surishlar mavjud emas
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

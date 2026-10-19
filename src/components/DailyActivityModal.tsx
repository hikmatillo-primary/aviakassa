"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Filter,
  Clock,
  User,
  Layers,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { FlightBar } from "@/components/FlightBar";
import { formatUSD, formatDate, getTodayISO } from "@/lib/format";

interface DailyActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches?: any[];
  sales?: any[];
  payments?: any[];
  debtOffsets?: any[];
  partners?: any[];
}

type TimelineFilter = "ALL" | "SALES" | "BATCHES" | "PAYMENTS" | "OFFSETS";

export function DailyActivityModal({
  isOpen,
  onClose,
  batches = [],
  sales = [],
  payments = [],
  debtOffsets = [],
  partners = [],
}: DailyActivityModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO());
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>("ALL");

  // Date navigation helpers
  const handleShiftDate = (days: number) => {
    const current = new Date(selectedDate);
    if (isNaN(current.getTime())) return;
    current.setDate(current.getDate() + days);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const isToday = selectedDate === getTodayISO();

  // Helper to extract time string (HH:MM) from createdAt
  const extractTime = (createdAt?: string) => {
    if (!createdAt) return "";
    try {
      const d = new Date(createdAt);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // Partner name map
  const partnerMap = useMemo(() => {
    const map = new Map<number, string>();
    partners.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [partners]);

  // Matches item date with selectedDate
  const matchesDate = React.useCallback(
    (itemDate?: string, createdAt?: string) => {
      if (itemDate && itemDate.slice(0, 10) === selectedDate) return true;
      if (createdAt && createdAt.slice(0, 10) === selectedDate) return true;
      return false;
    },
    [selectedDate]
  );

  // Day specific items
  const daySales = useMemo(
    () => sales.filter((s) => matchesDate(s.saleDate, s.createdAt)),
    [sales, matchesDate]
  );

  const dayBatches = useMemo(
    () => batches.filter((b) => matchesDate(b.purchaseDate, b.createdAt)),
    [batches, matchesDate]
  );

  const dayPayments = useMemo(
    () => payments.filter((p) => matchesDate(p.paymentDate, p.createdAt)),
    [payments, matchesDate]
  );

  const dayOffsets = useMemo(
    () => debtOffsets.filter((o) => matchesDate(o.date, o.createdAt)),
    [debtOffsets, matchesDate]
  );

  // Daily Metrics
  const metrics = useMemo(() => {
    const salesQty = daySales.reduce((acc, s) => acc + (s.qty || 0), 0);
    const salesRevenue = daySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const salesProfit = daySales.reduce((acc, s) => acc + (s.profit || 0), 0);

    const batchesQty = dayBatches.reduce((acc, b) => acc + (b.totalQty || 0), 0);
    const batchesCost = dayBatches.reduce((acc, b) => acc + (b.totalCost || 0), 0);

    const income = dayPayments
      .filter((p) => p.type === "INCOME")
      .reduce((acc, p) => acc + (p.amount || 0), 0);
    const expense = dayPayments
      .filter((p) => p.type === "EXPENSE")
      .reduce((acc, p) => acc + (p.amount || 0), 0);
    const cashNet = income - expense;

    const offsetsAmount = dayOffsets.reduce((acc, o) => acc + (o.amount || 0), 0);

    return {
      salesCount: daySales.length,
      salesQty,
      salesRevenue,
      salesProfit,
      batchesCount: dayBatches.length,
      batchesQty,
      batchesCost,
      paymentsCount: dayPayments.length,
      income,
      expense,
      cashNet,
      offsetsCount: dayOffsets.length,
      offsetsAmount,
    };
  }, [daySales, dayBatches, dayPayments, dayOffsets]);

  // Combined and sorted timeline
  const timelineEvents = useMemo(() => {
    const list: Array<{
      id: string;
      kind: "SALE" | "BATCH" | "PAYMENT" | "OFFSET";
      timestamp: number;
      timeStr: string;
      data: any;
    }> = [];

    daySales.forEach((s) => {
      const t = s.createdAt ? new Date(s.createdAt).getTime() : 0;
      list.push({
        id: `sale-${s.id}`,
        kind: "SALE",
        timestamp: t || s.id,
        timeStr: extractTime(s.createdAt),
        data: s,
      });
    });

    dayBatches.forEach((b) => {
      const t = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      list.push({
        id: `batch-${b.id}`,
        kind: "BATCH",
        timestamp: t || b.id,
        timeStr: extractTime(b.createdAt),
        data: b,
      });
    });

    dayPayments.forEach((p) => {
      const t = p.createdAt ? new Date(p.createdAt).getTime() : 0;
      list.push({
        id: `payment-${p.id}`,
        kind: "PAYMENT",
        timestamp: t || p.id,
        timeStr: extractTime(p.createdAt),
        data: p,
      });
    });

    dayOffsets.forEach((o) => {
      const t = o.createdAt ? new Date(o.createdAt).getTime() : 0;
      list.push({
        id: `offset-${o.id}`,
        kind: "OFFSET",
        timestamp: t || o.id,
        timeStr: extractTime(o.createdAt),
        data: o,
      });
    });

    // Newest first
    list.sort((a, b) => b.timestamp - a.timestamp);

    if (activeFilter === "ALL") return list;
    if (activeFilter === "SALES") return list.filter((e) => e.kind === "SALE");
    if (activeFilter === "BATCHES") return list.filter((e) => e.kind === "BATCH");
    if (activeFilter === "PAYMENTS") return list.filter((e) => e.kind === "PAYMENT");
    if (activeFilter === "OFFSETS") return list.filter((e) => e.kind === "OFFSET");
    return list;
  }, [daySales, dayBatches, dayPayments, dayOffsets, activeFilter]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kunlik hisobot va amallar jurnali"
      description="Tanlangan kundagi barcha xaridlar, sotuvlar, to‘lovlar va qarz harakatlari xronologiyasi."
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Date Selector Header Bar */}
        <div className="bg-slate-50 dark:bg-white/[0.03] p-3 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              aria-label="Oldingi kun"
              className="p-2 rounded-xl bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] transition-all cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative flex-1 sm:flex-none">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-bold bg-white dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              aria-label="Keyingi kun"
              className="p-2 rounded-xl bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] transition-all cursor-pointer shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(getTodayISO())}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all cursor-pointer"
              >
                Bugun
              </button>
            )}
          </div>

          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {formatDate(selectedDate)}
            </span>
            {isToday && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Bugun
              </span>
            )}
          </div>
        </div>

        {/* 4 Summary KPI Cards for the Day */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 tabular-nums">
          {/* Card 1: Sotuvlar */}
          <div className="bg-white dark:bg-[#111726] p-3.5 rounded-xl border border-slate-200/70 dark:border-white/[0.07] shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Kunlik Sotuv</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>
            <strong className="text-base sm:text-lg font-black text-slate-900 dark:text-white block mt-1">
              {formatUSD(metrics.salesRevenue)}
            </strong>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{metrics.salesQty} ta chipta</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                +{formatUSD(metrics.salesProfit)}
              </span>
            </div>
          </div>

          {/* Card 2: Xaridlar */}
          <div className="bg-white dark:bg-[#111726] p-3.5 rounded-xl border border-slate-200/70 dark:border-white/[0.07] shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Kunlik Xarid</span>
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            <strong className="text-base sm:text-lg font-black text-slate-900 dark:text-white block mt-1">
              {formatUSD(metrics.batchesCost)}
            </strong>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{metrics.batchesCount} ta partiya</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {metrics.batchesQty} ta joy
              </span>
            </div>
          </div>

          {/* Card 3: Kassa Kirim/Chiqim */}
          <div className="bg-white dark:bg-[#111726] p-3.5 rounded-xl border border-slate-200/70 dark:border-white/[0.07] shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Kassa Netto</span>
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  metrics.cashNet >= 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}
              >
                {metrics.cashNet >= 0 ? (
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
            <strong
              className={`text-base sm:text-lg font-black block mt-1 ${
                metrics.cashNet >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {metrics.cashNet >= 0
                ? `+${formatUSD(metrics.cashNet)}`
                : `-${formatUSD(Math.abs(metrics.cashNet))}`}
            </strong>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                +{formatUSD(metrics.income)}
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                -{formatUSD(metrics.expense)}
              </span>
            </div>
          </div>

          {/* Card 4: Qarz surishlar */}
          <div className="bg-white dark:bg-[#111726] p-3.5 rounded-xl border border-slate-200/70 dark:border-white/[0.07] shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Qarz surishlar</span>
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </div>
            </div>
            <strong className="text-base sm:text-lg font-black text-slate-900 dark:text-white block mt-1">
              {formatUSD(metrics.offsetsAmount)}
            </strong>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{metrics.offsetsCount} ta surish</span>
              <span className="text-slate-400 font-medium">O‘zaro hisob</span>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "ALL"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/[0.08]"
            }`}
          >
            Barchasi ({timelineEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("SALES")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "SALES"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/[0.08]"
            }`}
          >
            Sotuvlar ({metrics.salesCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("BATCHES")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "BATCHES"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/[0.08]"
            }`}
          >
            Xaridlar ({metrics.batchesCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("PAYMENTS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "PAYMENTS"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/[0.08]"
            }`}
          >
            Kassa ({metrics.paymentsCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("OFFSETS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "OFFSETS"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/[0.08]"
            }`}
          >
            Qarz surish ({metrics.offsetsCount})
          </button>
        </div>

        {/* Activity Timeline Feed */}
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {timelineEvents.map((event) => {
            if (event.kind === "SALE") {
              const s = event.data;
              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-[#111726] p-3.5 sm:p-4 rounded-xl border border-slate-200/70 dark:border-white/[0.07] shadow-2xs hover:border-emerald-300/60 dark:hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row items-stretch justify-between gap-3"
                >
                  <div className="flex-1 min-w-0 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          SOTUV
                        </span>
                        {event.timeStr && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3" /> {event.timeStr}
                          </span>
                        )}
                        <FlightBar batch={s} size="sm" showSubtitle={false} />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {s.clientName || partnerMap.get(s.clientId) || "Mijoz"}
                        </span>
                        <span>•</span>
                        <span>
                          Soni: <b className="text-blue-600 dark:text-blue-400">{s.qty} ta</b>
                        </span>
                        {s.passengerNames && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px]">
                              Yo‘lovchi: <b className="text-slate-700 dark:text-slate-300">{s.passengerNames}</b>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 tabular-nums border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-white/[0.06] flex sm:flex-col justify-between items-center sm:items-end">
                    <div>
                      <span className="text-[11px] text-slate-400 block">
                        1 dona: {formatUSD(s.sellPrice)}
                      </span>
                      <strong className="text-sm sm:text-base font-black text-slate-900 dark:text-white block">
                        {formatUSD(s.totalAmount)}
                      </strong>
                    </div>
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
                </div>
              );
            }

            if (event.kind === "BATCH") {
              const b = event.data;
              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-[#111726] p-3.5 sm:p-4 rounded-xl border border-slate-200/70 dark:border-white/[0.07] shadow-2xs hover:border-blue-300/60 dark:hover:border-blue-500/30 transition-all flex flex-col sm:flex-row items-stretch justify-between gap-3"
                >
                  <div className="flex-1 min-w-0 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          XARID (PARTIYA)
                        </span>
                        {event.timeStr && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3" /> {event.timeStr}
                          </span>
                        )}
                        <FlightBar batch={b} size="sm" showSubtitle={false} />
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          {b.batchNumber || "---"}
                        </span>
                        {b.accountedAt === null && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Kutilmoqda
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {b.supplierName || partnerMap.get(b.supplierId) || "Ta'minotchi"}
                        </span>
                        <span>•</span>
                        <span>
                          Jami joy: <b className="text-slate-800 dark:text-slate-200">{b.totalQty} ta</b>
                        </span>
                        {b.categoryName && (
                          <>
                            <span>•</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                              {b.categoryName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 tabular-nums border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-white/[0.06] flex sm:flex-col justify-between items-center sm:items-end">
                    <div>
                      <span className="text-[11px] text-slate-400 block">
                        1 dona: {formatUSD(b.buyPrice)}
                      </span>
                      <strong className="text-sm sm:text-base font-black text-slate-900 dark:text-white block">
                        {formatUSD(b.totalCost)}
                      </strong>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium block">
                      Tannarx yig‘indisi
                    </span>
                  </div>
                </div>
              );
            }

            if (event.kind === "PAYMENT") {
              const p = event.data;
              const isIncome = p.type === "INCOME";
              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-[#111726] p-3.5 sm:p-4 rounded-xl border border-slate-200/70 dark:border-white/[0.07] shadow-2xs hover:border-slate-300 dark:hover:border-white/[0.12] transition-all flex flex-col sm:flex-row items-stretch justify-between gap-3"
                >
                  <div className="flex-1 min-w-0 flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isIncome
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            isIncome
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isIncome ? "KIRIM (PUL OLINDI)" : "CHIQIM (PUL TO‘LANDI)"}
                        </span>
                        {event.timeStr && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3" /> {event.timeStr}
                          </span>
                        )}
                        {p.paymentMethod && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {p.paymentMethod}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {p.partnerName || partnerMap.get(p.partnerId) || "Hamkor"}
                        </span>
                        {p.accountName && (
                          <>
                            <span>•</span>
                            <span>Hisob: <b className="text-slate-700 dark:text-slate-300">{p.accountName}</b></span>
                          </>
                        )}
                        {p.notes && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 truncate max-w-xs">{p.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 tabular-nums border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-white/[0.06] flex sm:flex-col justify-between items-center sm:items-end">
                    <strong
                      className={`text-base font-black ${
                        isIncome
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isIncome ? `+${formatUSD(p.amount)}` : `-${formatUSD(p.amount)}`}
                    </strong>
                    <span className="text-[11px] text-slate-400 font-medium block">
                      {isIncome ? "Mijozdan kirim" : "Ta'minotchiga to‘lov"}
                    </span>
                  </div>
                </div>
              );
            }

            if (event.kind === "OFFSET") {
              const o = event.data;
              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-[#111726] p-3.5 sm:p-4 rounded-xl border border-slate-200/70 dark:border-white/[0.07] shadow-2xs hover:border-amber-300/60 dark:hover:border-amber-500/30 transition-all flex flex-col sm:flex-row items-stretch justify-between gap-3"
                >
                  <div className="flex-1 min-w-0 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          QARZ SURISH
                        </span>
                        {event.timeStr && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3" /> {event.timeStr}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">{o.fromPartnerName || partnerMap.get(o.fromPartnerId)}</span>
                        <span className="text-amber-500 font-bold">➔</span>
                        <span className="font-semibold">{o.toPartnerName || partnerMap.get(o.toPartnerId)}</span>
                        {o.notes && (
                          <>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-400 truncate max-w-xs">{o.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 tabular-nums border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-white/[0.06] flex sm:flex-col justify-between items-center sm:items-end">
                    <strong className="text-base font-black text-amber-600 dark:text-amber-400">
                      {formatUSD(o.amount)}
                    </strong>
                    <span className="text-[11px] text-slate-400 font-medium block">
                      O‘zaro hisob-kitob
                    </span>
                  </div>
                </div>
              );
            }

            return null;
          })}

          {timelineEvents.length === 0 && (
            <div className="py-14 text-center space-y-2 bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08]">
              <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ushbu kunda ({formatDate(selectedDate)}) amallar topilmadi
              </p>
              <p className="text-[11px] text-slate-400">
                Boshqa sanani tanlab amallar xronologiyasini ko‘rishingiz mumkin.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

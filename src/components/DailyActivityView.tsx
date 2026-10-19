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
import { FlightBar } from "@/components/FlightBar";
import { DatePicker } from "@/components/DatePicker";
import { formatUSD, formatDate, getTodayISO } from "@/lib/format";

export interface DailyActivityViewProps {
  batches?: any[];
  sales?: any[];
  payments?: any[];
  debtOffsets?: any[];
  partners?: any[];
}

type TimelineFilter = "ALL" | "SALES" | "BATCHES" | "PAYMENTS" | "OFFSETS";

export function DailyActivityView({
  batches = [],
  sales = [],
  payments = [],
  debtOffsets = [],
  partners = [],
}: DailyActivityViewProps) {
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

    const offsetSum = dayOffsets.reduce((acc, o) => acc + (o.amount || 0), 0);

    return {
      salesCount: daySales.length,
      salesQty,
      salesRevenue,
      salesProfit,
      batchesCount: dayBatches.length,
      batchesQty,
      batchesCost,
      income,
      expense,
      cashNet: income - expense,
      offsetsCount: dayOffsets.length,
      offsetSum,
    };
  }, [daySales, dayBatches, dayPayments, dayOffsets]);

  // Combined timeline of all events sorted chronologically (newest first)
  const timelineEvents = useMemo(() => {
    type ActivityItem = {
      id: string;
      kind: "SALE" | "BATCH" | "PAYMENT" | "OFFSET";
      timestamp: number;
      timeStr: string;
      data: any;
    };

    const list: ActivityItem[] = [];

    // 1. Sales
    daySales.forEach((s) => {
      const time = s.createdAt ? new Date(s.createdAt).getTime() : 0;
      list.push({
        id: `sale-${s.id}`,
        kind: "SALE",
        timestamp: time || 1,
        timeStr: extractTime(s.createdAt),
        data: s,
      });
    });

    // 2. Batches
    dayBatches.forEach((b) => {
      const time = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      list.push({
        id: `batch-${b.id}`,
        kind: "BATCH",
        timestamp: time || 2,
        timeStr: extractTime(b.createdAt),
        data: b,
      });
    });

    // 3. Payments
    dayPayments.forEach((p) => {
      const time = p.createdAt ? new Date(p.createdAt).getTime() : 0;
      list.push({
        id: `payment-${p.id}`,
        kind: "PAYMENT",
        timestamp: time || 3,
        timeStr: extractTime(p.createdAt),
        data: p,
      });
    });

    // 4. Debt Offsets
    dayOffsets.forEach((o) => {
      const time = o.createdAt ? new Date(o.createdAt).getTime() : 0;
      list.push({
        id: `offset-${o.id}`,
        kind: "OFFSET",
        timestamp: time || 4,
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
    <div className="space-y-5">
      {/* Date Selector Header Bar */}
      <div className="bg-white dark:bg-[#111726] p-3.5 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleShiftDate(-1)}
            aria-label="Oldingi kun"
            className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] transition-all cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative flex-1 sm:flex-none">
            <DatePicker
              value={selectedDate}
              onChange={(val) => val && setSelectedDate(val)}
              compact
              align="auto"
              placeholder="Sanani tanlang"
            />
          </div>

          <button
            type="button"
            onClick={() => handleShiftDate(1)}
            aria-label="Keyingi kun"
            className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] transition-all cursor-pointer shadow-2xs"
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

        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 tabular-nums">
        {/* Card 1: Sotuvlar */}
        <div className="bg-white dark:bg-[#111726] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Kunlik Sotuv</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-lg sm:text-xl font-black text-slate-900 dark:text-white block mt-1.5">
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
        <div className="bg-white dark:bg-[#111726] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Kunlik Xarid</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-lg sm:text-xl font-black text-slate-900 dark:text-white block mt-1.5">
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
        <div className="bg-white dark:bg-[#111726] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Kassa Netto</span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                metrics.cashNet >= 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              {metrics.cashNet >= 0 ? (
                <ArrowDownLeft className="w-4 h-4" />
              ) : (
                <ArrowUpRight className="w-4 h-4" />
              )}
            </div>
          </div>
          <strong
            className={`text-lg sm:text-xl font-black block mt-1.5 ${
              metrics.cashNet >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {metrics.cashNet >= 0 ? "+" : ""}
            {formatUSD(metrics.cashNet)}
          </strong>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="text-emerald-600 dark:text-emerald-400">
              ↓ {formatUSD(metrics.income)}
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              ↑ {formatUSD(metrics.expense)}
            </span>
          </div>
        </div>

        {/* Card 4: O'zaro hisob-kitob */}
        <div className="bg-white dark:bg-[#111726] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Qarz hisobi</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-lg sm:text-xl font-black text-slate-900 dark:text-white block mt-1.5">
            {formatUSD(metrics.offsetSum)}
          </strong>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{metrics.offsetsCount} ta operatsiya</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">O‘zaro</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(
            [
              { id: "ALL", label: "Barchasi", count: timelineEvents.length },
              { id: "SALES", label: "Sotuvlar", count: daySales.length },
              { id: "BATCHES", label: "Xaridlar", count: dayBatches.length },
              { id: "PAYMENTS", label: "To‘lovlar", count: dayPayments.length },
              { id: "OFFSETS", label: "Qarz hisobi", count: dayOffsets.length },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveFilter(t.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                activeFilter === t.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeFilter === t.id
                    ? "bg-white/20 text-white dark:bg-black/20 dark:text-slate-900"
                    : "bg-slate-200 dark:bg-white/[0.1] text-slate-600 dark:text-slate-400"
                }`}
              >
                {t.id === "ALL"
                  ? daySales.length + dayBatches.length + dayPayments.length + dayOffsets.length
                  : t.count}
              </span>
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-400 font-medium hidden sm:block">
          Jami amallar:{" "}
          <strong className="text-slate-700 dark:text-slate-300">
            {timelineEvents.length}
          </strong>{" "}
          ta
        </div>
      </div>

      {/* Chronological Activity Feed */}
      <div className="space-y-3">
        {timelineEvents.map((event) => {
          // 1. SALE Card
          if (event.kind === "SALE") {
            const s = event.data;
            return (
              <div
                key={event.id}
                className="bg-white dark:bg-[#111726] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-white/[0.12] transition-all"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        SOTUV #{s.id}
                      </span>
                      {event.timeStr && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {event.timeStr}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {s.clientName || "Noma’lum mijoz"}
                      </span>
                    </div>

                    <div className="max-w-md">
                      <FlightBar batch={s} showSubtitle={false} />
                    </div>

                    {s.passengerNames && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{s.passengerNames}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-white/[0.05] shrink-0">
                  <div className="text-left sm:text-right">
                    <strong className="text-sm sm:text-base font-black text-slate-900 dark:text-white tabular-nums block">
                      {formatUSD(s.totalAmount)}
                    </strong>
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {s.qty} dona × {formatUSD(s.unitPrice)}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +{formatUSD(s.profit)} foyda
                  </span>
                </div>
              </div>
            );
          }

          // 2. BATCH Card (Purchase)
          if (event.kind === "BATCH") {
            const b = event.data;
            return (
              <div
                key={event.id}
                className="bg-white dark:bg-[#111726] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-white/[0.12] transition-all"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        XARID #{b.id}
                      </span>
                      {event.timeStr && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {event.timeStr}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {b.supplierName || "Noma’lum ta’minotchi"}
                      </span>
                    </div>

                    <div className="max-w-md">
                      <FlightBar batch={b} showSubtitle={false} />
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                        Jami {b.totalQty} ta joy
                      </span>
                      <span>•</span>
                      <span>Qoldiq: {b.remainingQty ?? b.totalQty} ta</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-white/[0.05] shrink-0">
                  <strong className="text-sm sm:text-base font-black text-slate-900 dark:text-white tabular-nums block">
                    {formatUSD(b.totalCost)}
                  </strong>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    tannarxi: {formatUSD(b.unitCost)} / dona
                  </span>
                </div>
              </div>
            );
          }

          // 3. PAYMENT Card
          if (event.kind === "PAYMENT") {
            const p = event.data;
            const isIncome = p.type === "INCOME";
            const pName =
              p.partnerName ||
              (p.partnerId ? partnerMap.get(p.partnerId) : "") ||
              "Noma’lum hamkor";
            return (
              <div
                key={event.id}
                className="bg-white dark:bg-[#111726] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-white/[0.12] transition-all"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
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
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          isIncome
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {isIncome ? "KIRIM TO‘LOV" : "CHIQIM TO‘LOV"}
                      </span>
                      {event.timeStr && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {event.timeStr}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {pName}
                    </p>
                    {p.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Izoh: {p.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-white/[0.05] shrink-0">
                  <strong
                    className={`text-sm sm:text-base font-black tabular-nums block ${
                      isIncome
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatUSD(p.amount)}
                  </strong>
                  <span className="text-[11px] text-slate-400 font-medium block">
                    {p.accountName || "Kassa"}
                  </span>
                </div>
              </div>
            );
          }

          // 4. OFFSET Card
          if (event.kind === "OFFSET") {
            const o = event.data;
            const fromName =
              o.fromPartnerName ||
              (o.fromPartnerId ? partnerMap.get(o.fromPartnerId) : "") ||
              "Hamkor 1";
            const toName =
              o.toPartnerName ||
              (o.toPartnerId ? partnerMap.get(o.toPartnerId) : "") ||
              "Hamkor 2";
            return (
              <div
                key={event.id}
                className="bg-white dark:bg-[#111726] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-white/[0.12] transition-all"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        QARZNI O‘ZARO HISOBLASH
                      </span>
                      {event.timeStr && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {event.timeStr}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {fromName} ↔ {toName}
                    </p>
                    {o.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Izoh: {o.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-white/[0.05] shrink-0">
                  <strong className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 tabular-nums block">
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
          <div className="py-14 text-center space-y-2 bg-white dark:bg-[#111726] rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08]">
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
  );
}

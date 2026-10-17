"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Layers,
  Search,
  MoreHorizontal,
  ChevronDown,
  Plane,
  ArrowRightLeft,
} from "lucide-react";

const MONTH_LABELS = [
  "Yan", "Fev", "Mar", "Apr", "May", "Iyun",
  "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek",
];

const PERIOD_OPTIONS = [
  { label: "3 oy", months: 3 },
  { label: "6 oy", months: 6 },
  { label: "12 oy", months: 12 },
];
import { formatMoney, formatUSD, formatDate, matchesRouteSearch, isBatchExpired } from "@/lib/format";

interface DashboardViewProps {
  stats: any;
  batches: any[];
  sales: any[];
  payments: any[];
  partners: any[];
  onViewAllBatches?: () => void;
  onViewAllPartners?: () => void;
  onSelectBatch?: (batchId: number) => void;
  onOpenSaleModal?: (batchId: number) => void;
  onNavigateTab?: (tab: string) => void;
  onOpenPartnersDebt?: (filter: "DEBT_US" | "DEBT_THEM") => void;
  onRefresh?: () => void;
}

export function DashboardView({
  stats,
  batches,
  sales,
  partners,
  onViewAllBatches,
  onSelectBatch,
  onOpenSaleModal,
  onNavigateTab,
  onOpenPartnersDebt,
}: DashboardViewProps) {
  const [search, setSearch] = useState("");
  const [periodMonths, setPeriodMonths] = useState(6);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPeriodOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) {
        setIsPeriodOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isPeriodOpen]);

  const periodLabel =
    PERIOD_OPTIONS.find((o) => o.months === periodMonths)?.label || "6 oy";

  const availableBatches = batches.filter((b) => b.remainingQty > 0);

  // Filtered sales for bottom table
  const filteredSales = sales.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.clientName?.toLowerCase().includes(q) ||
      matchesRouteSearch(s.route, search) ||
      s.passengerNames?.toLowerCase().includes(q) ||
      String(s.id).includes(q)
    );
  });

  const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalTicketsAll = batches.reduce((sum, b) => sum + (b.totalQty || 0), 0);
  const totalSoldTicketsAll = batches.reduce(
    (sum, b) => sum + Math.max(0, (b.totalQty || 0) - (b.remainingQty || 0)),
    0
  );
  const soldRateNum = totalTicketsAll > 0 ? (totalSoldTicketsAll / totalTicketsAll) * 100 : 0;
  const soldRateDisplay = soldRateNum.toFixed(1);
  const filledArcSegments = Math.round((soldRateNum / 100) * 12);

  // Real oylik sotuv dinamikasi (oxirgi `periodMonths` oy)
  const monthsData = useMemo(() => {
    const now = new Date();
    const series = Array.from({ length: periodMonths }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (periodMonths - 1 - i), 1);
      return {
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        label: MONTH_LABELS[d.getMonth()],
        revenue: 0,
        tickets: 0,
      };
    });
    const index = new Map(series.map((m, idx) => [`${m.year}-${m.monthIndex}`, idx]));
    for (const s of sales) {
      if (!s.saleDate) continue;
      const parts = String(s.saleDate).split("-");
      if (parts.length < 3) continue;
      const y = parseInt(parts[0], 10);
      const mo = parseInt(parts[1], 10) - 1;
      const idx = index.get(`${y}-${mo}`);
      if (idx === undefined) continue;
      series[idx].revenue += s.totalAmount || 0;
      series[idx].tickets += s.qty || 0;
    }
    const max = Math.max(1, ...series.map((m) => m.revenue));
    return series.map((m) => ({
      month: m.label,
      height: m.revenue > 0 ? Math.max(4, Math.round((m.revenue / max) * 100)) : 2,
      value: formatUSD(m.revenue),
      tickets: m.tickets,
      revenue: formatUSD(m.revenue),
      rawRevenue: m.revenue,
      active: m.year === now.getFullYear() && m.monthIndex === now.getMonth(),
    }));
  }, [sales, periodMonths]);

  const yMaxK = Math.max(1, Math.ceil(Math.max(0, ...monthsData.map((m) => m.rawRevenue)) / 1000));
  const yAxisLabels = Array.from({ length: 6 }, (_, i) => {
    const v = (yMaxK * (5 - i)) / 5;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}k`;
  });

  const seriesYears = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (periodMonths - 1), 1);
    const startYear = start.getFullYear();
    const endYear = now.getFullYear();
    return startYear === endYear ? `${endYear}-yil` : `${startYear} – ${endYear}`;
  }, [periodMonths]);

  return (
    <div className="space-y-6">
      {/* 1. Header Title & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
        </div>

        {/* Period filter pill */}
        <div className="flex items-center gap-2.5 relative" ref={periodRef}>
          <button
            type="button"
            onClick={() => setIsPeriodOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={isPeriodOpen}
            aria-label="Davrni tanlash"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-[#111726] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:border-slate-300 dark:hover:border-white/[0.15] transition-all cursor-pointer"
          >
            Oxirgi {periodLabel}
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isPeriodOpen ? "rotate-180" : ""}`} />
          </button>

          {isPeriodOpen && (
            <div
              role="listbox"
              aria-label="Davr"
              className="absolute right-0 top-full mt-1.5 z-30 w-32 bg-white dark:bg-[#111726] rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-lg overflow-hidden py-1"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.months}
                  type="button"
                  role="option"
                  aria-selected={opt.months === periodMonths}
                  onClick={() => {
                    setPeriodMonths(opt.months);
                    setIsPeriodOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    opt.months === periodMonths
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]"
                  }`}
                >
                  Oxirgi {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* 2. Top 4 KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
        {/* Card 1: Sof Foyda */}
        <div
          onClick={() => onNavigateTab && onNavigateTab("sales")}
          className="bg-gradient-to-r from-blue-600 via-blue-600 to-sky-500 rounded-2xl p-5 sm:p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden flex flex-col justify-between min-h-[155px] cursor-pointer hover:scale-[1.015] active:scale-[0.99] transition-all group"
        >
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-blue-100">
              Sof foyda
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2 relative z-10">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {formatUSD(stats?.totalProfit)}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-white/20 backdrop-blur-sm text-[11px] font-semibold text-white">
                {totalSoldTicketsAll} ta sotuvdan
              </span>
            </div>
          </div>

          <div className="text-[11px] text-blue-100 relative z-10 flex items-center justify-between">
            <span>Tushum: {formatUSD(totalSalesRevenue)}</span>
            <span className="font-semibold text-white">
              Marja: ~{totalSalesRevenue > 0 ? Math.round(((stats?.totalProfit || 0) / totalSalesRevenue) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card 2: Hamkorlar qarzi (Olinishi kerak) */}
        <div
          onClick={() => onOpenPartnersDebt && onOpenPartnersDebt("DEBT_US")}
          className="bg-white dark:bg-[#111726] rounded-2xl p-5 sm:p-6 border border-slate-200/70 dark:border-white/[0.07] shadow-xs relative flex flex-col justify-between min-h-[155px] hover:border-blue-400 dark:hover:border-blue-500/50 cursor-pointer hover:scale-[1.015] active:scale-[0.99] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Hamkorlar qarzi (Olinishi kerak)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {stats?.clientDebtToUs ? formatUSD(stats.clientDebtToUs) : "$0"}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                Qarzdorlik
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>Hamkorlar umumiy qarzi</span>
            <span className="font-medium text-slate-500 dark:text-slate-400">Olinishi kerak</span>
          </div>
        </div>

        {/* Card 3: Hamkorlar haqi (To‘lanishi kerak) */}
        <div
          onClick={() => onOpenPartnersDebt && onOpenPartnersDebt("DEBT_THEM")}
          className="bg-white dark:bg-[#111726] rounded-2xl p-5 sm:p-6 border border-slate-200/70 dark:border-white/[0.07] shadow-xs relative flex flex-col justify-between min-h-[155px] hover:border-blue-400 dark:hover:border-blue-500/50 cursor-pointer hover:scale-[1.015] active:scale-[0.99] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Hamkorlar haqi (To‘lanishi kerak)
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {stats?.ourDebtToSuppliers ? formatUSD(stats.ourDebtToSuppliers) : "$0"}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[11px] font-semibold">
                Haqdorlik
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>Ta‘minotchilarga to‘lov</span>
            <span className="font-medium text-slate-500 dark:text-slate-400">To‘lanishi kerak</span>
          </div>
        </div>

        {/* Card 4: Ombordagi Chiptalar */}
        <div
          onClick={() => onNavigateTab && onNavigateTab("inventory")}
          className="bg-white dark:bg-[#111726] rounded-2xl p-5 sm:p-6 border border-slate-200/70 dark:border-white/[0.07] shadow-xs relative flex flex-col justify-between min-h-[155px] hover:border-blue-400 dark:hover:border-blue-500/50 cursor-pointer hover:scale-[1.015] active:scale-[0.99] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Ombordagi chiptalar
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {formatMoney(stats?.totalRemainingTickets)}
              </span>
              <span className="text-sm font-semibold text-slate-400">ta joy</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>{batches.length} ta partiyada</span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:underline">Omborga o‘tish →</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Savdo Dinamikasi + Chiptalar Sotilishi Spidometri */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Savdo Dinamikasi (Performance Overview) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#111726] rounded-2xl p-5 sm:p-6 border border-slate-200/70 dark:border-white/[0.07] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Savdo dinamikasi
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Oylar kesimida partiya va chipta sotuvlari ko‘lami
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 dark:bg-white/[0.05] rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>{seriesYears}</span>
            </div>
          </div>

          {/* Bar Chart Canvas with Y-Axis and Tooltip */}
          <div className="relative pt-6 pb-2 tabular-nums">
            <div className="flex h-56 items-end gap-3 sm:gap-6 pl-8 relative">
              {/* Y-Axis lines and labels */}
              <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[11px] text-slate-400 dark:text-slate-500 select-none">
                {yAxisLabels.map((label, i) => (
                  <span key={i}>{label}</span>
                ))}
              </div>

              {/* Horizontal gridlines */}
              <div className="absolute inset-x-8 top-0 border-b border-dashed border-slate-100 dark:border-white/[0.05] pointer-events-none" />
              <div className="absolute inset-x-8 top-1/4 border-b border-dashed border-slate-100 dark:border-white/[0.05] pointer-events-none" />
              <div className="absolute inset-x-8 top-2/4 border-b border-dashed border-slate-100 dark:border-white/[0.05] pointer-events-none" />
              <div className="absolute inset-x-8 top-3/4 border-b border-dashed border-slate-100 dark:border-white/[0.05] pointer-events-none" />

              {/* Bars */}
              {monthsData.map((item) => {
                const isActive = item.active;

                return (
                  <div
                    key={item.month}
                    className="flex-1 flex flex-col items-center h-full justify-end relative group"
                  >
                    {/* Tooltip on Active Bar */}
                    {isActive && (
                      <div className="absolute -top-12 z-20 bg-white dark:bg-slate-900 rounded-xl p-2.5 shadow-xl border border-slate-200/80 dark:border-white/[0.1] text-xs w-40 pointer-events-none animate-in fade-in zoom-in-95">
                        <div className="font-bold text-slate-900 dark:text-white text-[11px] mb-1">
                          Joriy ko‘rsatkich
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                          <span>Sotildi:</span>
                          <strong className="text-slate-800 dark:text-slate-200">{item.tickets} ta</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Tushum:</span>
                          <strong className="text-blue-600 dark:text-blue-400">{item.revenue}</strong>
                        </div>
                      </div>
                    )}

                    {/* The Bar */}
                    <div className="w-full max-w-[42px] h-full flex items-end">
                      <div
                        style={{ height: `${item.height}%` }}
                        className={`w-full rounded-xl transition-all duration-300 ${
                          isActive
                            ? "bg-gradient-to-t from-blue-600 to-sky-400 shadow-md shadow-blue-500/20"
                            : "bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1]"
                        }`}
                      />
                    </div>

                    {/* Month Label */}
                    <span
                      className={`text-[11px] mt-2 font-medium ${
                        isActive ? "text-slate-900 dark:text-white font-bold" : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Card: Chiptalar Sotilishi (Radial Spidometr — Live Data) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#111726] rounded-2xl p-5 sm:p-6 border border-slate-200/70 dark:border-white/[0.07] shadow-xs flex flex-col justify-between tabular-nums">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Chiptalar sotilishi
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Jami {totalTicketsAll} tadan {totalSoldTicketsAll} ta sotildi
              </p>
            </div>
          </div>

          {/* Segmented Semi-Circle Arc Meter */}
          <div className="my-auto py-4 flex flex-col items-center justify-center">
            <div className="relative w-52 h-28 flex items-end justify-center">
              <svg viewBox="0 0 200 110" className="w-52 h-28 overflow-visible">
                {[...Array(13)].map((_, i) => {
                  const angle = -180 + (i / 12) * 180;
                  const rad = (angle * Math.PI) / 180;
                  const rInner = 65;
                  const rOuter = 95;
                  const x1 = 100 + rInner * Math.cos(rad);
                  const y1 = 100 + rInner * Math.sin(rad);
                  const x2 = 100 + rOuter * Math.cos(rad);
                  const y2 = 100 + rOuter * Math.sin(rad);

                  const isFilled = i <= filledArcSegments && soldRateNum > 0;
                  const colors = [
                    "#2563eb",
                    "#3b82f6",
                    "#60a5fa",
                    "#38bdf8",
                    "#0ea5e9",
                    "#2563eb",
                    "#1d4ed8",
                  ];
                  const strokeColor = isFilled ? colors[i % colors.length] : "#cbd5e1";

                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={strokeColor}
                      strokeWidth="9"
                      strokeLinecap="round"
                      className={!isFilled ? "dark:stroke-slate-700" : ""}
                    />
                  );
                })}
              </svg>

              <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-end text-center">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                  {soldRateDisplay}%
                </span>
                <span className="text-[11px] text-slate-400 mt-1">Sotilish ko‘rsatkichi</span>
              </div>
            </div>
          </div>

          {/* Sub Stats Footer */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <div className="bg-slate-50/80 dark:bg-white/[0.03] p-3 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">
                Sotilgan chiptalar
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <strong className="text-base font-bold text-slate-900 dark:text-white">
                  {totalSoldTicketsAll} ta
                </strong>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {sales.length} bitim
                </span>
              </div>
            </div>
            <div className="bg-slate-50/80 dark:bg-white/[0.03] p-3 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">
                Jami tushum
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <strong className="text-base font-bold text-slate-900 dark:text-white">
                  {formatUSD(totalSalesRevenue)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Faol Bloklar va Chiptalar Qoldig'i (Bloklar vitrinasi — Clickable) */}
      <div className="bg-white dark:bg-[#111726] rounded-2xl p-5 sm:p-6 border border-slate-200/70 dark:border-white/[0.07] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Plane className="w-4 h-4 text-blue-600 -rotate-45" /> Faol bloklar va chiptalar qoldig&apos;i
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Kartaning ustiga bosib batafsil tarixni ko‘ring yoki chipta soting
            </p>
          </div>
          <button
            onClick={onViewAllBatches}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Barcha partiyalar →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 tabular-nums">
          {availableBatches.map((b: any) => {
            const soldQty = b.totalQty - b.remainingQty;
            const percentSold = Math.round((soldQty / b.totalQty) * 100);
            const isLowStock = b.remainingQty > 0 && b.remainingQty <= 5;

            return (
              <div
                key={b.id}
                onClick={() => onSelectBatch && onSelectBatch(b.id)}
                className="p-4 sm:p-5 rounded-xl border border-slate-200/70 dark:border-white/[0.07] bg-slate-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.04] hover:border-blue-400/60 dark:hover:border-blue-500/40 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span className="font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] px-2 py-0.5 rounded-md text-[11px]">
                      {b.batchNumber}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">{formatDate(b.flightDate)}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 tracking-tight my-1 transition-colors">
                    {b.route}
                  </h3>
                  <span className="text-[11px] text-slate-400 block mb-3">
                    Reys: <strong className="text-slate-700 dark:text-slate-300">{b.flightNumber || "N/A"}</strong>
                    {b.departureTime
                      ? ` • ${b.departureTime}${b.arrivalTime ? `–${b.arrivalTime}` : ""}`
                      : ""}
                  </span>

                  {/* Progress bar */}
                  <div className="bg-white dark:bg-[#111726] p-3 rounded-xl border border-slate-200/60 dark:border-white/[0.06]">
                    <div className="flex items-baseline justify-between mb-1.5 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Qolgan chipta:</span>
                      <span
                        className={`font-bold text-sm ${
                          isLowStock
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {b.remainingQty} <span className="text-xs font-normal text-slate-400">/ {b.totalQty} ta</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLowStock ? "bg-amber-500" : "bg-blue-600"
                        }`}
                        style={{ width: `${percentSold}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                      <span>{soldQty} ta sotildi ({percentSold}%)</span>
                      <span>Tan narx: {formatUSD(b.buyPrice)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="truncate max-w-[160px]" title={b.supplierName}>
                    <strong className="text-slate-700 dark:text-slate-300 font-semibold">{b.supplierName}</strong>
                  </span>
                  {onOpenSaleModal && b.remainingQty > 0 && !isBatchExpired(b) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSaleModal(b.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-white/[0.06] dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      + Sotish
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. So'nggi Sotuvlar Jadvali (Recent Orders) */}
      <div className="bg-white dark:bg-[#111726] rounded-2xl p-5 sm:p-6 border border-slate-200/70 dark:border-white/[0.07] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              So‘nggi sotuvlar
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Oxirgi amalga oshirilgan chipta savdolari ro‘yxati
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Qidiruv (yo‘nalish, mijoz)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:bg-white dark:focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Mobile View */}
        <div className="space-y-2.5 block md:hidden pt-1 tabular-nums">
          {filteredSales.map((sale) => (
            <div
              key={sale.id}
              className="bg-slate-50/70 dark:bg-white/[0.03] p-3.5 rounded-xl border border-slate-200/60 dark:border-white/[0.06] space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {sale.route}
                  </h4>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {sale.passengerNames || `Reys: ${sale.flightNumber || "-"}`}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">
                    {formatUSD(sale.totalAmount)}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                      sale.profit >= 0
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    Foyda: {sale.profit >= 0 ? `+${formatUSD(sale.profit)}` : `-${formatUSD(Math.abs(sale.profit))}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/50 dark:border-white/[0.05] text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">{sale.clientName}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {sale.qty} ta
                  </span>
                  <span>•</span>
                  <span>{formatDate(sale.saleDate)}</span>
                </div>
              </div>
            </div>
          ))}

          {filteredSales.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400 space-y-2">
              <p>Mos keladigan sotuvlar topilmadi</p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 rounded-lg font-medium cursor-pointer"
                >
                  Filterni tozalash
                </button>
              )}
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto tabular-nums">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.06] text-xs font-semibold text-slate-400 dark:text-slate-500">
                <th className="py-3 px-3">Yo‘nalish va yo‘lovchi</th>
                <th className="py-3 px-3">Sana</th>
                <th className="py-3 px-3">Mijoz / Agent</th>
                <th className="py-3 px-3 text-center">Soni</th>
                <th className="py-3 px-3 text-right">Jami summa</th>
                <th className="py-3 px-3 text-right">Sof foyda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 dark:divide-white/[0.05] text-xs text-slate-700 dark:text-slate-300">
              {filteredSales.map((sale) => {
                return (
                  <tr key={sale.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                    {/* Route & flight */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{sale.route}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">
                        {sale.passengerNames || `Reys: ${sale.flightNumber || "-"}`}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(sale.saleDate)}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-900 dark:text-white">{sale.clientName}</span>
                    </td>

                    {/* Items (Qty) */}
                    <td className="py-3.5 px-3 text-center font-semibold">
                      {sale.qty} ta
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatUSD(sale.totalAmount)}
                    </td>

                    {/* Real Profit Pill */}
                    <td className="py-3.5 px-3 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${
                          sale.profit >= 0
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {sale.profit >= 0 ? `+${formatUSD(sale.profit)}` : `-${formatUSD(Math.abs(sale.profit))}`}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-slate-400 space-y-2">
                    <div>Mos keladigan sotuvlar topilmadi</div>
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="mt-2 px-3 py-1.5 bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 rounded-lg font-medium cursor-pointer"
                      >
                        Filterni tozalash
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
            {filteredSales.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-100 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                  <td colSpan={3} className="py-3 px-3 text-slate-500 dark:text-slate-400">
                    Jami ({filteredSales.length} ta sotuv):
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">
                    {filteredSales.reduce((sum, s) => sum + (s.qty || 0), 0)} ta
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatUSD(filteredSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0))}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatUSD(filteredSales.reduce((sum, s) => sum + (s.profit || 0), 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

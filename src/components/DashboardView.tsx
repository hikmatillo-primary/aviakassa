"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Layers,
  Search,
  MoreHorizontal,
  ChevronDown,
  Sparkles,
  Plane,
  ArrowRightLeft,
} from "lucide-react";

interface DashboardViewProps {
  stats: any;
  batches: any[];
  sales: any[];
  payments: any[];
  partners: any[];
  onViewAllBatches?: () => void;
  onViewAllPartners?: () => void;
  onRefresh?: () => void;
  onResetDemo?: () => void;
}

export function DashboardView({
  stats,
  batches,
  sales,
  partners,
  onViewAllBatches,
  onViewAllPartners,
  onResetDemo,
}: DashboardViewProps) {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("Bu oy");

  const activeBatches = batches.filter((b) => b.status === "ACTIVE");
  const isEmptyData = batches.length === 0 && partners.length === 0;

  // Filtered sales for bottom table
  const filteredSales = sales.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.clientName?.toLowerCase().includes(q) ||
      s.route?.toLowerCase().includes(q) ||
      s.passengerNames?.toLowerCase().includes(q) ||
      String(s.id).includes(q)
    );
  });

  const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  // Month bar data
  const monthsData = [
    { month: "May", height: 45, value: "$12k" },
    { month: "Iyun", height: 60, value: "$18k" },
    { month: "Iyul", height: 75, value: "$24k" },
    { month: "Avg", height: 85, value: "$31k", active: true, tickets: 440, revenue: "$4.5k" },
    { month: "Sen", height: 40, value: "$11k" },
    { month: "Okt", height: 65, value: "$20k" },
    { month: "Noy", height: 50, value: "$15k" },
    { month: "Dek", height: 55, value: "$17k" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Title & Filter (Faqat tahliliy ma'lumotlar) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
        </div>

        {/* Period filter pill */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <button
              onClick={() => setPeriod(period === "Bu oy" ? "Bu hafta" : "Bu oy")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full border border-slate-200/80 dark:border-slate-700 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer"
            >
              {period}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State Banner (if needed) */}
      {isEmptyData && (
        <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl text-white shadow-md flex items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" /> Demo ma&apos;lumotlarni yuklash
            </h4>
            <p className="text-xs text-blue-100 mt-0.5">
              Tizim qanday ishlashini ko&apos;rish uchun namunaviy partiyalar va sotuvlarni oching.
            </p>
          </div>
          <button
            onClick={onResetDemo}
            className="px-4 py-1.5 bg-white text-blue-700 font-bold text-xs rounded-full shadow-sm hover:bg-blue-50 transition-all cursor-pointer shrink-0"
          >
            Namunaviy ma&apos;lumotlar
          </button>
        </div>
      )}

      {/* 2. Top 4 KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Sof Foyda */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-sky-500 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">
              Sof Foyda
            </span>
            <div className="w-9 h-9 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-xs shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2 relative z-10">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight font-mono">
                ${(stats?.totalProfit || 0).toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[11px] font-bold text-white">
                ↑ +14.9%
              </span>
            </div>
          </div>

          <div className="text-[11px] text-blue-100 relative z-10 flex items-center justify-between">
            <span>O‘tgan oy: $1,240</span>
            <span className="font-semibold text-white">Marja: ~15%</span>
          </div>
        </div>

        {/* Card 2: Bizning haqimiz (Debitorlik) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/70 dark:border-slate-700 shadow-xs relative flex flex-col justify-between min-h-[160px] hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Bizning haqimiz
            </span>
            <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
                ${(stats?.clientDebtToUs || 0).toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200/50 dark:border-emerald-800/50">
                ↑ +2.5%
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>Mijozlar umumiy qarzi</span>
            <span className="font-mono font-medium text-slate-500 dark:text-slate-400">Jami faol</span>
          </div>
        </div>

        {/* Card 3: Bizning qarzimiz (Kreditorlik) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/70 dark:border-slate-700 shadow-xs relative flex flex-col justify-between min-h-[160px] hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Bizning qarzimiz
            </span>
            <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
                ${(stats?.ourDebtToSuppliers || 0).toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-200/50 dark:border-rose-800/50">
                ↓ 6.0%
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>Ta‘minotchilarga to‘lov</span>
            <span className="font-mono font-medium text-slate-500 dark:text-slate-400">Jami qarz</span>
          </div>
        </div>

        {/* Card 4: Ombordagi Chiptalar */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/70 dark:border-slate-700 shadow-xs relative flex flex-col justify-between min-h-[160px] hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ombordagi chiptalar
            </span>
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
                {stats?.totalRemainingTickets || 0}
              </span>
              <span className="text-sm font-semibold text-slate-400">ta joy</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>{stats?.activeBatchesCount || 0} ta faol partiyada</span>
            <button
              onClick={onViewAllBatches}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 cursor-pointer"
            >
              Omborga o‘tish →
            </button>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Savdo Dinamikasi + Chiptalar Sotilishi Spidometri */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Savdo Dinamikasi (Performance Overview) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/70 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Savdo Dinamikasi
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Oylar kesimida partiya va chipta sotuvlari ko‘lami
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/70 dark:bg-slate-700/60 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/40 dark:border-slate-600/40">
              <span>Bu hafta</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Bar Chart Canvas with Y-Axis and Tooltip */}
          <div className="relative pt-6 pb-2">
            <div className="flex h-56 items-end gap-3 sm:gap-6 pl-8 relative">
              {/* Y-Axis lines and labels */}
              <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[11px] text-slate-400 dark:text-slate-500 font-mono select-none">
                <span>40k</span>
                <span>30k</span>
                <span>20k</span>
                <span>10k</span>
                <span>5k</span>
                <span>0k</span>
              </div>

              {/* Horizontal gridlines */}
              <div className="absolute inset-x-8 top-0 border-b border-dashed border-slate-100 dark:border-slate-700/60 pointer-events-none" />
              <div className="absolute inset-x-8 top-1/4 border-b border-dashed border-slate-100 dark:border-slate-700/60 pointer-events-none" />
              <div className="absolute inset-x-8 top-2/4 border-b border-dashed border-slate-100 dark:border-slate-700/60 pointer-events-none" />
              <div className="absolute inset-x-8 top-3/4 border-b border-dashed border-slate-100 dark:border-slate-700/60 pointer-events-none" />

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
                      <div className="absolute -top-12 z-20 bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-xl border border-slate-100 dark:border-slate-700 text-xs w-44 pointer-events-none animate-in fade-in zoom-in-95">
                        <div className="font-bold text-slate-900 dark:text-white text-[11px] mb-1.5">
                          Avgust 2026
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" /> Jami Sotuv
                          </span>
                          <strong className="text-slate-800 dark:text-slate-200">440 ta</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Tushum
                          </span>
                          <strong className="text-blue-600 dark:text-blue-400 font-mono">$4.5k</strong>
                        </div>
                      </div>
                    )}

                    {/* The Bar */}
                    <div className="w-full max-w-[42px] h-full flex items-end">
                      <div
                        style={{ height: `${item.height}%` }}
                        className={`w-full rounded-2xl transition-all duration-300 ${
                          isActive
                            ? "bg-gradient-to-t from-blue-600 to-sky-400 shadow-md shadow-blue-500/20"
                            : "bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700"
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

        {/* Right Card: Chiptalar Sotilishi (Radial Spidometr) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/70 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Chiptalar Sotilishi
            </h2>
            <button className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer">
              <MoreHorizontal className="w-4 h-4" />
            </button>
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

                  const isFilled = i <= 8;
                  const colors = [
                    "#2563eb",
                    "#3b82f6",
                    "#60a5fa",
                    "#93c5fd",
                    "#38bdf8",
                    "#0ea5e9",
                    "#2563eb",
                    "#1d4ed8",
                    "#1e40af",
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
                    />
                  );
                })}
              </svg>

              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end text-center">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono leading-none">
                  70.8%
                </span>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
                  Sotilish sur‘ati (Bandlik)
                </span>
              </div>
            </div>
          </div>

          {/* Sub Stats Footer */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="bg-slate-50/70 dark:bg-slate-700/40 p-3 rounded-2xl">
              <span className="text-[11px] text-slate-400 dark:text-slate-400 block font-medium">
                Sotuvlar soni
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <strong className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {stats?.totalSalesCount || 24}
                </strong>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                  4.5%
                </span>
              </div>
            </div>
            <div className="bg-slate-50/70 dark:bg-slate-700/40 p-3 rounded-2xl">
              <span className="text-[11px] text-slate-400 dark:text-slate-400 block font-medium">
                Jami tushum
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <strong className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  ${(totalSalesRevenue > 0 ? (totalSalesRevenue / 1000).toFixed(1) : "30.9")}k
                </strong>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 border border-transparent dark:border-slate-700">
                  4.5% ↗
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Faol Bloklar va Chiptalar Qoldig'i (Bloklar vitrinasi) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/70 dark:border-slate-700 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Plane className="w-4 h-4 text-blue-600 -rotate-45" /> Faol Bloklar va Chiptalar Qoldig&apos;i
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Qaysi yo‘nalishda nechta joy qolganini ko‘ring va darhol soting
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onViewAllBatches}
              className="text-xs font-semibold text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              Barcha partiyalar →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeBatches.map((b) => {
            const soldQty = b.totalQty - b.remainingQty;
            const percentSold = Math.round((soldQty / b.totalQty) * 100);

            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-2 py-0.5 rounded-md shadow-2xs">
                      {b.batchNumber}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">{b.flightDate}</span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight my-1">
                    {b.route}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400 block mb-3">
                    Reys: <strong className="text-slate-700 dark:text-slate-300">{b.flightNumber || "N/A"}</strong>
                  </span>

                  {/* Progress bar */}
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700 shadow-2xs">
                    <div className="flex items-baseline justify-between mb-1.5 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Qolgan chipta:</span>
                      <span className="font-bold font-mono text-blue-600 dark:text-blue-400 text-sm">
                        {b.remainingQty} <span className="text-xs font-normal text-slate-400">/ {b.totalQty} ta</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${percentSold}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                      <span>{soldQty} ta sotildi ({percentSold}%)</span>
                      <span>Tannarx: ${b.buyPrice}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="truncate max-w-[180px]" title={b.supplierName}>
                    Ta&apos;minotchi: <strong className="text-slate-700 dark:text-slate-300">{b.supplierName}</strong>
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-slate-400">
                    {b.status === "ACTIVE" ? "Faol" : "Tugagan"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. So'nggi Sotuvlar Jadvali (Recent Orders) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/70 dark:border-slate-700 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              So‘nggi Sotuvlar
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
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-full focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">Yo‘nalish & Reys</th>
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Sana</th>
                <th className="py-3 px-3">Mijoz / Agent</th>
                <th className="py-3 px-3 text-center">Holati</th>
                <th className="py-3 px-3 text-center">Soni</th>
                <th className="py-3 px-3 text-right">Jami Summa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
              {filteredSales.map((sale) => {
                return (
                  <tr key={sale.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors">
                    {/* Route & flight */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{sale.route}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">
                        {sale.passengerNames || `Reys: ${sale.flightNumber || "-"}`}
                      </div>
                    </td>

                    {/* Order ID */}
                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">
                      #{sale.id}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {sale.saleDate}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-900 dark:text-white">{sale.clientName}</span>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                        To‘langan
                      </span>
                    </td>

                    {/* Items (Qty) */}
                    <td className="py-3.5 px-3 text-center font-bold font-mono">
                      {sale.qty} ta
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-3 text-right font-extrabold text-slate-900 dark:text-white font-mono">
                      ${sale.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                );
              })}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    Sotuvlar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

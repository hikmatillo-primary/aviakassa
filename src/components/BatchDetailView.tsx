"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Search,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import { formatUSD, formatDate } from "@/lib/format";
import { FlightBar } from "@/components/FlightBar";

interface BatchDetailViewProps {
  batch: any;
  allBatches: any[];
  allSales: any[];
  onBack: () => void;
  onOpenBatchModal: () => void;
  onOpenSaleModal: (batchId: number) => void;
  onEditBatch: (batch: any) => void;
  onEditSale: (sale: any) => void;
  onOpenHistoryModal?: (partnerId: number) => void;
}

export function BatchDetailView({
  batch,
  allSales,
  onBack,
  onOpenSaleModal,
  onEditBatch,
  onEditSale,
  onOpenHistoryModal,
}: BatchDetailViewProps) {
  const [saleSearch, setSaleSearch] = useState("");

  if (!batch) return null;

  // Faqat aynan shu partiyaga tegishli sotuvlar
  const batchSales = allSales.filter((s) => s.batchId === batch.id);

  const filteredSales = batchSales.filter((s) => {
    if (!saleSearch.trim()) return true;
    const q = saleSearch.toLowerCase();
    return (
      s.clientName?.toLowerCase().includes(q) ||
      s.passengerNames?.toLowerCase().includes(q) ||
      s.saleDate?.toLowerCase().includes(q)
    );
  });

  // Shu partiya bo'yicha hisob-kitoblar
  const totalQty = batch.totalQty || 0;
  const remainingQty = batch.remainingQty || 0;
  const soldQty = Math.max(0, totalQty - remainingQty);
  const percentSold = totalQty > 0 ? Math.round((soldQty / totalQty) * 100) : 0;

  const totalPurchaseCost = batch.totalCost || totalQty * (batch.buyPrice || 0);
  const totalSalesAmount = batchSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalProfit = batchSales.reduce((sum, s) => sum + (s.profit || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Orqaga qaytish tugmasi */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-[#111726] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          Omborga qaytish
        </button>
      </div>

      {/* 1. YUQORI BLOK: PARTIYA REYSI VA MOLIYAVIY HISOB-KITOBI */}
      <div className="bg-white dark:bg-[#111726] p-3.5 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {/* CHAP KARTA: Shu partiyaning reys ma'lumotlari */}
          <div className="bg-slate-50/80 dark:bg-white/[0.03] p-3.5 sm:p-5 rounded-xl border border-slate-200/70 dark:border-white/[0.06] flex flex-col justify-between gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <FlightBar batch={batch} size="lg" />
              </div>
            </div>

            {/* Qoldiq progress bari */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06] tabular-nums">
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold mb-1.5">
                <span className="text-blue-600 dark:text-blue-400">
                  Qoldiq: {remainingQty} ta
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Jami {totalQty} tadan ({soldQty} ta sotildi • {percentSold}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${percentSold}%` }}
                />
              </div>
            </div>
          </div>

          {/* O'NG KARTA: Shu partiyaning moliyaviy xulosasi */}
          <div className="bg-slate-50/80 dark:bg-white/[0.03] p-3.5 sm:p-5 rounded-xl border border-slate-200/70 dark:border-white/[0.06] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Shu partiya bo‘yicha hisob-kitob
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 my-auto tabular-nums">
              {/* Xarid */}
              <div className="bg-white dark:bg-[#111726] p-2.5 sm:p-3 rounded-xl border border-slate-200/60 dark:border-white/[0.06] min-w-0">
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block truncate">
                  Xarid ({totalQty} ta)
                </span>
                <span className="text-xs sm:text-base font-bold text-slate-900 dark:text-white block mt-1 truncate">
                  {formatUSD(totalPurchaseCost)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                  1 ta: {formatUSD(batch.buyPrice)}
                </span>
              </div>

              {/* Sotuv */}
              <div className="bg-white dark:bg-[#111726] p-2.5 sm:p-3 rounded-xl border border-slate-200/60 dark:border-white/[0.06] min-w-0">
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block truncate">
                  Sotuv ({soldQty} ta)
                </span>
                <span className="text-xs sm:text-base font-bold text-blue-600 dark:text-blue-400 block mt-1 truncate">
                  {formatUSD(totalSalesAmount)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                  {batchSales.length} ta sotuv
                </span>
              </div>

              {/* Sof Foyda */}
              <div className="bg-emerald-500/10 p-2.5 sm:p-3 rounded-xl border border-emerald-500/20 min-w-0">
                <span className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 font-medium block truncate">
                  Sof foyda
                </span>
                <span
                  className={`text-xs sm:text-base font-bold block mt-1 truncate ${
                    totalProfit >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {totalProfit >= 0
                    ? `+${formatUSD(totalProfit)}`
                    : `-${formatUSD(Math.abs(totalProfit))}`}
                </span>
                <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5 truncate">
                  Sotilganlardan
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-white/[0.06] gap-2 flex-wrap">
              <span className="truncate">
                Kompaniya: <b className="text-slate-700 dark:text-slate-300">{batch.supplierName}</b> • Xarid: <b className="text-slate-700 dark:text-slate-300">{formatDate(batch.purchaseDate)}</b>
              </span>
              <button
                type="button"
                onClick={() => onEditBatch(batch)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-[11px] font-semibold rounded-lg transition-all cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-400" /> Narx
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PASTKI BLOK: FAQAT SOTUVLAR (BUTUN KENG BO'YICHA) */}
      <div className="bg-white dark:bg-[#111726] p-4 sm:p-6 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs space-y-4">
        {/* Sarlavha va Chipta sotish tugmasi */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06] flex-wrap">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Ushbu partiya sotuvlari</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {filteredSales.length} ta
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Shu partiyadan mijozlarga sotilgan barcha chiptalar ro‘yxati
            </p>
          </div>

          {batch.remainingQty > 0 && (
            <button
              type="button"
              onClick={() => onOpenSaleModal(batch.id)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Chipta sotish
            </button>
          )}
        </div>

        {/* Ichki qidiruv */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Hamkor yoki sana bo‘yicha qidirish..."
            value={saleSearch}
            onChange={(e) => setSaleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        {/* Sotuv kartalari ro'yxati */}
        <div className="space-y-3">
          {filteredSales.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border bg-slate-50/60 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/[0.06] p-4 flex flex-col sm:flex-row items-stretch justify-between gap-3 hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors"
            >
              {/* Kartaning chap qismi: Mijoz va reys ma'lumotlari */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    Hamkor
                  </span>
                  {s.isRoundTrip && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      ⇄ Borish-kelish
                    </span>
                  )}
                  <span className="text-xs text-slate-400">• {formatDate(s.saleDate)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  <button
                    type="button"
                    onClick={() => onOpenHistoryModal?.(s.clientId)}
                    className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate text-left cursor-pointer"
                  >
                    {s.clientName}
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-0.5 tabular-nums">
                  <span>
                    Soni: <b className="text-blue-600 dark:text-blue-400 font-bold">{s.qty} ta</b>
                  </span>
                  {s.departureTime && (
                    <span>
                      Vaqti: <b className="text-slate-700 dark:text-slate-300 font-mono">{s.departureTime}{s.arrivalTime ? `–${s.arrivalTime}` : ""}</b>
                    </span>
                  )}
                  {s.isRoundTrip && s.returnDate && (
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      ⇄ Qaytish: {formatDate(s.returnDate, false)}
                    </span>
                  )}
                </div>
              </div>

              {/* Kartaning o'ng qismi: Narxlar va Foyda */}
              <div className="sm:w-56 p-3 sm:p-0 sm:pl-4 bg-white/70 dark:bg-white/[0.02] sm:bg-transparent border-t sm:border-t-0 sm:border-l border-slate-200/70 dark:border-white/[0.06] flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 tabular-nums">
                <div className="sm:text-right">
                  <span className="text-xs text-slate-400 font-medium block">
                    1 dona: {formatUSD(s.sellPrice)}
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block mt-0.5">
                    {formatUSD(s.totalAmount)}
                  </span>
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

                <button
                  type="button"
                  onClick={() => onEditSale(s)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-400" /> Narx
                </button>
              </div>
            </div>
          ))}

          {filteredSales.length === 0 && (
            <div className="py-12 text-center text-xs sm:text-sm text-slate-400 space-y-3">
              <p>Ushbu partiyadan hozircha sotuv amalga oshirilmagan</p>
              {batch.remainingQty > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenSaleModal(batch.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl cursor-pointer shadow-sm shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" /> Birinchi chiptani sotish
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

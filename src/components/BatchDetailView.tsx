"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Plane,
  Calendar,
  Pencil,
  Search,
  Building2,
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
  allBatches,
  allSales,
  onBack,
  onOpenBatchModal,
  onOpenSaleModal,
  onEditBatch,
  onEditSale,
  onOpenHistoryModal,
}: BatchDetailViewProps) {
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [saleSearch, setSaleSearch] = useState("");
  const [mobileTab, setMobileTab] = useState<"PURCHASES" | "SALES">("PURCHASES");

  if (!batch) return null;

  // Shu yo'nalish/mahsulotga tegishli xaridlar (birinchi tanlangan partiya turadi)
  const productBatches = allBatches
    .filter((b) => b.id === batch.id || b.route === batch.route)
    .sort((a, b) => (a.id === batch.id ? -1 : b.id === batch.id ? 1 : 0));

  const productBatchIds = new Set(productBatches.map((b) => b.id));

  // Shu mahsulot bo'yicha barcha sotuvlar
  const productSales = allSales.filter((s) => productBatchIds.has(s.batchId));

  // Filtrlangan xaridlar va sotuvlar
  const filteredPurchases = productBatches.filter((b) => {
    if (!purchaseSearch.trim()) return true;
    const q = purchaseSearch.toLowerCase();
    return (
      b.supplierName?.toLowerCase().includes(q) ||
      b.batchNumber?.toLowerCase().includes(q) ||
      b.flightNumber?.toLowerCase().includes(q) ||
      b.flightDate?.toLowerCase().includes(q)
    );
  });

  const filteredSales = productSales.filter((s) => {
    if (!saleSearch.trim()) return true;
    const q = saleSearch.toLowerCase();
    return (
      s.clientName?.toLowerCase().includes(q) ||
      s.passengerNames?.toLowerCase().includes(q) ||
      s.saleDate?.toLowerCase().includes(q)
    );
  });

  // Umumiy ko'rsatkichlar
  const totalQty = productBatches.reduce((sum, b) => sum + (b.totalQty || 0), 0);
  const remainingQty = productBatches.reduce((sum, b) => sum + (b.remainingQty || 0), 0);
  const soldQty = totalQty - remainingQty;
  const percentSold = totalQty > 0 ? Math.round((soldQty / totalQty) * 100) : 0;

  const totalPurchaseCost = productBatches.reduce((sum, b) => sum + (b.totalCost || 0), 0);
  const totalSalesAmount = productSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalProfit = productSales.reduce((sum, s) => sum + (s.profit || 0), 0);

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

        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
          Mahsulot tafsilotlari (Xarid va sotuv tarixi)
        </span>
      </div>

      {/* 1. YUQORI BLOK */}
      <div className="bg-white dark:bg-[#111726] p-3.5 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {/* CHAP KARTA: Shu mahsulotning o'zi */}
          <div className="bg-slate-50/80 dark:bg-white/[0.03] p-3.5 sm:p-5 rounded-xl border border-slate-200/70 dark:border-white/[0.06] flex flex-col justify-between gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <FlightBar batch={batch} />
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

          {/* O'NG KARTA: Shu mahsulotning moliyaviy xulosasi (Xarid, Sotuv, Sof Foyda) */}
          <div className="bg-slate-50/80 dark:bg-white/[0.03] p-3.5 sm:p-5 rounded-xl border border-slate-200/70 dark:border-white/[0.06] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Shu mahsulot bo‘yicha hisob-kitob
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 my-auto tabular-nums">
              {/* Jami Xarid */}
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

              {/* Jami Sotuv */}
              <div className="bg-white dark:bg-[#111726] p-2.5 sm:p-3 rounded-xl border border-slate-200/60 dark:border-white/[0.06] min-w-0">
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block truncate">
                  Sotuv ({soldQty} ta)
                </span>
                <span className="text-xs sm:text-base font-bold text-blue-600 dark:text-blue-400 block mt-1 truncate">
                  {formatUSD(totalSalesAmount)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                  {productSales.length} ta sotuv
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

            <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-white/[0.06] gap-2">
              <span className="truncate">
                Kompaniya: <b className="text-slate-700 dark:text-slate-300">{batch.supplierName}</b>
              </span>
              <span className="shrink-0">
                Xarid: <b className="text-slate-700 dark:text-slate-300">{formatDate(batch.purchaseDate)}</b>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MOBIL UCHUN TEZ ALMASHUVCHI TAB: Xarid vs Sotuv */}
      <div className="flex lg:hidden items-center gap-1.5 bg-slate-200/70 dark:bg-[#111726] p-1 rounded-xl border border-transparent dark:border-white/[0.07]">
        <button
          type="button"
          onClick={() => setMobileTab("PURCHASES")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mobileTab === "PURCHASES"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <span>Xarid (Kimdan)</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300">
            {filteredPurchases.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("SALES")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mobileTab === "SALES"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <span>Sotuv (Kimga)</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300">
            {filteredSales.length}
          </span>
        </button>
      </div>

      {/* 2. PASTKI BLOK: 2 ta ustun yonma-yon — Chapda "Xarid [+]", O'ngda "Sotuv [+]" */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHAP USTUN: XARID (Kimdan xarid qilingan) */}
        <div
          className={`bg-white dark:bg-[#111726] p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs flex-col ${
            mobileTab === "PURCHASES" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Ustun sarlavhasi va [+] tugmasi */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Xarid</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300">
                  {filteredPurchases.length} ta
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Shu mahsulot qaysi kompaniyadan xarid qilingan
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenBatchModal}
              title="Yangi xarid qo'shish"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.07] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Ichki qidiruv */}
          <div className="relative my-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Kompaniya, partiya yoki sana bo‘yicha..."
              value={purchaseSearch}
              onChange={(e) => setPurchaseSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Xarid kartalari ro'yxati */}
          <div className="space-y-3 lg:max-h-[460px] lg:overflow-y-auto pr-0.5 lg:pr-1">
            {filteredPurchases.map((b) => (
              <div
                key={b.id}
                className={`rounded-xl border transition-all overflow-hidden flex flex-col sm:flex-row items-stretch justify-between ${
                  b.id === batch.id
                    ? "bg-blue-50/20 dark:bg-blue-500/[0.04] border-blue-200 dark:border-blue-500/30"
                    : "bg-slate-50/60 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/[0.06]"
                }`}
              >
                {/* Kartaning chap qismi */}
                <div className="p-3.5 flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300">
                      Ta&apos;minotchi
                    </span>
                    <span className="tabular-nums text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {b.batchNumber}
                    </span>
                    {b.isRoundTrip && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        ⇄ Borish-kelish
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">• {formatDate(b.purchaseDate)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <button
                      type="button"
                      onClick={() => onOpenHistoryModal?.(b.supplierId)}
                      className="font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate text-left cursor-pointer"
                    >
                      {b.supplierName}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-0.5 tabular-nums">
                    <span>
                      Soni: <b className="text-slate-800 dark:text-slate-200">{b.totalQty} ta</b>
                    </span>
                    <span>
                      Qoldiq: <b className="text-blue-600 dark:text-blue-400">{b.remainingQty} ta</b>
                    </span>
                    <span>
                      Borish: <b className="text-slate-700 dark:text-slate-300">{formatDate(b.flightDate)}</b>
                      {b.departureTime ? ` (${b.departureTime}${b.arrivalTime ? `–${b.arrivalTime}` : ""})` : ""}
                    </span>
                    {b.isRoundTrip && b.returnDate && (
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        ⇄ Qaytish: {formatDate(b.returnDate, false)}
                        {b.returnDepartureTime
                          ? ` (${b.returnDepartureTime}${b.returnArrivalTime ? `–${b.returnArrivalTime}` : ""})`
                          : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Kartaning o'ng qismi */}
                <div className="p-3.5 sm:w-44 bg-white/80 dark:bg-white/[0.02] border-t sm:border-t-0 sm:border-l border-slate-200/70 dark:border-white/[0.06] flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 tabular-nums">
                  <div className="sm:text-right">
                    <span className="text-[11px] text-slate-400 font-medium block">
                      1 dona: {formatUSD(b.buyPrice)}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white block mt-0.5">
                      {formatUSD(b.totalCost)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditBatch(b)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-[11px] font-medium rounded-lg transition-all cursor-pointer"
                  >
                    <Pencil className="w-3 h-3 text-slate-400" /> Narxni o‘zgartirish
                  </button>
                </div>
              </div>
            ))}

            {filteredPurchases.length === 0 && (
              <div className="py-10 text-center text-xs text-slate-400">
                Xarid ma&apos;lumotlari topilmadi
              </div>
            )}
          </div>
        </div>

        {/* O'NG USTUN: SOTUV (Kimga sotilgan) */}
        <div
          className={`bg-white dark:bg-[#111726] p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs flex-col ${
            mobileTab === "SALES" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Ustun sarlavhasi va [+] tugmasi */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Sotuv</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {filteredSales.length} ta
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Shu mahsulot qaysi mijozlarga sotilgan
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenSaleModal(batch.id)}
              title="Shu mahsulotdan chipta sotish"
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Ichki qidiruv */}
          <div className="relative my-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Mijoz ismi, yo‘lovchi yoki sana bo‘yicha..."
              value={saleSearch}
              onChange={(e) => setSaleSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Sotuv kartalari ro'yxati */}
          <div className="space-y-3 lg:max-h-[460px] lg:overflow-y-auto pr-0.5 lg:pr-1">
            {filteredSales.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border bg-slate-50/60 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/[0.06] overflow-hidden flex flex-col sm:flex-row items-stretch justify-between"
              >
                {/* Kartaning chap qismi */}
                <div className="p-3.5 flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      Mijoz
                    </span>
                    {s.isRoundTrip && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        ⇄ Borish-kelish
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">• {formatDate(s.saleDate)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                    <button
                      type="button"
                      onClick={() => onOpenHistoryModal?.(s.clientId)}
                      className="font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate text-left cursor-pointer"
                    >
                      {s.clientName}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-0.5 tabular-nums">
                    <span>
                      Soni: <b className="text-blue-600 dark:text-blue-400">{s.qty} ta</b>
                    </span>
                    <span className="truncate max-w-[220px]">
                      Yo‘lovchi: <b className="text-slate-700 dark:text-slate-300">{s.passengerNames || "-"}</b>
                    </span>
                    {s.departureTime && (
                      <span className="text-[11px]">
                        {s.departureTime}
                        {s.arrivalTime ? `–${s.arrivalTime}` : ""}
                      </span>
                    )}
                    {s.isRoundTrip && s.returnDate && (
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        ⇄ Qaytish: {formatDate(s.returnDate, false)}
                        {s.returnDepartureTime
                          ? ` (${s.returnDepartureTime}${s.returnArrivalTime ? `–${s.returnArrivalTime}` : ""})`
                          : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Kartaning o'ng qismi */}
                <div className="p-3.5 sm:w-44 bg-white/80 dark:bg-white/[0.02] border-t sm:border-t-0 sm:border-l border-slate-200/70 dark:border-white/[0.06] flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 tabular-nums">
                  <div className="sm:text-right">
                    <span className="text-[11px] text-slate-400 font-medium block">
                      1 dona: {formatUSD(s.sellPrice)}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white block mt-0.5">
                      {formatUSD(s.totalAmount)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold block ${
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-[11px] font-medium rounded-lg transition-all cursor-pointer"
                  >
                    <Pencil className="w-3 h-3 text-slate-400" /> Narxni o‘zgartirish
                  </button>
                </div>
              </div>
            ))}

            {filteredSales.length === 0 && (
              <div className="py-10 text-center text-xs text-slate-400 space-y-2">
                <p>Bu mahsulotdan hozircha sotuv amalga oshirilmagan</p>
                <button
                  type="button"
                  onClick={() => onOpenSaleModal(batch.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Birinchi chiptani sotish
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

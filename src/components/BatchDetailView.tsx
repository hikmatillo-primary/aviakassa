"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Plane,
  Calendar,
  Pencil,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import { formatUSD } from "@/lib/format";

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
    <div className="space-y-5">
      {/* Orqaga qaytish tugmasi */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-full border border-slate-200/80 dark:border-slate-700 shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Omborga qaytish
        </button>

        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
          Mahsulot tafsilotlari (Xarid va Sotuv tarixi)
        </span>
      </div>

      {/* 1. YUQORI BLOK (Chizmadagi kabi katta konteyner ichida 2 ta blok: Mahsulotning o'zi + Umumiy hisob-kitob) */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CHAP KARTA: Shu mahsulotning o'zi */}
          <div className="bg-slate-50/90 dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/60">
                      {batch.batchNumber}
                    </span>
                    {batch.isRoundTrip && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        ⇄ Obratno (Borish-qaytish)
                      </span>
                    )}
                    {batch.status === "ACTIVE" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                        <CheckCircle2 className="w-3 h-3" /> Faol
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        <AlertCircle className="w-3 h-3" /> Tugagan
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1.5 leading-snug">
                    {batch.route}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      Borish: <b className="text-slate-700 dark:text-slate-200">{batch.flightDate}</b>
                    </span>
                    <span className="font-mono bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-600 dark:text-slate-300">
                      Reys: {batch.flightNumber || "-"}
                    </span>
                    {batch.isRoundTrip && batch.returnDate && (
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        ⇄ Qaytish: {batch.returnDate} {batch.returnFlightNumber ? `(${batch.returnFlightNumber})` : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Qoldiq progress bari */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-blue-600 dark:text-blue-400">
                  Omborda qoldiq: {remainingQty} ta
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Jami {totalQty} tadan ({soldQty} ta sotildi • {percentSold}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${percentSold}%` }}
                />
              </div>
            </div>
          </div>

          {/* O'NG KARTA: Shu mahsulotning moliyaviy xulosasi (Xarid, Sotuv, Sof Foyda) */}
          <div className="bg-slate-50/90 dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Shu mahsulot bo‘yicha hisob-kitob
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 my-auto">
              {/* Jami Xarid */}
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/70">
                <span className="text-[11px] text-slate-400 font-semibold block">
                  Jami Xarid ({totalQty} ta)
                </span>
                <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white block mt-1">
                  {formatUSD(totalPurchaseCost)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  1 dona: {formatUSD(batch.buyPrice)}
                </span>
              </div>

              {/* Jami Sotuv */}
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/70">
                <span className="text-[11px] text-slate-400 font-semibold block">
                  Jami Sotuv ({soldQty} ta)
                </span>
                <span className="text-sm sm:text-base font-black font-mono text-blue-600 dark:text-blue-400 block mt-1">
                  {formatUSD(totalSalesAmount)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  {productSales.length} ta sotuv
                </span>
              </div>

              {/* Sof Foyda */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-800/50">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                  Sof Foyda
                </span>
                <span
                  className={`text-sm sm:text-base font-black font-mono block mt-1 ${
                    totalProfit >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {totalProfit >= 0
                    ? `+${formatUSD(totalProfit)}`
                    : `-${formatUSD(Math.abs(totalProfit))}`}
                </span>
                <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5">
                  Sotilganlardan
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <span>Kompaniya: <b className="text-slate-700 dark:text-slate-300">{batch.supplierName}</b></span>
              <span>Xarid sanasi: <b className="text-slate-700 dark:text-slate-300">{batch.purchaseDate}</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PASTKI BLOK: Chizmadagi kabi 2 ta ustun yonma-yon — Chapda "Xarid [+]", O'ngda "Sotuv [+]" */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHAP USTUN: XARID (Kimdan xarid qilingan) */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col">
          {/* Ustun sarlavhasi va [+] tugmasi */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Xarid</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  {filteredPurchases.length} ta
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Shu mahsulot kimdan (qaysi kompaniyadan) xarid qilingan
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenBatchModal}
              title="Yangi xarid qo'shish"
              className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-sm shadow-indigo-500/25 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-5 h-5" />
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
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Xarid kartalari ro'yxati (Scroll bilan, chizmadagi kabi o'ng tomoni ajratilgan) */}
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {filteredPurchases.map((b) => (
              <div
                key={b.id}
                className={`rounded-2xl border transition-all overflow-hidden flex flex-col sm:flex-row items-stretch justify-between ${
                  b.id === batch.id
                    ? "bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-700/80"
                    : "bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-700/80"
                }`}
              >
                {/* Kartaning chap qismi: Kimdan olingani va tafsilotlar */}
                <div className="p-3.5 flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      Ta&apos;minotchi
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {b.batchNumber}
                    </span>
                    {b.isRoundTrip && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        ⇄ Obratno
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">• {b.purchaseDate}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <button
                      type="button"
                      onClick={() => onOpenHistoryModal?.(b.supplierId)}
                      className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline truncate text-left cursor-pointer"
                    >
                      {b.supplierName}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-0.5">
                    <span>
                      Olingan soni: <b className="text-slate-800 dark:text-slate-200">{b.totalQty} ta</b>
                    </span>
                    <span>
                      Qoldiq: <b className="text-blue-600 dark:text-blue-400">{b.remainingQty} ta</b>
                    </span>
                    <span>
                      Borish: <b className="text-slate-700 dark:text-slate-300">{b.flightDate}</b>
                    </span>
                    {b.isRoundTrip && b.returnDate && (
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        ⇄ Qaytish: {b.returnDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Kartaning o'ng qismi (Chizmadagi vertikal chiziq bilan ajratilgan narx va tahrirlash bloki) */}
                <div className="p-3.5 sm:w-44 bg-white/80 dark:bg-slate-800/90 border-t sm:border-t-0 sm:border-l border-slate-200/80 dark:border-slate-700/80 flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <div className="sm:text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      1 dona: {formatUSD(b.buyPrice)}
                    </span>
                    <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white block mt-0.5">
                      {formatUSD(b.totalCost)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditBatch(b)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold rounded-full border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" /> Narxni o‘zgartirish
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
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col">
          {/* Ustun sarlavhasi va [+] tugmasi */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Sotuv</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  {filteredSales.length} ta
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Shu mahsulot kimga (qaysi mijozlarga) sotilgan
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenSaleModal(batch.id)}
              title="Shu mahsulotdan chipta sotish"
              className="w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-sm shadow-blue-500/25 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-5 h-5" />
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
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sotuv kartalari ro'yxati */}
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {filteredSales.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-700/80 overflow-hidden flex flex-col sm:flex-row items-stretch justify-between"
              >
                {/* Kartaning chap qismi: Kimga sotilgani va yo'lovchi */}
                <div className="p-3.5 flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      Xaridor (Mijoz)
                    </span>
                    {s.isRoundTrip && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        ⇄ Obratno
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">• {s.saleDate}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-500 shrink-0" />
                    <button
                      type="button"
                      onClick={() => onOpenHistoryModal?.(s.clientId)}
                      className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate text-left cursor-pointer"
                    >
                      {s.clientName}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-0.5">
                    <span>
                      Sotilgan soni: <b className="text-blue-600 dark:text-blue-400">{s.qty} ta</b>
                    </span>
                    <span className="truncate max-w-[220px]">
                      Yo‘lovchi: <b className="text-slate-700 dark:text-slate-300">{s.passengerNames || "-"}</b>
                    </span>
                    {s.isRoundTrip && s.returnDate && (
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        ⇄ Qaytish: {s.returnDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Kartaning o'ng qismi: Sotuv narxi, foyda va tahrirlash */}
                <div className="p-3.5 sm:w-44 bg-white/80 dark:bg-slate-800/90 border-t sm:border-t-0 sm:border-l border-slate-200/80 dark:border-slate-700/80 flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <div className="sm:text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      1 dona: {formatUSD(s.sellPrice)}
                    </span>
                    <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white block mt-0.5">
                      {formatUSD(s.totalAmount)}
                    </span>
                    <span
                      className={`text-[10px] font-bold font-mono block ${
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-[11px] font-bold rounded-full border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" /> Narxni o‘zgartirish
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full cursor-pointer"
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

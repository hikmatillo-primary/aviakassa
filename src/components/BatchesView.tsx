"use client";

import React, { useState } from "react";
import { Package, Search, Plus, CheckCircle2, AlertCircle } from "lucide-react";

interface BatchesViewProps {
  batches: any[];
  onOpenBatchModal: () => void;
  onOpenSaleModal: (batchId: number) => void;
  onToggleStatus: (id: number) => void;
}

export function BatchesView({
  batches,
  onOpenBatchModal,
  onOpenSaleModal,
  onToggleStatus,
}: BatchesViewProps) {
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [search, setSearch] = useState("");

  const filteredBatches = batches.filter((b) => {
    if (filter === "ACTIVE" && b.status !== "ACTIVE") return false;
    if (filter === "COMPLETED" && b.status !== "COMPLETED") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchRoute = b.route?.toLowerCase().includes(q);
      const matchBatch = b.batchNumber?.toLowerCase().includes(q);
      const matchSupplier = b.supplierName?.toLowerCase().includes(q);
      const matchFlight = b.flightNumber?.toLowerCase().includes(q);
      if (!matchRoute && !matchBatch && !matchSupplier && !matchFlight) return false;
    }
    return true;
  });

  const handleToggleStatus = (id: number) => {
    onToggleStatus(id);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Partiyalar (Bloklar)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Xarid qilingan barcha bloklar, ularning qoldiqlari va tannarxi
          </p>
        </div>
        <button
          onClick={onOpenBatchModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-sm shadow-blue-500/25 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> + Yangi partiya sotib olish
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-3xl border border-slate-200/70 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Yo'nalish, reys, ta'minotchi qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-full w-full sm:w-auto">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              filter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Barchasi ({batches.length})
          </button>
          <button
            onClick={() => setFilter("ACTIVE")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              filter === "ACTIVE" ? "bg-white text-blue-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Faol ({batches.filter((b) => b.status === "ACTIVE").length})
          </button>
          <button
            onClick={() => setFilter("COMPLETED")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              filter === "COMPLETED" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Tugagan ({batches.filter((b) => b.status === "COMPLETED").length})
          </button>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-3xl border border-slate-200/70 overflow-hidden shadow-xs p-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Partiya & Yo&apos;nalish</th>
                <th className="py-3 px-4">Sana & Reys</th>
                <th className="py-3 px-4">Ta&apos;minotchi</th>
                <th className="py-3 px-4 text-center">Chipta Qoldig&apos;i</th>
                <th className="py-3 px-4 text-right">Tannarx (1 ta / Jami)</th>
                <th className="py-3 px-4 text-center">Holati</th>
                <th className="py-3 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredBatches.map((batch) => {
                const soldQty = batch.totalQty - batch.remainingQty;
                const percentSold = Math.round((soldQty / batch.totalQty) * 100);

                return (
                  <tr key={batch.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Partiya & Yo'nalish */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{batch.route}</div>
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                        {batch.batchNumber}
                      </span>
                    </td>

                    {/* Sana & Reys */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{batch.flightDate}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {batch.flightNumber || "Reys ko'rsatilmagan"}
                      </div>
                    </td>

                    {/* Ta'minotchi */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{batch.supplierName}</span>
                    </td>

                    {/* Qoldiq Progress */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-block min-w-[130px]">
                        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                          <span className={batch.remainingQty === 0 ? "text-slate-400" : "text-blue-600"}>
                            {batch.remainingQty} ta qoldi
                          </span>
                          <span className="text-slate-400">{batch.totalQty} tadan</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              batch.remainingQty === 0 ? "bg-slate-300" : "bg-blue-600"
                            }`}
                            style={{ width: `${percentSold}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block text-right">
                          {soldQty} ta sotildi ({percentSold}%)
                        </span>
                      </div>
                    </td>

                    {/* Tannarx */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-slate-900 font-mono">${batch.buyPrice}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Jami: ${batch.totalCost.toLocaleString()}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(batch.id)}
                        title="Statusni almashtirish uchun bosing"
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                          batch.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {batch.status === "ACTIVE" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Faol
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-slate-400" /> Tugagan
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onOpenSaleModal(batch.id)}
                        disabled={batch.remainingQty <= 0}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full shadow-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Chipta sotish
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredBatches.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    Mos keladigan partiyalar topilmadi
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

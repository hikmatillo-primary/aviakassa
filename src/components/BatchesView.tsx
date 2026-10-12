"use client";

import React, { useState, useTransition } from "react";
import { Package, Search, Filter, Plus, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { toggleBatchStatus } from "@/lib/actions";

interface BatchesViewProps {
  batches: any[];
  onOpenBatchModal: () => void;
  onOpenSaleModal: (batchId: number) => void;
  onRefresh: () => void;
}

export function BatchesView({
  batches,
  onOpenBatchModal,
  onOpenSaleModal,
  onRefresh,
}: BatchesViewProps) {
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

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

  const handleToggleStatus = (id: number, currentStatus: string) => {
    startTransition(async () => {
      await toggleBatchStatus(id, currentStatus);
      onRefresh();
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Partiyalar (Blok chiptalar ombori)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xarid qilingan barcha bloklar, ularning qoldiqlari va tannarxi
          </p>
        </div>
        <button
          onClick={onOpenBatchModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Yangi partiya sotib olish
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Yo'nalish, reys, ta'minotchi qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Barchasi ({batches.length})
          </button>
          <button
            onClick={() => setFilter("ACTIVE")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filter === "ACTIVE" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Faol ({batches.filter((b) => b.status === "ACTIVE").length})
          </button>
          <button
            onClick={() => setFilter("COMPLETED")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filter === "COMPLETED" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tugagan ({batches.filter((b) => b.status === "COMPLETED").length})
          </button>
        </div>
      </div>

      {/* Batches Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
                  <tr key={batch.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Partiya & Yo'nalish */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{batch.route}</div>
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {batch.batchNumber}
                      </span>
                    </td>

                    {/* Sana & Reys */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{batch.flightDate}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {batch.flightNumber || "Reys ko'rsatilmagan"}
                      </div>
                    </td>

                    {/* Ta'minotchi */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{batch.supplierName}</span>
                    </td>

                    {/* Qoldiq Progress */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-block min-w-[130px]">
                        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                          <span className={batch.remainingQty === 0 ? "text-slate-400" : "text-blue-600"}>
                            {batch.remainingQty} ta qoldi
                          </span>
                          <span className="text-slate-400">{batch.totalQty} tadan</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              batch.remainingQty === 0 ? "bg-slate-400" : "bg-blue-600"
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
                    <td className="py-3 px-4 text-right">
                      <div className="font-bold text-slate-900 font-mono">${batch.buyPrice}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Jami: ${batch.totalCost.toLocaleString()}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(batch.id, batch.status)}
                        disabled={isPending}
                        title="Statusni almashtirish uchun bosing"
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                          batch.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
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
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onOpenSaleModal(batch.id)}
                        disabled={batch.remainingQty <= 0}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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

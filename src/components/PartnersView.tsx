"use client";

import React, { useState } from "react";
import { Search, PackagePlus, Users, Layers, Plane, Calendar } from "lucide-react";

interface PartnersViewProps {
  batches?: any[];
  onOpenBatchModal?: () => void;
  onOpenPartnerModal?: (type?: "SUPPLIER") => void;
}

export function PartnersView({
  batches = [],
  onOpenBatchModal,
  onOpenPartnerModal,
}: PartnersViewProps) {
  const [search, setSearch] = useState("");

  const filteredBatches = batches.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.route?.toLowerCase().includes(q) ||
      b.batchNumber?.toLowerCase().includes(q) ||
      b.supplierName?.toLowerCase().includes(q) ||
      b.flightNumber?.toLowerCase().includes(q)
    );
  });

  const totalBatchesCount = batches.length;
  const totalTicketsBought = batches.reduce((sum, b) => sum + (b.totalQty || 0), 0);
  const totalCost = batches.reduce((sum, b) => sum + (b.totalCost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Xaridlar (Blok Chiptalar Qabuli)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Xarid qilingan barcha partiyalar, reyslar va blok chiptalar qabuli jurnali
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenPartnerModal && (
            <button
              onClick={() => onOpenPartnerModal("SUPPLIER")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-full shadow-xs border border-transparent dark:border-slate-700 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Yangi Ta&apos;minotchi
            </button>
          )}

          {onOpenBatchModal && (
            <button
              onClick={onOpenBatchModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              Yangi Xarid
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Jami qabul qilingan partiyalar:
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {totalBatchesCount} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">ta</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Jami xarid qilingan chiptalar:
          </span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
            {totalTicketsBought} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">dona</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Jami xarid summasi (Tannarx):
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            ${totalCost.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Partiya kodi, yo‘nalish, reys yoki ta‘minotchi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
          />
        </div>
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 pr-2 hidden sm:block">
          Ko&apos;rsatilyapti: <strong className="text-slate-800 dark:text-slate-200 font-mono">{filteredBatches.length}</strong> ta partiya
        </div>
      </div>

      {/* XARID QILINGAN PARTIYALAR RO'YXATI */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 overflow-hidden shadow-xs p-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Partiya & Yo‘nalish</th>
                <th className="py-3 px-4">Uchish Sanasi & Reys</th>
                <th className="py-3 px-4">Ta‘minotchi</th>
                <th className="py-3 px-4 text-center">Chiptalar Soni</th>
                <th className="py-3 px-4 text-right">Tannarx (1 dona)</th>
                <th className="py-3 px-4 text-right">Jami Partiya Qiymati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {filteredBatches.map((batch) => (
                <tr
                  key={batch.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {/* Route & batch code */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {batch.route}
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                      {batch.batchNumber}
                    </span>
                  </td>

                  {/* Flight Date & Flight Number */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {batch.flightDate}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {batch.flightNumber || "Reys ko‘rsatilmagan"}
                    </div>
                  </td>

                  {/* Supplier */}
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {batch.supplierName}
                    </span>
                  </td>

                  {/* Quantity */}
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                    {batch.totalQty} ta
                  </td>

                  {/* Buy Price */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ${batch.buyPrice}
                  </td>

                  {/* Total Cost */}
                  <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                    ${(batch.totalCost || 0).toLocaleString()}
                  </td>
                </tr>
              ))}

              {filteredBatches.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-xs text-slate-400 dark:text-slate-500"
                  >
                    Xaridlar topilmadi
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

"use client";

import React, { useState } from "react";
import { Search, PackagePlus, Users, Calendar, Pencil, FileSpreadsheet } from "lucide-react";
import { formatUSD } from "@/lib/format";

interface PartnersViewProps {
  batches?: any[];
  suppliers?: any[];
  onOpenBatchModal?: () => void;
  onOpenPartnerModal?: (type?: "SUPPLIER") => void;
  onEditBatch?: (batch: any) => void;
  onOpenHistoryModal?: (partnerId: number) => void;
}

export function PartnersView({
  batches = [],
  suppliers = [],
  onOpenBatchModal,
  onOpenPartnerModal,
  onEditBatch,
  onOpenHistoryModal,
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

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Xaridlar
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenPartnerModal && (
            <button
              onClick={() => onOpenPartnerModal("SUPPLIER")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-full shadow-xs border border-transparent dark:border-slate-600 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Yangi Kompaniya (Ta&apos;minotchi)
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

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-3xl border border-slate-200/70 dark:border-slate-700 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Partiya kodi, yo‘nalish, reys yoki kompaniya..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/70 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-full focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 transition-all"
          />
        </div>
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-400 pr-2 hidden sm:block">
          Ko&apos;rsatilyapti:{" "}
          <strong className="text-slate-800 dark:text-slate-200 font-mono">
            {filteredBatches.length}
          </strong>{" "}
          ta partiya
        </div>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="space-y-3 block md:hidden">
        {filteredBatches.map((batch) => (
          <div
            key={batch.id}
            className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/70 dark:border-slate-700 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug">
                  {batch.route}
                </h3>
                <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/90 px-2.5 py-0.5 rounded-full mt-1 inline-block border border-slate-200/60 dark:border-slate-600">
                  {batch.batchNumber}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono block">
                  {formatUSD(batch.totalCost)}
                </span>
                <span className="text-[10px] text-slate-400 block">Jami hisob</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-slate-100 dark:border-slate-700">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Uchish & Reys:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  {batch.flightDate}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5">
                  {batch.flightNumber || "Reys ko‘rsatilmagan"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Kompaniya:</span>
                <button
                  type="button"
                  onClick={() => onOpenHistoryModal && onOpenHistoryModal(batch.supplierId)}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline block truncate mt-0.5 text-left cursor-pointer"
                >
                  {batch.supplierName}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/50 -mx-4 -mb-4 px-4 py-3 rounded-b-3xl">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {batch.totalQty} ta
                </span>
                <span className="text-slate-400">×</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                  {formatUSD(batch.buyPrice)}
                </span>
              </div>

              {onEditBatch && (
                <button
                  type="button"
                  onClick={() => onEditBatch(batch)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3 h-3" /> Narxni o‘zgartirish
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredBatches.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/70 dark:border-slate-700 p-8 text-center text-xs text-slate-400 dark:text-slate-500">
            Xaridlar topilmadi
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/70 dark:border-slate-700 overflow-hidden shadow-xs p-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Partiya & Yo‘nalish</th>
                <th className="py-3 px-4">Uchish Sanasi & Reys</th>
                <th className="py-3 px-4">Kompaniya (Ta‘minotchi)</th>
                <th className="py-3 px-4 text-center">Chiptalar Soni</th>
                <th className="py-3 px-4 text-right">Olingan Narx (1 dona)</th>
                <th className="py-3 px-4 text-right">Jami Hisob</th>
                <th className="py-3 px-4 text-center">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
              {filteredBatches.map((batch) => (
                <tr
                  key={batch.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors"
                >
                  {/* Route & batch code */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {batch.route}
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md mt-0.5 inline-block">
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
                    <button
                      type="button"
                      onClick={() => onOpenHistoryModal && onOpenHistoryModal(batch.supplierId)}
                      title="Kompaniya bilan hisob-kitob (otchyot) oynasini ochish"
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left"
                    >
                      {batch.supplierName}
                    </button>
                  </td>

                  {/* Quantity */}
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                    {batch.totalQty} ta
                  </td>

                  {/* Buy Price */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {formatUSD(batch.buyPrice)}
                  </td>

                  {/* Total Cost */}
                  <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                    {formatUSD(batch.totalCost)}
                  </td>

                  {/* Edit Action */}
                  <td className="py-3.5 px-4 text-center">
                    {onEditBatch && (
                      <button
                        type="button"
                        onClick={() => onEditBatch(batch)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" /> Narxni o‘zgartirish
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredBatches.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
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

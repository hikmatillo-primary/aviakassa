"use client";

import React, { useState } from "react";
import {
  Search,
  PackagePlus,
  Pencil,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { formatUSD, matchesBatchSearch } from "@/lib/format";
import { FlightBar } from "@/components/FlightBar";
import { RowActionsMenu } from "@/components/RowActionsMenu";

interface BatchesViewProps {
  batches: any[];
  onOpenBatchModal?: () => void;
  onEditBatch?: (batch: any) => void;
  onDeleteBatch?: (batch: any) => void;
  onOpenHistoryModal?: (partnerId: number) => void;
  onSelectBatch?: (batchId: number) => void;
}

export function BatchesView({
  batches,
  onOpenBatchModal,
  onEditBatch,
  onDeleteBatch,
  onOpenHistoryModal,
  onSelectBatch,
}: BatchesViewProps) {
  const [search, setSearch] = useState("");

  const filteredBatches = batches.filter((b) => matchesBatchSearch(b, search));

  const filteredTotalQty = filteredBatches.reduce((sum, b) => sum + (b.totalQty || 0), 0);
  const filteredRemainingQty = filteredBatches.reduce((sum, b) => sum + (b.remainingQty || 0), 0);
  const filteredTotalCost = filteredBatches.reduce((sum, b) => sum + (b.totalCost || 0), 0);

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Ombor
          </h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-[#111726] p-3 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Yo‘nalish, reys, kompaniya qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] rounded-xl focus:bg-white dark:focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-white transition-all"
          />
        </div>
        <div className="text-xs font-medium text-slate-400 dark:text-slate-500 pr-2 hidden sm:block">
          Partiyalar soni:{" "}
          <strong className="text-slate-700 dark:text-slate-300 tabular-nums font-semibold">
            {filteredBatches.length}
          </strong>{" "}
          ta
        </div>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="space-y-3 block md:hidden">
        {filteredBatches.map((batch) => {
          const soldQty = batch.totalQty - batch.remainingQty;
          const percentSold = Math.round((soldQty / batch.totalQty) * 100);
          const isLowStock = batch.remainingQty > 0 && batch.remainingQty <= 5;

          return (
            <div
              key={batch.id}
              onClick={() => onSelectBatch && onSelectBatch(batch.id)}
              className="bg-white dark:bg-[#111726] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] hover:border-blue-400/70 dark:hover:border-blue-500/50 shadow-xs space-y-3 cursor-pointer transition-all"
            >
              {/* Aviation Product Title Block */}
              <div className="flex items-start justify-between gap-2">
                <FlightBar batch={batch} />
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-2.5" />
              </div>

              {/* Supplier info */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] text-slate-400 font-medium">Kompaniya:</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenHistoryModal?.(batch.supplierId);
                  }}
                  className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline block truncate text-right cursor-pointer"
                >
                  {batch.supplierName}
                </button>
              </div>

              {/* Progress bar */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5 tabular-nums">
                  <span
                    className={
                      batch.remainingQty === 0
                        ? "text-slate-400"
                        : isLowStock
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-blue-600 dark:text-blue-400"
                    }
                  >
                    {batch.remainingQty} ta qoldi
                  </span>
                  <span className="text-slate-400 font-normal">
                    {batch.totalQty} tadan ({percentSold}% sotildi)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      batch.remainingQty === 0
                        ? "bg-slate-300 dark:bg-slate-600"
                        : isLowStock
                        ? "bg-amber-500"
                        : "bg-blue-600"
                    }`}
                    style={{ width: `${percentSold}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="tabular-nums">
                  <span className="text-slate-500 dark:text-slate-400 text-xs">Tan narx: </span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {formatUSD(batch.buyPrice)}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-1.5">
                    (Jami: {formatUSD(batch.totalCost)})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RowActionsMenu
                    actions={[
                      ...(onEditBatch
                        ? [
                            {
                              label: "Narx",
                              icon: <Pencil className="w-3.5 h-3.5" />,
                              onClick: () => onEditBatch(batch),
                            },
                          ]
                        : []),
                      ...(onDeleteBatch
                        ? [
                            {
                              label: "O‘chirish",
                              icon: <Trash2 className="w-3.5 h-3.5" />,
                              onClick: () => onDeleteBatch(batch),
                              variant: "danger" as const,
                            },
                          ]
                        : []),
                    ]}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {filteredBatches.length === 0 && (
          <div className="bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/70 dark:border-white/[0.07] p-8 text-center space-y-2">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Mos keladigan partiyalar topilmadi
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Qidiruvni tozalash
              </button>
            )}
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/70 dark:border-white/[0.07] overflow-hidden shadow-xs p-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.06] text-xs font-semibold text-slate-400 dark:text-slate-500">
                <th className="py-3 px-4">Mahsulot / Reys</th>
                <th className="py-3 px-4">Kompaniya</th>
                <th className="py-3 px-4 text-center">Chipta qoldig‘i</th>
                <th className="py-3 px-4 text-right">Tan narxi (1 dona / Jami)</th>
                <th className="py-3 px-4 text-center">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs text-slate-700 dark:text-slate-300">
              {filteredBatches.map((batch) => {
                const soldQty = batch.totalQty - batch.remainingQty;
                const percentSold = Math.round((soldQty / batch.totalQty) * 100);
                const isLowStock = batch.remainingQty > 0 && batch.remainingQty <= 5;

                return (
                  <tr
                    key={batch.id}
                    onClick={() => onSelectBatch && onSelectBatch(batch.id)}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    {/* Aviation Title Block */}
                    <td className="py-3.5 px-4">
                      <div className="group-hover:translate-x-0.5 transition-transform">
                        <FlightBar batch={batch} />
                      </div>
                    </td>

                    {/* Supplier */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenHistoryModal?.(batch.supplierId);
                        }}
                        className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer text-left"
                      >
                        {batch.supplierName}
                      </button>
                    </td>

                    {/* Remaining Tickets Progress */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-block min-w-[130px] tabular-nums">
                        <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                          <span
                            className={
                              batch.remainingQty === 0
                                ? "text-slate-400"
                                : isLowStock
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-blue-600 dark:text-blue-400"
                            }
                          >
                            {batch.remainingQty} ta qoldi
                          </span>
                          <span className="text-slate-400">{batch.totalQty} tadan</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              batch.remainingQty === 0
                                ? "bg-slate-300 dark:bg-slate-600"
                                : isLowStock
                              ? "bg-amber-500"
                              : "bg-blue-600"
                            }`}
                            style={{ width: `${percentSold}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block text-right">
                          {soldQty} ta sotildi ({percentSold}%)
                        </span>
                      </div>
                    </td>

                    {/* Cost */}
                    <td className="py-3.5 px-4 text-right tabular-nums">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {formatUSD(batch.buyPrice)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Jami: {formatUSD(batch.totalCost)}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <RowActionsMenu
                          actions={[
                            ...(onEditBatch
                              ? [
                                  {
                                    label: "Narx",
                                    icon: <Pencil className="w-3.5 h-3.5" />,
                                    onClick: () => onEditBatch(batch),
                                  },
                                ]
                              : []),
                            ...(onDeleteBatch
                              ? [
                                  {
                                    label: "O‘chirish",
                                    icon: <Trash2 className="w-3.5 h-3.5" />,
                                    onClick: () => onDeleteBatch(batch),
                                    variant: "danger" as const,
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredBatches.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center space-y-2">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Mos keladigan partiyalar topilmadi
                    </p>
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Qidiruvni tozalash
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
            {filteredBatches.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-100 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                  <td colSpan={2} className="py-3 px-4 text-slate-500 dark:text-slate-400">
                    Jami ({filteredBatches.length} ta partiya):
                  </td>
                  <td className="py-3 px-4 text-center text-blue-600 dark:text-blue-400">
                    {filteredRemainingQty} ta qoldi / {filteredTotalQty} tadan
                  </td>
                  <td className="py-3 px-4 text-right text-slate-900 dark:text-white text-sm">
                    {formatUSD(filteredTotalCost)}
                  </td>
                  <td className="py-3 px-4" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

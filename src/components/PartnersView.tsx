"use client";

import React, { useState } from "react";
import { Search, PackagePlus, Users, Calendar, Pencil, SquarePen, Trash2, Tag } from "lucide-react";
import { formatUSD, formatDate, matchesBatchSearch, isDateInRange } from "@/lib/format";
import { FlightBar } from "@/components/FlightBar";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { CategoryModal } from "@/components/CategoryModal";
import { CustomSelect } from "@/components/CustomSelect";

interface PartnersViewProps {
  batches?: any[];
  suppliers?: any[];
  onOpenBatchModal?: () => void;
  onOpenPartnerModal?: (type?: "SUPPLIER") => void;
  onEditBatch?: (batch: any) => void;
  onFullEditBatch?: (batch: any) => void;
  onDeleteBatch?: (batch: any) => void;
  onOpenHistoryModal?: (partnerId: number) => void;
  onSelectBatch?: (batchId: number) => void;
  categories?: Array<{ id: number; name: string }>;
  onCreateCategory?: (name: string) => Promise<any> | void;
  onAccountBatch?: (batch: any) => void | Promise<void>;
  onAccountSeries?: (seriesId: string) => void | Promise<void>;
}

export function PartnersView({
  batches = [],
  suppliers = [],
  onOpenBatchModal,
  onOpenPartnerModal,
  onEditBatch,
  onFullEditBatch,
  onDeleteBatch,
  onOpenHistoryModal,
  onSelectBatch,
  categories = [],
  onCreateCategory,
  onAccountBatch,
  onAccountSeries,
}: PartnersViewProps) {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const clearAllFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setCategoryFilter("");
  };

  const filteredBatches = batches.filter(
    (b) =>
      matchesBatchSearch(b, search) &&
      isDateInRange(b.purchaseDate, dateFrom, dateTo) &&
      (!categoryFilter || String(b.categoryId || "") === categoryFilter)
  );

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Xaridlar
          </h1>
        </div>
        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto">
          {onCreateCategory && (
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl shadow-2xs border border-slate-200/80 dark:border-white/[0.08] transition-all cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <span>+ Kategoriya</span>
            </button>
          )}

          {onOpenPartnerModal && (
            <button
              onClick={() => onOpenPartnerModal("SUPPLIER")}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl shadow-2xs border border-slate-200/80 dark:border-white/[0.08] transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <span className="sm:hidden truncate">+ Hamkor</span>
              <span className="hidden sm:inline">+ Yangi hamkor</span>
            </button>
          )}

          {onOpenBatchModal && (
            <button
              onClick={onOpenBatchModal}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              <PackagePlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Yangi Xarid</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Date Range Filters */}
      <div className="bg-white dark:bg-[#111726] p-3 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Partiya kodi, yo‘nalish, reys yoki hamkor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] rounded-xl focus:bg-white dark:focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
            />
          </div>
          <DateRangeFilter
            from={dateFrom}
            to={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
            onClear={() => {
              setDateFrom("");
              setDateTo("");
            }}
          />
          {categories.length > 0 && (
            <CustomSelect
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              options={[
                { value: "", label: "Barcha turlar" },
                ...categories.map((c) => ({ value: String(c.id), label: c.name })),
              ]}
              placeholder="Barcha turlar"
            />
          )}
        </div>
        <div className="text-xs font-medium text-slate-400 dark:text-slate-500 pr-2 hidden sm:block shrink-0">
          Jami:{" "}
          <strong className="text-slate-700 dark:text-slate-300 tabular-nums font-semibold">
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
            onClick={() => onSelectBatch?.(batch.id)}
            className="bg-white dark:bg-[#111726] p-3.5 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-2xs space-y-3.5 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <FlightBar batch={batch} />
              </div>
              <div className="text-right shrink-0 pl-1.5">
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums block leading-tight">
                  {formatUSD(batch.totalCost)}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 block leading-tight mt-0.5 whitespace-nowrap">
                  Jami hisob
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                  Parvoz vaqti
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5 tabular-nums">
                  {formatDate(batch.flightDate, false)}
                  {batch.departureTime
                    ? ` • ${batch.departureTime}–${batch.arrivalTime || ""}`
                    : ""}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 tabular-nums">
                  Xarid: {formatDate(batch.purchaseDate, false)}
                </span>
                {batch.isRoundTrip && batch.returnDate && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 tabular-nums">
                    ⇄ {formatDate(batch.returnDate, false)}
                    {batch.returnDepartureTime
                      ? ` • ${batch.returnDepartureTime}–${batch.returnArrivalTime || ""}`
                      : ""}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                  Hamkor
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenHistoryModal?.(batch.supplierId);
                  }}
                  className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline block truncate mt-0.5 text-left cursor-pointer"
                >
                  {batch.supplierName}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-1.5 tabular-nums">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {batch.totalQty} ta
                </span>
                <span className="text-slate-400">×</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {formatUSD(batch.buyPrice)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {batch.isAuto && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5"
                  >
                    {batch.accountedAt ? (
                      <span
                        title="Hisobga olingan (hamkor balansiga qo'shilgan)"
                        className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs ring-1 ring-inset ring-emerald-500/20"
                      >
                        ✓
                      </span>
                    ) : (
                      <label className="flex items-center gap-1 cursor-pointer text-[11px] text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800/40">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => onAccountBatch?.(batch)}
                          className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                        />
                        <span>Hisobga olish</span>
                      </label>
                    )}
                  </div>
                )}

                <RowActionsMenu
                  actions={[
                    ...(onFullEditBatch
                      ? [
                          {
                            label: "Tahrirlash",
                            icon: <SquarePen className="w-3.5 h-3.5" />,
                            onClick: () => onFullEditBatch(batch),
                          },
                        ]
                      : []),
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
        ))}

        {filteredBatches.length === 0 && (
          <div className="bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/70 dark:border-white/[0.07] p-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
            <div>Mos keladigan xaridlar topilmadi</div>
            {(search || dateFrom || dateTo) && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-3 py-1.5 bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 rounded-lg font-medium cursor-pointer"
              >
                Filterni tozalash
              </button>
            )}
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/70 dark:border-white/[0.07] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.06] text-xs font-medium text-slate-400 dark:text-slate-500">
                <th className="py-3.5 px-5 font-medium">Sana</th>
                <th className="py-3.5 px-5 font-medium">Mahsulot / Reys</th>
                <th className="py-3.5 px-5 font-medium">Hamkor</th>
                <th className="py-3.5 px-5 font-medium text-center">Chiptalar soni</th>
                <th className="py-3.5 px-5 font-medium text-right">1 dona narxi</th>
                <th className="py-3.5 px-5 font-medium text-right">Jami hisob</th>
                <th className="py-3.5 px-4 font-medium text-center">Hisobga olish</th>
                <th className="py-3.5 px-5 font-medium text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs text-slate-700 dark:text-slate-300">
              {filteredBatches.map((batch) => (
                <tr
                  key={batch.id}
                  onClick={() => onSelectBatch?.(batch.id)}
                  className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                >
                  {/* Xarid sanasi */}
                  <td className="py-4 px-5 text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                    {formatDate(batch.purchaseDate, false)}
                  </td>

                  {/* Aviation Product Title */}
                  <td className="py-4 px-5">
                    <FlightBar batch={batch} />
                  </td>

                  {/* Supplier */}
                  <td className="py-4 px-5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenHistoryModal?.(batch.supplierId);
                      }}
                      title="Hamkor bilan hisob-kitob (otchyot) oynasini ochish"
                      className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer text-left transition-colors"
                    >
                      {batch.supplierName}
                    </button>
                  </td>

                  {/* Quantity */}
                  <td className="py-4 px-5 text-center tabular-nums font-semibold text-slate-700 dark:text-slate-300 text-sm">
                    {batch.totalQty} ta
                  </td>

                  {/* Buy Price */}
                  <td className="py-4 px-5 text-right tabular-nums font-medium text-slate-600 dark:text-slate-300 text-sm">
                    {formatUSD(batch.buyPrice)}
                  </td>

                  {/* Total Cost */}
                  <td className="py-4 px-5 text-right tabular-nums font-bold text-slate-900 dark:text-white text-sm">
                    {formatUSD(batch.totalCost)}
                  </td>

                  {/* Hisobga olish Checkbox */}
                  <td
                    className="py-4 px-4 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {batch.isAuto ? (
                      batch.accountedAt ? (
                        <span
                          title="Hisobga olingan (hamkor balansiga qo'shilgan)"
                          className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold ring-1 ring-inset ring-emerald-500/20"
                        >
                          ✓
                        </span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => onAccountBatch?.(batch)}
                          title="Hisobga olish uchun bosing (hamkor qarziga qo'shiladi)"
                          className="w-4 h-4 accent-blue-600 rounded cursor-pointer transition-transform hover:scale-110"
                        />
                      )
                    ) : (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>

                  {/* Edit Action */}
                  <td className="py-4 px-5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <RowActionsMenu
                        actions={[
                          ...(onFullEditBatch
                            ? [
                                {
                                  label: "Tahrirlash",
                                  icon: <SquarePen className="w-3.5 h-3.5" />,
                                  onClick: () => onFullEditBatch(batch),
                                },
                              ]
                            : []),
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
              ))}

              {filteredBatches.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2"
                  >
                    <div>Mos keladigan xaridlar topilmadi</div>
                    {(search || dateFrom || dateTo) && (
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="mt-2 px-3 py-1.5 bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 rounded-lg font-medium cursor-pointer"
                      >
                        Filterni tozalash
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
            {filteredBatches.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                  <td colSpan={3} className="py-3.5 px-5 text-slate-500 dark:text-slate-400">
                    Jami ({filteredBatches.length} ta partiya):
                  </td>
                  <td className="py-3.5 px-5 text-center font-bold text-slate-900 dark:text-white">
                    {filteredBatches.reduce((sum, b) => sum + (b.totalQty || 0), 0)} ta
                  </td>
                  <td className="py-3.5 px-5 text-right text-slate-400">—</td>
                  <td className="py-3.5 px-5 text-right font-bold text-slate-900 dark:text-white text-sm">
                    {formatUSD(filteredBatches.reduce((sum, b) => sum + (b.totalCost || 0), 0))}
                  </td>
                  <td className="py-3.5 px-5" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {onCreateCategory && (
        <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={onCreateCategory}
        />
      )}
    </div>
  );
}

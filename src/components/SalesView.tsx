"use client";

import React, { useState } from "react";
import { Search, ShoppingBag, Users, Pencil } from "lucide-react";
import { formatUSD, formatDate } from "@/lib/format";
import { FlightBar } from "@/components/FlightBar";

interface SalesViewProps {
  sales: any[];
  clients?: any[];
  onOpenSaleModal: () => void;
  onOpenPartnerModal?: (type?: "CLIENT") => void;
  onEditSale?: (sale: any) => void;
  onOpenHistoryModal?: (partnerId: number) => void;
}

export function SalesView({
  sales,
  onOpenSaleModal,
  onOpenPartnerModal,
  onEditSale,
  onOpenHistoryModal,
}: SalesViewProps) {
  const [search, setSearch] = useState("");

  // Filtered sales
  const filteredSales = sales.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.clientName?.toLowerCase().includes(q) ||
      s.route?.toLowerCase().includes(q) ||
      s.passengerNames?.toLowerCase().includes(q) ||
      s.flightNumber?.toLowerCase().includes(q) ||
      s.saleDate?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Sotuvlar Daftari
          </h1>
        </div>
        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto">
          {onOpenPartnerModal && (
            <button
              onClick={() => onOpenPartnerModal("CLIENT")}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl shadow-2xs border border-slate-200/80 dark:border-white/[0.08] transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <span className="sm:hidden truncate">+ Hamkor</span>
              <span className="hidden sm:inline">+ Yangi hamkor</span>
            </button>
          )}

          <button
            onClick={onOpenSaleModal}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Chipta sotish</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-[#111726] p-3 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-2xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Hamkor, yo‘nalish yoki reys..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] rounded-xl focus:bg-white dark:focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
          />
        </div>
        <div className="text-xs font-medium text-slate-400 dark:text-slate-500 pr-2 hidden sm:block">
          Sotuvlar soni:{" "}
          <strong className="text-slate-700 dark:text-slate-300 tabular-nums font-semibold">
            {filteredSales.length}
          </strong>{" "}
          ta
        </div>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="space-y-3 block md:hidden">
        {filteredSales.map((sale) => (
          <div
            key={sale.id}
            className="bg-white dark:bg-[#111726] p-3.5 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-2xs space-y-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <FlightBar batch={sale} showSubtitle={false} />
              </div>
              <div className="text-right shrink-0 pl-1.5">
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums block leading-tight">
                  {formatUSD(sale.totalAmount)}
                </span>
                <span
                  className={`text-[10px] sm:text-[11px] font-semibold tabular-nums block leading-tight mt-0.5 whitespace-nowrap ${
                    (sale.profit || 0) >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {(sale.profit || 0) >= 0
                    ? `+${formatUSD(sale.profit || 0)} foyda`
                    : `-${formatUSD(Math.abs(sale.profit || 0))} zarar`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Hamkor:
              </span>
              <button
                type="button"
                onClick={() => onOpenHistoryModal && onOpenHistoryModal(sale.clientId)}
                className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate text-right cursor-pointer"
              >
                {sale.clientName}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-1.5 tabular-nums">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {sale.qty} ta
                </span>
                <span className="text-slate-400">×</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {formatUSD(sale.sellPrice)}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  (Tannarx: {formatUSD(sale.buyPrice || 0)})
                </span>
              </div>

              {onEditSale && (
                <button
                  type="button"
                  onClick={() => onEditSale(sale)}
                  title="Sotish narxini o'zgartirish"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200/60 dark:border-white/[0.08] transition-colors cursor-pointer"
                >
                  <Pencil className="w-3 h-3 text-slate-400" /> Narx
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredSales.length === 0 && (
          <div className="bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/70 dark:border-white/[0.07] p-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
            <div>Mos keladigan sotuvlar topilmadi</div>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
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
                <th className="py-3.5 px-5 font-medium text-center">Soni</th>
                <th className="py-3.5 px-5 font-medium text-right">Tannarx</th>
                <th className="py-3.5 px-5 font-medium text-right">Sotish narxi</th>
                <th className="py-3.5 px-5 font-medium text-right">Jami hisob</th>
                <th className="py-3.5 px-5 font-medium text-right">Sof foyda</th>
                <th className="py-3.5 px-5 font-medium text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs text-slate-700 dark:text-slate-300">
              {filteredSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Date */}
                  <td className="py-4 px-5 text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                    {formatDate(sale.saleDate, false)}
                  </td>

                  {/* Route & Flight */}
                  <td className="py-4 px-5">
                    <FlightBar batch={sale} showSubtitle={false} />
                  </td>

                  {/* Client name */}
                  <td className="py-4 px-5">
                    <button
                      type="button"
                      onClick={() => onOpenHistoryModal && onOpenHistoryModal(sale.clientId)}
                      title="Hamkor bilan hisob-kitob (otchyot) oynasini ochish"
                      className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer text-left transition-colors"
                    >
                      {sale.clientName}
                    </button>
                  </td>

                  {/* Qty */}
                  <td className="py-4 px-5 text-center tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                    {sale.qty} ta
                  </td>

                  {/* Buy Price (Tannarx) */}
                  <td className="py-4 px-5 text-right tabular-nums text-slate-400 dark:text-slate-500">
                    {formatUSD(sale.buyPrice || 0)}
                  </td>

                  {/* Sell Price */}
                  <td className="py-4 px-5 text-right tabular-nums font-medium text-slate-700 dark:text-slate-200 text-sm">
                    {formatUSD(sale.sellPrice)}
                  </td>

                  {/* Total Amount */}
                  <td className="py-4 px-5 text-right tabular-nums font-bold text-slate-900 dark:text-white text-sm">
                    {formatUSD(sale.totalAmount)}
                  </td>

                  {/* Profit */}
                  <td
                    className={`py-4 px-5 text-right tabular-nums font-semibold ${
                      (sale.profit || 0) >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {(sale.profit || 0) >= 0
                      ? `+${formatUSD(sale.profit || 0)}`
                      : `-${formatUSD(Math.abs(sale.profit || 0))}`}
                  </td>

                  {/* Edit Action */}
                  <td className="py-4 px-5 text-right">
                    {onEditSale && (
                      <button
                        type="button"
                        onClick={() => onEditSale(sale)}
                        title="Sotish narxini o'zgartirish"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200/60 dark:border-white/[0.08] transition-all cursor-pointer"
                      >
                        <Pencil className="w-3 h-3 text-slate-400" /> Narx
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredSales.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2"
                  >
                    <div>Mos keladigan sotuvlar topilmadi</div>
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="mt-2 px-3 py-1.5 bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 rounded-lg font-medium cursor-pointer"
                      >
                        Filterni tozalash
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
            {filteredSales.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                  <td colSpan={3} className="py-3.5 px-5 text-slate-500 dark:text-slate-400">
                    Jami ({filteredSales.length} ta sotuv):
                  </td>
                  <td className="py-3.5 px-5 text-center font-bold text-slate-900 dark:text-white">
                    {filteredSales.reduce((sum, s) => sum + (s.qty || 0), 0)} ta
                  </td>
                  <td className="py-3.5 px-5 text-right text-slate-400">—</td>
                  <td className="py-3.5 px-5 text-right text-slate-400">—</td>
                  <td className="py-3.5 px-5 text-right font-bold text-slate-900 dark:text-white text-sm">
                    {formatUSD(filteredSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0))}
                  </td>
                  <td className="py-3.5 px-5 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    +{formatUSD(filteredSales.reduce((sum, s) => sum + (s.profit || 0), 0))}
                  </td>
                  <td className="py-3.5 px-5" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

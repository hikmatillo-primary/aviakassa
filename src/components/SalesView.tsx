"use client";

import React, { useState } from "react";
import { Search, ShoppingBag, Users, Calendar, TrendingUp } from "lucide-react";

interface SalesViewProps {
  sales: any[];
  onOpenSaleModal: () => void;
  onOpenPartnerModal?: (type?: "CLIENT") => void;
}

export function SalesView({
  sales,
  onOpenSaleModal,
  onOpenPartnerModal,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sotuvlar Daftari
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenPartnerModal && (
            <button
              onClick={() => onOpenPartnerModal("CLIENT")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-full shadow-xs border border-transparent dark:border-slate-700 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Yangi Mijoz
            </button>
          )}

          <button
            onClick={onOpenSaleModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            Chipta sotish
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Yo‘lovchi ismi, mijoz, yo‘nalish yoki reys..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
          />
        </div>
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 pr-2 hidden sm:block">
          Sotuvlar soni: <strong className="text-slate-800 dark:text-slate-200 font-mono">{filteredSales.length}</strong> ta
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 overflow-hidden shadow-xs p-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Sotuv Sanasi</th>
                <th className="py-3 px-4">Yo‘nalish & Reys</th>
                <th className="py-3 px-4">Yo‘lovchilar</th>
                <th className="py-3 px-4">Xaridor (Mijoz / Agent)</th>
                <th className="py-3 px-4 text-center">Soni</th>
                <th className="py-3 px-4 text-right">Sotish Narxi</th>
                <th className="py-3 px-4 text-right">Jami Summa</th>
                <th className="py-3 px-4 text-right">Sof Foyda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {filteredSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {/* Date */}
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                    {sale.saleDate}
                  </td>

                  {/* Route & Flight */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {sale.route}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {sale.flightNumber || "-"} ({sale.flightDate})
                    </div>
                  </td>

                  {/* Passenger names */}
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {sale.passengerNames || "-"}
                    </span>
                  </td>

                  {/* Client name */}
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    {sale.clientName}
                  </td>

                  {/* Qty */}
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                    {sale.qty} ta
                  </td>

                  {/* Sell Price */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ${sale.sellPrice}
                  </td>

                  {/* Total Amount */}
                  <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                    ${sale.totalAmount.toLocaleString()}
                  </td>

                  {/* Profit */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +${(sale.profit || 0).toLocaleString()}
                  </td>
                </tr>
              ))}

              {filteredSales.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-xs text-slate-400 dark:text-slate-500"
                  >
                    Sotuvlar topilmadi
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

"use client";

import React, { useState } from "react";
import { ShoppingBag, Search, Plus, Calendar, TrendingUp } from "lucide-react";

interface SalesViewProps {
  sales: any[];
  onOpenSaleModal: () => void;
}

export function SalesView({ sales, onOpenSaleModal }: SalesViewProps) {
  const [search, setSearch] = useState("");

  const filteredSales = sales.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.clientName?.toLowerCase().includes(q) ||
      s.route?.toLowerCase().includes(q) ||
      s.passengerNames?.toLowerCase().includes(q) ||
      s.saleDate?.toLowerCase().includes(q)
    );
  });

  const totalRevenue = filteredSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const totalProfit = filteredSales.reduce((acc, s) => acc + (s.profit || 0), 0);
  const totalTicketsSold = filteredSales.reduce((acc, s) => acc + (s.qty || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sotuvlar Daftari</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Partiyalardan amalga oshirilgan barcha chipta sotuvlari va ulardan qolgan foyda
          </p>
        </div>
        <button
          onClick={onOpenSaleModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> + Chipta sotish
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Jami sotilgan chiptalar:</span>
          <div className="text-xl font-black text-slate-900 font-mono mt-1">
            {totalTicketsSold} <span className="text-xs font-normal text-slate-500">ta</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Jami sotuv tushumi:</span>
          <div className="text-xl font-black text-slate-900 font-mono mt-1">
            ${totalRevenue.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Sof foyda:
          </span>
          <div className="text-xl font-black text-emerald-600 font-mono mt-1">
            +${totalProfit.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Mijoz, yo'nalish, yo'lovchi ismi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Sana</th>
                <th className="py-3 px-4">Yo&apos;nalish & Reys</th>
                <th className="py-3 px-4">Xaridor (Mijoz)</th>
                <th className="py-3 px-4 text-center">Soni</th>
                <th className="py-3 px-4 text-right">Narxi ($)</th>
                <th className="py-3 px-4 text-right">Jami Summa</th>
                <th className="py-3 px-4 text-right">Sof Foyda</th>
                <th className="py-3 px-4">Yo&apos;lovchilar / PNR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                    {sale.saleDate}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{sale.route}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {sale.flightNumber || ""} {sale.flightDate ? `(${sale.flightDate})` : ""}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900">{sale.clientName}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600 font-mono">
                    {sale.qty} ta
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">
                    ${sale.sellPrice}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ${sale.totalAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                    +${sale.profit.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-[180px] truncate" title={sale.passengerNames}>
                    {sale.passengerNames || "-"}
                  </td>
                </tr>
              ))}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
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

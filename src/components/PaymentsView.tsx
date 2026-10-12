"use client";

import React, { useState } from "react";
import { Wallet, Search, Plus, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface PaymentsViewProps {
  payments: any[];
  onOpenPaymentModal: (type?: "INCOME" | "EXPENSE") => void;
}

export function PaymentsView({ payments, onOpenPaymentModal }: PaymentsViewProps) {
  const [filter, setFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [search, setSearch] = useState("");

  const filteredPayments = payments.filter((p) => {
    if (filter === "INCOME" && p.type !== "INCOME") return false;
    if (filter === "EXPENSE" && p.type !== "EXPENSE") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.partnerName?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q) ||
        p.paymentDate?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalIncome = payments
    .filter((p) => p.type === "INCOME")
    .reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalExpense = payments
    .filter((p) => p.type === "EXPENSE")
    .reduce((acc, p) => acc + (p.amount || 0), 0);
  const netCashFlow = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kassa & To&apos;lovlar Tarixi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Barcha kirim (mijoz to&apos;lovlari) va chiqim (ta&apos;minotchi to&apos;lovlari) ro&apos;yxati
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenPaymentModal("EXPENSE")}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full shadow-sm shadow-rose-500/25 transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> - Chiqim (To&apos;lash)
          </button>
          <button
            onClick={() => onOpenPaymentModal("INCOME")}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full shadow-sm shadow-emerald-500/25 transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" /> + Kirim (Qabul qilish)
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Jami kirim (Mijozlardan):</span>
            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
            +${totalIncome.toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Jami chiqim (Ta&apos;minotchilarga):</span>
            <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono mt-1">
            -${totalExpense.toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Kassa qoldig&apos;i (Sof oqim):</span>
            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div
            className={`text-2xl font-black font-mono mt-1 ${
              netCashFlow >= 0 ? "text-slate-900" : "text-rose-600"
            }`}
          >
            {netCashFlow >= 0 ? `+$${netCashFlow.toLocaleString()}` : `-$${Math.abs(netCashFlow).toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-3xl border border-slate-200/70 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Hamkor nomi yoki izoh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-full w-full sm:w-auto">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              filter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Barchasi ({payments.length})
          </button>
          <button
            onClick={() => setFilter("INCOME")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              filter === "INCOME" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Kirim ({payments.filter((p) => p.type === "INCOME").length})
          </button>
          <button
            onClick={() => setFilter("EXPENSE")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              filter === "EXPENSE" ? "bg-white text-rose-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Chiqim ({payments.filter((p) => p.type === "EXPENSE").length})
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200/70 overflow-hidden shadow-xs p-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Sana</th>
                <th className="py-3 px-4">Turi</th>
                <th className="py-3 px-4">Hamkor</th>
                <th className="py-3 px-4 text-right">Summa ($)</th>
                <th className="py-3 px-4">To&apos;lov shakli</th>
                <th className="py-3 px-4">Izoh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                    {p.paymentDate}
                  </td>
                  <td className="py-3.5 px-4">
                    {p.type === "INCOME" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <ArrowDownLeft className="w-3 h-3" /> Kirim
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                        <ArrowUpRight className="w-3 h-3" /> Chiqim
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{p.partnerName}</td>
                  <td
                    className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${
                      p.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {p.type === "INCOME" ? `+$${p.amount.toLocaleString()}` : `-$${p.amount.toLocaleString()}`}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
                      {p.paymentMethod === "CASH"
                        ? "Naqd pul"
                        : p.paymentMethod === "CARD"
                        ? "Karta / O'tkazma"
                        : "Bank hisobi"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{p.notes || "-"}</td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    To&apos;lovlar topilmadi
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

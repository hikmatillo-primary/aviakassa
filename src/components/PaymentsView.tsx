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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Kassa & To&apos;lovlar Tarixi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Barcha kirim (mijoz to&apos;lovlari) va chiqim (ta&apos;minotchi to&apos;lovlari) ro&apos;yxati
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenPaymentModal("EXPENSE")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <ArrowUpRight className="w-4 h-4" /> Chiqim (To&apos;lash)
          </button>
          <button
            onClick={() => onOpenPaymentModal("INCOME")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <ArrowDownLeft className="w-4 h-4" /> Kirim (Qabul qilish)
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Jami kirim (Mijozlardan):</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600 font-mono mt-1">
            +${totalIncome.toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Jami chiqim (Ta&apos;minotchilarga):</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-600 font-mono mt-1">
            -${totalExpense.toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Sof kassa qoldig&apos;i:</span>
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <div
            className={`text-xl font-black font-mono mt-1 ${
              netCashFlow >= 0 ? "text-slate-900" : "text-amber-600"
            }`}
          >
            ${netCashFlow.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Hamkor nomi, izoh, sana..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Barchasi ({payments.length})
          </button>
          <button
            onClick={() => setFilter("INCOME")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filter === "INCOME" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Kirimlar ({payments.filter((p) => p.type === "INCOME").length})
          </button>
          <button
            onClick={() => setFilter("EXPENSE")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filter === "EXPENSE" ? "bg-white text-rose-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Chiqimlar ({payments.filter((p) => p.type === "EXPENSE").length})
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Sana</th>
                <th className="py-3 px-4">To&apos;lov Turi</th>
                <th className="py-3 px-4">Hamkor</th>
                <th className="py-3 px-4">To&apos;lov Shakli</th>
                <th className="py-3 px-4 text-right">Summa ($)</th>
                <th className="py-3 px-4">Izoh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                    {p.paymentDate}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        p.type === "INCOME"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {p.type === "INCOME" ? (
                        <>
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" /> Kirim
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" /> Chiqim
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900">{p.partnerName}</span>
                    <span className="text-[10px] text-slate-400 block">
                      {p.partnerType === "SUPPLIER" ? "Ta'minotchi" : "Mijoz"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                      {p.paymentMethod === "CASH"
                        ? "Naqd pul"
                        : p.paymentMethod === "CARD"
                        ? "Karta / O'tkazma"
                        : "Bank hisobi"}
                    </span>
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-bold text-sm ${
                      p.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {p.type === "INCOME" ? "+" : "-"}${p.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate" title={p.notes}>
                    {p.notes || "-"}
                  </td>
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

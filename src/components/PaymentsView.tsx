"use client";

import React, { useState } from "react";
import {
  Wallet,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Receipt,
  Calendar,
  FileSpreadsheet,
  Users,
} from "lucide-react";
import { formatUSD } from "@/lib/format";

interface PaymentsViewProps {
  payments: any[];
  debtOffsets?: any[];
  partners?: any[];
  onOpenPaymentModal: (type?: "INCOME" | "EXPENSE", partnerId?: number) => void;
  onOpenDebtOffsetModal?: (fromPartnerId?: number, toPartnerId?: number) => void;
  onOpenHistoryModal?: (partnerId: number) => void;
}

export function PaymentsView({
  payments,
  debtOffsets = [],
  partners = [],
  onOpenPaymentModal,
  onOpenDebtOffsetModal,
  onOpenHistoryModal,
}: PaymentsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"CASH" | "PARTNERS" | "OFFSETS">("CASH");
  const [filter, setFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [partnerFilter, setPartnerFilter] = useState<"ALL" | "CLIENT" | "SUPPLIER">("ALL");
  const [search, setSearch] = useState("");

  const filteredPayments = payments.filter((p) => {
    if (filter === "INCOME" && p.type !== "INCOME") return false;
    if (filter === "EXPENSE" && p.type !== "EXPENSE") return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.partnerName?.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q) ||
      p.paymentDate?.toLowerCase().includes(q)
    );
  });

  const filteredPartners = partners.filter((pt) => {
    if (partnerFilter === "CLIENT" && pt.type !== "CLIENT") return false;
    if (partnerFilter === "SUPPLIER" && pt.type !== "SUPPLIER") return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      pt.name?.toLowerCase().includes(q) ||
      pt.phone?.toLowerCase().includes(q) ||
      pt.notes?.toLowerCase().includes(q)
    );
  });

  const filteredOffsets = debtOffsets.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.fromPartnerName?.toLowerCase().includes(q) ||
      o.toPartnerName?.toLowerCase().includes(q) ||
      o.notes?.toLowerCase().includes(q) ||
      o.date?.toLowerCase().includes(q)
    );
  });

  const totalIncome = payments
    .filter((p) => p.type === "INCOME")
    .reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalExpense = payments
    .filter((p) => p.type === "EXPENSE")
    .reduce((acc, p) => acc + (p.amount || 0), 0);
  const netCashFlow = totalIncome - totalExpense;

  const totalOffsetsAmount = debtOffsets.reduce((acc, o) => acc + (o.amount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Kassa
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenDebtOffsetModal && (
            <button
              onClick={() => onOpenDebtOffsetModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full shadow-xs border border-blue-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" /> ⇄ Qarzni surish
            </button>
          )}

          <button
            onClick={() => onOpenPaymentModal("EXPENSE")}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full shadow-sm shadow-rose-500/25 transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> - Chiqim
          </button>

          <button
            onClick={() => onOpenPaymentModal("INCOME")}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full shadow-sm shadow-emerald-500/25 transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" /> + Kirim
          </button>
        </div>
      </div>

      {/* Mobile Compact Indicators (Minimal 2x2 grid) */}
      <div className="grid grid-cols-2 gap-2 sm:hidden">
        {/* Kirim */}
        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Kirim:</span>
            <ArrowDownLeft className="w-3 h-3 text-emerald-500" />
          </div>
          <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            +{formatUSD(totalIncome)}
          </div>
        </div>

        {/* Chiqim */}
        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Chiqim:</span>
            <ArrowUpRight className="w-3 h-3 text-rose-500" />
          </div>
          <div className="text-base font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
            -{formatUSD(totalExpense)}
          </div>
        </div>

        {/* Kassa naqd qoldig'i */}
        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Naqd qoldiq:</span>
            <Wallet className="w-3 h-3 text-blue-500" />
          </div>
          <div
            className={`text-base font-black font-mono mt-0.5 ${
              netCashFlow >= 0
                ? "text-slate-900 dark:text-white"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {netCashFlow >= 0
              ? `+${formatUSD(netCashFlow)}`
              : `-${formatUSD(Math.abs(netCashFlow))}`}
          </div>
        </div>

        {/* Surilgan qarzlar */}
        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Surilgan qarz:</span>
            <ArrowRightLeft className="w-3 h-3 text-indigo-500" />
          </div>
          <div className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
            {formatUSD(totalOffsetsAmount)}
          </div>
        </div>
      </div>

      {/* Desktop Summary Cards (hidden on mobile, shown on sm+) */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kirim */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/70 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-400 font-medium">
            <span>Jami kirim (Mijozlar):</span>
            <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            +{formatUSD(totalIncome)}
          </div>
        </div>

        {/* Chiqim */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/70 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-400 font-medium">
            <span>Jami chiqim (Ta&apos;minotchilar):</span>
            <div className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
            -{formatUSD(totalExpense)}
          </div>
        </div>

        {/* Kassa qoldig'i */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/70 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-400 font-medium">
            <span>Kassa naqd qoldig&apos;i:</span>
            <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-black font-mono mt-1 ${
              netCashFlow >= 0
                ? "text-slate-900 dark:text-white"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {netCashFlow >= 0
              ? `+${formatUSD(netCashFlow)}`
              : `-${formatUSD(Math.abs(netCashFlow))}`}
          </div>
        </div>

        {/* O'zaro surilgan qarzlar */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/70 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-400 font-medium">
            <span>O‘zaro surilgan qarzlar:</span>
            <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
            {formatUSD(totalOffsetsAmount)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            (Naqd pulsiz o‘zaro hisob)
          </span>
        </div>
      </div>

      {/* Sub Tabs Switch */}
      <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-2xl w-fit max-w-full overflow-x-auto">
        <button
          onClick={() => {
            setActiveSubTab("CASH");
            setSearch("");
          }}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "CASH"
              ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          Kassa Harakatlari ({payments.length})
        </button>

        <button
          onClick={() => {
            setActiveSubTab("PARTNERS");
            setSearch("");
          }}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "PARTNERS"
              ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Hamkorlar Otchyoti ({partners.length})
        </button>

        <button
          onClick={() => {
            setActiveSubTab("OFFSETS");
            setSearch("");
          }}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "OFFSETS"
              ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          O‘zaro Qarz Surish ({debtOffsets.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-3xl border border-slate-200/70 dark:border-slate-700 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder={
              activeSubTab === "CASH"
                ? "Hamkor nomi yoki izoh..."
                : activeSubTab === "PARTNERS"
                ? "Mijoz yoki kompaniya nomi..."
                : "Qarz beruvchi, oluvchi yoki izoh..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/70 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-full focus:bg-white dark:focus:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Filter Tabs for Cash */}
        {activeSubTab === "CASH" && (
          <div className="flex items-center gap-1 bg-slate-100/70 dark:bg-slate-700/60 p-1 rounded-full w-full sm:w-auto">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                filter === "ALL"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Barchasi ({payments.length})
            </button>
            <button
              onClick={() => setFilter("INCOME")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                filter === "INCOME"
                  ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Kirim ({payments.filter((p) => p.type === "INCOME").length})
            </button>
            <button
              onClick={() => setFilter("EXPENSE")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                filter === "EXPENSE"
                  ? "bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Chiqim ({payments.filter((p) => p.type === "EXPENSE").length})
            </button>
          </div>
        )}

        {/* Filter Tabs for Partners */}
        {activeSubTab === "PARTNERS" && (
          <div className="flex items-center gap-1 bg-slate-100/70 dark:bg-slate-700/60 p-1 rounded-full w-full sm:w-auto">
            <button
              onClick={() => setPartnerFilter("ALL")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                partnerFilter === "ALL"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Barchasi ({partners.length})
            </button>
            <button
              onClick={() => setPartnerFilter("CLIENT")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                partnerFilter === "CLIENT"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Mijozlar ({partners.filter((p) => p.type === "CLIENT").length})
            </button>
            <button
              onClick={() => setPartnerFilter("SUPPLIER")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                partnerFilter === "SUPPLIER"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Kompaniyalar ({partners.filter((p) => p.type === "SUPPLIER").length})
            </button>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: CASH PAYMENTS */}
      {activeSubTab === "CASH" && (
        <>
          {/* MOBILE LIST VIEW */}
          <div className="space-y-3 block md:hidden">
            {filteredPayments.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/70 dark:border-slate-700 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <button
                      type="button"
                      onClick={() => onOpenHistoryModal && onOpenHistoryModal(p.partnerId)}
                      className="font-extrabold text-blue-600 dark:text-blue-400 hover:underline text-base text-left cursor-pointer"
                    >
                      {p.partnerName}
                    </button>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {p.paymentDate}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-lg font-black font-mono block ${
                        p.type === "INCOME"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {p.type === "INCOME" ? `+${formatUSD(p.amount)}` : `-${formatUSD(p.amount)}`}
                    </span>
                    {p.type === "INCOME" ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <ArrowDownLeft className="w-3 h-3" /> Kirim
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        <ArrowUpRight className="w-3 h-3" /> Chiqim
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/50 -mx-4 -mb-4 px-4 py-2.5 rounded-b-3xl">
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
                    {p.paymentMethod === "CASH"
                      ? "Naqd pul"
                      : p.paymentMethod === "CARD"
                      ? "Karta / O'tkazma"
                      : "Bank hisobi"}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs truncate max-w-[160px]">
                    {p.notes || "-"}
                  </span>
                </div>
              </div>
            ))}

            {filteredPayments.length === 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/70 dark:border-slate-700 p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                To&apos;lovlar topilmadi
              </div>
            )}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/70 dark:border-slate-700 overflow-hidden shadow-xs p-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Sana</th>
                    <th className="py-3 px-4">Turi</th>
                    <th className="py-3 px-4">Hamkor (Otchyot uchun bosing)</th>
                    <th className="py-3 px-4 text-right">Summa</th>
                    <th className="py-3 px-4">To‘lov Usuli</th>
                    <th className="py-3 px-4">Izoh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                  {filteredPayments.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        {p.paymentDate}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.type === "INCOME" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                            <ArrowDownLeft className="w-3 h-3" /> Kirim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
                            <ArrowUpRight className="w-3 h-3" /> Chiqim
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        <button
                          type="button"
                          onClick={() => onOpenHistoryModal && onOpenHistoryModal(p.partnerId)}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer text-left"
                        >
                          {p.partnerName}
                        </button>
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${
                          p.type === "INCOME"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {p.type === "INCOME"
                          ? `+${formatUSD(p.amount)}`
                          : `-${formatUSD(p.amount)}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
                          {p.paymentMethod === "CASH"
                            ? "Naqd pul"
                            : p.paymentMethod === "CARD"
                            ? "Karta / O'tkazma"
                            : "Bank hisobi"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 dark:text-slate-500 max-w-xs truncate">
                        {p.notes || "-"}
                      </td>
                    </tr>
                  ))}

                  {filteredPayments.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-xs text-slate-400 dark:text-slate-500"
                      >
                        To&apos;lovlar topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* SUB-TAB 2: PARTNERS SETTLEMENT & OTCHYOT */}
      {activeSubTab === "PARTNERS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredPartners.map((pt) => {
            const isSupplier = pt.type === "SUPPLIER";
            const debt = pt.balance || 0;
            return (
              <div
                key={pt.id}
                className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200/70 dark:border-slate-700 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        isSupplier
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                          : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {isSupplier ? "Kompaniya (Ta'minotchi)" : "Mijoz (Xaridor)"}
                    </span>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg mt-1.5">
                      {pt.name}
                    </h3>
                    {pt.phone && (
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{pt.phone}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      {debt > 0
                        ? isSupplier
                          ? "Bizning qarzimiz"
                          : "Mijozning qarzi"
                        : debt < 0
                        ? "Avans (Ortiqcha to'lov)"
                        : "Hisob-kitob holati"}
                    </span>
                    <span
                      className={`text-lg sm:text-xl font-black font-mono block mt-0.5 ${
                        debt > 0
                          ? isSupplier
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-amber-600 dark:text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {debt > 0
                        ? formatUSD(debt)
                        : debt < 0
                        ? `+${formatUSD(Math.abs(debt))}`
                        : "Qarz yo‘q ($0)"}
                    </span>
                  </div>
                </div>

                {/* Financial breakdown row */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/70 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      {isSupplier ? "Jami olingan chiptalar:" : "Jami sotilgan chiptalar:"}
                    </span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {formatUSD(pt.totalDeal || 0)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">
                      {isSupplier ? "Jami to‘lab berilgan:" : "Jami to‘lab bergan:"}
                    </span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatUSD(pt.totalPaid || 0)}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onOpenHistoryModal && onOpenHistoryModal(pt.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-xs transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    To‘liq Otchyot (Narxlarni tahrirlash)
                  </button>

                  <div className="flex items-center gap-1.5">
                    {isSupplier ? (
                      <button
                        type="button"
                        onClick={() => onOpenPaymentModal("EXPENSE", pt.id)}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-full border border-rose-200 dark:border-rose-800/60 transition-all cursor-pointer"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" /> Pul berish
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenPaymentModal("INCOME", pt.id)}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-800/60 transition-all cursor-pointer"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" /> Pul olish
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPartners.length === 0 && (
            <div className="col-span-full bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/70 dark:border-slate-700 p-8 text-center text-xs text-slate-400 dark:text-slate-500">
              Hamkorlar topilmadi
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: DEBT OFFSETS (QARZ SURISH) JOURNAL */}
      {activeSubTab === "OFFSETS" && (
        <>
          {/* MOBILE LIST VIEW */}
          <div className="space-y-3 block md:hidden">
            {filteredOffsets.map((o) => (
              <div
                key={o.id}
                className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/70 dark:border-slate-700 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      {o.fromPartnerName}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      ➔ {o.toPartnerName}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-black font-mono text-blue-600 dark:text-blue-400 block">
                      {formatUSD(o.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{o.date}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                  {o.notes || "O'zaro hisob-kitob"}
                </div>
              </div>
            ))}

            {filteredOffsets.length === 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/70 dark:border-slate-700 p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                Hozircha o‘zaro qarz surishlar amalga oshirilmagan
              </div>
            )}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/70 dark:border-slate-700 overflow-hidden shadow-xs p-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Sana</th>
                    <th className="py-3 px-4">Kimning hisobidan (Haqdor tomon)</th>
                    <th className="py-3 px-4">Kimning qarziga (Qarzi yopilgan)</th>
                    <th className="py-3 px-4 text-right">Surilgan Summa ($)</th>
                    <th className="py-3 px-4">Izoh / Asosiy sabab</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                  {filteredOffsets.map((o) => (
                    <tr
                      key={o.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        {o.date}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                          {o.fromPartnerName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                          {o.toPartnerName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                        {formatUSD(o.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-sm truncate">
                        {o.notes || "O'zaro hisob-kitob"}
                      </td>
                    </tr>
                  ))}

                  {filteredOffsets.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 text-center text-xs text-slate-400 dark:text-slate-500"
                      >
                        Hozircha o‘zaro qarz surishlar amalga oshirilmagan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

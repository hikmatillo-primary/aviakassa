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
import { formatUSD, formatDate } from "@/lib/format";

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
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<"ALL" | "SUPPLIER" | "CLIENT">("ALL");
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
    if (partnerTypeFilter !== "ALL" && pt.type !== partnerTypeFilter) {
      return false;
    }
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

  const filteredCashIncome = filteredPayments
    .filter((p) => p.type === "INCOME")
    .reduce((acc, p) => acc + (p.amount || 0), 0);
  const filteredCashExpense = filteredPayments
    .filter((p) => p.type === "EXPENSE")
    .reduce((acc, p) => acc + (p.amount || 0), 0);
  const filteredCashNet = filteredCashIncome - filteredCashExpense;
  const filteredOffsetsAmount = filteredOffsets.reduce((acc, o) => acc + (o.amount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Kassa
          </h1>
        </div>
        <div className="grid grid-cols-3 sm:flex items-center gap-2">
          {onOpenDebtOffsetModal && (
            <button
              onClick={() => onOpenDebtOffsetModal()}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2.5 bg-white dark:bg-[#111726] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 text-[11px] sm:text-xs font-semibold rounded-xl shadow-xs border border-slate-200/80 dark:border-white/[0.08] transition-all cursor-pointer truncate"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">Qarz surish</span>
            </button>
          )}

          <button
            onClick={() => onOpenPaymentModal("EXPENSE")}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] sm:text-xs font-semibold rounded-xl shadow-sm shadow-rose-500/20 transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            <span>Chiqim</span>
          </button>

          <button
            onClick={() => onOpenPaymentModal("INCOME")}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-semibold rounded-xl shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
            <span>Kirim</span>
          </button>
        </div>
      </div>

      {/* Mobile Compact Indicators (Minimal 2x2 grid) */}
      <div className="grid grid-cols-2 gap-2.5 sm:hidden tabular-nums">
        {/* Kirim */}
        <div className="bg-white dark:bg-[#111726] p-3.5 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Kirim</span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            +{formatUSD(totalIncome)}
          </div>
        </div>

        {/* Chiqim */}
        <div className="bg-white dark:bg-[#111726] p-3.5 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Chiqim</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-1">
            -{formatUSD(totalExpense)}
          </div>
        </div>

        {/* Kassa naqd qoldig'i */}
        <div className="bg-white dark:bg-[#111726] p-3.5 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Naqd qoldiq</span>
            <Wallet className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div
            className={`text-base font-bold mt-1 ${
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
        <div className="bg-white dark:bg-[#111726] p-3.5 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Surilgan qarz</span>
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {formatUSD(totalOffsetsAmount)}
          </div>
        </div>
      </div>

      {/* Desktop Summary Cards (hidden on mobile, shown on sm+) */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
        {/* Kirim */}
        <div className="bg-white dark:bg-[#111726] p-5 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Jami kirim (Mijozlar)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">
            +{formatUSD(totalIncome)}
          </div>
        </div>

        {/* Chiqim */}
        <div className="bg-white dark:bg-[#111726] p-5 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Jami chiqim (Ta&apos;minotchilar)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1.5">
            -{formatUSD(totalExpense)}
          </div>
        </div>

        {/* Kassa qoldig'i */}
        <div className="bg-white dark:bg-[#111726] p-5 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Kassa naqd qoldig&apos;i</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold mt-1.5 ${
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
        <div className="bg-white dark:bg-[#111726] p-5 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>O‘zaro surilgan qarzlar</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1.5">
            {formatUSD(totalOffsetsAmount)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Naqd pulsiz o‘zaro hisob
          </span>
        </div>
      </div>

      {/* Sub Tabs Switch */}
      <div className="grid grid-cols-3 sm:inline-flex items-center gap-1 bg-slate-200/60 dark:bg-[#111726] p-1 rounded-xl border border-transparent dark:border-white/[0.07] w-full sm:w-auto">
        <button
          onClick={() => {
            setActiveSubTab("CASH");
            setSearch("");
          }}
          className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
            activeSubTab === "CASH"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Receipt className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden">Kassa ({payments.length})</span>
          <span className="hidden sm:inline">Kassa harakatlari ({payments.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab("PARTNERS");
            setSearch("");
          }}
          className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
            activeSubTab === "PARTNERS"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden">Otchyot ({partners.length})</span>
          <span className="hidden sm:inline">Hamkorlar otchyoti ({partners.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab("OFFSETS");
            setSearch("");
          }}
          className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
            activeSubTab === "OFFSETS"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden">Qarz surish ({debtOffsets.length})</span>
          <span className="hidden sm:inline">O‘zaro qarz surish ({debtOffsets.length})</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-[#111726] p-3 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs">
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
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:bg-white dark:focus:bg-white/[0.07] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
          />
        </div>

        {/* Filter Tabs for Cash */}
        {activeSubTab === "CASH" && (
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-white/[0.05] p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setFilter("ALL")}
              className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filter === "ALL"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Barchasi ({payments.length})
            </button>
            <button
              onClick={() => setFilter("INCOME")}
              className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filter === "INCOME"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Kirim ({payments.filter((p) => p.type === "INCOME").length})
            </button>
            <button
              onClick={() => setFilter("EXPENSE")}
              className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filter === "EXPENSE"
                  ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Chiqim ({payments.filter((p) => p.type === "EXPENSE").length})
            </button>
          </div>
        )}

        {/* Filter Tabs for Partners */}
        {activeSubTab === "PARTNERS" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            <button
              onClick={() => setPartnerTypeFilter("ALL")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
                partnerTypeFilter === "ALL"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100/80 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Barchasi ({partners.length})
            </button>
            <button
              onClick={() => setPartnerTypeFilter("SUPPLIER")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
                partnerTypeFilter === "SUPPLIER"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100/80 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Ta‘minotchilar ({partners.filter((p) => p.type === "SUPPLIER").length})
            </button>
            <button
              onClick={() => setPartnerTypeFilter("CLIENT")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
                partnerTypeFilter === "CLIENT"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100/80 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Mijozlar ({partners.filter((p) => p.type === "CLIENT").length})
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
                className="bg-white dark:bg-[#111726] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <button
                      type="button"
                      onClick={() => onOpenHistoryModal && onOpenHistoryModal(p.partnerId)}
                      className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline text-base text-left cursor-pointer"
                    >
                      {p.partnerName}
                    </button>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(p.paymentDate)}
                    </div>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <span
                      className={`text-base font-bold block ${
                        p.type === "INCOME"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {p.type === "INCOME" ? `+${formatUSD(p.amount)}` : `-${formatUSD(p.amount)}`}
                    </span>
                    {p.type === "INCOME" ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <ArrowDownLeft className="w-3 h-3" /> Kirim
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                        <ArrowUpRight className="w-3 h-3" /> Chiqim
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100 dark:border-white/[0.06]">
                  <span className="bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-lg text-[11px] font-medium">
                    {p.paymentMethod === "CASH"
                      ? "Naqd pul"
                      : p.paymentMethod === "CARD"
                      ? "Karta / O'tkazma"
                      : "Bank hisobi"}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs truncate max-w-[180px]">
                    {p.notes || "-"}
                  </span>
                </div>
              </div>
            ))}

            {filteredPayments.length === 0 && (
              <div className="bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/70 dark:border-white/[0.07] p-8 text-center space-y-2">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  To‘lovlar topilmadi
                </p>
                {(search || filter !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setFilter("ALL");
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Filterni tozalash
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
                    <th className="py-3 px-4">Sana</th>
                    <th className="py-3 px-4">Turi</th>
                    <th className="py-3 px-4">Hamkor</th>
                    <th className="py-3 px-4 text-right">Summa</th>
                    <th className="py-3 px-4">To‘lov usuli</th>
                    <th className="py-3 px-4">Izoh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs text-slate-700 dark:text-slate-300">
                  {filteredPayments.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.type === "INCOME" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                            <ArrowDownLeft className="w-3 h-3" /> Kirim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400">
                            <ArrowUpRight className="w-3 h-3" /> Chiqim
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        <button
                          type="button"
                          onClick={() => onOpenHistoryModal && onOpenHistoryModal(p.partnerId)}
                          className="text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline font-semibold cursor-pointer text-left"
                        >
                          {p.partnerName}
                        </button>
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right tabular-nums font-bold text-sm ${
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
                        <span className="bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-lg text-[11px] font-medium">
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
                        className="py-12 text-center space-y-2"
                      >
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          To‘lovlar topilmadi
                        </p>
                        {(search || filter !== "ALL") && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearch("");
                              setFilter("ALL");
                            }}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            Filterni tozalash
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredPayments.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-slate-100 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      <td colSpan={3} className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        Jami ({filteredPayments.length} ta to‘lov):
                        <span className="ml-2 font-normal text-[11px]">
                          (Kirim: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{formatUSD(filteredCashIncome)}</span> | Chiqim: <span className="text-rose-600 dark:text-rose-400 font-semibold">-{formatUSD(filteredCashExpense)}</span>)
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right text-sm font-bold ${
                          filteredCashNet >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {filteredCashNet >= 0
                          ? `+${formatUSD(filteredCashNet)}`
                          : `-${formatUSD(Math.abs(filteredCashNet))}`}
                      </td>
                      <td colSpan={2} className="py-3 px-4 text-slate-400 font-normal text-[11px]">
                        Sof kassa harakati
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      {/* SUB-TAB 2: PARTNERS SETTLEMENT & OTCHYOT */}
      {activeSubTab === "PARTNERS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredPartners.map((pt) => {
            const debt = pt.balance || 0;
            return (
              <div
                key={pt.id}
                className="bg-white dark:bg-[#111726] p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          pt.type === "SUPPLIER"
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {pt.type === "SUPPLIER" ? "Ta‘minotchi" : "Mijoz"}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg mt-1">
                      {pt.name}
                    </h3>
                    {pt.phone && (
                      <p className="text-xs text-slate-400 tabular-nums mt-0.5">{pt.phone}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0 tabular-nums">
                    <span className="text-[11px] text-slate-400 font-medium block">
                      {debt > 0
                        ? "Mijozning qarzi"
                        : debt < 0
                        ? "Bizning qarzimiz"
                        : "Hisob-kitob teng"}
                    </span>
                    <span
                      className={`text-lg sm:text-xl font-bold block mt-0.5 ${
                        debt > 0
                          ? "text-amber-600 dark:text-amber-400"
                          : debt < 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {debt > 0
                        ? formatUSD(debt)
                        : debt < 0
                        ? formatUSD(Math.abs(debt))
                        : "Qarz yo‘q ($0)"}
                    </span>
                  </div>
                </div>

                {/* Financial breakdown row */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] text-xs tabular-nums">
                  {(pt.totalBoughtFromUs > 0 || pt.totalPaidToUs > 0) && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">
                        Bizdan xarid (Chiptalar):
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {formatUSD(pt.totalBoughtFromUs || 0)}{" "}
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                          (To‘lagan: {formatUSD(pt.totalPaidToUs || 0)})
                        </span>
                      </span>
                    </div>
                  )}
                  {(pt.totalSoldToUs > 0 || pt.totalPaidByUs > 0) && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">
                        Bizga sotgan (Partiyalar):
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {formatUSD(pt.totalSoldToUs || 0)}{" "}
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-normal">
                          (To‘laganmiz: {formatUSD(pt.totalPaidByUs || 0)})
                        </span>
                      </span>
                    </div>
                  )}
                  {!pt.totalBoughtFromUs && !pt.totalSoldToUs && (
                    <div className="text-[11px] text-slate-400 text-center py-0.5">
                      Bitimlar mavjud emas
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onOpenHistoryModal && onOpenHistoryModal(pt.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                    Otchyot
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenPaymentModal("INCOME", pt.id)}
                      className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                      title="Mijozdan to‘lov qabul qilish"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" /> + Pul olish
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenPaymentModal("EXPENSE", pt.id)}
                      className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                      title="Hamkorga to‘lov qilish"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> - Pul berish
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPartners.length === 0 && (
            <div className="col-span-full bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/70 dark:border-white/[0.07] p-8 text-center space-y-2">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Hamkorlar topilmadi
              </p>
              {(search || partnerTypeFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPartnerTypeFilter("ALL");
                  }}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Filterni tozalash
                </button>
              )}
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
                className="bg-white dark:bg-[#111726] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      {o.fromPartnerName}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      ➔ {o.toPartnerName}
                    </div>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400 block">
                      {formatUSD(o.amount)}
                    </span>
                    <span className="text-[11px] text-slate-400 block">{formatDate(o.date)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400">
                  {o.notes || "O'zaro hisob-kitob"}
                </div>
              </div>
            ))}

            {filteredOffsets.length === 0 && (
              <div className="bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/70 dark:border-white/[0.07] p-8 text-center space-y-2">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Hozircha o‘zaro qarz surishlar amalga oshirilmagan
                </p>
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Filterni tozalash
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
                    <th className="py-3 px-4">Sana</th>
                    <th className="py-3 px-4">Kimning hisobidan (Haqdor tomon)</th>
                    <th className="py-3 px-4">Kimning qarziga (Qarzi yopilgan)</th>
                    <th className="py-3 px-4 text-right">Surilgan summa</th>
                    <th className="py-3 px-4">Izoh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs text-slate-700 dark:text-slate-300">
                  {filteredOffsets.map((o) => (
                    <tr
                      key={o.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        {formatDate(o.date)}
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
                      <td className="py-3.5 px-4 text-right tabular-nums font-bold text-sm text-blue-600 dark:text-blue-400">
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
                        className="py-12 text-center space-y-2"
                      >
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Hozircha o‘zaro qarz surishlar amalga oshirilmagan
                        </p>
                        {search && (
                          <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            Filterni tozalash
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredOffsets.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-slate-100 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      <td colSpan={3} className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        Jami surilgan qarzlar ({filteredOffsets.length} ta operatsiya):
                      </td>
                      <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400 font-bold text-sm">
                        {formatUSD(filteredOffsetsAmount)}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-normal text-[11px]">
                        Naqd pulsiz
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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
  Trash2,
  Landmark,
  Plus,
  Loader2,
} from "lucide-react";
import { formatUSD, formatDate, paymentMethodLabel, isDateInRange } from "@/lib/format";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { CashAccount } from "@/lib/storage";
import { getValidationMessage } from "@/lib/api";

interface PaymentsViewProps {
  payments: any[];
  debtOffsets?: any[];
  partners?: any[];
  accounts?: CashAccount[];
  onOpenPaymentModal: (type?: "INCOME" | "EXPENSE", partnerId?: number) => void;
  onOpenDebtOffsetModal?: (fromPartnerId?: number, toPartnerId?: number) => void;
  onOpenHistoryModal?: (partnerId: number) => void;
  onDeletePayment?: (payment: any) => void;
  onDeleteDebtOffset?: (offset: any) => void;
  onAddAccount?: (name: string) => Promise<void>;
  onDeleteAccount?: (account: CashAccount) => void;
}

export function PaymentsView({
  payments,
  debtOffsets = [],
  partners = [],
  accounts = [],
  onOpenPaymentModal,
  onOpenDebtOffsetModal,
  onOpenHistoryModal,
  onDeletePayment,
  onDeleteDebtOffset,
  onAddAccount,
  onDeleteAccount,
}: PaymentsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"CASH" | "PARTNERS" | "OFFSETS" | "ACCOUNTS">("CASH");
  const [filter, setFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [partnerBalanceFilter, setPartnerBalanceFilter] = useState<"ALL" | "DEBT_US" | "DEBT_THEM">("ALL");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const handleCreateAccount = async () => {
    const name = newAccountName.trim();
    if (!name || !onAddAccount) return;
    setIsCreatingAccount(true);
    setAccountError(null);
    try {
      await onAddAccount(name);
      setNewAccountName("");
    } catch (err) {
      setAccountError(getValidationMessage(err));
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const paymentsForAccount = (accountId: number | null) =>
    payments.filter((p) =>
      accountId === null ? p.accountId == null : p.accountId === accountId
    );

  const accountNet = (list: any[]) =>
    list.reduce(
      (acc, p) => acc + (p.type === "INCOME" ? p.amount || 0 : -(p.amount || 0)),
      0
    );

  const unassignedPayments = paymentsForAccount(null);

  const filteredAccounts = accounts.filter((a) =>
    !search.trim() ? true : a.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPayments = payments.filter((p) => {
    if (!isDateInRange(p.paymentDate, dateFrom, dateTo)) return false;
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

  const clearCashFilters = () => {
    setSearch("");
    setFilter("ALL");
    setDateFrom("");
    setDateTo("");
  };

  const filteredPartners = partners.filter((pt) => {
    if (partnerBalanceFilter === "DEBT_US" && (pt.balance || 0) >= 0) return false;
    if (partnerBalanceFilter === "DEBT_THEM" && (pt.balance || 0) <= 0) return false;
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
            <span>Jami kirim</span>
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
            <span>Jami chiqim</span>
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
      <div className="grid grid-cols-4 sm:inline-flex items-center gap-1 bg-slate-200/60 dark:bg-[#111726] p-1 rounded-xl border border-transparent dark:border-white/[0.07] w-full sm:w-auto">
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

        <button
          onClick={() => {
            setActiveSubTab("ACCOUNTS");
            setSearch("");
            setAccountError(null);
          }}
          className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
            activeSubTab === "ACCOUNTS"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Landmark className="w-3.5 h-3.5 shrink-0" />
          <span>Hisoblar ({accounts.length})</span>
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
                ? "Hamkor nomi bo‘yicha qidirish..."
                : activeSubTab === "OFFSETS"
                ? "Qarz beruvchi, oluvchi yoki izoh..."
                : "Hisob nomi bo‘yicha qidirish..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:bg-white dark:focus:bg-white/[0.07] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
          />
        </div>

        {/* Date Range for Cash */}
        {activeSubTab === "CASH" && (
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
        )}

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
              onClick={() => setPartnerBalanceFilter("ALL")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
                partnerBalanceFilter === "ALL"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100/80 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Barchasi ({partners.length})
            </button>
            <button
              onClick={() => setPartnerBalanceFilter("DEBT_US")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
                partnerBalanceFilter === "DEBT_US"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-slate-100/80 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Qarzdorlar (–) ({partners.filter((p) => (p.balance || 0) < 0).length})
            </button>
            <button
              onClick={() => setPartnerBalanceFilter("DEBT_THEM")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
                partnerBalanceFilter === "DEBT_THEM"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100/80 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Haqdorlar (+) ({partners.filter((p) => (p.balance || 0) > 0).length})
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

                <div className="flex items-center justify-between gap-2 text-xs pt-2.5 border-t border-slate-100 dark:border-white/[0.06]">
                  <span className="bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-lg text-[11px] font-medium">
                    {p.accountName || paymentMethodLabel(p.paymentMethod)}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-slate-500 dark:text-slate-400 text-xs truncate max-w-[180px]">
                      {p.notes || "-"}
                    </span>
                    {onDeletePayment && (
                      <button
                        type="button"
                        onClick={() => onDeletePayment(p)}
                        aria-label="To‘lovni o‘chirish"
                        className="inline-flex items-center justify-center p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors cursor-pointer border border-rose-200/80 dark:border-rose-500/20 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredPayments.length === 0 && (
              <div className="bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/70 dark:border-white/[0.07] p-8 text-center space-y-2">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  To‘lovlar topilmadi
                </p>
                {(search || filter !== "ALL" || dateFrom || dateTo) && (
                  <button
                    type="button"
                    onClick={clearCashFilters}
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
                    <th className="py-3 px-4">Hisob / Usul</th>
                    <th className="py-3 px-4">Izoh</th>
                    <th className="py-3 px-4 text-right">Amal</th>
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
                          {p.accountName || paymentMethodLabel(p.paymentMethod)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 dark:text-slate-500 max-w-xs truncate">
                        {p.notes || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {onDeletePayment && (
                          <button
                            type="button"
                            onClick={() => onDeletePayment(p)}
                            aria-label="To‘lovni o‘chirish"
                            className="inline-flex items-center justify-center p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors cursor-pointer border border-rose-200/80 dark:border-rose-500/20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredPayments.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center space-y-2"
                      >
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          To‘lovlar topilmadi
                        </p>
                        {(search || filter !== "ALL" || dateFrom || dateTo) && (
                          <button
                            type="button"
                            onClick={clearCashFilters}
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
                      <td colSpan={3} className="py-3 px-4 text-slate-400 font-normal text-[11px]">
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
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        Hamkor
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
                      Balans
                    </span>
                    <span
                      className={`text-lg sm:text-xl font-bold block mt-0.5 ${
                        debt < 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : debt > 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {debt < 0
                        ? formatUSD(Math.abs(debt))
                        : debt > 0
                        ? formatUSD(debt)
                        : "$0"}
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
              {(search || partnerBalanceFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPartnerBalanceFilter("ALL");
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

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400">
                  <span className="truncate">{o.notes || "O'zaro hisob-kitob"}</span>
                  {onDeleteDebtOffset && (
                    <button
                      type="button"
                      onClick={() => onDeleteDebtOffset(o)}
                      aria-label="Qarz surishni o‘chirish"
                      className="inline-flex items-center justify-center p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors cursor-pointer border border-rose-200/80 dark:border-rose-500/20 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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
                    <th className="py-3 px-4 text-right">Amal</th>
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
                      <td className="py-3.5 px-4 text-right">
                        {onDeleteDebtOffset && (
                          <button
                            type="button"
                            onClick={() => onDeleteDebtOffset(o)}
                            aria-label="Qarz surishni o‘chirish"
                            className="inline-flex items-center justify-center p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors cursor-pointer border border-rose-200/80 dark:border-rose-500/20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredOffsets.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
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
                      <td colSpan={4} className="py-3 px-4 text-slate-500 dark:text-slate-400">
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

      {/* SUB-TAB 4: CASH ACCOUNTS (HISOBLAR) */}
      {activeSubTab === "ACCOUNTS" && (
        <div className="space-y-4">
          {/* Add account */}
          {onAddAccount && (
            <div className="bg-white dark:bg-[#111726] p-3 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateAccount();
                  }
                }}
                placeholder="Yangi hisob nomi (masalan: Naqd, Kapitalbank, Click)..."
                className="w-full flex-1 px-3.5 py-2.5 text-xs bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:bg-white dark:focus:bg-white/[0.07] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              />
              <button
                type="button"
                onClick={handleCreateAccount}
                disabled={isCreatingAccount || !newAccountName.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {isCreatingAccount ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Hisob qo‘shish
              </button>
            </div>
          )}

          {accountError && (
            <div className="p-3 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
              {accountError}
            </div>
          )}

          {/* Account cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredAccounts.map((acc) => {
              const accPayments = paymentsForAccount(acc.id);
              const net = accountNet(accPayments);
              return (
                <div
                  key={acc.id}
                  className="bg-white dark:bg-[#111726] p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                          {acc.name}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {accPayments.length} ta to‘lov
                        </p>
                      </div>
                    </div>
                    {onDeleteAccount && (
                      <button
                        type="button"
                        onClick={() => onDeleteAccount(acc)}
                        aria-label="Hisobni o‘chirish"
                        className="inline-flex items-center justify-center p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors cursor-pointer border border-rose-200/80 dark:border-rose-500/20 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] text-xs tabular-nums">
                    <span className="text-slate-400 text-[11px]">Qoldiq:</span>
                    <span
                      className={`text-lg font-bold ${
                        net >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {net >= 0
                        ? `+${formatUSD(net)}`
                        : `-${formatUSD(Math.abs(net))}`}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Unassigned payments bucket */}
            {unassignedPayments.length > 0 && (
              <div className="bg-white dark:bg-[#111726] p-4 sm:p-5 rounded-2xl border border-dashed border-slate-300/80 dark:border-white/[0.12] shadow-xs flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                        Hisobsiz to‘lovlar
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {unassignedPayments.length} ta to‘lov
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] text-xs tabular-nums">
                  <span className="text-slate-400 text-[11px]">Qoldiq:</span>
                  <span
                    className={`text-lg font-bold ${
                      accountNet(unassignedPayments) >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {accountNet(unassignedPayments) >= 0
                      ? `+${formatUSD(accountNet(unassignedPayments))}`
                      : `-${formatUSD(Math.abs(accountNet(unassignedPayments)))}`}
                  </span>
                </div>
              </div>
            )}

            {filteredAccounts.length === 0 && unassignedPayments.length === 0 && (
              <div className="col-span-full bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/70 dark:border-white/[0.07] p-8 text-center space-y-2">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Hisoblar topilmadi
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
        </div>
      )}
    </div>
  );
}

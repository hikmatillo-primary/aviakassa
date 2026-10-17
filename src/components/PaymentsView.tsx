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
  Trash2,
  Pencil,
  Landmark,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { formatUSD, formatDate, paymentMethodLabel, isDateInRange } from "@/lib/format";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { RowActionsMenu, RowActionItem } from "@/components/RowActionsMenu";
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
  onRenameAccount?: (account: CashAccount, newName: string) => Promise<void>;
  onDeleteAccount?: (account: CashAccount) => void;
}

export function PaymentsView({
  payments,
  debtOffsets = [],
  accounts = [],
  onOpenPaymentModal,
  onOpenDebtOffsetModal,
  onOpenHistoryModal,
  onDeletePayment,
  onDeleteDebtOffset,
  onAddAccount,
  onRenameAccount,
  onDeleteAccount,
}: PaymentsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"CASH" | "ACCOUNTS">("CASH");
  const [filter, setFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<CashAccount | null>(null);
  const [renameName, setRenameName] = useState("");
  const [isRenamingAccount, setIsRenamingAccount] = useState(false);

  const handleCreateAccount = async () => {
    const name = newAccountName.trim();
    if (!name || !onAddAccount) return;
    setIsCreatingAccount(true);
    setAccountError(null);
    try {
      await onAddAccount(name);
      setNewAccountName("");
      setIsAddAccountOpen(false);
    } catch (err) {
      setAccountError(getValidationMessage(err));
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleRenameAccount = async () => {
    const name = renameName.trim();
    if (!name || !renameTarget || !onRenameAccount) return;
    setIsRenamingAccount(true);
    setAccountError(null);
    try {
      await onRenameAccount(renameTarget, name);
      setRenameTarget(null);
      setRenameName("");
    } catch (err) {
      setAccountError(getValidationMessage(err));
    } finally {
      setIsRenamingAccount(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="grid grid-cols-2 sm:inline-flex items-center gap-1 bg-slate-200/60 dark:bg-[#111726] p-1 rounded-xl border border-transparent dark:border-white/[0.07] w-full sm:w-auto">
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

        {activeSubTab === "ACCOUNTS" && onAddAccount && (
          <button
            type="button"
            onClick={() => {
              setNewAccountName("");
              setAccountError(null);
              setIsAddAccountOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer w-full sm:w-auto shrink-0"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            Hisob qo‘shish
          </button>
        )}
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

      {/* SUB-TAB 2: CASH ACCOUNTS (HISOBLAR) */}
      {activeSubTab === "ACCOUNTS" && (
        <div className="bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {filteredAccounts.map((acc) => {
              const accPayments = paymentsForAccount(acc.id);
              const net = accountNet(accPayments);
              const actions: RowActionItem[] = [];
              if (onRenameAccount) {
                actions.push({
                  label: "Nomini tahrirlash",
                  icon: <Pencil className="w-3.5 h-3.5" />,
                  onClick: () => {
                    setAccountError(null);
                    setRenameName(acc.name);
                    setRenameTarget(acc);
                  },
                });
              }
              if (onDeleteAccount) {
                actions.push({
                  label: "O‘chirish",
                  icon: <Trash2 className="w-3.5 h-3.5" />,
                  onClick: () => onDeleteAccount(acc),
                  variant: "danger",
                });
              }
              return (
                <div
                  key={acc.id}
                  className="flex items-center justify-between gap-3 p-3.5 sm:p-4 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Landmark className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                        {acc.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {accPayments.length} ta to‘lov
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="text-right tabular-nums">
                      <span className="text-[11px] text-slate-400 block">Qoldiq</span>
                      <span
                        className={`text-sm sm:text-base font-bold ${
                          net >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {net >= 0 ? `+${formatUSD(net)}` : `-${formatUSD(Math.abs(net))}`}
                      </span>
                    </div>
                    <RowActionsMenu actions={actions} ariaLabel="Hisob amallari" />
                  </div>
                </div>
              );
            })}

            {/* Unassigned payments bucket */}
            {unassignedPayments.length > 0 && (
              <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-500/10 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                      Hisobsiz to‘lovlar
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {unassignedPayments.length} ta to‘lov
                    </p>
                  </div>
                </div>
                <div className="text-right tabular-nums shrink-0">
                  <span className="text-[11px] text-slate-400 block">Qoldiq</span>
                  <span
                    className={`text-sm sm:text-base font-bold ${
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
              <div className="p-8 text-center space-y-2">
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

      {/* ADD ACCOUNT MODAL */}
      {isAddAccountOpen && onAddAccount && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => {
            if (!isCreatingAccount) setIsAddAccountOpen(false);
          }}
        >
          <div
            className="bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-2xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Yangi hisob qo‘shish
              </h3>
              <button
                type="button"
                onClick={() => setIsAddAccountOpen(false)}
                aria-label="Yopish"
                className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateAccount();
                }
              }}
              placeholder="Hisob nomi (masalan: Naqd, Kapitalbank, Click)..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:bg-white dark:focus:bg-white/[0.07] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            />

            {accountError && (
              <div className="p-3 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                {accountError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddAccountOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleCreateAccount}
                disabled={isCreatingAccount || !newAccountName.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingAccount ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Qo‘shish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENAME ACCOUNT MODAL */}
      {renameTarget && onRenameAccount && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => {
            if (!isRenamingAccount) setRenameTarget(null);
          }}
        >
          <div
            className="bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-2xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Hisob nomini tahrirlash
              </h3>
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                aria-label="Yopish"
                className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleRenameAccount();
                }
              }}
              placeholder="Hisob nomi..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:bg-white dark:focus:bg-white/[0.07] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            />

            {accountError && (
              <div className="p-3 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                {accountError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleRenameAccount}
                disabled={
                  isRenamingAccount ||
                  !renameName.trim() ||
                  renameName.trim() === renameTarget.name
                }
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRenamingAccount ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Pencil className="w-3.5 h-3.5" />
                )}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

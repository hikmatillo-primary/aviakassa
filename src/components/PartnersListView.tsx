"use client";

import React, { useMemo, useState } from "react";
import {
  Users,
  Search,
  UserPlus,
  Phone,
  TrendingDown,
  TrendingUp,
  Pencil,
  Trash2,
} from "lucide-react";
import { formatUSD } from "@/lib/format";
import { RowActionsMenu } from "@/components/RowActionsMenu";

interface PartnersListViewProps {
  partners: any[];
  batches?: any[];
  sales?: any[];
  payments?: any[];
  initialFilter?: "ALL" | "DEBT_US" | "DEBT_THEM";
  onSelectPartner: (partnerId: number) => void;
  onOpenPartnerModal: (type?: "CLIENT" | "SUPPLIER") => void;
  onOpenPaymentModal: (type: "INCOME" | "EXPENSE", partnerId: number) => void;
  onEditPartner?: (partner: any) => void;
  onDeletePartner?: (partner: any) => void;
}

export function PartnersListView({
  partners,
  batches = [],
  initialFilter = "ALL",
  onSelectPartner,
  onOpenPartnerModal,
  onOpenPaymentModal,
  onEditPartner,
  onDeletePartner,
}: PartnersListViewProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "CLIENT" | "SUPPLIER" | "DEBT_US" | "DEBT_THEM">(initialFilter);

  const { pendingDebtMap, totalPendingDebt } = useMemo(() => {
    const map = new Map<number, number>();
    let total = 0;
    batches.forEach((b) => {
      if (b.accountedAt === null && b.supplierId) {
        const cost = b.totalCost || 0;
        map.set(b.supplierId, (map.get(b.supplierId) || 0) + cost);
        total += cost;
      }
    });
    return { pendingDebtMap: map, totalPendingDebt: total };
  }, [batches]);

  // Filtrlash va yig'indilar — faqat ma'lumot/filtr o'zgarganda.
  const {
    filteredPartners,
    totalDebtorsCount,
    totalCreditorsCount,
    totalClientsDebt,
    totalSuppliersCredit,
    filteredTotalBought,
    filteredTotalSold,
    filteredNetBalance,
  } = useMemo(() => {
    const rows = partners.filter((p) => {
      // Type filter
      if (filterType === "CLIENT" && p.type === "SUPPLIER") return false;
      if (filterType === "SUPPLIER" && p.type === "CLIENT") return false;
      if (filterType === "DEBT_US" && (p.balance || 0) >= 0) return false;
      if (filterType === "DEBT_THEM" && (p.balance || 0) <= 0) return false;

      // Search filter
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchPhone = p.phone?.toLowerCase().includes(q);
      const matchNotes = p.notes?.toLowerCase().includes(q);
      const matchTags = p.tags?.some((t: string) => t.toLowerCase().includes(q));
      return matchName || matchPhone || matchNotes || matchTags;
    });

    const debtors = partners.filter((p) => (p.balance || 0) < 0);
    const creditors = partners.filter((p) => (p.balance || 0) > 0);

    return {
      filteredPartners: rows,
      totalDebtorsCount: debtors.length,
      totalCreditorsCount: creditors.length,
      totalClientsDebt: debtors.reduce((sum, p) => sum + Math.abs(p.balance || 0), 0),
      totalSuppliersCredit: creditors.reduce((sum, p) => sum + (p.balance || 0), 0),
      filteredTotalBought: rows.reduce((sum, p) => sum + (p.totalBoughtFromUs || 0), 0),
      filteredTotalSold: rows.reduce((sum, p) => sum + (p.totalSoldToUs || 0), 0),
      filteredNetBalance: rows.reduce((sum, p) => sum + (p.balance || 0), 0),
    };
  }, [partners, search, filterType]);

  const clearAllFilters = () => {
    setSearch("");
    setFilterType("ALL");
  };

  const balanceText = (balance: number) =>
    balance < 0
      ? formatUSD(Math.abs(balance))
      : balance > 0
      ? formatUSD(balance)
      : "$0";

  const balanceColor = (balance: number) =>
    balance < 0
      ? "text-emerald-600 dark:text-emerald-400"
      : balance > 0
      ? "text-rose-600 dark:text-rose-400"
      : "text-slate-600 dark:text-slate-400";

  const renderActions = (pt: any) => (
    <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => onOpenPaymentModal("INCOME", pt.id)}
        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer"
      >
        Kirim
      </button>
      <button
        type="button"
        onClick={() => onOpenPaymentModal("EXPENSE", pt.id)}
        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
      >
        Chiqim
      </button>
      {onEditPartner || onDeletePartner ? (
        <RowActionsMenu
          actions={[
            ...(onEditPartner
              ? [
                  {
                    label: "Tahrirlash",
                    icon: <Pencil className="w-3.5 h-3.5" />,
                    onClick: () => onEditPartner(pt),
                  },
                ]
              : []),
            ...(onDeletePartner
              ? [
                  {
                    label: "O‘chirish",
                    icon: <Trash2 className="w-3.5 h-3.5" />,
                    onClick: () => onDeletePartner(pt),
                    variant: "danger" as const,
                  },
                ]
              : []),
          ]}
        />
      ) : null}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* 1. TOP HEADER & NEW PARTNER BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hamkorlar
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Mijozlar, sub-agentlar va birinchi qo‘l ta’minotchilarning to‘liq hisob-kitobi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenPartnerModal("CLIENT")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            + Yangi hamkor
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRICS BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 tabular-nums">
        {/* Hamkorlar qarzi (Bizga to'lashi kerak) */}
        <div className="bg-white dark:bg-[#111726] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              Mijozlar qarzi (Debitorlik)
            </span>
            <strong className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {formatUSD(totalClientsDebt)}
            </strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {totalDebtorsCount} ta hamkor qarzdor
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Bizning qarzimiz (Ta'minotchi haqi) */}
        <div className="bg-white dark:bg-[#111726] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              Bizning qarzimiz (Kreditorlik)
            </span>
            <strong className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
              {formatUSD(totalSuppliersCredit)}
            </strong>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              <span className="text-[11px] text-slate-400">
                {totalCreditorsCount} ta ta’minotchi haqi
              </span>
              {totalPendingDebt > 0 && (
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  (+{formatUSD(totalPendingDebt)} kutilmoqda)
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Jami hamkorlar soni */}
        <div className="bg-white dark:bg-[#111726] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              Jami faol hamkorlar
            </span>
            <strong className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {partners.length} <span className="text-sm font-semibold text-slate-400">ta</span>
            </strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Ro‘yxatdagi barcha kontragentlar
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTER PILLS */}
      <div className="bg-white dark:bg-[#111726] p-3 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Hamkor nomi, telefoni yoki tegi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] rounded-xl focus:bg-white dark:focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-white transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterType === "ALL"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Barchasi ({partners.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType("DEBT_US")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterType === "DEBT_US"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-slate-100 dark:bg-white/[0.05] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50"
            }`}
          >
            Qarzdorlar ({totalDebtorsCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterType("DEBT_THEM")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterType === "DEBT_THEM"
                ? "bg-rose-600 text-white shadow-2xs"
                : "bg-slate-100 dark:bg-white/[0.05] text-rose-600 dark:text-rose-400 hover:bg-rose-50"
            }`}
          >
            Haqdorlar ({totalCreditorsCount})
          </button>
        </div>
      </div>

      {/* 4. MOBILE LIST VIEW */}
      <div className="space-y-3 block md:hidden">
        {filteredPartners.map((pt) => {
          const balance = pt.balance || 0;
          const pendingDebt = pendingDebtMap.get(pt.id) || 0;
          return (
            <div
              key={pt.id}
              onClick={() => onSelectPartner(pt.id)}
              className="bg-white dark:bg-[#111726] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] hover:border-blue-400/80 dark:hover:border-blue-500/50 shadow-xs space-y-2.5 cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                    {pt.name}
                  </h3>
                  {pt.phone && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 tabular-nums">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {pt.phone}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0 tabular-nums">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                    Balans
                  </span>
                  <span className={`text-base font-black block mt-0.5 ${balanceColor(balance)}`}>
                    {balanceText(balance)}
                  </span>
                  {pendingDebt > 0 && (
                    <span className="block text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      +{formatUSD(pendingDebt)} (kutilmoqda)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  <span>
                    Xarid:{" "}
                    <b className="text-slate-800 dark:text-slate-200">
                      {formatUSD(pt.totalBoughtFromUs || 0)}
                    </b>
                  </span>
                  <span>
                    Sotgan:{" "}
                    <b className="text-slate-800 dark:text-slate-200">
                      {formatUSD(pt.totalSoldToUs || 0)}
                    </b>
                  </span>
                </div>
                {renderActions(pt)}
              </div>
            </div>
          );
        })}

        {filteredPartners.length === 0 && (
          <div className="bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/70 dark:border-white/[0.07] p-8 text-center space-y-3">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-400">
              Qidiruv bo‘yicha hamkorlar topilmadi
            </p>
            {(search || filterType !== "ALL") && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Filterni tozalash
              </button>
            )}
          </div>
        )}
      </div>

      {/* 5. DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/70 dark:border-white/[0.07] overflow-hidden shadow-xs p-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.06] text-xs font-semibold text-slate-400 dark:text-slate-500">
                <th className="py-3 px-4">Hamkor</th>
                <th className="py-3 px-4 text-right">Bizdan xarid</th>
                <th className="py-3 px-4 text-right">Bizga sotgan</th>
                <th className="py-3 px-4 text-right">Balans</th>
                <th className="py-3 px-4 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs text-slate-700 dark:text-slate-300">
              {filteredPartners.map((pt) => {
                const balance = pt.balance || 0;
                const pendingDebt = pendingDebtMap.get(pt.id) || 0;
                return (
                  <tr
                    key={pt.id}
                    onClick={() => onSelectPartner(pt.id)}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {pt.name}
                      </div>
                      {pt.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 tabular-nums">
                          <Phone className="w-3 h-3" />
                          {pt.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums font-medium text-slate-600 dark:text-slate-300">
                      {formatUSD(pt.totalBoughtFromUs || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums font-medium text-slate-600 dark:text-slate-300">
                      {formatUSD(pt.totalSoldToUs || 0)}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right tabular-nums font-bold text-sm ${balanceColor(
                        balance
                      )}`}
                    >
                      <div>{balanceText(balance)}</div>
                      {pendingDebt > 0 && (
                        <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          +{formatUSD(pendingDebt)} (kutilmoqda)
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">{renderActions(pt)}</td>
                  </tr>
                );
              })}

              {filteredPartners.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center space-y-3">
                    <Users className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-400">
                      Qidiruv bo‘yicha hamkorlar topilmadi
                    </p>
                    {(search || filterType !== "ALL") && (
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Filterni tozalash
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
            {filteredPartners.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-100 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                  <td colSpan={1} className="py-3 px-4 text-slate-500 dark:text-slate-400">
                    Jami ({filteredPartners.length} ta hamkor):
                  </td>
                  <td className="py-3 px-4 text-right">{formatUSD(filteredTotalBought)}</td>
                  <td className="py-3 px-4 text-right">{formatUSD(filteredTotalSold)}</td>
                  <td
                    className={`py-3 px-4 text-right text-sm ${balanceColor(
                      filteredNetBalance
                    )}`}
                  >
                    {balanceText(filteredNetBalance)}
                  </td>
                  <td className="py-3 px-4" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Users, Search, Plus, ArrowDownLeft, ArrowUpRight, FileText, Phone, PackagePlus } from "lucide-react";

interface PartnersViewProps {
  partners: any[];
  defaultTab?: "CLIENT" | "SUPPLIER";
  onOpenPartnerModal: (type?: "CLIENT" | "SUPPLIER") => void;
  onOpenPaymentModal: (type: "INCOME" | "EXPENSE", partnerId: number) => void;
  onOpenHistoryModal: (partnerId: number) => void;
  onOpenBatchModal?: () => void;
}

export function PartnersView({
  partners,
  defaultTab = "SUPPLIER",
  onOpenPartnerModal,
  onOpenPaymentModal,
  onOpenHistoryModal,
  onOpenBatchModal,
}: PartnersViewProps) {
  const [tab, setTab] = useState<"CLIENT" | "SUPPLIER">(defaultTab);
  const [search, setSearch] = useState("");

  const filteredPartners = partners
    .filter((p) => p.type === tab)
    .filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.phone && p.phone.toLowerCase().includes(q));
    });

  const totalBalance = filteredPartners.reduce((acc, p) => acc + (p.balance > 0 ? p.balance : 0), 0);
  const totalDeals = filteredPartners.reduce((acc, p) => acc + (p.totalDeal || 0), 0);
  const totalPaid = filteredPartners.reduce((acc, p) => acc + (p.totalPaid || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {tab === "SUPPLIER" ? "Xarid & Ta'minotchilar" : "Mijozlar & Hisob-kitob"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {tab === "SUPPLIER"
              ? "Ta'minotchilar ro'yxati, blok xaridlari va bizning qarzlarimiz"
              : "Mijozlar ro'yxati, chipta xaridlari va ularning qarzdorligi"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {tab === "SUPPLIER" && onOpenBatchModal && (
            <button
              onClick={onOpenBatchModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              Yangi Xarid
            </button>
          )}
          <button
            onClick={() => onOpenPartnerModal(tab)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-full shadow-xs border border-transparent dark:border-slate-700 transition-all cursor-pointer"
          >
            <Users className="w-4 h-4" />
            {tab === "CLIENT" ? "Yangi Mijoz" : "Yangi Ta'minotchi"}
          </button>
        </div>
      </div>

      {/* Sub Tabs Switch */}
      <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-2xl w-fit">
        <button
          onClick={() => {
            setTab("SUPPLIER");
            setSearch("");
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            tab === "SUPPLIER"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          Ta&apos;minotchilar ({partners.filter((p) => p.type === "SUPPLIER").length})
        </button>
        <button
          onClick={() => {
            setTab("CLIENT");
            setSearch("");
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            tab === "CLIENT"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Mijozlar & Sub-agentlar ({partners.filter((p) => p.type === "CLIENT").length})
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {tab === "SUPPLIER" ? "Jami ta'minotchilar:" : "Jami mijozlar:"}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {filteredPartners.length} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">ta</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {tab === "SUPPLIER" ? "Bizning qarzimiz (Ta'minotchilarga):" : "Bizning haqimiz (Mijozlar qarzi):"}
          </span>
          <div
            className={`text-2xl font-black font-mono mt-1 ${
              tab === "SUPPLIER"
                ? totalBalance > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-900 dark:text-white"
                : totalBalance > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-900 dark:text-white"
            }`}
          >
            ${totalBalance.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {tab === "SUPPLIER" ? "Jami xarid qilingan partiyalar:" : "Jami xarid summasi:"}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            ${totalDeals.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder={tab === "CLIENT" ? "Mijoz nomi yoki telefon..." : "Ta'minotchi nomi yoki telefon..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
          />
        </div>
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 pr-2 hidden sm:block">
          {tab === "SUPPLIER" ? "Umumiy qarzimiz: " : "Mijozlar qarzi: "}
          <strong className="text-slate-800 dark:text-slate-200 font-mono">${totalBalance.toLocaleString()}</strong>
        </div>
      </div>

      {/* Partners List / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 overflow-hidden shadow-xs p-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Hamkor nomi</th>
                <th className="py-3 px-4">Telefon</th>
                <th className="py-3 px-4 text-right">
                  {tab === "CLIENT" ? "Jami xarid" : "Jami olingan partiya"}
                </th>
                <th className="py-3 px-4 text-right">To&apos;langan summa</th>
                <th className="py-3 px-4 text-right">Qarz / Balans</th>
                <th className="py-3 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {filteredPartners.map((partner) => {
                const isSupplier = partner.type === "SUPPLIER";
                const hasDebt = (partner.balance || 0) > 0;

                return (
                  <tr key={partner.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{partner.name}</div>
                      {partner.notes && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-xs">{partner.notes}</p>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4">
                      {partner.phone ? (
                        <span className="text-slate-600 dark:text-slate-300 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {partner.phone}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                      )}
                    </td>

                    {/* Total Deals */}
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      ${(partner.totalDeal || 0).toLocaleString()}
                    </td>

                    {/* Total Paid */}
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      ${(partner.totalPaid || 0).toLocaleString()}
                    </td>

                    {/* Balance */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          hasDebt
                            ? isSupplier
                              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60"
                              : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60"
                            : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                        }`}
                      >
                        ${Math.abs(partner.balance || 0).toLocaleString()}
                        {hasDebt ? (isSupplier ? " (Qarzmiz)" : " (Qarzdor)") : " (Hisob 0)"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Sverka Modal button */}
                        <button
                          onClick={() => onOpenHistoryModal(partner.id)}
                          title="Akt Sverka (Hisob daftari)"
                          className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> Sverka
                        </button>

                        {/* Payment button */}
                        <button
                          onClick={() =>
                            onOpenPaymentModal(isSupplier ? "EXPENSE" : "INCOME", partner.id)
                          }
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-full text-white shadow-xs transition-all cursor-pointer ${
                            isSupplier
                              ? "bg-rose-600 hover:bg-rose-700"
                              : "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                        >
                          {isSupplier ? "- To'lash" : "+ Qabul qilish"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredPartners.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                    Hamkorlar topilmadi
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

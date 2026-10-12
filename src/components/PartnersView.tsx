"use client";

import React, { useState } from "react";
import { Users, Search, Plus, ArrowDownLeft, ArrowUpRight, FileText, Phone } from "lucide-react";

interface PartnersViewProps {
  partners: any[];
  onOpenPartnerModal: (type?: "CLIENT" | "SUPPLIER") => void;
  onOpenPaymentModal: (type: "INCOME" | "EXPENSE", partnerId: number) => void;
  onOpenHistoryModal: (partnerId: number) => void;
}

export function PartnersView({
  partners,
  onOpenPartnerModal,
  onOpenPaymentModal,
  onOpenHistoryModal,
}: PartnersViewProps) {
  const [tab, setTab] = useState<"CLIENT" | "SUPPLIER">("CLIENT");
  const [search, setSearch] = useState("");

  const filteredPartners = partners
    .filter((p) => p.type === tab)
    .filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.phone && p.phone.toLowerCase().includes(q));
    });

  const totalBalance = filteredPartners.reduce((acc, p) => acc + (p.balance > 0 ? p.balance : 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hamkorlar va Balans
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Mijozlarning sizdan qarzi va sizning ta&apos;minotchilar oldidagi qarzingiz hisob-kitobi
          </p>
        </div>
        <button
          onClick={() => onOpenPartnerModal(tab)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-sm shadow-blue-500/25 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          {tab === "CLIENT" ? "+ Yangi mijoz / agent" : "+ Yangi ta'minotchi"}
        </button>
      </div>

      {/* Tab Selector & Stats (2 large rounded-3xl cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tab 1: Mijozlar */}
        <div
          onClick={() => setTab("CLIENT")}
          className={`cursor-pointer p-6 rounded-3xl border transition-all ${
            tab === "CLIENT"
              ? "bg-white border-blue-500 ring-2 ring-blue-500/10 shadow-md"
              : "bg-white/80 border-slate-200/70 hover:bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" /> Mijozlar & Sub-agentlar
            </span>
            <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-200/60">
              {partners.filter((p) => p.type === "CLIENT").length} ta
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-400">Bizning haqimiz (Mijozlar qarzi):</span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
              $
              {partners
                .filter((p) => p.type === "CLIENT")
                .reduce((acc, p) => acc + (p.balance > 0 ? p.balance : 0), 0)
                .toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tab 2: Ta'minotchilar */}
        <div
          onClick={() => setTab("SUPPLIER")}
          className={`cursor-pointer p-6 rounded-3xl border transition-all ${
            tab === "SUPPLIER"
              ? "bg-white border-blue-500 ring-2 ring-blue-500/10 shadow-md"
              : "bg-white/80 border-slate-200/70 hover:bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-rose-600" /> Ta&apos;minotchilar (1-qo&apos;l)
            </span>
            <span className="text-xs bg-rose-50 text-rose-700 font-bold px-2.5 py-0.5 rounded-full border border-rose-200/60">
              {partners.filter((p) => p.type === "SUPPLIER").length} ta
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-400">Bizning qarzimiz (Ta&apos;minotchilarga):</span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
              $
              {partners
                .filter((p) => p.type === "SUPPLIER")
                .reduce((acc, p) => acc + (p.balance > 0 ? p.balance : 0), 0)
                .toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-3xl border border-slate-200/70 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder={tab === "CLIENT" ? "Mijoz nomi yoki telefon..." : "Ta'minotchi nomi yoki telefon..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="text-xs font-semibold text-slate-400 pr-2 hidden sm:block">
          Jami qarz: <strong className="text-slate-800 font-mono">${totalBalance.toLocaleString()}</strong>
        </div>
      </div>

      {/* Partners List / Table */}
      <div className="bg-white rounded-3xl border border-slate-200/70 overflow-hidden shadow-xs p-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredPartners.map((partner) => {
                const isSupplier = partner.type === "SUPPLIER";
                const hasDebt = (partner.balance || 0) > 0;

                return (
                  <tr key={partner.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{partner.name}</div>
                      {partner.notes && (
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">{partner.notes}</p>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4">
                      {partner.phone ? (
                        <span className="text-slate-600 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {partner.phone}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Total Deals */}
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                      ${(partner.totalDeal || 0).toLocaleString()}
                    </td>

                    {/* Total Paid */}
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-emerald-600">
                      ${(partner.totalPaid || 0).toLocaleString()}
                    </td>

                    {/* Balance */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          hasDebt
                            ? isSupplier
                              ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                              : "bg-amber-50 text-amber-700 border border-amber-200/60"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
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
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> Sverka
                        </button>

                        {/* Payment button */}
                        <button
                          onClick={() =>
                            onOpenPaymentModal(isSupplier ? "EXPENSE" : "INCOME", partner.id)
                          }
                          className={`px-3 py-1.5 text-xs font-bold rounded-full text-white shadow-xs transition-all cursor-pointer ${
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
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
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

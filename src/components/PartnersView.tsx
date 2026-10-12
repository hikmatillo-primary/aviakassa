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

  // Totals for the current tab
  const totalBalance = filteredPartners.reduce((acc, p) => acc + (p.balance > 0 ? p.balance : 0), 0);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Hamkorlar va Balans (Qarzdorlik / Haqdorlik)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mijozlarning sizdan qarzi va sizning ta&apos;minotchilar oldidagi qarzingiz hisob-kitobi
          </p>
        </div>
        <button
          onClick={() => onOpenPartnerModal(tab)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          {tab === "CLIENT" ? "Yangi mijoz / agent" : "Yangi ta'minotchi"}
        </button>
      </div>

      {/* Tab Selector & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tab 1: Mijozlar */}
        <div
          onClick={() => setTab("CLIENT")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            tab === "CLIENT"
              ? "bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
              : "bg-slate-50/70 border-slate-200 hover:bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" /> Mijozlar & Sub-agentlar
            </span>
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              {partners.filter((p) => p.type === "CLIENT").length} ta
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xs text-slate-500">Bizning haqimiz (Mijozlar qarzi):</span>
            <div className="text-xl font-black text-slate-900 font-mono">
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
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            tab === "SUPPLIER"
              ? "bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
              : "bg-slate-50/70 border-slate-200 hover:bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-rose-600" /> Ta&apos;minotchilar (1-qo&apos;l)
            </span>
            <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
              {partners.filter((p) => p.type === "SUPPLIER").length} ta
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xs text-slate-500">Bizning qarzimiz (Ta&apos;minotchilarga):</span>
            <div className="text-xl font-black text-slate-900 font-mono">
              $
              {partners
                .filter((p) => p.type === "SUPPLIER")
                .reduce((acc, p) => acc + (p.balance > 0 ? p.balance : 0), 0)
                .toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={`${tab === "CLIENT" ? "Mijoz" : "Ta'minotchi"} nomi yoki telefoni...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Partners List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Hamkor Nomi</th>
                <th className="py-3 px-4">Aloqa</th>
                <th className="py-3 px-4 text-right">
                  {tab === "CLIENT" ? "Jami xaridlar" : "Jami partiyalar"}
                </th>
                <th className="py-3 px-4 text-right">To&apos;langan summa</th>
                <th className="py-3 px-4 text-right">
                  {tab === "CLIENT" ? "Qarzdorlik (Bizning haq)" : "Bizning qarzimiz"}
                </th>
                <th className="py-3 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredPartners.map((p) => {
                const hasDebt = p.balance > 0;
                const hasDeposit = p.balance < 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                      {p.notes && <div className="text-[11px] text-slate-400 mt-0.5">{p.notes}</div>}
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4">
                      {p.phone ? (
                        <span className="inline-flex items-center gap-1 text-slate-600 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" /> {p.phone}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Total Deal */}
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                      ${p.totalDeal.toLocaleString()}
                    </td>

                    {/* Total Paid */}
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                      ${p.totalPaid.toLocaleString()}
                    </td>

                    {/* Balance */}
                    <td className="py-3.5 px-4 text-right">
                      <div
                        className={`font-mono font-bold text-sm ${
                          hasDebt
                            ? tab === "CLIENT"
                              ? "text-amber-600" // Mijoz qarzi (Haqimiz)
                              : "text-rose-600"  // Ta'minotchiga qarzimiz
                            : hasDeposit
                            ? "text-emerald-600" // Depozit
                            : "text-slate-400"   // 0
                        }`}
                      >
                        ${Math.abs(p.balance).toLocaleString()}
                        {hasDeposit && <span className="text-[10px] ml-1">(avans)</span>}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenHistoryModal(p.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                          title="Sverka daftari"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" /> Sverka
                        </button>
                        <button
                          onClick={() => onOpenPaymentModal(tab === "CLIENT" ? "INCOME" : "EXPENSE", p.id)}
                          className={`px-3 py-1 text-xs font-bold text-white rounded-lg transition-all shadow-xs ${
                            tab === "CLIENT"
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-rose-600 hover:bg-rose-700"
                          }`}
                        >
                          {tab === "CLIENT" ? "+ To'lov qabul" : "- To'lov berish"}
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

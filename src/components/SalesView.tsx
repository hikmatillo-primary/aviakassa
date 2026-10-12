"use client";

import React, { useState } from "react";
import { Search, Plus, TrendingUp, Users, ArrowDownLeft, FileText, Phone, ShoppingBag, ArrowRightLeft } from "lucide-react";

interface SalesViewProps {
  sales: any[];
  partners?: any[];
  onOpenSaleModal: () => void;
  onOpenHistoryModal?: (partnerId: number) => void;
  onOpenPaymentModal?: (type: "INCOME" | "EXPENSE", partnerId: number) => void;
  onOpenDebtOffsetModal?: (fromPartnerId?: number, toPartnerId?: number) => void;
  onOpenPartnerModal?: (type?: "CLIENT") => void;
}

export function SalesView({
  sales,
  partners = [],
  onOpenSaleModal,
  onOpenHistoryModal,
  onOpenPaymentModal,
  onOpenDebtOffsetModal,
  onOpenPartnerModal,
}: SalesViewProps) {
  const [subTab, setSubTab] = useState<"SALES" | "CLIENTS">("SALES");
  const [search, setSearch] = useState("");

  const clients = partners.filter((p) => p.type === "CLIENT");

  // Filtered sales
  const filteredSales = sales.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.clientName?.toLowerCase().includes(q) ||
      s.route?.toLowerCase().includes(q) ||
      s.passengerNames?.toLowerCase().includes(q) ||
      s.saleDate?.toLowerCase().includes(q)
    );
  });

  // Filtered clients
  const filteredClients = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name?.toLowerCase().includes(q) || (c.phone && c.phone.toLowerCase().includes(q));
  });

  // Metrics for sales
  const totalRevenue = filteredSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const totalProfit = filteredSales.reduce((acc, s) => acc + (s.profit || 0), 0);
  const totalTicketsSold = filteredSales.reduce((acc, s) => acc + (s.qty || 0), 0);

  // Metrics for clients
  const totalClientDebt = clients.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sotuv & Xaridorlar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Partiyalardan amalga oshirilgan barcha chipta sotuvlari, sof foyda va mijozlar qarzdorligi
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenDebtOffsetModal && (
            <button
              onClick={() => onOpenDebtOffsetModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-full shadow-xs border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              ⇄ Qarzni surish
            </button>
          )}

          {onOpenPartnerModal && (
            <button
              onClick={() => onOpenPartnerModal("CLIENT")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-full shadow-xs transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" /> + Yangi Mijoz
            </button>
          )}

          <button
            onClick={onOpenSaleModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> + Chipta sotish
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-2xl w-fit">
        <button
          onClick={() => {
            setSubTab("SALES");
            setSearch("");
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            subTab === "SALES"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Sotuvlar Daftari ({sales.length})
        </button>
        <button
          onClick={() => {
            setSubTab("CLIENTS");
            setSearch("");
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            subTab === "CLIENTS"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Xaridorlar & Qarzlar ({clients.length})
        </button>
      </div>

      {/* VIEW 1: SALES JOURNAL */}
      {subTab === "SALES" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Jami sotilgan chiptalar:</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {totalTicketsSold} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">ta</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Jami sotuv tushumi:</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                ${totalRevenue.toLocaleString()}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Sof foyda:
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                +${totalProfit.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Mijoz, yo'nalish, yo'lovchi ismi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 overflow-hidden shadow-xs p-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Sana</th>
                    <th className="py-3 px-4">Yo&apos;nalish & Reys</th>
                    <th className="py-3 px-4">Xaridor (Mijoz)</th>
                    <th className="py-3 px-4 text-center">Soni</th>
                    <th className="py-3 px-4 text-right">Narxi ($)</th>
                    <th className="py-3 px-4 text-right">Jami Summa</th>
                    <th className="py-3 px-4 text-right">Sof Foyda</th>
                    <th className="py-3 px-4">Yo&apos;lovchilar / PNR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        {sale.saleDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{sale.route}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          {sale.flightNumber || ""} {sale.flightDate ? `(${sale.flightDate})` : ""}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 dark:text-white">{sale.clientName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {sale.qty} ta
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                        ${sale.sellPrice}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ${sale.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +${sale.profit.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-[180px] truncate" title={sale.passengerNames}>
                        {sale.passengerNames || "-"}
                      </td>
                    </tr>
                  ))}

                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                        Sotuvlar topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CLIENTS & DEBTORS */}
      {subTab === "CLIENTS" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Jami xaridorlar soni:</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {clients.length} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">ta</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Mijozlarning umumiy qarzdorligi:</span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
                ${totalClientDebt.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Mijoz nomi yoki telefoni..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Clients Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 overflow-hidden shadow-xs p-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Xaridor (Mijoz / Agent)</th>
                    <th className="py-3 px-4">Telefon</th>
                    <th className="py-3 px-4 text-right">Jami Xarid ($)</th>
                    <th className="py-3 px-4 text-right">To&apos;langan ($)</th>
                    <th className="py-3 px-4 text-right">Hozirgi Qarz ($)</th>
                    <th className="py-3 px-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {filteredClients.map((client) => {
                    const hasDebt = client.balance > 0;
                    return (
                      <tr key={client.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {client.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                          {client.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" /> {client.phone}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                          ${(client.totalDeal || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                          ${(client.totalPaid || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold">
                          {hasDebt ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              ${client.balance.toLocaleString()}
                            </span>
                          ) : client.balance < 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              (Depozit: ${Math.abs(client.balance).toLocaleString()})
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">$0</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {onOpenHistoryModal && (
                              <button
                                onClick={() => onOpenHistoryModal(client.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
                                title="Hisob-kitob daftari (Sverka)"
                              >
                                <FileText className="w-3 h-3" /> Sverka
                              </button>
                            )}
                            {onOpenDebtOffsetModal && hasDebt && (
                              <button
                                onClick={() => onOpenDebtOffsetModal(client.id, undefined)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                                title="Mijoz qarzini boshqa tomonga surish"
                              >
                                <ArrowRightLeft className="w-3 h-3" /> Surish
                              </button>
                            )}
                            {onOpenPaymentModal && (
                              <button
                                onClick={() => onOpenPaymentModal("INCOME", client.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-full transition-colors cursor-pointer"
                                title="To'lov qabul qilish"
                              >
                                <ArrowDownLeft className="w-3 h-3" /> To&apos;lov
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredClients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                        Xaridorlar topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

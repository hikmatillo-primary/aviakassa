"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  PackagePlus,
  ArrowRightLeft,
  FileText,
  Phone,
  Plane,
  Layers,
  ArrowUpRight,
} from "lucide-react";

interface PartnersViewProps {
  partners: any[];
  batches?: any[];
  onOpenPartnerModal: (type?: "CLIENT" | "SUPPLIER") => void;
  onOpenPaymentModal: (type: "INCOME" | "EXPENSE", partnerId: number) => void;
  onOpenHistoryModal: (partnerId: number) => void;
  onOpenBatchModal?: () => void;
  onOpenDebtOffsetModal?: (fromPartnerId?: number, toPartnerId?: number) => void;
}

export function PartnersView({
  partners,
  batches = [],
  onOpenPartnerModal,
  onOpenPaymentModal,
  onOpenHistoryModal,
  onOpenBatchModal,
  onOpenDebtOffsetModal,
}: PartnersViewProps) {
  const [subTab, setSubTab] = useState<"SUPPLIERS" | "BATCHES">("SUPPLIERS");
  const [search, setSearch] = useState("");

  const suppliers = partners.filter((p) => p.type === "SUPPLIER");

  const filteredSuppliers = suppliers.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.phone && p.phone.toLowerCase().includes(q));
  });

  const filteredBatches = batches.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.route?.toLowerCase().includes(q) ||
      b.batchNumber?.toLowerCase().includes(q) ||
      b.supplierName?.toLowerCase().includes(q) ||
      b.flightNumber?.toLowerCase().includes(q)
    );
  });

  const totalDebtToSuppliers = suppliers.reduce(
    (acc, p) => acc + (p.balance > 0 ? p.balance : 0),
    0
  );
  const totalPurchasesCost = suppliers.reduce((acc, p) => acc + (p.totalDeal || 0), 0);
  const totalPaidToSuppliers = suppliers.reduce((acc, p) => acc + (p.totalPaid || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Xarid & Ta&apos;minotchilar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Blok chiptalar xaridi, ta&apos;minotchilar bilan hisob-kitob va qarzdorliklar nazorati
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

          <button
            onClick={() => onOpenPartnerModal("SUPPLIER")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-full shadow-xs border border-transparent dark:border-slate-700 transition-all cursor-pointer"
          >
            <Users className="w-4 h-4" />
            Yangi Ta&apos;minotchi
          </button>

          {onOpenBatchModal && (
            <button
              onClick={onOpenBatchModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              Yangi Xarid
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs Switch */}
      <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-2xl w-fit">
        <button
          onClick={() => {
            setSubTab("SUPPLIERS");
            setSearch("");
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            subTab === "SUPPLIERS"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          Ta&apos;minotchilar & Qarzlar ({suppliers.length})
        </button>
        <button
          onClick={() => {
            setSubTab("BATCHES");
            setSearch("");
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            subTab === "BATCHES"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Xaridlar Jurnali ({batches.length})
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Jami olingan partiyalar qiymati:
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            ${totalPurchasesCost.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Bizning qarzimiz (Ta&apos;minotchilarga):
          </span>
          <div
            className={`text-2xl font-black font-mono mt-1 ${
              totalDebtToSuppliers > 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-900 dark:text-white"
            }`}
          >
            ${totalDebtToSuppliers.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Ta&apos;minotchilarga to&apos;langan summa:
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            ${totalPaidToSuppliers.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder={
              subTab === "SUPPLIERS"
                ? "Ta'minotchi nomi yoki telefon..."
                : "Partiya kodi, yo'nalish yoki reys..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
          />
        </div>
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 pr-2 hidden sm:block">
          Ta&apos;minotchilar qarzi:{" "}
          <strong className="text-slate-800 dark:text-slate-200 font-mono">
            ${totalDebtToSuppliers.toLocaleString()}
          </strong>
        </div>
      </div>

      {/* TAB 1: SUPPLIERS TABLE */}
      {subTab === "SUPPLIERS" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 overflow-hidden shadow-xs p-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Ta&apos;minotchi</th>
                  <th className="py-3 px-4">Telefon</th>
                  <th className="py-3 px-4 text-right">Jami olingan bloklar</th>
                  <th className="py-3 px-4 text-right">To&apos;langan summa</th>
                  <th className="py-3 px-4 text-right">Bizning qarzimiz</th>
                  <th className="py-3 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                {filteredSuppliers.map((supplier) => {
                  const hasDebt = (supplier.balance || 0) > 0;

                  return (
                    <tr
                      key={supplier.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {supplier.name}
                        </div>
                        {supplier.notes && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-xs">
                            {supplier.notes}
                          </p>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4">
                        {supplier.phone ? (
                          <span className="text-slate-600 dark:text-slate-300 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {supplier.phone}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Total Deals */}
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                        ${(supplier.totalDeal || 0).toLocaleString()}
                      </td>

                      {/* Total Paid */}
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        ${(supplier.totalPaid || 0).toLocaleString()}
                      </td>

                      {/* Balance */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            hasDebt
                              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60"
                              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                          }`}
                        >
                          ${Math.abs(supplier.balance || 0).toLocaleString()}
                          {hasDebt ? " (Qarzmiz)" : " (Hisob 0)"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Sverka Modal button */}
                          <button
                            onClick={() => onOpenHistoryModal(supplier.id)}
                            title="Akt Sverka (Hisob daftari)"
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" /> Sverka
                          </button>

                          {/* Quick Debt Offset */}
                          {onOpenDebtOffsetModal && hasDebt && (
                            <button
                              onClick={() => onOpenDebtOffsetModal(undefined, supplier.id)}
                              title="Boshqa haqni bu ta'minotchi qarziga surish"
                              className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 bg-blue-50 dark:bg-blue-950/50 rounded-full border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" /> Surish
                            </button>
                          )}

                          {/* Payment button */}
                          <button
                            onClick={() => onOpenPaymentModal("EXPENSE", supplier.id)}
                            className="px-3.5 py-1.5 text-xs font-bold rounded-full text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" /> To&apos;lash
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-xs text-slate-400 dark:text-slate-500"
                    >
                      Ta&apos;minotchilar topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASES (BATCHES) JOURNAL */}
      {subTab === "BATCHES" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 overflow-hidden shadow-xs p-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Partiya & Yo‘nalish</th>
                  <th className="py-3 px-4">Sana & Reys</th>
                  <th className="py-3 px-4">Ta‘minotchi</th>
                  <th className="py-3 px-4 text-center">Chiptalar soni</th>
                  <th className="py-3 px-4 text-right">Tannarx (1 ta)</th>
                  <th className="py-3 px-4 text-right">Jami Qiymat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                {filteredBatches.map((batch) => (
                  <tr
                    key={batch.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {batch.route}
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                        {batch.batchNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {batch.flightDate}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {batch.flightNumber || "-"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {batch.supplierName}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                      {batch.totalQty} ta
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ${batch.buyPrice}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ${(batch.totalCost || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}

                {filteredBatches.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-xs text-slate-400 dark:text-slate-500"
                    >
                      Xaridlar topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

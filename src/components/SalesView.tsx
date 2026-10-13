"use client";

import React, { useState } from "react";
import { Search, ShoppingBag, Users, Pencil, FileSpreadsheet } from "lucide-react";
import { formatUSD } from "@/lib/format";

interface SalesViewProps {
  sales: any[];
  clients?: any[];
  onOpenSaleModal: () => void;
  onOpenPartnerModal?: (type?: "CLIENT") => void;
  onEditSale?: (sale: any) => void;
  onOpenHistoryModal?: (partnerId: number) => void;
}

export function SalesView({
  sales,
  clients = [],
  onOpenSaleModal,
  onOpenPartnerModal,
  onEditSale,
  onOpenHistoryModal,
}: SalesViewProps) {
  const [search, setSearch] = useState("");

  // Filtered sales
  const filteredSales = sales.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.clientName?.toLowerCase().includes(q) ||
      s.route?.toLowerCase().includes(q) ||
      s.passengerNames?.toLowerCase().includes(q) ||
      s.flightNumber?.toLowerCase().includes(q) ||
      s.saleDate?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sotuvlar Daftari
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenPartnerModal && (
            <button
              onClick={() => onOpenPartnerModal("CLIENT")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-full shadow-xs border border-transparent dark:border-slate-600 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Yangi Mijoz
            </button>
          )}

          <button
            onClick={onOpenSaleModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            Chipta sotish
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-3xl border border-slate-200/70 dark:border-slate-700 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Yo‘lovchi ismi, mijoz, yo‘nalish yoki reys..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/70 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-full focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 transition-all"
          />
        </div>
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-400 pr-2 hidden sm:block">
          Sotuvlar soni:{" "}
          <strong className="text-slate-800 dark:text-slate-200 font-mono">
            {filteredSales.length}
          </strong>{" "}
          ta
        </div>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="space-y-3 block md:hidden">
        {filteredSales.map((sale) => (
          <div
            key={sale.id}
            className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/70 dark:border-slate-700 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug">
                    {sale.route}
                  </h3>
                  {sale.isRoundTrip && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      ⇄ Obratno
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Borish: {sale.flightNumber || "-"} ({sale.flightDate}){" "}
                  {sale.departureTime
                    ? `• 🛫${sale.departureTime}➔🛬${sale.arrivalTime || ""}`
                    : ""}
                </div>
                {sale.isRoundTrip && sale.returnDate && (
                  <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                    ⇄ Qaytish: {sale.returnDate}{" "}
                    {sale.returnFlightNumber ? `(${sale.returnFlightNumber})` : ""}{" "}
                    {sale.returnDepartureTime
                      ? `• 🛫${sale.returnDepartureTime}➔🛬${sale.returnArrivalTime || ""}`
                      : ""}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono block">
                  {formatUSD(sale.totalAmount)}
                </span>
                <span
                  className={`text-[11px] font-bold font-mono block ${
                    (sale.profit || 0) >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {(sale.profit || 0) >= 0
                    ? `+${formatUSD(sale.profit || 0)} foyda`
                    : `-${formatUSD(Math.abs(sale.profit || 0))} zarar`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-slate-100 dark:border-slate-700">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Yo‘lovchi:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 block truncate mt-0.5">
                  {sale.passengerNames || "-"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Xaridor (Mijoz):</span>
                <button
                  type="button"
                  onClick={() => onOpenHistoryModal && onOpenHistoryModal(sale.clientId)}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline block truncate mt-0.5 text-left cursor-pointer"
                >
                  {sale.clientName}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/50 -mx-4 -mb-4 px-4 py-3 rounded-b-3xl">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {sale.qty} ta
                </span>
                <span className="text-slate-400">×</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                  {formatUSD(sale.sellPrice)}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  (Olingan: {formatUSD(sale.buyPrice || 0)})
                </span>
              </div>

              {onEditSale && (
                <button
                  type="button"
                  onClick={() => onEditSale(sale)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3 h-3" /> Narxni o‘zgartirish
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredSales.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/70 dark:border-slate-700 p-8 text-center text-xs text-slate-400 dark:text-slate-500">
            Sotuvlar topilmadi
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
                <th className="py-3 px-4">Yo‘nalish & Reys</th>
                <th className="py-3 px-4">Yo‘lovchi</th>
                <th className="py-3 px-4">Mijoz (Xaridor)</th>
                <th className="py-3 px-4 text-center">Soni</th>
                <th className="py-3 px-4 text-right">Olingan Narx</th>
                <th className="py-3 px-4 text-right">Sotilgan Narx</th>
                <th className="py-3 px-4 text-right">Jami Hisob</th>
                <th className="py-3 px-4 text-right">Sof Foyda</th>
                <th className="py-3 px-4 text-center">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
              {filteredSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors"
                >
                  {/* Date */}
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                    {sale.saleDate}
                  </td>

                  {/* Route & Flight */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {sale.route}
                      </span>
                      {sale.isRoundTrip && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          ⇄ Obratno
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Borish: {sale.flightNumber || "-"} ({sale.flightDate}){" "}
                      {sale.departureTime
                        ? `• 🛫 ${sale.departureTime} ➔ 🛬 ${sale.arrivalTime || ""}`
                        : ""}
                    </div>
                    {sale.isRoundTrip && sale.returnDate && (
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                        ⇄ Qaytish: {sale.returnDate}{" "}
                        {sale.returnFlightNumber ? `(${sale.returnFlightNumber})` : ""}{" "}
                        {sale.returnDepartureTime
                          ? `• 🛫 ${sale.returnDepartureTime} ➔ 🛬 ${sale.returnArrivalTime || ""}`
                          : ""}
                      </div>
                    )}
                  </td>

                  {/* Passenger names */}
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {sale.passengerNames || "-"}
                    </span>
                  </td>

                  {/* Client name */}
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => onOpenHistoryModal && onOpenHistoryModal(sale.clientId)}
                      title="Mijoz bilan hisob-kitob (otchyot) oynasini ochish"
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left"
                    >
                      {sale.clientName}
                    </button>
                  </td>

                  {/* Qty */}
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                    {sale.qty} ta
                  </td>

                  {/* Buy Price (Tannarx) */}
                  <td className="py-3.5 px-4 text-right font-mono text-slate-500 dark:text-slate-400">
                    {formatUSD(sale.buyPrice || 0)}
                  </td>

                  {/* Sell Price */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {formatUSD(sale.sellPrice)}
                  </td>

                  {/* Total Amount */}
                  <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                    {formatUSD(sale.totalAmount)}
                  </td>

                  {/* Profit */}
                  <td
                    className={`py-3.5 px-4 text-right font-mono font-bold ${
                      (sale.profit || 0) >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {(sale.profit || 0) >= 0
                      ? `+${formatUSD(sale.profit || 0)}`
                      : `-${formatUSD(Math.abs(sale.profit || 0))}`}
                  </td>

                  {/* Edit Action */}
                  <td className="py-3.5 px-4 text-center">
                    {onEditSale && (
                      <button
                        type="button"
                        onClick={() => onEditSale(sale)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" /> Narxni o‘zgartirish
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredSales.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="py-12 text-center text-xs text-slate-400 dark:text-slate-500"
                  >
                    Sotuvlar topilmadi
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

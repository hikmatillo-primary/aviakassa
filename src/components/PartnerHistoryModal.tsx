"use client";

import React, { useState } from "react";
import { Modal } from "./Modal";
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Pencil, Layers, ShoppingBag } from "lucide-react";
import { formatUSD, formatDate } from "@/lib/format";

interface PartnerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: number | null;
  partners: any[];
  batches: any[];
  sales: any[];
  payments: any[];
  debtOffsets?: any[];
  onOpenPaymentModal?: (type: "INCOME" | "EXPENSE", partnerId: number) => void;
  onOpenDebtOffsetModal?: (fromPartnerId?: number, toPartnerId?: number) => void;
  onEditBatch?: (batch: any) => void;
  onEditSale?: (sale: any) => void;
}

export function PartnerHistoryModal({
  isOpen,
  onClose,
  partnerId,
  partners,
  batches,
  sales,
  payments,
  debtOffsets = [],
  onOpenPaymentModal,
  onOpenDebtOffsetModal,
  onEditBatch,
  onEditSale,
}: PartnerHistoryModalProps) {
  const [mobileTab, setMobileTab] = useState<"PURCHASES" | "SALES" | "PAYMENTS">("PURCHASES");

  if (!isOpen || !partnerId) return null;

  const partner = partners.find((p) => p.id === partnerId);
  if (!partner) return null;

  // Batches sold to us (Partner as Supplier/Vendor)
  const partnerBatches = batches.filter((b) => b.supplierId === partnerId);
  // Sales bought from us (Partner as Buyer/Client)
  const partnerSales = sales.filter((s) => s.clientId === partnerId);

  // Payments for this partner
  const partnerPayments = payments.filter((p) => p.partnerId === partnerId);

  // Debt offsets for this partner
  const partnerOffsets = debtOffsets.filter(
    (o: any) => o.fromPartnerId === partnerId || o.toPartnerId === partnerId
  );

  const totalSoldToUs = partnerBatches.reduce((sum, b) => sum + (b.totalCost || 0), 0);
  const totalBoughtFromUs = partnerSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const totalPaidToUs = partnerPayments
    .filter((p) => p.type === "INCOME")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPaidByUs = partnerPayments
    .filter((p) => p.type === "EXPENSE")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const offsetFrom = partnerOffsets
    .filter((o) => o.fromPartnerId === partnerId)
    .reduce((sum, o) => sum + (o.amount || 0), 0);
  const offsetTo = partnerOffsets
    .filter((o) => o.toPartnerId === partnerId)
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  // Unified net balance (Sal'do)
  const theyOweUs = totalBoughtFromUs - totalPaidToUs - offsetFrom + offsetTo;
  const weOweThem = totalSoldToUs - totalPaidByUs - offsetTo + offsetFrom;
  const netBalance = theyOweUs - weOweThem;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${partner.name} — Hisob-kitob`}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-4">

        {/* Top Universal Balance Summary Cards (3 cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3.5 bg-slate-50/60 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] rounded-2xl tabular-nums">
          {/* Card 1: Bizdan xarid (Chiptalar) */}
          <div className="bg-white dark:bg-[#111726] p-3 sm:p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.06] shadow-xs">
            <span className="text-[11px] text-slate-400 block font-medium">
              Bizdan xarid (Chiptalar)
            </span>
            <strong className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
              {formatUSD(totalBoughtFromUs)}
            </strong>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-0.5 font-medium">
              To‘langan: +{formatUSD(totalPaidToUs)}
            </span>
          </div>

          {/* Card 2: Bizga sotgan (Partiyalar) */}
          <div className="bg-white dark:bg-[#111726] p-3 sm:p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.06] shadow-xs">
            <span className="text-[11px] text-slate-400 block font-medium">
              Bizga sotgan (Partiyalar)
            </span>
            <strong className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
              {formatUSD(totalSoldToUs)}
            </strong>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 block mt-0.5 font-medium">
              To‘langan: -{formatUSD(totalPaidByUs)}
            </span>
          </div>

          {/* Card 3: O‘zaro umumiy Sal'do */}
          <div
            className={`p-3 sm:p-3.5 rounded-xl border shadow-xs flex sm:block items-center justify-between ${
              netBalance > 0
                ? "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-300"
                : netBalance < 0
                ? "bg-rose-500/10 border-rose-500/20 text-rose-900 dark:text-rose-300"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-300"
            }`}
          >
            <div>
              <span className="text-xs block font-medium">
                {netBalance > 0
                  ? "Mijozning qarzi (Ular to‘lashi kerak)"
                  : netBalance < 0
                  ? "Bizning qarzimiz (Biz to‘lashimiz kerak)"
                  : "O‘zaro hisob-kitob teng"}
              </span>
              <strong className="text-base sm:text-lg font-bold sm:mt-0.5 block">
                {netBalance === 0 ? "$0" : formatUSD(Math.abs(netBalance))}
              </strong>
            </div>
            {partnerOffsets.length > 0 && (
              <span className="text-[10px] text-blue-600 dark:text-blue-400 block sm:mt-0.5">
                (O‘zaro surishlar hisobga olingan)
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-end gap-2 flex-wrap">
          {onOpenDebtOffsetModal && (
            <button
              onClick={() => {
                onClose();
                onOpenDebtOffsetModal(
                  netBalance > 0 ? partner.id : undefined,
                  netBalance < 0 ? partner.id : undefined
                );
              }}
              className="px-3 sm:px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" /> Qarzni surish
            </button>
          )}

          {onOpenPaymentModal && (
            <>
              <button
                onClick={() => {
                  onClose();
                  onOpenPaymentModal("INCOME", partner.id);
                }}
                className="px-3 sm:px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center gap-1"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" /> Pul olish (Kirim)
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenPaymentModal("EXPENSE", partner.id);
                }}
                className="px-3 sm:px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center gap-1"
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Pul berish (Chiqim)
              </button>
            </>
          )}
        </div>

        {/* Mobile Tab Switch for Purchases vs Sales vs Payments */}
        <div className="flex md:hidden items-center gap-1 bg-slate-100 dark:bg-white/[0.05] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMobileTab("PURCHASES")}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mobileTab === "PURCHASES"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            Xarid ({partnerBatches.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("SALES")}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mobileTab === "SALES"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            Sotuv ({partnerSales.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("PAYMENTS")}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mobileTab === "PAYMENTS"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            To‘lov ({partnerPayments.length + partnerOffsets.length})
          </button>
        </div>

        {/* 2 Columns: Left = Hamkordan xaridlar, Right = Hamkorga sotuvlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chap ustun: Hamkordan xaridlar */}
          <div
            className={`border border-slate-200/70 dark:border-white/[0.07] rounded-2xl overflow-hidden bg-white dark:bg-[#111726] shadow-xs ${
              mobileTab === "PURCHASES" ? "block" : "hidden md:block"
            }`}
          >
            <div className="bg-slate-50/70 dark:bg-white/[0.03] px-3.5 py-2.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Hamkordan xaridlar
                <span className="text-[11px] font-normal text-slate-400">({partnerBatches.length})</span>
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {formatUSD(totalSoldToUs)}
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/[0.05] max-h-72 overflow-y-auto tabular-nums">
              {partnerBatches.length === 0 ? (
                <p className="p-4 text-xs text-slate-400 dark:text-slate-500 text-center">
                  Ushbu hamkordan olingan partiyalar yo‘q
                </p>
              ) : (
                partnerBatches.map((b: any) => (
                  <div key={b.id} className="p-3.5 text-xs hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        {b.route || b.batchNumber}
                      </span>
                      <span className="text-slate-900 dark:text-white font-bold">
                        {formatUSD(b.totalCost)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mt-1.5">
                      <span>
                        {b.totalQty} ta × {formatUSD(b.buyPrice)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px]">{formatDate(b.purchaseDate || b.flightDate)}</span>
                        {onEditBatch && (
                          <button
                            type="button"
                            onClick={() => onEditBatch(b)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-[11px] font-medium rounded-lg cursor-pointer transition-all"
                          >
                            <Pencil className="w-2.5 h-2.5 text-slate-400" /> Narx
                          </button>
                        )}
                      </div>
                    </div>
                    {b.notes && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                        {b.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* O'ng ustun: Hamkorga sotuvlar */}
          <div
            className={`border border-slate-200/70 dark:border-white/[0.07] rounded-2xl overflow-hidden bg-white dark:bg-[#111726] shadow-xs ${
              mobileTab === "SALES" ? "block" : "hidden md:block"
            }`}
          >
            <div className="bg-slate-50/70 dark:bg-white/[0.03] px-3.5 py-2.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
                Hamkorga sotuvlar
                <span className="text-[11px] font-normal text-slate-400">({partnerSales.length})</span>
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {formatUSD(totalBoughtFromUs)}
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/[0.05] max-h-72 overflow-y-auto tabular-nums">
              {partnerSales.length === 0 ? (
                <p className="p-4 text-xs text-slate-400 dark:text-slate-500 text-center">
                  Ushbu hamkorga sotilgan chiptalar yo‘q
                </p>
              ) : (
                partnerSales.map((s: any) => (
                  <div key={s.id} className="p-3.5 text-xs hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
                        {s.route || "Chipta sotuvi"}
                      </span>
                      <span className="text-slate-900 dark:text-white font-bold">
                        {formatUSD(s.totalAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mt-1.5">
                      <span>
                        {s.qty} ta × {formatUSD(s.sellPrice)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px]">{formatDate(s.saleDate)}</span>
                        {onEditSale && (
                          <button
                            type="button"
                            onClick={() => onEditSale(s)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-[11px] font-medium rounded-lg cursor-pointer transition-all"
                          >
                            <Pencil className="w-2.5 h-2.5 text-slate-400" /> Narx
                          </button>
                        )}
                      </div>
                    </div>
                    {s.passengerNames && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                        {s.passengerNames}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pastki qism: To‘lovlar va o‘zaro hisoblar */}
        <div
          className={`border border-slate-200/70 dark:border-white/[0.07] rounded-2xl overflow-hidden bg-white dark:bg-[#111726] shadow-xs ${
            mobileTab === "PAYMENTS" ? "block" : "hidden md:block"
          }`}
        >
          <div className="bg-slate-50/70 dark:bg-white/[0.03] px-3.5 py-2.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-500" />
              To‘lovlar va o‘zaro hisoblar
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {partnerPayments.length + partnerOffsets.length} ta amal
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/[0.05] max-h-60 overflow-y-auto tabular-nums">
            {partnerPayments.length === 0 && partnerOffsets.length === 0 ? (
              <p className="p-4 text-xs text-slate-400 dark:text-slate-500 text-center">
                To‘lovlar va o‘zaro hisoblar yo‘q
              </p>
            ) : (
              <>
                {partnerPayments.map((p: any) => (
                  <div key={`p-${p.id}`} className="p-3.5 text-xs hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                      <span className="flex items-center gap-1 font-bold">
                        {p.type === "INCOME" ? (
                          <>
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400">+{formatUSD(p.amount)}</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span className="text-rose-600 dark:text-rose-400">-{formatUSD(p.amount)}</span>
                          </>
                        )}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500">{formatDate(p.paymentDate)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mt-1">
                      <span>
                        {p.type === "INCOME" ? "Kirim (Mijoz to‘ladi)" : "Chiqim (Biz to‘ladik)"} •{" "}
                        {p.paymentMethod === "CASH"
                          ? "Naqd pul"
                          : p.paymentMethod === "CARD"
                          ? "Karta"
                          : "Bank hisobi"}
                      </span>
                      <span className="truncate max-w-[140px] sm:max-w-xs">{p.notes || "-"}</span>
                    </div>
                  </div>
                ))}

                {partnerOffsets.map((o: any) => {
                  const isFrom = o.fromPartnerId === partnerId;
                  return (
                    <div key={`o-${o.id}`} className="p-3.5 text-xs bg-blue-500/[0.04] hover:bg-blue-500/[0.08]">
                      <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                        <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          {formatUSD(o.amount)}
                          <span className="text-[10px] font-normal text-slate-500">
                            (O‘zaro surish)
                          </span>
                        </span>
                        <span className="text-slate-400 dark:text-slate-500">{formatDate(o.date)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {isFrom ? (
                          <span>➔ {o.toPartnerName || "Hamkor"} qarziga o‘tkazildi</span>
                        ) : (
                          <span>➔ {o.fromPartnerName || "Hamkor"} hisobidan yopildi</span>
                        )}
                        {o.notes && <span className="block italic text-slate-400 mt-0.5">{o.notes}</span>}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

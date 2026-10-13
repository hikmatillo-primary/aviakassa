"use client";

import React from "react";
import { Modal } from "./Modal";
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Pencil } from "lucide-react";
import { formatUSD } from "@/lib/format";

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
  if (!isOpen || !partnerId) return null;

  const partner = partners.find((p) => p.id === partnerId);
  if (!partner) return null;

  const isSupplier = partner.type === "SUPPLIER";

  // Deals: for supplier -> batches, for client -> sales
  const deals = isSupplier
    ? batches.filter((b) => b.supplierId === partnerId)
    : sales.filter((s) => s.clientId === partnerId);

  // Payments for this partner
  const partnerPayments = payments.filter((p) => p.partnerId === partnerId);

  // Debt offsets for this partner
  const partnerOffsets = debtOffsets.filter(
    (o: any) => o.fromPartnerId === partnerId || o.toPartnerId === partnerId
  );

  // Totals
  const totalDeals = deals.reduce(
    (sum: number, item: any) => sum + (isSupplier ? item.totalCost || 0 : item.totalAmount || 0),
    0
  );
  const totalPaidDirect = partnerPayments.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

  // Offsets impact
  const offsetToAmount = partnerOffsets
    .filter((o: any) => o.toPartnerId === partnerId)
    .reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
  const offsetFromAmount = partnerOffsets
    .filter((o: any) => o.fromPartnerId === partnerId)
    .reduce((sum: number, o: any) => sum + (o.amount || 0), 0);

  const totalPaid = isSupplier
    ? totalPaidDirect + offsetToAmount - offsetFromAmount
    : totalPaidDirect + offsetFromAmount - offsetToAmount;

  const balance = totalDeals - totalPaid;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${partner.name} — Hisob-kitob daftari (Otchyot)`}
      description={
        isSupplier
          ? "Kompaniya (Ta'minotchi) bilan barcha partiyalar, to'lovlar va o'zaro hisob-kitoblar"
          : "Mijoz bilan barcha chipta sotuvi, to'lovlar va o'zaro hisob-kitoblar"
      }
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Top Balance Summary Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-3xl">
          <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs">
            <span className="text-xs text-slate-400 dark:text-slate-400 block font-medium">
              {isSupplier ? "Jami partiyalar (Olingan)" : "Jami chiptalar (Sotilgan)"}:
            </span>
            <strong className="text-base font-bold text-slate-900 dark:text-white">{formatUSD(totalDeals)}</strong>
          </div>
          <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs">
            <span className="text-xs text-slate-400 dark:text-slate-400 block font-medium">
              {isSupplier ? "Biz to'lagan summa:" : "Mijoz to'lagan summa:"}
            </span>
            <strong className="text-base font-bold text-slate-900 dark:text-white">{formatUSD(totalPaid)}</strong>
            {partnerOffsets.length > 0 && (
              <span className="text-[10px] text-blue-600 dark:text-blue-400 block mt-0.5">
                (O&apos;zaro surishlar hisobga olingan)
              </span>
            )}
          </div>
          <div
            className={`p-4 rounded-2xl border shadow-xs ${
              balance > 0
                ? isSupplier
                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200"
                  : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200"
                : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
            }`}
          >
            <span className="text-xs block font-medium">
              {isSupplier
                ? balance > 0
                  ? "Bizning qarzimiz:"
                  : "Haqdorlik (Ortiqcha to'langan):"
                : balance > 0
                ? "Mijozning qarzi (Bizning haq):"
                : "Ortiqcha to'langan (Depozit):"}
            </span>
            <strong className="text-lg font-bold font-mono">
              {formatUSD(Math.abs(balance))}
            </strong>
          </div>
        </div>

        {/* Quick Actions in Modal */}
        <div className="flex items-center justify-end gap-2.5 flex-wrap">
          {onOpenDebtOffsetModal && (
            <button
              onClick={() => {
                onClose();
                if (isSupplier) {
                  onOpenDebtOffsetModal(undefined, partner.id);
                } else {
                  onOpenDebtOffsetModal(partner.id, undefined);
                }
              }}
              className="px-4 py-2 text-xs font-bold rounded-full text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" /> ⇄ Qarzni surish
            </button>
          )}

          {onOpenPaymentModal && (
            <button
              onClick={() => {
                onClose();
                onOpenPaymentModal(isSupplier ? "EXPENSE" : "INCOME", partner.id);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-full text-white shadow-xs cursor-pointer ${
                isSupplier ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {isSupplier ? "- To'lov qilish" : "+ To'lov qabul qilish"}
            </button>
          )}
        </div>

        {/* Lists: Deals, Payments, and Offsets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Column 1: Deals (Batches / Sales) */}
          <div className="border border-slate-200/70 dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <div className="bg-slate-50/70 dark:bg-slate-800/60 px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {isSupplier ? "Olingan partiyalar" : "Sotilgan chiptalar"}
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
              {deals.length === 0 ? (
                <p className="p-4 text-xs text-slate-400 dark:text-slate-500 text-center">Bitimlar yo&apos;q</p>
              ) : (
                deals.map((item: any) => (
                  <div key={item.id} className="p-3.5 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                      <span>{item.route || item.batchNumber}</span>
                      <span className="text-slate-900 dark:text-white font-mono font-bold">
                        {formatUSD(isSupplier ? item.totalCost : item.totalAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mt-1.5">
                      <span>
                        {isSupplier
                          ? `${item.totalQty} ta × ${formatUSD(item.buyPrice)}`
                          : `${item.qty} ta × ${formatUSD(item.sellPrice)}`}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px]">{item.saleDate || item.flightDate}</span>
                        {((isSupplier && onEditBatch) || (!isSupplier && onEditSale)) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (isSupplier && onEditBatch) {
                                onEditBatch(item);
                              } else if (!isSupplier && onEditSale) {
                                onEditSale(item);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-[11px] font-bold rounded-full border border-blue-200 dark:border-blue-800 cursor-pointer"
                          >
                            <Pencil className="w-2.5 h-2.5" /> Narxni o‘zgartirish
                          </button>
                        )}
                      </div>
                    </div>
                    {item.passengerNames && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{item.passengerNames}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Payments & Offsets */}
          <div className="border border-slate-200/70 dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <div className="bg-slate-50/70 dark:bg-slate-800/60 px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              To&apos;lovlar & O‘zaro hisoblar
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
              {partnerPayments.length === 0 && partnerOffsets.length === 0 ? (
                <p className="p-4 text-xs text-slate-400 dark:text-slate-500 text-center">To&apos;lovlar va o&apos;zaro hisoblar yo&apos;q</p>
              ) : (
                <>
                  {partnerPayments.map((p: any) => (
                    <div key={`p-${p.id}`} className="p-3.5 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                        <span className="flex items-center gap-1 font-bold">
                          {p.type === "INCOME" ? (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          )}
                          {formatUSD(p.amount)}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500">{p.paymentDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mt-1">
                        <span>Usuli: {p.paymentMethod || "CASH"}</span>
                        <span>{p.notes || "-"}</span>
                      </div>
                    </div>
                  ))}

                  {partnerOffsets.map((o: any) => {
                    const isFrom = o.fromPartnerId === partnerId;
                    return (
                      <div key={`o-${o.id}`} className="p-3.5 text-xs bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/50">
                        <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                          <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            {formatUSD(o.amount)}
                            <span className="text-[10px] font-normal text-slate-500">
                              (O‘zaro surish)
                            </span>
                          </span>
                          <span className="text-slate-400 dark:text-slate-500">{o.date}</span>
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
      </div>
    </Modal>
  );
}

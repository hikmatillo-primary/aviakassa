"use client";

import React from "react";
import { Modal } from "./Modal";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface PartnerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: number | null;
  partners: any[];
  batches: any[];
  sales: any[];
  payments: any[];
  onOpenPaymentModal?: (type: "INCOME" | "EXPENSE", partnerId: number) => void;
}

export function PartnerHistoryModal({
  isOpen,
  onClose,
  partnerId,
  partners,
  batches,
  sales,
  payments,
  onOpenPaymentModal,
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

  // Totals
  const totalDeals = deals.reduce(
    (sum: number, item: any) => sum + (isSupplier ? item.totalCost || 0 : item.totalAmount || 0),
    0
  );
  const totalPaid = partnerPayments.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
  const balance = totalDeals - totalPaid;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${partner.name} — Hisob-kitob daftari (Sverka)`}
      description={
        isSupplier
          ? "Ta'minotchi bilan barcha partiyalar va to'lovlar"
          : "Mijoz bilan barcha chipta xaridlari va to'lovlar"
      }
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Top Balance Summary Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50/60 border border-slate-200/70 rounded-3xl">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <span className="text-xs text-slate-400 block font-medium">
              {isSupplier ? "Jami partiyalar (Olingan)" : "Jami chiptalar (Sotilgan)"}:
            </span>
            <strong className="text-base font-bold text-slate-900">${totalDeals.toLocaleString()}</strong>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <span className="text-xs text-slate-400 block font-medium">
              {isSupplier ? "Biz to'lagan summa:" : "Mijoz to'lagan summa:"}
            </span>
            <strong className="text-base font-bold text-slate-900">${totalPaid.toLocaleString()}</strong>
          </div>
          <div
            className={`p-4 rounded-2xl border shadow-xs ${
              balance > 0
                ? isSupplier
                  ? "bg-rose-50 border-rose-200 text-rose-950"
                  : "bg-amber-50 border-amber-200 text-amber-950"
                : "bg-emerald-50 border-emerald-200 text-emerald-950"
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
              ${Math.abs(balance).toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Quick Action in Modal */}
        {onOpenPaymentModal && (
          <div className="flex justify-end">
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
          </div>
        )}

        {/* Tabs or Two Columns: Deals vs Payments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Column 1: Deals (Batches / Sales) */}
          <div className="border border-slate-200/70 rounded-3xl overflow-hidden bg-white shadow-xs">
            <div className="bg-slate-50/70 px-4 py-3 border-b border-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider">
              {isSupplier ? "Olingan partiyalar" : "Sotilgan chiptalar"}
            </div>
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {deals.length === 0 ? (
                <p className="p-4 text-xs text-slate-400 text-center">Bitimlar yo&apos;q</p>
              ) : (
                deals.map((item: any) => (
                  <div key={item.id} className="p-3.5 text-xs hover:bg-slate-50/50">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{item.route || item.batchNumber}</span>
                      <span className="text-slate-900 font-mono font-bold">
                        ${(isSupplier ? item.totalCost : item.totalAmount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 mt-1">
                      <span>
                        {isSupplier
                          ? `${item.totalQty} ta chipta ($${item.buyPrice} dan)`
                          : `${item.qty} ta chipta ($${item.sellPrice} dan)`}
                      </span>
                      <span>{item.saleDate || item.flightDate}</span>
                    </div>
                    {item.passengerNames && (
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.passengerNames}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Payments */}
          <div className="border border-slate-200/70 rounded-3xl overflow-hidden bg-white shadow-xs">
            <div className="bg-slate-50/70 px-4 py-3 border-b border-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider">
              To&apos;lovlar tarixi
            </div>
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {partnerPayments.length === 0 ? (
                <p className="p-4 text-xs text-slate-400 text-center">To&apos;lovlar yo&apos;q</p>
              ) : (
                partnerPayments.map((p: any) => (
                  <div key={p.id} className="p-3.5 text-xs hover:bg-slate-50/50">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span className="flex items-center gap-1 font-bold">
                        {p.type === "INCOME" ? (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        ${p.amount.toLocaleString()}
                      </span>
                      <span className="text-slate-400">{p.paymentDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 mt-1">
                      <span>Usuli: {p.paymentMethod || "CASH"}</span>
                      <span>{p.notes || "-"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

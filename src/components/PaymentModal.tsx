"use client";

import React, { useState } from "react";
import { Modal } from "./Modal";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatUSD } from "@/lib/format";
import { DatePicker } from "./DatePicker";
import { PartnerSelect } from "./PartnerSelect";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  partners: any[];
  defaultType?: "INCOME" | "EXPENSE";
  defaultPartnerId?: number | null;
  onSave: (paymentData: {
    partnerId: number;
    type: "INCOME" | "EXPENSE";
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    notes: string;
  }) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  partners,
  defaultType = "INCOME",
  defaultPartnerId,
  onSave,
}: PaymentModalProps) {
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<"INCOME" | "EXPENSE">(defaultType);
  const [partnerId, setPartnerId] = useState<string>(defaultPartnerId ? String(defaultPartnerId) : "");
  const [amount, setAmount] = useState<number | string>(0);
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [notes, setNotes] = useState<string>("");

  React.useEffect(() => {
    if (isOpen) {
      setError(null);
      if (defaultType) setType(defaultType);
      setPartnerId(defaultPartnerId ? String(defaultPartnerId) : "");
      setAmount(0);
      setNotes("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
    }
  }, [isOpen, defaultType, defaultPartnerId]);

  const selectedPartner = partners.find((p) => String(p.id) === partnerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!partnerId || !amount || Number(amount) <= 0) {
      setError("Iltimos, hamkor va summani to'g'ri kiriting!");
      return;
    }

    try {
      onSave({
        partnerId: Number(partnerId),
        type,
        amount: Number(amount),
        paymentDate: paymentDate || new Date().toISOString().split("T")[0],
        paymentMethod,
        notes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi!");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === "INCOME" ? "Kassa kirimi" : "Kassa chiqimi"}
      maxWidth="max-w-xl md:max-w-2xl"
      footer={
        <div className="flex items-center justify-end w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            form="payment-form"
            className={`px-6 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl shadow-sm transition-all cursor-pointer ${
              type === "INCOME"
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
            }`}
          >
            To&apos;lovni saqlash
          </button>
        </div>
      }
    >
      <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* To'lov turi tanlash */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setType("INCOME");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              type === "INCOME"
                ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Kirim (Pul olish)
          </button>
          <button
            type="button"
            onClick={() => {
              setType("EXPENSE");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              type === "EXPENSE"
                ? "bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            Chiqim (Pul berish)
          </button>
        </div>

        {/* Hamkor */}
        <div>
          {defaultPartnerId && selectedPartner ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Hamkor
              </label>
              <div className="p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold text-sm">
                    {selectedPartner.name ? selectedPartner.name.charAt(0).toUpperCase() : "H"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {selectedPartner.name}
                    </div>
                    {selectedPartner.phone && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {selectedPartner.phone}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 tabular-nums">
                  <span className="text-[10px] text-slate-400 block font-medium">Balans:</span>
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      (selectedPartner.balance || 0) < 0
                        ? "text-rose-600 dark:text-rose-400"
                        : (selectedPartner.balance || 0) > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {(selectedPartner.balance || 0) < 0
                      ? `-${formatUSD(Math.abs(selectedPartner.balance))}`
                      : (selectedPartner.balance || 0) > 0
                      ? `+${formatUSD(selectedPartner.balance)}`
                      : "$0"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <PartnerSelect
                label="Qaysi hamkor bilan hisob-kitob?"
                value={partnerId}
                onChange={(val) => setPartnerId(val)}
                partners={partners}
                placeholder="-- Hamkorni tanlang --"
                required
              />
              {selectedPartner && (
                <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between tabular-nums">
                  <span>Balans:</span>
                  <strong
                    className={
                      (selectedPartner.balance || 0) < 0
                        ? "text-rose-600 dark:text-rose-400 font-bold"
                        : (selectedPartner.balance || 0) > 0
                        ? "text-emerald-600 dark:text-emerald-400 font-bold"
                        : "text-slate-600 dark:text-slate-400 font-bold"
                    }
                  >
                    {(selectedPartner.balance || 0) < 0
                      ? `-${formatUSD(Math.abs(selectedPartner.balance))}`
                      : (selectedPartner.balance || 0) > 0
                      ? `+${formatUSD(selectedPartner.balance)}`
                      : "$0"}
                  </strong>
                </div>
              )}
            </>
          )}
        </div>

        {/* Summa ($) */}
        <div>
          <div className="flex items-center justify-between mb-1 gap-1 flex-wrap">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              To&apos;lov summasi ($) *
            </label>
            {selectedPartner && (
              <>
                {type === "INCOME" && (selectedPartner.balance || 0) < 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(Math.abs(selectedPartner.balance || 0))}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                  >
                    Qarzni yopish: {formatUSD(Math.abs(selectedPartner.balance || 0))}
                  </button>
                )}
                {type === "EXPENSE" && (selectedPartner.balance || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(selectedPartner.balance || 0)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  >
                    Haqni to‘lash: {formatUSD(selectedPartner.balance || 0)}
                  </button>
                )}
              </>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-400 dark:text-slate-500 text-sm">$</span>
            <input
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : e.target.value)}
              onBlur={() => {
                if (amount === "" || isNaN(Number(amount))) {
                  setAmount(0);
                } else {
                  setAmount(Number(amount));
                }
              }}
              placeholder="Masalan: 1500"
              className="w-full pl-7 pr-3 py-2 text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold tabular-nums"
              required
            />
          </div>
        </div>

        {/* Sana va Usuli */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <DatePicker
              label="To'lov sanasi"
              value={paymentDate}
              onChange={(val) => setPaymentDate(val)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              To&apos;lov shakli
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CASH">Naqd (Cash)</option>
              <option value="CARD">Karta / O&apos;tkazma</option>
              <option value="BANK">Bank hisob raqami</option>
            </select>
          </div>
        </div>

        {/* Izoh */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Izoh (ixtiyoriy)
          </label>
          <input
            type="text"
            placeholder="Kvitansiya raqami yoki eslatma..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>
    </Modal>
  );
}

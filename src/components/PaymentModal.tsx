"use client";

import React, { useState } from "react";
import { Modal } from "./Modal";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatUSD } from "@/lib/format";

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
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [notes, setNotes] = useState<string>("");

  React.useEffect(() => {
    if (!paymentDate) {
      setPaymentDate(new Date().toISOString().split("T")[0]);
    }
  }, [paymentDate]);

  React.useEffect(() => {
    if (defaultType) setType(defaultType);
    if (defaultPartnerId) setPartnerId(String(defaultPartnerId));
  }, [defaultType, defaultPartnerId]);

  // Filter partners based on selected payment type
  const targetType = type === "INCOME" ? "CLIENT" : "SUPPLIER";
  const filteredPartners = partners.filter((p) => p.type === targetType);

  const selectedPartner = partners.find((p) => String(p.id) === partnerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!partnerId || !amount || amount <= 0) {
      setError("Iltimos, hamkor va summani to'g'ri kiriting!");
      return;
    }

    try {
      onSave({
        partnerId: Number(partnerId),
        type,
        amount,
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
      title={type === "INCOME" ? "Kassa kirimi (To'lov qabul qilish)" : "Kassa chiqimi (To'lov berish)"}
      description={
        type === "INCOME"
          ? "Mijoz yoki agentdan qarz to'lovini qabul qilib, uning qarzini kamaytiring"
          : "Ta'minotchiga qarz to'lovini amalga oshirib, o'z qarzingizni kamaytiring"
      }
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
              setPartnerId("");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              type === "INCOME"
                ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Kirim (Mijoz to&apos;lovi)
          </button>
          <button
            type="button"
            onClick={() => {
              setType("EXPENSE");
              setPartnerId("");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              type === "EXPENSE"
                ? "bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            Chiqim (Ta&apos;minotchiga)
          </button>
        </div>

        {/* Hamkor */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {type === "INCOME" ? "Qaysi mijoz to'ladi? *" : "Qaysi ta'minotchiga to'landi? *"}
          </label>
          <select
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            required
          >
            <option value="">-- Hamkorni tanlang --</option>
            {filteredPartners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Hozirgi qarz: {formatUSD(Math.max(0, p.balance || 0))})
              </option>
            ))}
          </select>
          {selectedPartner && (
            <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
              Hozirgi hisob-kitob balansi:{" "}
              <strong className={selectedPartner.balance > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>
                {formatUSD(selectedPartner.balance)}
              </strong>
            </div>
          )}
        </div>

        {/* Summa ($) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            To&apos;lov summasi ($) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-400 dark:text-slate-500 text-sm">$</span>
            <input
              type="number"
              min="1"
              step="any"
              value={amount || ""}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="Masalan: 1500"
              className="w-full pl-7 pr-3 py-2 text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              required
            />
          </div>
        </div>

        {/* Sana va Usuli */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              To&apos;lov sanasi
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            className={`px-5 py-2.5 text-xs font-bold text-white rounded-full shadow-sm transition-all cursor-pointer ${
              type === "INCOME"
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25"
                : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/25"
            }`}
          >
            To&apos;lovni saqlash
          </button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { ArrowRightLeft, Users, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { Partner } from "@/lib/storage";

interface DebtOffsetModalProps {
  isOpen: boolean;
  onClose: () => void;
  partners: Partner[];
  defaultFromPartnerId?: number | null;
  defaultToPartnerId?: number | null;
  onSave: (offsetData: {
    fromPartnerId: number;
    toPartnerId: number;
    amount: number;
    date: string;
    notes: string;
  }) => void;
}

export function DebtOffsetModal({
  isOpen,
  onClose,
  partners,
  defaultFromPartnerId,
  defaultToPartnerId,
  onSave,
}: DebtOffsetModalProps) {
  const [fromPartnerId, setFromPartnerId] = useState<string>(
    defaultFromPartnerId ? String(defaultFromPartnerId) : ""
  );
  const [toPartnerId, setToPartnerId] = useState<string>(
    defaultToPartnerId ? String(defaultToPartnerId) : ""
  );
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) {
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [date]);

  useEffect(() => {
    if (defaultFromPartnerId) {
      setFromPartnerId(String(defaultFromPartnerId));
    }
    if (defaultToPartnerId) {
      setToPartnerId(String(defaultToPartnerId));
    }
  }, [defaultFromPartnerId, defaultToPartnerId]);

  // If no initial selection, choose reasonable defaults:
  // e.g., first client with positive balance as fromPartner, first supplier with debt as toPartner
  useEffect(() => {
    if (isOpen && !fromPartnerId && partners.length > 0) {
      const clientWithDebt = partners.find((p) => p.type === "CLIENT" && (p.balance || 0) > 0);
      if (clientWithDebt) setFromPartnerId(String(clientWithDebt.id));
    }
    if (isOpen && !toPartnerId && partners.length > 0) {
      const supplierWithDebt = partners.find((p) => p.type === "SUPPLIER" && (p.balance || 0) > 0);
      if (supplierWithDebt) setToPartnerId(String(supplierWithDebt.id));
    }
  }, [isOpen, partners, fromPartnerId, toPartnerId]);

  const fromPartner = partners.find((p) => String(p.id) === fromPartnerId);
  const toPartner = partners.find((p) => String(p.id) === toPartnerId);

  const handleQuickAmount = (val: number) => {
    setAmount(val);
  };

  const handleFullAmount = () => {
    if (fromPartner && (fromPartner.balance || 0) > 0) {
      setAmount(fromPartner.balance || 0);
    } else if (toPartner && (toPartner.balance || 0) > 0) {
      setAmount(toPartner.balance || 0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fromPartnerId || !toPartnerId) {
      setError("Iltimos, ikkala tomonni ham tanlang!");
      return;
    }
    if (fromPartnerId === toPartnerId) {
      setError("Bir xil hamkor tanlandi. Ikkita har xil tomonni tanlang!");
      return;
    }
    if (!amount || amount <= 0) {
      setError("Suriladigan summani 0 dan katta qilib kiriting!");
      return;
    }

    try {
      onSave({
        fromPartnerId: Number(fromPartnerId),
        toPartnerId: Number(toPartnerId),
        amount: Number(amount),
        date: date || new Date().toISOString().split("T")[0],
        notes: notes.trim(),
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
      title="O‘zaro hisob-kitob (Qarzni surish)"
      description="Kimdandir haqingiz bo'lsa, uni boshqa tomonning qarziga o'tkazib hisoblarni o'zaro tenglang"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Info banner */}
        <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 p-3 rounded-2xl text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Ushbu amal kassadagi naqd pulga tegmaydi. <strong>1-tomonning</strong> qarzi/haqi kamayadi, <strong>2-tomonning</strong> qarzi esa mos ravishda yopiladi.
          </p>
        </div>

        {/* Two sides selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Side 1: From */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              1. Kimning hisobidan yechilsin? (Haqdor tomon)
            </label>
            <select
              value={fromPartnerId}
              onChange={(e) => setFromPartnerId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            >
              <option value="">Hamkorni tanlang...</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type === "CLIENT" ? "Mijoz" : "Ta'minotchi"}) — Balans: ${(p.balance || 0).toLocaleString()}
                </option>
              ))}
            </select>
            {fromPartner && (
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                Joriy qarz/haq:{" "}
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                  ${(fromPartner.balance || 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Side 2: To */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              2. Kimning qarzi yopilsin? (Qarz egasi)
            </label>
            <select
              value={toPartnerId}
              onChange={(e) => setToPartnerId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            >
              <option value="">Hamkorni tanlang...</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type === "CLIENT" ? "Mijoz" : "Ta'minotchi"}) — Balans: ${(p.balance || 0).toLocaleString()}
                </option>
              ))}
            </select>
            {toPartner && (
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                Joriy qarz/haq:{" "}
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                  ${(toPartner.balance || 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Amount Input & Quick Chips */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Suriladigan summa ($)
            </label>
            <button
              type="button"
              onClick={handleFullAmount}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
            >
              Mavjud to‘liq qarzni qo‘yish
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">$</span>
            <input
              type="number"
              min="1"
              step="any"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="0"
              className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Quick chips */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {[100, 250, 500, 1000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAmount(val)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                  amount === val
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                }`}
              >
                ${val}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Reason/Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Operatsiya sanasi
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Izoh / Asosiy sabab
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Masalan: To'g'ridan-to'g'ri to'lov hisobiga"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Live Calculation Preview Card */}
        {fromPartner && toPartner && amount > 0 && (
          <div className="p-3.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Kutilayotgan o&apos;zgarishlar natijasi:
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span>{fromPartner.name}:</span>
                <span className="font-mono">
                  ${(fromPartner.balance || 0).toLocaleString()} ➔{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    ${Math.max(0, (fromPartner.balance || 0) - amount).toLocaleString()}
                  </strong>
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span>{toPartner.name}:</span>
                <span className="font-mono">
                  ${(toPartner.balance || 0).toLocaleString()} ➔{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    ${Math.max(0, (toPartner.balance || 0) - amount).toLocaleString()}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-sm shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Qarzni surishni tasdiqlash
          </button>
        </div>
      </form>
    </Modal>
  );
}

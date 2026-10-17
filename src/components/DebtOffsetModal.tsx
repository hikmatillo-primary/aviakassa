"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { ArrowRightLeft, Users, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Partner } from "@/lib/storage";
import { formatUSD, getTodayISO } from "@/lib/format";
import { DatePicker } from "./DatePicker";
import { PartnerSelect } from "./PartnerSelect";
import { getValidationMessage } from "@/lib/api";

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
  }) => void | Promise<void>;
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
  const [amount, setAmount] = useState<number | string>(0);
  const [date, setDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!date) {
      setDate(getTodayISO());
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
  useEffect(() => {
    if (isOpen && !fromPartnerId && partners.length > 0) {
      const pWithDebt = partners.find((p) => (p.balance || 0) > 0);
      if (pWithDebt) setFromPartnerId(String(pWithDebt.id));
    }
    if (isOpen && !toPartnerId && partners.length > 0) {
      const pOther = partners.find(
        (p) => String(p.id) !== fromPartnerId && (p.balance || 0) > 0
      );
      if (pOther) setToPartnerId(String(pOther.id));
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

  const handleSubmit = async (e: React.FormEvent) => {
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
    if (!amount || Number(amount) <= 0) {
      setError("Suriladigan summani 0 dan katta qilib kiriting!");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        fromPartnerId: Number(fromPartnerId),
        toPartnerId: Number(toPartnerId),
        amount: Number(amount),
        date: date || getTodayISO(),
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(getValidationMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="O‘zaro hisob-kitob"
      maxWidth="max-w-2xl sm:max-w-2xl md:max-w-3xl"
      footer={
        <div className="flex items-center justify-end w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            form="offset-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
            {isSubmitting ? "Saqlanmoqda..." : "Tasdiqlash"}
          </button>
        </div>
      }
    >
      <form id="offset-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Two sides selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Side 1: From */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <PartnerSelect
              label="1. Kimning hisobidan yechilsin?"
              value={fromPartnerId}
              onChange={(val) => setFromPartnerId(val)}
              partners={partners}
              placeholder="Hamkorni tanlang..."
              required
            />
            {fromPartner && (
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                Joriy qarz/haq:{" "}
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                  {formatUSD(Math.abs(fromPartner.balance || 0))}
                </span>
              </div>
            )}
          </div>

          {/* Side 2: To */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <PartnerSelect
              label="2. Kimning qarzi yopilsin?"
              value={toPartnerId}
              onChange={(val) => setToPartnerId(val)}
              partners={partners}
              placeholder="Hamkorni tanlang..."
              required
            />
            {toPartner && (
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                Joriy qarz/haq:{" "}
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                  {formatUSD(Math.abs(toPartner.balance || 0))}
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
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : e.target.value)}
              onBlur={() => {
                if (amount === "" || isNaN(Number(amount))) {
                  setAmount(0);
                } else {
                  setAmount(Number(amount));
                }
              }}
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
                  Number(amount) === val
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
            <DatePicker
              label="Operatsiya sanasi"
              value={date}
              onChange={(val) => setDate(val)}
              required
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
        {fromPartner && toPartner && (Number(amount) || 0) > 0 && (
          <div className="p-3.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Kutilayotgan o&apos;zgarishlar natijasi:
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span>{fromPartner.name}:</span>
                <span className="font-mono">
                  {formatUSD(Math.abs(fromPartner.balance || 0))} ➔{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {formatUSD(Math.max(0, (fromPartner.balance || 0) - (Number(amount) || 0)))}
                  </strong>
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span>{toPartner.name}:</span>
                <span className="font-mono">
                  {formatUSD(Math.abs(toPartner.balance || 0))} ➔{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {formatUSD(Math.max(0, (toPartner.balance || 0) - (Number(amount) || 0)))}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}

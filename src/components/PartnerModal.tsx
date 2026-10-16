"use client";

import React, { useState } from "react";
import { Modal } from "./Modal";
import { Loader2 } from "lucide-react";
import { getValidationMessage } from "@/lib/api";
import { sanitizePhoneInput, isValidPhone } from "@/lib/format";

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: "SUPPLIER" | "CLIENT";
  zIndex?: string;
  partner?: {
    id: number;
    name?: string;
    type?: "SUPPLIER" | "CLIENT" | "BOTH";
    phone?: string;
    notes?: string;
  } | null;
  onSave: (partnerData: {
    name: string;
    type?: "SUPPLIER" | "CLIENT";
    tags: string[];
    phone: string;
    notes: string;
  }) => void | Promise<void>;
}

export function PartnerModal({
  isOpen,
  onClose,
  defaultType = "CLIENT",
  zIndex = "z-[60]",
  partner = null,
  onSave,
}: PartnerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState<"SUPPLIER" | "CLIENT">(defaultType);
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setName(partner?.name || "");
      setType(partner ? (partner.type === "SUPPLIER" ? "SUPPLIER" : "CLIENT") : defaultType);
      setPhone(partner?.phone || "");
      setNotes(partner?.notes || "");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, defaultType, partner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Hamkor nomini kiriting!");
      return;
    }

    if (!isValidPhone(phone)) {
      setError("Telefon raqami noto'g'ri! Faqat raqam kiriting (masalan: +998 90 123-45-67).");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        type,
        tags: [],
        phone: phone.trim(),
        notes: notes.trim(),
      });
      setName("");
      setPhone("");
      setNotes("");
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
      zIndex={zIndex}
      title={partner ? "Hamkorni tahrirlash" : "Yangi hamkor qo‘shish"}
      maxWidth="max-w-xl md:max-w-2xl"
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
            form="partner-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      }
    >
      <form id="partner-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {error && (
          <div className="p-3.5 sm:p-4 text-xs sm:text-sm bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 font-medium">
            {error}
          </div>
        )}

        {/* Nomi */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Hamkor nomi yoki F.I.Sh. *
          </label>
          <input
            type="text"
            placeholder="Masalan: Asman Travel yoki Aliyev Sherzod"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            required
            autoFocus
          />
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Telefon raqami
          </label>
          <input
            type="text"
            inputMode="tel"
            placeholder="+998 90 123-45-67"
            value={phone}
            onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
            className="w-full px-3.5 py-2.5 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums font-mono"
          />
        </div>

        {/* Izoh */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Qo‘shimcha ma‘lumot (Izoh)
          </label>
          <input
            type="text"
            placeholder="Shartnoma shartlari, Telegram yoki manzili..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>
    </Modal>
  );
}

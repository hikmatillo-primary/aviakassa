"use client";

import React, { useState } from "react";
import { Tag, Sparkles } from "lucide-react";
import { Modal } from "@/components/Modal";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<any> | void;
}

const PRESET_CATEGORIES = [
  "1 oylik",
  "2 haftalik",
  "10 kunlik",
  "Blok xarid",
  "VIP xarid",
  "Mavsumiy",
  "Charter",
];

export function CategoryModal({ isOpen, onClose, onSave }: CategoryModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Kategoriya nomini kiriting!");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(trimmed);
      setName("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset: string) => {
    setName(preset);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yangi xarid turi (kategoriya)"
      description="Partiyalarni qulay guruhlash va saralash uchun xarid turi nomini kiriting."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Kategoriya nomi *
          </label>
          <div className="relative">
            <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: 1 oylik, Blok xarid..."
              className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
            />
          </div>
          {error && <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>}
        </div>

        {/* Quick preset suggestions */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Tezkor namunalar:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_CATEGORIES.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                  name === preset
                    ? "bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 font-bold"
                    : "bg-slate-100/70 dark:bg-white/[0.04] border-slate-200/70 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/[0.15]"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saqlanmoqda..." : "Qo‘shish"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

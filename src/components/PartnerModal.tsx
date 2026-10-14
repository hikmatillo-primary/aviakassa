"use client";

import React, { useState } from "react";
import { Modal } from "./Modal";
import { Tag, Plus, X } from "lucide-react";

const POPULAR_TAGS = [
  "Birinchi qo'l",
  "Sub-agent",
  "Turfirma",
  "Konsolidator",
  "Charter",
  "Doimiy mijoz",
  "Korporativ",
];

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: "SUPPLIER" | "CLIENT";
  onSave: (partnerData: {
    name: string;
    type?: "SUPPLIER" | "CLIENT";
    tags: string[];
    phone: string;
    notes: string;
  }) => void;
}

export function PartnerModal({
  isOpen,
  onClose,
  defaultType = "CLIENT",
  onSave,
}: PartnerModalProps) {
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<"SUPPLIER" | "CLIENT">(defaultType);
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      if (defaultType === "SUPPLIER") {
        setTags(["Birinchi qo'l"]);
      } else {
        setTags(["Sub-agent"]);
      }
      setName("");
      setPhone("");
      setNotes("");
      setCustomTagInput("");
      setError(null);
    }
  }, [isOpen, defaultType]);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const clean = customTagInput.trim();
    if (!clean) return;
    if (!tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
    }
    setCustomTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Hamkor nomini kiriting!");
      return;
    }

    try {
      const finalTags = tags.length > 0 ? tags : [type === "SUPPLIER" ? "Birinchi qo'l" : "Mijoz"];
      onSave({
        name: name.trim(),
        type,
        tags: finalTags,
        phone: phone.trim(),
        notes: notes.trim(),
      });
      setName("");
      setPhone("");
      setNotes("");
      setTags([]);
      onClose();
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi!");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yangi hamkor qo‘shish"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Nomi */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Hamkor nomi yoki F.I.Sh. *
          </label>
          <input
            type="text"
            placeholder="Masalan: Asman Travel yoki Aliyev Sherzod"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            required
          />
        </div>

        {/* Teglar (Tags) tanlash */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Tag className="w-3.5 h-3.5 text-blue-500" />
              Teglar (Faoliyat turlari)
            </label>
            <span className="text-[11px] text-slate-400">
              Bir nechta tanlash mumkin
            </span>
          </div>

          {/* Preset chips */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {POPULAR_TAGS.map((t) => {
              const active = tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.12]"
                  }`}
                >
                  {t}
                  {active && <span className="text-[10px]">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Custom tag input */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Boshqa teg qo‘shish..."
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomTag();
                }
              }}
              className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddCustomTag}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.15] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Qo‘shish
            </button>
          </div>

          {/* Active custom tags that are not in popular tags */}
          {tags.filter((t) => !POPULAR_TAGS.includes(t)).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags
                .filter((t) => !POPULAR_TAGS.includes(t))
                .map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Telefon raqami
          </label>
          <input
            type="text"
            placeholder="+998 90 123-45-67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
          />
        </div>

        {/* Izoh */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Qo‘shimcha ma‘lumot (Izoh)
          </label>
          <input
            type="text"
            placeholder="Shartnoma shartlari, Telegram yoki manzili..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sticky Buttons */}
        <div className="sticky bottom-0 -mx-4 sm:-mx-5 -mb-6 sm:-mb-5 px-4 sm:px-5 py-3 bg-white/95 dark:bg-[#111726]/95 backdrop-blur-md border-t border-slate-100 dark:border-white/[0.07] flex items-center justify-end gap-2 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            Saqlash
          </button>
        </div>
      </form>
    </Modal>
  );
}

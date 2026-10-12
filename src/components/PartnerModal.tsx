"use client";

import React, { useState } from "react";
import { Modal } from "./Modal";

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: "SUPPLIER" | "CLIENT";
  onSave: (partnerData: {
    name: string;
    type: "SUPPLIER" | "CLIENT";
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

  React.useEffect(() => {
    if (defaultType) setType(defaultType);
  }, [defaultType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Hamkor nomini kiriting!");
      return;
    }

    try {
      onSave({
        name: name.trim(),
        type,
        phone: phone.trim(),
        notes: notes.trim(),
      });
      setName("");
      setPhone("");
      setNotes("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi!");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === "CLIENT" ? "Yangi mijoz / agent qo'shish" : "Yangi ta'minotchi qo'shish"}
      description="Hamkor ma'lumotlarini kiriting"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Turi */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setType("CLIENT")}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              type === "CLIENT" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600"
            }`}
          >
            Mijoz / Sub-agent
          </button>
          <button
            type="button"
            onClick={() => setType("SUPPLIER")}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              type === "SUPPLIER" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600"
            }`}
          >
            Ta&apos;minotchi (1-qo&apos;l)
          </button>
        </div>

        {/* Nomi */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nomi yoki F.I.Sh. *
          </label>
          <input
            type="text"
            placeholder={type === "CLIENT" ? "Masalan: Samarqand Turizm yoki Aliyev Alisher" : "Masalan: FlyDubai Bosh Ofis"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            required
          />
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Telefon raqami
          </label>
          <input
            type="text"
            placeholder="+998 90 123-45-67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Izoh */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Qo&apos;shimcha ma&apos;lumot (Izoh)
          </label>
          <input
            type="text"
            placeholder="Agentlik shartlari yoki Telegram kontaklari..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
          >
            Saqlash
          </button>
        </div>
      </form>
    </Modal>
  );
}

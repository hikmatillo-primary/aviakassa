"use client";

import React, { useState } from "react";
import { Modal } from "./Modal";
import { PackagePlus, Calculator } from "lucide-react";

import { RouteSelector } from "./RouteSelector";

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: any[];
  onSave: (batchData: {
    batchNumber: string;
    route: string;
    flightDate: string;
    flightNumber: string;
    supplierId: number;
    totalQty: number;
    buyPrice: number;
    notes: string;
  }) => void;
  onOpenSupplierModal?: () => void;
}

export function BatchModal({
  isOpen,
  onClose,
  suppliers,
  onSave,
  onOpenSupplierModal,
}: BatchModalProps) {
  const [error, setError] = useState<string | null>(null);

  const [batchNumber, setBatchNumber] = useState("");
  const [route, setRoute] = useState("Toshkent — Dubay");
  const [flightDate, setFlightDate] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [totalQty, setTotalQty] = useState(50);
  const [buyPrice, setBuyPrice] = useState(300);
  const [notes, setNotes] = useState("");

  React.useEffect(() => {
    if (!batchNumber) {
      setBatchNumber(`P-${Math.floor(100 + Math.random() * 900)}`);
    }
    if (!flightDate) {
      setFlightDate(new Date().toISOString().split("T")[0]);
    }
  }, [batchNumber, flightDate]);

  const totalCost = (totalQty || 0) * (buyPrice || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!route || !flightDate || !supplierId || !totalQty || !buyPrice) {
      setError("Iltimos, barcha majburiy maydonlarni to'ldiring!");
      return;
    }

    try {
      onSave({
        batchNumber,
        route,
        flightDate,
        flightNumber,
        supplierId: Number(supplierId),
        totalQty: Number(totalQty),
        buyPrice: Number(buyPrice),
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
      title="Yangi partiya sotib olish (Kirim)"
      description="Ta'minotchidan blok chiptalar sotib oling va omborga kiring"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* 1. Aviasales uslubidagi 2 tomonlama Yo'nalish tanlash */}
        <RouteSelector
          initialOrigin="Toshkent"
          initialDestination="Dubay"
          onChange={(newRoute) => setRoute(newRoute)}
        />

        {/* 2. Partiya kodi, Uchish sanasi va Reys raqami */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Partiya kodi *
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Uchish sanasi *
            </label>
            <input
              type="date"
              value={flightDate}
              onChange={(e) => setFlightDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reys raqami (ixtiyoriy)
            </label>
            <input
              type="text"
              placeholder="FZ-780 / HY-333"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
            />
          </div>
        </div>

        {/* Ta'minotchi */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Kimdan sotib olindi? *</label>
            {onOpenSupplierModal && (
              <button
                type="button"
                onClick={onOpenSupplierModal}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium cursor-pointer"
              >
                + Yangi ta&apos;minotchi
              </button>
            )}
          </div>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            required
          >
            <option value="">-- Ta&apos;minotchini tanlang --</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.phone ? `(${s.phone})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Chipta soni va Tannarx */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Jami chiptalar soni *
            </label>
            <input
              type="number"
              min="1"
              value={totalQty}
              onChange={(e) => setTotalQty(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              1 ta chipta tannarxi ($) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 dark:text-slate-500 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={buyPrice}
                onChange={(e) => setBuyPrice(parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                required
              />
            </div>
          </div>
        </div>

        {/* Partiya jami qiymati kartochkasi */}
        <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 rounded-2xl flex items-center justify-between">
          <div className="text-xs text-amber-900 dark:text-amber-200">
            <span className="block font-medium">Jami partiya qiymati (Tannarx):</span>
            <span className="text-[11px] text-amber-700 dark:text-amber-300">
              {totalQty} ta x ${buyPrice} (Ta&apos;minotchiga qarzga yoziladi)
            </span>
          </div>
          <strong className="text-base font-bold text-amber-950 dark:text-amber-100 font-mono">
            ${totalCost.toLocaleString()}
          </strong>
        </div>

        {/* Izoh */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Izoh (ixtiyoriy)
          </label>
          <input
            type="text"
            placeholder="Reys shartlari, bagaj yoki boshqa ma'lumotlar..."
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
            className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
          >
            Partiyani ochish
          </button>
        </div>
      </form>
    </Modal>
  );
}

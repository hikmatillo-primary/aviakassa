"use client";

import React, { useState } from "react";
import { Modal } from "./Modal";
import { PackagePlus, Calculator } from "lucide-react";

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
  const [route, setRoute] = useState("");
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
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Partiya raqami va Yo'nalish */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Partiya kodi *
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Yo&apos;nalish (Shahar - Shahar) *
            </label>
            <input
              type="text"
              placeholder="Masalan: Toshkent - Dubay"
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              required
            />
          </div>
        </div>

        {/* Uchish sanasi va Reys raqami */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Uchish sanasi *
            </label>
            <input
              type="date"
              value={flightDate}
              onChange={(e) => setFlightDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reys raqami (ixtiyoriy)
            </label>
            <input
              type="text"
              placeholder="Masalan: FZ-780 / HY-333"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
            />
          </div>
        </div>

        {/* Ta'minotchi */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700">Kimdan sotib olindi? *</label>
            {onOpenSupplierModal && (
              <button
                type="button"
                onClick={onOpenSupplierModal}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Yangi ta&apos;minotchi
              </button>
            )}
          </div>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jami chiptalar soni *
            </label>
            <input
              type="number"
              min="1"
              value={totalQty}
              onChange={(e) => setTotalQty(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              1 ta chipta tannarxi ($) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={buyPrice}
                onChange={(e) => setBuyPrice(parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                required
              />
            </div>
          </div>
        </div>

        {/* Partiya jami qiymati kartochkasi */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-center justify-between">
          <div className="text-xs text-amber-900">
            <span className="block font-medium">Jami partiya qiymati (Tannarx):</span>
            <span className="text-[11px] text-amber-700">
              {totalQty} ta x ${buyPrice} (Ta&apos;minotchiga qarzga yoziladi)
            </span>
          </div>
          <strong className="text-base font-bold text-amber-950 font-mono">
            ${totalCost.toLocaleString()}
          </strong>
        </div>

        {/* Izoh */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Izoh (ixtiyoriy)
          </label>
          <input
            type="text"
            placeholder="Reys shartlari, bagaj yoki boshqa ma'lumotlar..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
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

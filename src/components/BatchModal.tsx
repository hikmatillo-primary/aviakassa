"use client";

import React, { useState } from "react";
import { Modal } from "./Modal";
import { RouteSelector } from "./RouteSelector";
import { formatUSD } from "@/lib/format";

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
    paidNow?: number;
    paymentMethod?: string;
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
  const [paidNow, setPaidNow] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [baggage, setBaggage] = useState<string>("20 kg");
  const [notes, setNotes] = useState("");

  React.useEffect(() => {
    if (!batchNumber) {
      setBatchNumber(`P-${Math.floor(100 + Math.random() * 900)}`);
    }
    if (!flightDate) {
      setFlightDate(new Date().toISOString().split("T")[0]);
    }
  }, [batchNumber, flightDate]);

  // Total cost calculation
  const totalCost = (totalQty || 0) * (buyPrice || 0);
  const remainingDebt = Math.max(0, totalCost - (paidNow || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!route || !flightDate || !supplierId || !totalQty || !buyPrice) {
      setError("Iltimos, barcha majburiy maydonlarni to'ldiring!");
      return;
    }

    const fullNotes = [
      baggage ? `Bagaj: ${baggage}` : null,
      notes.trim() ? notes.trim() : null,
    ]
      .filter(Boolean)
      .join(" • ");

    try {
      onSave({
        batchNumber,
        route,
        flightDate,
        flightNumber: flightNumber.trim().toUpperCase(),
        supplierId: Number(supplierId),
        totalQty: Number(totalQty),
        buyPrice: Number(buyPrice),
        notes: fullNotes,
        paidNow: Number(paidNow) || 0,
        paymentMethod,
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
      title="Yangi xarid"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="p-2.5 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* 1. Yo'nalish tanlash */}
        <RouteSelector
          initialOrigin="Toshkent"
          initialDestination="Dubay"
          onChange={(newRoute) => setRoute(newRoute)}
        />

        {/* 2. Ta'minotchi va Sana */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ta&apos;minotchi *
              </label>
              {onOpenSupplierModal && (
                <button
                  type="button"
                  onClick={onOpenSupplierModal}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  + Yangi ta&apos;minotchi
                </button>
              )}
            </div>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Uchish sanasi *
            </label>
            <input
              type="date"
              value={flightDate}
              onChange={(e) => setFlightDate(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              required
            />
          </div>
        </div>

        {/* 3. Reys raqami va Partiya kodi */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reys raqami (ixtiyoriy)
            </label>
            <input
              type="text"
              placeholder="Masalan: FZ-780 / HY-333"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Partiya kodi *
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
              required
            />
          </div>
        </div>

        {/* 4. Chiptalar soni va Tannarx */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Chiptalar soni *
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

        {/* 5. Real-time Calculation Summary Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Jami partiya qiymati:</span>
          <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
            {totalQty} ta × ${buyPrice} = <strong className="text-amber-600 dark:text-amber-400">{formatUSD(totalCost)}</strong>
          </span>
        </div>

        {/* 6. To'lov berilganligi */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hozir to&apos;landi ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                max={totalCost}
                step="any"
                value={paidNow || ""}
                onChange={(e) => setPaidNow(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 px-0.5">
              Qarz:{" "}
              <strong
                className={
                  remainingDebt > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              >
                {formatUSD(remainingDebt)}
              </strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              To&apos;lov usuli
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="CASH">Naqd (Cash)</option>
              <option value="CARD">Karta / O&apos;tkazma</option>
              <option value="BANK">Bank hisob raqami</option>
            </select>
          </div>
        </div>

        {/* 7. Bagaj va Izoh */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bagaj miqdori
            </label>
            <select
              value={baggage}
              onChange={(e) => setBaggage(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="20 kg">20 kg</option>
              <option value="25 kg">25 kg</option>
              <option value="30 kg">30 kg</option>
              <option value="Qo'l yuki (7 kg)">Qo&apos;l yuki (7 kg)</option>
              <option value="Bagajsiz">Bagajsiz</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Izoh (ixtiyoriy)
            </label>
            <input
              type="text"
              placeholder="Charter, eslatma..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
          >
            Xaridni qabul qilish
          </button>
        </div>
      </form>
    </Modal>
  );
}

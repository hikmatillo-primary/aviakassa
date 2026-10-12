"use client";

import React, { useState } from "react";
import { Modal } from "./Modal";
import { PackagePlus, Calculator, Luggage, Wallet, Plus, Building2, Calendar, Hash } from "lucide-react";
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
      title="Yangi Xarid (Blok chiptalar qabuli)"
      description="Ta'minotchidan blok partiyani qabul qilib, omborga kirim qiling"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* 1. Yo'nalish tanlash (Aviasales uslubida Qayerdan ➔ Qayerga) */}
        <RouteSelector
          initialOrigin="Toshkent"
          initialDestination="Dubay"
          onChange={(newRoute) => setRoute(newRoute)}
        />

        {/* 2. Parvoz sanasi va Reys raqami */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Uchish sanasi *
            </label>
            <input
              type="date"
              value={flightDate}
              onChange={(e) => setFlightDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Reys raqami (ixtiyoriy)
            </label>
            <input
              type="text"
              placeholder="Masalan: FZ-780 / HY-333"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono font-bold"
            />
          </div>
        </div>

        {/* 3. Ta'minotchi va Partiya kodi */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                Kimdan sotib olindi? (Ta&apos;minotchi) *
              </label>
              {onOpenSupplierModal && (
                <button
                  type="button"
                  onClick={onOpenSupplierModal}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold cursor-pointer"
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
        </div>

        {/* 4. Chiptalar soni va Tannarx */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Jami chiptalar soni *
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={totalQty}
                onChange={(e) => setTotalQty(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                required
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold pointer-events-none">
                ta chipta
              </span>
            </div>
            {/* Tezkor son qo'shish teglari */}
            <div className="flex items-center gap-1.5 mt-1.5">
              {[20, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTotalQty(preset)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                    totalQty === preset
                      ? "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  {preset} ta
                </button>
              ))}
            </div>
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

        {/* Jonli hisob-kitob kartochkasi */}
        <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-950 dark:text-amber-200 font-bold flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Jami partiya qiymati (Tannarx):
            </div>
            <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
              {totalQty} ta chipta × ${buyPrice}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-black font-mono text-amber-950 dark:text-amber-100">
              ${totalCost.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 5. To'lov berilganligi (ixtiyoriy) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Hozir qancha to&apos;landi? ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 dark:text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  max={totalCost}
                  step="any"
                  value={paidNow || ""}
                  onChange={(e) => setPaidNow(parseFloat(e.target.value) || 0)}
                  placeholder="0 (To'liq qarzga bo'lsa 0 qoldiring)"
                  className="w-full pl-7 pr-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                Ta&apos;minotchiga qolgan qarz: <strong>${remainingDebt.toLocaleString()}</strong>
              </span>
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
        </div>

        {/* 6. Bagaj va Qo'shimcha Izoh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Luggage className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Bagaj miqdori
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {["20 kg", "25 kg", "30 kg", "Qo'l yuki (7 kg)"].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBaggage(b)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    baggage === b
                      ? "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Qo&apos;shimcha izoh (ixtiyoriy)
            </label>
            <input
              type="text"
              placeholder="Charter, qaytarilmaydi, vaucher..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <PackagePlus className="w-4 h-4" />
            Xaridni qabul qilish
          </button>
        </div>
      </form>
    </Modal>
  );
}

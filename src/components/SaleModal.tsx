"use client";

import React, { useState } from "react";
import { Modal } from "./Modal";
import { Calculator } from "lucide-react";
import { formatUSD } from "@/lib/format";

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: any[];
  clients: any[];
  selectedBatchId?: number | null;
  onSave: (saleData: {
    batchId: number;
    clientId: number;
    qty: number;
    sellPrice: number;
    passengerNames: string;
    saleDate: string;
    paidNow: number;
    paymentMethod: string;
    notes: string;
  }) => void;
  onOpenClientModal?: () => void;
}

export function SaleModal({
  isOpen,
  onClose,
  batches,
  clients,
  selectedBatchId,
  onSave,
  onOpenClientModal,
}: SaleModalProps) {
  const [error, setError] = useState<string | null>(null);

  // Active batches only
  const activeBatches = batches.filter((b) => b.status === "ACTIVE" && b.remainingQty > 0);

  const [batchId, setBatchId] = useState<string>(selectedBatchId ? String(selectedBatchId) : "");
  const [clientId, setClientId] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [passengerNames, setPassengerNames] = useState<string>("");
  const [saleDate, setSaleDate] = useState<string>("");
  const [paidNow, setPaidNow] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [notes, setNotes] = useState<string>("");

  React.useEffect(() => {
    if (!saleDate) {
      setSaleDate(new Date().toISOString().split("T")[0]);
    }
  }, [saleDate]);

  // Sync selectedBatchId when changed
  React.useEffect(() => {
    if (selectedBatchId) {
      setBatchId(String(selectedBatchId));
      const b = batches.find((item) => item.id === selectedBatchId);
      if (b) {
        setSellPrice(Math.round(b.buyPrice + 30));
      }
    } else if (batches.length > 0) {
      const active = batches.find((b) => b.status === "ACTIVE" && b.remainingQty > 0);
      if (active) {
        setBatchId(String(active.id));
        setSellPrice(Math.round(active.buyPrice + 30));
      }
    }
  }, [selectedBatchId, batches]);

  const selectedBatch = batches.find((b) => String(b.id) === batchId);

  const handleBatchChange = (newBatchId: string) => {
    setBatchId(newBatchId);
    const b = batches.find((item) => String(item.id) === newBatchId);
    if (b) {
      setSellPrice(Math.round(b.buyPrice + 30));
    }
  };

  const totalAmount = (qty || 0) * (sellPrice || 0);
  const totalCost = selectedBatch ? (qty || 0) * selectedBatch.buyPrice : 0;
  const estimatedProfit = totalAmount - totalCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!batchId) {
      setError("Iltimos, partiyani tanlang!");
      return;
    }
    if (!clientId) {
      setError("Iltimos, mijoz yoki sub-agentni tanlang!");
      return;
    }
    if (!selectedBatch || qty > selectedBatch.remainingQty) {
      setError(`Partiyada faqat ${selectedBatch?.remainingQty || 0} ta chipta mavjud!`);
      return;
    }
    if (qty <= 0) {
      setError("Chipta soni kamida 1 ta bo'lishi kerak!");
      return;
    }
    if (sellPrice <= 0) {
      setError("Sotish narxi 0 dan katta bo'lishi kerak!");
      return;
    }

    try {
      onSave({
        batchId: Number(batchId),
        clientId: Number(clientId),
        qty,
        sellPrice,
        passengerNames,
        saleDate: saleDate || new Date().toISOString().split("T")[0],
        paidNow,
        paymentMethod,
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
      title="Chipta sotish"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="p-2.5 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* 1. Partiya va Mijoz */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Partiya (Reys) *
            </label>
            <select
              value={batchId}
              onChange={(e) => handleBatchChange(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              required
            >
              <option value="">-- Partiyani tanlang --</option>
              {activeBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber}: {b.route} ({b.remainingQty} ta qoldiq)
                </option>
              ))}
            </select>
            {selectedBatch && (
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
                <span>Qoldiq: <strong className="text-blue-600 dark:text-blue-400">{selectedBatch.remainingQty} ta</strong></span>
                <span>Tannarx: <strong className="text-slate-700 dark:text-slate-300">${selectedBatch.buyPrice}</strong></span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mijoz / Agent *
              </label>
              {onOpenClientModal && (
                <button
                  type="button"
                  onClick={onOpenClientModal}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  + Yangi mijoz
                </button>
              )}
            </div>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              required
            >
              <option value="">-- Mijozni tanlang --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Soni va Sotish narxi */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Chipta soni *
            </label>
            <input
              type="number"
              min="1"
              max={selectedBatch?.remainingQty || 9999}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              1 ta chipta narxi ($) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={sellPrice}
                onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>
        </div>

        {/* 3. Real-time Calculation Summary Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Jami:</span>
            <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
              {formatUSD(totalAmount)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Sof foyda:</span>
            <span
              className={`font-bold font-mono text-sm ${
                estimatedProfit >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {estimatedProfit >= 0 ? `+${formatUSD(estimatedProfit)}` : `-${formatUSD(Math.abs(estimatedProfit))}`}
            </span>
          </div>
        </div>

        {/* 4. To'lov */}
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
                max={totalAmount}
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
                  totalAmount - paidNow > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              >
                {formatUSD(Math.max(0, totalAmount - paidNow))}
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

        {/* 5. Sana va Yo'lovchilar / PNR */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sana
            </label>
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Yo&apos;lovchilar / PNR
            </label>
            <input
              type="text"
              placeholder="Masalan: Karim A., PNR"
              value={passengerNames}
              onChange={(e) => setPassengerNames(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 6. Izoh */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Izoh (ixtiyoriy)
          </label>
          <input
            type="text"
            placeholder="Qo'shimcha eslatma..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
            Sotuvni tasdiqlash
          </button>
        </div>
      </form>
    </Modal>
  );
}

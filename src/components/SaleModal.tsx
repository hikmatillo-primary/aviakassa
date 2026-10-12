"use client";

import React, { useState } from "react";
import { Modal } from "./Modal";
import { Calculator } from "lucide-react";

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
      title="Chipta sotish (Partiyadan chiqim)"
      description="Partiyadan chipta ajrating va mijoz hisobiga yozing"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* 1. Partiya tanlash */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Qaysi partiyadan sotiladi? *
          </label>
          <select
            value={batchId}
            onChange={(e) => handleBatchChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            required
          >
            <option value="">-- Partiyani tanlang --</option>
            {activeBatches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batchNumber}: {b.route} ({b.flightDate}) — Qoldiq: {b.remainingQty} ta (Tannarx: ${b.buyPrice})
              </option>
            ))}
          </select>
          {selectedBatch && (
            <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200/60">
              <span>Mavjud: <strong className="text-blue-600">{selectedBatch.remainingQty} ta</strong></span>
              <span>1 ta tannarxi: <strong className="text-slate-800">${selectedBatch.buyPrice}</strong></span>
              <span>Reys: <strong>{selectedBatch.flightNumber || "N/A"}</strong></span>
            </div>
          )}
        </div>

        {/* 2. Mijoz tanlash */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">Kimga sotiladi? *</label>
            {onOpenClientModal && (
              <button
                type="button"
                onClick={onOpenClientModal}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Yangi mijoz
              </button>
            )}
          </div>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            required
          >
            <option value="">-- Mijoz / Sub-agentni tanlang --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Soni va Sotish narxi */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chipta soni *
            </label>
            <input
              type="number"
              min="1"
              max={selectedBatch?.remainingQty || 9999}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                className="w-full pl-7 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                required
              />
            </div>
          </div>
        </div>

        {/* Real-time Calculation Summary Card */}
        <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs text-blue-900">
            <span>Jami sotuv summasi:</span>
            <strong className="text-sm font-bold text-blue-950">${totalAmount.toLocaleString()}</strong>
          </div>
          <div className="flex items-center justify-between text-xs text-blue-900">
            <span>Tannarx jami ({qty} ta x ${selectedBatch?.buyPrice || 0}):</span>
            <span>${totalCost.toLocaleString()}</span>
          </div>
          <div className="pt-1.5 border-t border-blue-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-800 flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5" /> Sof foyda:
            </span>
            <strong className={`text-sm font-bold ${estimatedProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {estimatedProfit >= 0 ? `+$${estimatedProfit.toLocaleString()}` : `-$${Math.abs(estimatedProfit).toLocaleString()}`}
            </strong>
          </div>
        </div>

        {/* 4. Darhol to'lov (ixtiyoriy) */}
        <div className="pt-2 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hozir qancha to&apos;ladi? ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  step="any"
                  value={paidNow}
                  onChange={(e) => setPaidNow(parseFloat(e.target.value) || 0)}
                  placeholder="0 (Nasiya bo'lsa 0 qoldiring)"
                  className="w-full pl-7 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-[11px] text-slate-500">
                Qolgan qarz: <strong>${Math.max(0, totalAmount - paidNow).toLocaleString()}</strong>
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                To&apos;lov usuli
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CASH">Naqd (Cash)</option>
                <option value="CARD">Karta / O&apos;tkazma</option>
                <option value="BANK">Bank hisob raqami</option>
              </select>
            </div>
          </div>
        </div>

        {/* 5. Yo'lovchi ismlari va Sana */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sotuv sanasi
            </label>
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Yo&apos;lovchilar / PNR (ixtiyoriy)
            </label>
            <input
              type="text"
              placeholder="Masalan: Karim Aliyev, PNR: 4X9F8"
              value={passengerNames}
              onChange={(e) => setPassengerNames(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Izoh */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Izoh (ixtiyoriy)
          </label>
          <input
            type="text"
            placeholder="Qo'shimcha eslatma..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
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
            Sotuvni tasdiqlash
          </button>
        </div>
      </form>
    </Modal>
  );
}

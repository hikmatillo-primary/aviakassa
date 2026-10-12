"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Plus, Trash2 } from "lucide-react";
import { formatUSD } from "@/lib/format";

export interface SaleItemInput {
  id: string;
  batchId: string;
  qty: number;
  sellPrice: number;
  passengerNames: string;
}

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: any[];
  clients: any[];
  selectedBatchId?: number | null;
  onSave: (saleData: {
    clientId: number;
    saleDate: string;
    paidNow: number;
    paymentMethod: string;
    notes: string;
    items: Array<{
      batchId: number;
      qty: number;
      sellPrice: number;
      passengerNames?: string;
    }>;
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
  const [clientId, setClientId] = useState<string>("");
  const [saleDate, setSaleDate] = useState<string>("");
  const [paidNow, setPaidNow] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [notes, setNotes] = useState<string>("");

  // Only active batches with remaining stock
  const activeBatches = batches.filter((b) => b.status === "ACTIVE" && b.remainingQty > 0);

  const [items, setItems] = useState<SaleItemInput[]>([]);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      const active = batches.filter((b) => b.status === "ACTIVE" && b.remainingQty > 0);
      const initialBatch = selectedBatchId
        ? batches.find((b) => b.id === selectedBatchId)
        : active[0];

      setItems([
        {
          id: Math.random().toString(),
          batchId: initialBatch ? String(initialBatch.id) : "",
          qty: 1,
          sellPrice: initialBatch ? Math.round(initialBatch.buyPrice + 30) : 0,
          passengerNames: "",
        },
      ]);
      setSaleDate(new Date().toISOString().split("T")[0]);
      setPaidNow(0);
      setNotes("");
      setError(null);
    }
  }, [isOpen, selectedBatchId, batches]);

  // Handlers for items
  const handleAddItem = () => {
    const defaultBatch = activeBatches[0];
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        batchId: defaultBatch ? String(defaultBatch.id) : "",
        qty: 1,
        sellPrice: defaultBatch ? Math.round(defaultBatch.buyPrice + 30) : 0,
        passengerNames: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof SaleItemInput, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      if (field === "batchId") {
        const found = batches.find((b) => String(b.id) === String(value));
        if (found) {
          next[index].sellPrice = Math.round(found.buyPrice + 30);
        }
      }
      return next;
    });
  };

  // Calculations
  const totalAmount = items.reduce(
    (sum, it) => sum + (it.qty || 0) * (it.sellPrice || 0),
    0
  );
  const totalCost = items.reduce((sum, it) => {
    const b = batches.find((x) => String(x.id) === it.batchId);
    return sum + (it.qty || 0) * (b?.buyPrice || 0);
  }, 0);
  const totalQty = items.reduce((sum, it) => sum + (it.qty || 0), 0);
  const estimatedProfit = totalAmount - totalCost;
  const remainingDebt = Math.max(0, totalAmount - (paidNow || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientId) {
      setError("Iltimos, mijoz yoki sub-agentni tanlang!");
      return;
    }

    if (items.length === 0) {
      setError("Kamida bitta chipta/reys qo'shilishi kerak!");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.batchId) {
        setError(`${i + 1}-qatorda partiya tanlanmagan!`);
        return;
      }
      const b = batches.find((x) => String(x.id) === it.batchId);
      if (!b) {
        setError(`${i + 1}-qatordagi partiya topilmadi!`);
        return;
      }
      if (it.qty <= 0) {
        setError(`${i + 1}-qatorda chipta soni kamida 1 ta bo'lishi kerak!`);
        return;
      }
      if (it.qty > b.remainingQty) {
        setError(
          `"${b.route}" partiyasida faqat ${b.remainingQty} ta chipta mavjud! (${it.qty} ta so'ralgan)`
        );
        return;
      }
      if (it.sellPrice <= 0) {
        setError(`${i + 1}-qatorda sotish narxi 0 dan katta bo'lishi kerak!`);
        return;
      }
    }

    try {
      onSave({
        clientId: Number(clientId),
        saleDate: saleDate || new Date().toISOString().split("T")[0],
        paidNow: Number(paidNow) || 0,
        paymentMethod,
        notes,
        items: items.map((it) => ({
          batchId: Number(it.batchId),
          qty: Number(it.qty),
          sellPrice: Number(it.sellPrice),
          passengerNames: it.passengerNames.trim(),
        })),
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
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 font-medium">
            {error}
          </div>
        )}

        {/* 1. Mijoz va Sana */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sotuv sanasi *
            </label>
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              required
            />
          </div>
        </div>

        {/* 2. Mahsulotlar / Chiptalar ro'yxati (Multi-item savatcha) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Sotilayotgan chiptalar ({items.length} ta)
            </span>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Chipta qo‘shish
            </button>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-0.5">
            {items.map((item, index) => {
              const selectedBatch = batches.find((b) => String(b.id) === item.batchId);
              const itemTotal = (item.qty || 0) * (item.sellPrice || 0);
              const itemProfit =
                itemTotal - (item.qty || 0) * (selectedBatch?.buyPrice || 0);

              return (
                <div
                  key={item.id}
                  className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2.5 transition-all"
                >
                  {/* Qator tepasi: Partiya tanlash va O'chirish tugmasi */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <select
                        value={item.batchId}
                        onChange={(e) =>
                          handleUpdateItem(index, "batchId", e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                        required
                      >
                        <option value="">-- Partiya/Reysni tanlang --</option>
                        {activeBatches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.route} ({b.flightDate}, {b.flightNumber || "Reys"}) — Qoldiq: {b.remainingQty} ta • Tannarx: ${b.buyPrice} ({b.batchNumber})
                          </option>
                        ))}
                      </select>
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        title="Ushbu chiptani o'chirish"
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Qator maydonlari: Soni, Narxi, Yo'lovchi */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        Chipta soni
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={selectedBatch?.remainingQty || 9999}
                        value={item.qty}
                        onChange={(e) =>
                          handleUpdateItem(
                            index,
                            "qty",
                            Math.max(1, parseInt(e.target.value) || 0)
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        1 ta narxi ($)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.sellPrice}
                          onChange={(e) =>
                            handleUpdateItem(
                              index,
                              "sellPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full pl-6 pr-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        Yo‘lovchi / PNR
                      </label>
                      <input
                        type="text"
                        placeholder="Masalan: Karim A."
                        value={item.passengerNames}
                        onChange={(e) =>
                          handleUpdateItem(index, "passengerNames", e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Qator xulosasi */}
                  {selectedBatch && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 px-0.5 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span>
                        Qoldiq: <b className="text-blue-600 dark:text-blue-400">{selectedBatch.remainingQty} ta</b> • Tannarx: <b>${selectedBatch.buyPrice}</b>
                      </span>
                      <span>
                        Jami: <strong className="text-slate-900 dark:text-white font-mono">{formatUSD(itemTotal)}</strong> • Foyda:{" "}
                        <strong
                          className={
                            itemProfit >= 0
                              ? "text-emerald-600 dark:text-emerald-400 font-mono"
                              : "text-rose-600 dark:text-rose-400 font-mono"
                          }
                        >
                          {itemProfit >= 0 ? `+${formatUSD(itemProfit)}` : `-${formatUSD(Math.abs(itemProfit))}`}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Yana chipta (mahsulot) qo‘shish
          </button>
        </div>

        {/* 3. Real-time Calculation Summary Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Jami ({totalQty} ta):
            </span>
            <span className="font-black font-mono text-slate-900 dark:text-white text-sm">
              {formatUSD(totalAmount)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Sof foyda:</span>
            <span
              className={`font-black font-mono text-sm ${
                estimatedProfit >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {estimatedProfit >= 0
                ? `+${formatUSD(estimatedProfit)}`
                : `-${formatUSD(Math.abs(estimatedProfit))}`}
            </span>
          </div>
        </div>

        {/* 4. To'lov */}
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
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
                className="w-full pl-7 pr-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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

        {/* 5. Izoh */}
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
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
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

"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Plus, Trash2, ArrowRightLeft } from "lucide-react";
import { formatUSD, formatDate } from "@/lib/format";
import { FlightBar } from "./FlightBar";
import { DatePicker } from "./DatePicker";
import { PartnerSelect } from "./PartnerSelect";

export interface SaleItemInput {
  id: string;
  batchId: string;
  qty: number;
  sellPrice: number;
  passengerNames: string;
  departureTime: string;
  arrivalTime: string;
  isRoundTrip: boolean;
  returnDate: string;
  returnFlightNumber: string;
  returnDepartureTime: string;
  returnArrivalTime: string;
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
      departureTime?: string;
      arrivalTime?: string;
      isRoundTrip?: boolean;
      returnDate?: string;
      returnFlightNumber?: string;
      returnDepartureTime?: string;
      returnArrivalTime?: string;
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

  // Batches with remaining stock
  const activeBatches = batches.filter((b) => b.remainingQty > 0);

  const [items, setItems] = useState<SaleItemInput[]>([]);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      const active = batches.filter((b) => b.remainingQty > 0);
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
          departureTime: initialBatch?.departureTime || "08:00",
          arrivalTime: initialBatch?.arrivalTime || "11:30",
          isRoundTrip: Boolean(initialBatch?.isRoundTrip),
          returnDate: initialBatch?.returnDate || "",
          returnFlightNumber: initialBatch?.returnFlightNumber || "",
          returnDepartureTime: initialBatch?.returnDepartureTime || "14:00",
          returnArrivalTime: initialBatch?.returnArrivalTime || "17:30",
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
        departureTime: defaultBatch?.departureTime || "08:00",
        arrivalTime: defaultBatch?.arrivalTime || "11:30",
        isRoundTrip: Boolean(defaultBatch?.isRoundTrip),
        returnDate: defaultBatch?.returnDate || "",
        returnFlightNumber: defaultBatch?.returnFlightNumber || "",
        returnDepartureTime: defaultBatch?.returnDepartureTime || "14:00",
        returnArrivalTime: defaultBatch?.returnArrivalTime || "17:30",
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
          next[index].departureTime = found.departureTime || "08:00";
          next[index].arrivalTime = found.arrivalTime || "11:30";
          next[index].isRoundTrip = Boolean(found.isRoundTrip);
          next[index].returnDate = found.returnDate || "";
          next[index].returnFlightNumber = found.returnFlightNumber || "";
          next[index].returnDepartureTime = found.returnDepartureTime || "14:00";
          next[index].returnArrivalTime = found.returnArrivalTime || "17:30";
        }
      }
      if (field === "returnDate") {
        next[index].isRoundTrip = Boolean(value);
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
      if (it.isRoundTrip && !it.returnDate) {
        setError(`${i + 1}-qatorda obratno (qaytish) sanasi tanlanmagan!`);
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
          departureTime: it.departureTime,
          arrivalTime: it.arrivalTime,
          isRoundTrip: it.isRoundTrip,
          returnDate: it.isRoundTrip ? it.returnDate : undefined,
          returnFlightNumber: it.isRoundTrip
            ? it.returnFlightNumber.trim().toUpperCase()
            : undefined,
          returnDepartureTime: it.isRoundTrip ? it.returnDepartureTime : undefined,
          returnArrivalTime: it.isRoundTrip ? it.returnArrivalTime : undefined,
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
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
            Jami: <strong className="text-sm sm:text-base font-bold text-emerald-500 font-mono">{formatUSD(totalAmount)}</strong>{" "}
            <span className="text-slate-400 font-normal">({totalQty} ta chipta)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              form="sale-form"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              Sotuvni tasdiqlash
            </button>
          </div>
        </div>
      }
    >
      <form id="sale-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 font-medium">
            {error}
          </div>
        )}

        {/* 1. Mijoz va Sana */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <PartnerSelect
              label="Mijoz / Hamkor"
              value={clientId}
              onChange={(val) => setClientId(val)}
              partners={clients}
              onAddNew={onOpenClientModal}
              placeholder="-- Mijoz yoki Hamkorni tanlang --"
              required
            />
          </div>

          <div>
            <DatePicker
              label="Sotuv sanasi"
              value={saleDate}
              onChange={(val) => setSaleDate(val)}
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

          <div className="space-y-2.5 sm:max-h-[340px] sm:overflow-y-auto pr-0.5">
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
                  {/* Qator tepasi: Partiya tanlash, Obratno tugmasi va O'chirish tugmasi */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
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
                            {b.route} (
                            {formatDate(b.flightDate, false)}
                            {b.isRoundTrip && b.returnDate
                              ? ` ⇄ ${formatDate(b.returnDate, false)}`
                              : ""}
                            {" • "}Qoldiq: {b.remainingQty} ta{" • "}
                            {formatUSD(b.buyPrice)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateItem(index, "isRoundTrip", !item.isRoundTrip)
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          item.isRoundTrip
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-blue-400"
                        }`}
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        {item.isRoundTrip ? "⇄ Obratno" : "Obratno qo‘shish"}
                      </button>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          title="Ushbu chiptani o'chirish"
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedBatch && (
                    <div className="pt-0.5">
                      <FlightBar batch={selectedBatch} showSubtitle={false} />
                    </div>
                  )}

                  {/* Uchish va Qo'nish vaqtlari (Borish) */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Uchish vaqti
                      </label>
                      <input
                        type="time"
                        value={item.departureTime}
                        onChange={(e) =>
                          handleUpdateItem(index, "departureTime", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Qo‘nish vaqti
                      </label>
                      <input
                        type="time"
                        value={item.arrivalTime}
                        onChange={(e) =>
                          handleUpdateItem(index, "arrivalTime", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        Chipta soni
                      </label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateItem(
                              index,
                              "qty",
                              Math.max(1, (item.qty || 1) - 1)
                            )
                          }
                          className="w-6 h-[30px] flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-l-xl font-bold text-xs cursor-pointer border border-r-0 border-slate-300 dark:border-slate-700 shrink-0"
                        >
                          -
                        </button>
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
                          className="w-full text-center py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-y border-slate-300 dark:border-slate-700 focus:outline-none font-bold tabular-nums"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateItem(
                              index,
                              "qty",
                              Math.min(
                                selectedBatch?.remainingQty || 9999,
                                (item.qty || 0) + 1
                              )
                            )
                          }
                          className="w-6 h-[30px] flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-r-xl font-bold text-xs cursor-pointer border border-l-0 border-slate-300 dark:border-slate-700 shrink-0"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
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
                          className="w-full pl-6 pr-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold tabular-nums"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        Yo‘lovchi / PNR
                      </label>
                      <input
                        type="text"
                        placeholder="Karim A."
                        value={item.passengerNames}
                        onChange={(e) =>
                          handleUpdateItem(index, "passengerNames", e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* OBRATNO (QAYTISH REYSI) MAYDONLARI */}
                  {item.isRoundTrip && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60">
                      <div>
                        <DatePicker
                          label="⇄ Qaytish sanasi"
                          value={item.returnDate || ""}
                          onChange={(val) => handleUpdateItem(index, "returnDate", val)}
                          labelClassName="block text-[10px] font-bold text-blue-700 dark:text-blue-300 mb-0.5"
                          compact
                          required={item.isRoundTrip}
                          clearable
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-blue-700 dark:text-blue-300 mb-0.5">
                          ⇄ Qaytish reysi
                        </label>
                        <input
                          type="text"
                          placeholder="Masalan: FZ-781"
                          value={item.returnFlightNumber}
                          onChange={(e) =>
                            handleUpdateItem(
                              index,
                              "returnFlightNumber",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-blue-300 dark:border-blue-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-blue-700 dark:text-blue-300 mb-0.5">
                          ⇄ Qaytish uchish
                        </label>
                        <input
                          type="time"
                          value={item.returnDepartureTime}
                          onChange={(e) =>
                            handleUpdateItem(
                              index,
                              "returnDepartureTime",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-blue-300 dark:border-blue-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-blue-700 dark:text-blue-300 mb-0.5">
                          ⇄ Qaytish qo‘nish
                        </label>
                        <input
                          type="time"
                          value={item.returnArrivalTime}
                          onChange={(e) =>
                            handleUpdateItem(
                              index,
                              "returnArrivalTime",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-blue-300 dark:border-blue-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                        />
                      </div>
                    </div>
                  )}

                  {/* Qator xulosasi */}
                  {selectedBatch && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 px-0.5 border-t border-slate-200/50 dark:border-slate-700/50 tabular-nums">
                      <span>
                        Qoldiq: <b className="text-blue-600 dark:text-blue-400">{selectedBatch.remainingQty} ta</b> • Tannarx: <b>{formatUSD(selectedBatch.buyPrice)}</b>
                      </span>
                      <span>
                        Jami: <strong className="text-slate-900 dark:text-white font-bold">{formatUSD(itemTotal)}</strong> • Foyda:{" "}
                        <strong
                          className={
                            itemProfit >= 0
                              ? "text-emerald-600 dark:text-emerald-400 font-bold"
                              : "text-rose-600 dark:text-rose-400 font-bold"
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
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs tabular-nums">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Jami ({totalQty} ta):
            </span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {formatUSD(totalAmount)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Sof foyda:</span>
            <span
              className={`font-bold text-sm ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-1 gap-1 flex-wrap">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Hozir to&apos;landi ($)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPaidNow(totalAmount)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                >
                  To‘liq (100%)
                </button>
                <button
                  type="button"
                  onClick={() => setPaidNow(0)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Qarzga ($0)
                </button>
              </div>
            </div>
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
                className="w-full pl-7 pr-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium tabular-nums"
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 px-0.5 tabular-nums">
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
      </form>
    </Modal>
  );
}

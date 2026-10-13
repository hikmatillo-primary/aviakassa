"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Plus, Trash2, Sparkles, ArrowRightLeft } from "lucide-react";
import { formatUSD } from "@/lib/format";

export interface BatchItemInput {
  id: string;
  route: string;
  flightDate: string;
  flightNumber: string;
  isRoundTrip: boolean;
  returnDate: string;
  returnFlightNumber: string;
  totalQty: number;
  buyPrice: number;
  baggage: string;
}

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: any[];
  onSave: (batchData: {
    supplierId: number;
    purchaseDate?: string;
    paidNow?: number;
    paymentMethod?: string;
    notes?: string;
    items: Array<{
      route: string;
      flightDate: string;
      flightNumber?: string;
      isRoundTrip?: boolean;
      returnDate?: string;
      returnFlightNumber?: string;
      totalQty: number;
      buyPrice: number;
      baggage?: string;
      notes?: string;
      batchNumber?: string;
    }>;
  }) => void;
  onOpenSupplierModal?: () => void;
}

const POPULAR_ROUTES = [
  "Toshkent — Dubay",
  "Toshkent — Jidda",
  "Toshkent — Madina",
  "Toshkent — Istanbul",
  "Toshkent — Antaliya",
  "Toshkent — Sharm-el-Sheyx",
  "Toshkent — Moskva",
  "Toshkent — Sankt-Peterburg",
  "Samarqand — Dubay",
  "Samarqand — Jidda",
  "Samarqand — Istanbul",
  "Farg'ona — Dubay",
  "Namangan — Dubay",
];

// Helper to auto-generate a smart batch code preview
function getAutoBatchCode(route: string, index: number): string {
  if (!route) return `P-BLOK-${101 + index}`;
  const dest = route.includes("—") ? route.split("—")[1].trim() : route.trim();
  const code = dest.slice(0, 3).toUpperCase();
  return `P-${code}-${101 + index}`;
}

export function BatchModal({
  isOpen,
  onClose,
  suppliers,
  onSave,
  onOpenSupplierModal,
}: BatchModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<string>("");
  const [paidNow, setPaidNow] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [notes, setNotes] = useState<string>("");

  const [items, setItems] = useState<BatchItemInput[]>([]);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split("T")[0];
      setItems([
        {
          id: Math.random().toString(),
          route: "Toshkent — Dubay",
          flightDate: today,
          flightNumber: "",
          isRoundTrip: false,
          returnDate: "",
          returnFlightNumber: "",
          totalQty: 50,
          buyPrice: 300,
          baggage: "20 kg",
        },
      ]);
      setPurchaseDate(today);
      setPaidNow(0);
      setNotes("");
      setError(null);
    }
  }, [isOpen]);

  const handleAddItem = () => {
    const today = new Date().toISOString().split("T")[0];
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        route: "Toshkent — Jidda",
        flightDate: today,
        flightNumber: "",
        isRoundTrip: false,
        returnDate: "",
        returnFlightNumber: "",
        totalQty: 30,
        buyPrice: 400,
        baggage: "20 kg",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof BatchItemInput, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Calculations
  const totalCost = items.reduce(
    (sum, it) => sum + (it.totalQty || 0) * (it.buyPrice || 0),
    0
  );
  const totalTickets = items.reduce((sum, it) => sum + (it.totalQty || 0), 0);
  const remainingDebt = Math.max(0, totalCost - (paidNow || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError("Iltimos, ta'minotchini tanlang!");
      return;
    }

    if (items.length === 0) {
      setError("Kamida bitta reys/partiya qo'shilishi kerak!");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.route.trim()) {
        setError(`${i + 1}-qatorda yo'nalish kiritilmagan!`);
        return;
      }
      if (!it.flightDate) {
        setError(`${i + 1}-qatorda uchish sanasi tanlanmagan!`);
        return;
      }
      if (it.isRoundTrip && !it.returnDate) {
        setError(`${i + 1}-qatorda obratno (qaytish) sanasi tanlanmagan!`);
        return;
      }
      if (it.totalQty <= 0) {
        setError(`${i + 1}-qatorda chiptalar soni kamida 1 ta bo'lishi kerak!`);
        return;
      }
      if (it.buyPrice <= 0) {
        setError(`${i + 1}-qatorda tannarx 0 dan katta bo'lishi kerak!`);
        return;
      }
    }

    try {
      onSave({
        supplierId: Number(supplierId),
        purchaseDate: purchaseDate || new Date().toISOString().split("T")[0],
        paidNow: Number(paidNow) || 0,
        paymentMethod,
        notes,
        items: items.map((it, idx) => ({
          route: it.route.trim(),
          flightDate: it.flightDate,
          flightNumber: it.flightNumber.trim().toUpperCase(),
          isRoundTrip: it.isRoundTrip,
          returnDate: it.isRoundTrip ? it.returnDate : undefined,
          returnFlightNumber: it.isRoundTrip
            ? it.returnFlightNumber.trim().toUpperCase()
            : undefined,
          totalQty: Number(it.totalQty),
          buyPrice: Number(it.buyPrice),
          baggage: it.baggage,
          batchNumber: getAutoBatchCode(it.route, idx),
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
      title="Yangi xarid"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 font-medium">
            {error}
          </div>
        )}

        {/* Global Datalist for fast route auto-complete */}
        <datalist id="popular-routes-list">
          {POPULAR_ROUTES.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>

        {/* 1. Ta'minotchi va Sana */}
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
              Xarid sanasi *
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              required
            />
          </div>
        </div>

        {/* 2. Xarid qilinayotgan reyslar / bloklar ro'yxati (Multi-item) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Xarid qilinayotgan reyslar ({items.length} ta)
            </span>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Reys qo‘shish
            </button>
          </div>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-0.5">
            {items.map((item, index) => {
              const itemTotal = (item.totalQty || 0) * (item.buyPrice || 0);
              const autoBatchNumber = getAutoBatchCode(item.route, index);

              return (
                <div
                  key={item.id}
                  className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2.5 transition-all"
                >
                  {/* Qator tepasi: Yo'nalish, Obratno tugmasi va O'chirish tugmasi */}
                  <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        Yo‘nalish (Qayerdan ➔ Qayerga) *
                      </label>
                      <input
                        list="popular-routes-list"
                        type="text"
                        placeholder="Masalan: Toshkent — Dubay"
                        value={item.route}
                        onChange={(e) =>
                          handleUpdateItem(index, "route", e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Obratno toggle button */}
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
                        {item.isRoundTrip ? "⇄ Obratno (Borish-qaytish)" : "Obratno qo‘shish"}
                      </button>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          title="Ushbu reysni o'chirish"
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Qator o'rtasi: Borish sanasi, Reys, Soni, Tannarx, Bagaj */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        Borish sanasi *
                      </label>
                      <input
                        type="date"
                        value={item.flightDate}
                        onChange={(e) =>
                          handleUpdateItem(index, "flightDate", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        Borish reysi
                      </label>
                      <input
                        type="text"
                        placeholder="FZ-780"
                        value={item.flightNumber}
                        onChange={(e) =>
                          handleUpdateItem(index, "flightNumber", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        Soni (ta) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.totalQty}
                        onChange={(e) =>
                          handleUpdateItem(
                            index,
                            "totalQty",
                            Math.max(1, parseInt(e.target.value) || 0)
                          )
                        }
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        Tannarx ($) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.buyPrice}
                          onChange={(e) =>
                            handleUpdateItem(
                              index,
                              "buyPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full pl-5 pr-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        Bagaj
                      </label>
                      <select
                        value={item.baggage}
                        onChange={(e) =>
                          handleUpdateItem(index, "baggage", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="20 kg">20 kg</option>
                        <option value="25 kg">25 kg</option>
                        <option value="30 kg">30 kg</option>
                        <option value="Qo'l yuki (7 kg)">7 kg</option>
                        <option value="Bagajsiz">Bagajsiz</option>
                      </select>
                    </div>
                  </div>

                  {/* OBRATNO (QAYTISH REYSI) MAYDONLARI */}
                  {item.isRoundTrip && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60">
                      <div>
                        <label className="block text-[11px] font-bold text-blue-700 dark:text-blue-300 mb-0.5">
                          ⇄ Obratno (Qaytish) sanasi *
                        </label>
                        <input
                          type="date"
                          value={item.returnDate}
                          onChange={(e) =>
                            handleUpdateItem(index, "returnDate", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-blue-300 dark:border-blue-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          required={item.isRoundTrip}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-blue-700 dark:text-blue-300 mb-0.5">
                          ⇄ Obratno reys raqami (ixtiyoriy)
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
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-blue-300 dark:border-blue-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono font-bold"
                        />
                      </div>
                    </div>
                  )}

                  {/* Qator pastki qismi: Avtomatik partiya kodi va Jami qiymat */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 px-0.5 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Partiya kodi (avto):{" "}
                      <strong className="text-blue-600 dark:text-blue-400 font-mono font-bold">
                        {autoBatchNumber}
                      </strong>
                    </span>
                    <span>
                      Jami:{" "}
                      <strong className="text-amber-600 dark:text-amber-400 font-mono font-bold text-xs">
                        {formatUSD(itemTotal)}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Yana reys (mahsulot) qo‘shish
          </button>
        </div>

        {/* 3. Real-time Calculation Summary Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Jami xarid ({totalTickets} ta chipta):
          </span>
          <span className="font-black font-mono text-sm text-amber-600 dark:text-amber-400">
            {formatUSD(totalCost)}
          </span>
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
                max={totalCost}
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
            placeholder="Charter shartnomasi, eslatma..."
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
            Xaridni qabul qilish
          </button>
        </div>
      </form>
    </Modal>
  );
}
